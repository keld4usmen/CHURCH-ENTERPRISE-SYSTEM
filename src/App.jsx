import { useEffect, useState } from 'react';
import churchData from './data/church_data.json';
import logo from './assets/fota-logo.svg';

const WEBHOOK_URL = 'https://yikkyman.app.n8n.cloud/webhook/5e73495e-c736-4aae-ac04-3dc8eab8322e/chat';
const initialBotMessage = 'Welcome! Ask about service times, departments, events, policies, or church contact details.';

const Answer = ({ html }) => (
  <div className="message bot-message" dangerouslySetInnerHTML={{ __html: html }} />
);

const App = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: initialBotMessage }
  ]);
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isSending, setIsSending] = useState(false);
  const [webhookError, setWebhookError] = useState(null);

  useEffect(() => {
    setData(churchData);
  }, []);

  const appendMessage = (text, type = 'bot') => {
    setMessages((current) => [...current, { type, text }]);
  };

  const sendChatToWebhook = async (message) => {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'guest', message })
      });

      const text = await response.text();
      if (!response.ok) {
        const errorMessage = `Webhook error ${response.status}: ${text || response.statusText}. Please activate the n8n workflow or verify the webhook URL.`;
        setWebhookError(errorMessage);
        console.error(errorMessage);
        return null;
      }

      setWebhookError(null);
      try {
        const json = JSON.parse(text);
        return json.response || json.answer || json.result || text;
      } catch {
        return text;
      }
    } catch (error) {
      const errorMessage = `Webhook request failed: ${error.message}. Please check your network and webhook settings.`;
      setWebhookError(errorMessage);
      console.error('Webhook error:', error);
      return null;
    }
  };

  const formatResponse = (response) => response;

  const answerFromData = (question) => {
    const normalized = question.toLowerCase();

    if (normalized.includes('service') || normalized.includes('time')) {
      const services = data.church.serviceTimes
        .map((s) => `${s.day}: ${s.times.join(', ')}`)
        .join('<br>');
      return `Service schedule:<br>${services}`;
    }

    if (normalized.includes('location') || normalized.includes('where')) {
      return `Our location is ${data.church.location}.`;
    }

    if (normalized.includes('contact') || normalized.includes('email') || normalized.includes('phone')) {
      return `You can reach us at ${data.church.contact.phone} or ${data.church.contact.email}.`;
    }

    if (normalized.includes('department') || normalized.includes('lead') || normalized.includes('who')) {
      const matches = data.departments.filter((dept) =>
        normalized.includes(dept.name.toLowerCase()) || normalized.includes(dept.lead.toLowerCase())
      );
      if (matches.length) {
        return matches
          .map((dept) => `${dept.name} is led by ${dept.lead} (${dept.email})`)
          .join('<br>');
      }
      return data.departments
        .map((dept) => `${dept.name} — lead: ${dept.lead}`)
        .join('<br>');
    }

    if (normalized.includes('event') || normalized.includes('upcoming') || normalized.includes('calendar')) {
      return data.events
        .map(
          (event) => `<strong>${event.title}</strong><br>${event.date} • ${event.location}<br>${event.description}`
        )
        .join('<br><br>');
    }

    if (normalized.includes('policy') || normalized.includes('leave') || normalized.includes('safety')) {
      return data.policies
        .map((policy) => `<strong>${policy.title}</strong><br>${policy.summary}`)
        .join('<br><br>');
    }

    const faqMatch = data.faqs.find((faq) =>
      normalized.includes(faq.question.toLowerCase().replace(/[^a-z0-9 ]/g, ''))
    );
    if (faqMatch) {
      return faqMatch.answer;
    }

    return 'I could not find a direct answer in the church data. Try asking about service times, department leaders, events, or contact details.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || isSending) return;

    const question = input.trim();
    appendMessage(question, 'user');
    setInput('');
    setIsSending(true);

    const webhookReply = await sendChatToWebhook(question);
    if (webhookReply) {
      appendMessage(webhookReply, 'bot');
    } else if (data) {
      appendMessage(answerFromData(question), 'bot');
      if (webhookError) {
        appendMessage(`Webhook fallback active: ${webhookError}`, 'bot');
      }
    } else {
      appendMessage('Unable to reach the chat webhook or load local data.', 'bot');
    }

    setIsSending(false);
  };

  const handleQuickAction = (action) => {
    let response = 'I am not sure how to help with that action.';

    switch (action) {
      case 'service-times':
        response = answerFromData('service times');
        break;
      case 'departments':
        response = answerFromData('departments');
        break;
      case 'events':
        response = answerFromData('upcoming events');
        break;
      case 'contacts':
        response = answerFromData('contact');
        break;
      case 'policies':
        response = answerFromData('policies');
        break;
    }

    appendMessage(response, 'bot');
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="Foundation of Truth Assembly logo" className="brand-logo" />
          <div>
            <h1>Foundation of Truth Assembly</h1>
            <p>FOTA Church Assistant</p>
          </div>
        </div>

        <section className="panel church-summary">
          <h2>Church Overview</h2>
          {data ? (
            <>
              <p><strong>{data.church.name}</strong></p>
              <p>{data.church.mission}</p>
              <p><strong>Location:</strong> {data.church.location}</p>
              <p><strong>Phone:</strong> {data.church.contact.phone}</p>
              <p><strong>Email:</strong> {data.church.contact.email}</p>
            </>
          ) : (
            <p>Loading church data...</p>
          )}
        </section>

        <section className="panel quick-actions">
          <h2>Quick Actions</h2>
          <button type="button" onClick={() => handleQuickAction('service-times')}>Service Times</button>
          <button type="button" onClick={() => handleQuickAction('departments')}>Departments</button>
          <button type="button" onClick={() => handleQuickAction('events')}>Upcoming Events</button>
          <button type="button" onClick={() => handleQuickAction('contacts')}>Contacts</button>
          <button type="button" onClick={() => handleQuickAction('policies')}>Policies</button>
        </section>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h2>Assistant Chat</h2>
            <p>Ask about service times, departments, events, policies, or church contact details.</p>
          </div>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
          </button>
        </header>
        {webhookError && (
          <div className="webhook-error-banner">
            <strong>Webhook Notice:</strong> {webhookError}
          </div>
        )}

        <section className="chat-panel" id="chat-panel">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}>
              <span className="message-label">{message.type === 'user' ? 'You' : 'Bot'}</span>
              <p dangerouslySetInnerHTML={{ __html: formatResponse(message.text) }} />
            </div>
          ))}
        </section>

        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question here..."
            autoComplete="off"
            disabled={isSending}
          />
          <button type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default App;
