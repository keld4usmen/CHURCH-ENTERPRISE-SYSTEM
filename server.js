import express from 'express';
import cors from 'cors';
import { openDatabase, syncData, getChurchData, getNotifications, addInquiry } from './db.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const dbPromise = openDatabase();

app.get('/api/church', async (req, res) => {
  try {
    const db = await dbPromise;
    const data = await getChurchData(db);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const db = await dbPromise;
    const notifications = await getNotifications(db);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inquiry', async (req, res) => {
  try {
    const db = await dbPromise;
    const { name, email, department, subject, message } = req.body;
    if (!name || !email || !department || !subject || !message) {
      return res.status(400).json({ error: 'name, email, department, subject, and message are required' });
    }

    const inquiry = await addInquiry(db, { name, email, department, subject, message });
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const db = await dbPromise;
    await syncData(db);
    res.json({ success: true, message: 'Database sync complete.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const db = await dbPromise;
    const departments = await db.all('SELECT name, lead, email FROM departments');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const db = await dbPromise;
    const events = await db.all('SELECT title, date, description, location FROM events');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/policies', async (req, res) => {
  try {
    const db = await dbPromise;
    const policies = await db.all('SELECT title, summary, link FROM policies');
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, async () => {
  const db = await dbPromise;
  await syncData(db);
  console.log(`Backend API running on http://localhost:${port}`);
});
