const chatPanel = document.getElementById('chat-panel');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const summarySection = document.getElementById('church-summary');
const quickActions = document.querySelectorAll('[data-action]');

let churchData = null;

const appendMessage = (text, type = 'bot') => {
  const message = document.createElement('div');
  message.className = `message ${type === 'user' ? 'user-message' : 'bot-message'}`;
  message.innerHTML = `<span class="message-label">${type === 'user' ? 'You' : 'Bot'}</span><p>${text}</p>`;
  chatPanel.appendChild(message);
  chatPanel.scrollTop = chatPanel.scrollHeight;
};

const renderSummary = (data) => {
  summarySection.innerHTML = `
    <h2>Church Overview</h2>
    <p><strong>${data.church.name}</strong></p>
    <p>${data.church.mission}</p>
    <p><strong>Location:</strong> ${data.church.location}</p>
    <p><strong>Phone:</strong> ${data.church.contact.phone}</p>
    <p><strong>Email:</strong> ${data.church.contact.email}</p>
  `;
};

const answerFromData = (question) => {
  const normalized = question.toLowerCase();

  if (normalized.includes('service') || normalized.includes('time')) {
    const services = churchData.church.serviceTimes
      .map(s => `${s.day}: ${s.times.join(', ')}`)
      .join('<br>');
    return `Service schedule:<br>${services}`;
  }

  if (normalized.includes('location') || normalized.includes('where')) {
    return `Our location is ${churchData.church.location}.`;
  }

  if (normalized.includes('contact') || normalized.includes('email') || normalized.includes('phone')) {
    return `You can reach us at ${churchData.church.contact.phone} or ${churchData.church.contact.email}.`;
  }

  if (normalized.includes('department') || normalized.includes('lead') || normalized.includes('who')) {
    const matches = churchData.departments.filter(dept =>
      normalized.includes(dept.name.toLowerCase()) || normalized.includes(dept.lead.toLowerCase())
    );
    if (matches.length) {
      return matches.map(dept => `${dept.name} is led by ${dept.lead} (${dept.email})`).join('<br>');
    }
    return churchData.departments
      .map(dept => `${dept.name} — lead: ${dept.lead}`)
      .join('<br>');
  }

  if (normalized.includes('event') || normalized.includes('upcoming') || normalized.includes('calendar')) {
    return churchData.events
      .map(event => `<strong>${event.title}</strong><br>${event.date} • ${event.location}<br>${event.description}`)
      .join('<br><br>');
  }

  if (normalized.includes('policy') || normalized.includes('leave') || normalized.includes('safety')) {
    return churchData.policies
      .map(policy => `<strong>${policy.title}</strong><br>${policy.summary}`)
      .join('<br><br>');
  }

  const faqMatch = churchData.faqs.find(faq => normalized.includes(faq.question.toLowerCase().replace(/[^a-z0-9 ]/g, '')));
  if (faqMatch) {
    return faqMatch.answer;
  }

  return `I couldn't find a direct answer in the church data. Try asking about service times, department leaders, events, or contact details.`;
};

const handleAction = (action) => {
  if (!churchData) return;

  switch (action) {
    case 'service-times':
      appendMessage(answerFromData('service times'), 'bot');
      break;
    case 'departments':
      appendMessage(answerFromData('departments'), 'bot');
      break;
    case 'events':
      appendMessage(answerFromData('upcoming events'), 'bot');
      break;
    case 'contacts':
      appendMessage(answerFromData('contact'), 'bot');
      break;
    case 'policies':
      appendMessage(answerFromData('policies'), 'bot');
      break;
    default:
      appendMessage('I am not sure how to help with that action.', 'bot');
  }
};

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, 'user');
  const response = answerFromData(text);
  appendMessage(response, 'bot');
  userInput.value = '';
});

quickActions.forEach((button) => {
  button.addEventListener('click', () => {
    handleAction(button.dataset.action);
  });
});

fetch('church_data.json')
  .then((response) => response.json())
  .then((data) => {
    churchData = data;
    renderSummary(data);
  })
  .catch(() => {
    appendMessage('Unable to load church data. Please serve this project from a local web server.', 'bot');
  });
