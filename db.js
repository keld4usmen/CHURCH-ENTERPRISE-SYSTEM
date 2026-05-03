import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'church.db');
const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'church_data.json');

export async function openDatabase() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS church (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      lead TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      date TEXT,
      description TEXT,
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      summary TEXT,
      link TEXT
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT,
      answer TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT,
      permissions TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      title TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      department TEXT,
      subject TEXT,
      message TEXT,
      routed_to TEXT,
      status TEXT,
      created_at TEXT
    );
  `);

  return db;
}

async function insertNotificationIfMissing(db, type, title, message) {
  const existing = await db.get(
    'SELECT id FROM notifications WHERE type = ? AND title = ?',
    type,
    title
  );
  if (!existing) {
    await db.run(
      'INSERT INTO notifications (type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?)',
      type,
      title,
      message,
      0,
      new Date().toISOString()
    );
  }
}

export async function syncData(db) {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const source = JSON.parse(raw);

  await db.exec('BEGIN TRANSACTION');
  await db.run('DELETE FROM church');
  await db.run('DELETE FROM departments');
  await db.run('DELETE FROM events');
  await db.run('DELETE FROM policies');
  await db.run('DELETE FROM faqs');
  await db.run('DELETE FROM roles');

  const churchEntries = [
    ['name', source.church.name],
    ['mission', source.church.mission],
    ['vision', source.church.vision],
    ['location', source.church.location],
    ['phone', source.church.contact.phone],
    ['email', source.church.contact.email],
    ['officeHours', source.church.contact.officeHours]
  ];

  for (const [key, value] of churchEntries) {
    await db.run('INSERT INTO church (key, value) VALUES (?, ?)', key, value);
  }

  for (const dept of source.departments || []) {
    await db.run(
      'INSERT INTO departments (name, lead, email) VALUES (?, ?, ?)',
      dept.name,
      dept.lead,
      dept.email
    );
  }

  for (const event of source.events || []) {
    await db.run(
      'INSERT INTO events (title, date, description, location) VALUES (?, ?, ?, ?)',
      event.title,
      event.date,
      event.description,
      event.location
    );
    await insertNotificationIfMissing(
      db,
      'event',
      event.title,
      `New event added: ${event.title} on ${event.date}`
    );
  }

  for (const policy of source.policies || []) {
    await db.run(
      'INSERT INTO policies (title, summary, link) VALUES (?, ?, ?)',
      policy.title,
      policy.summary,
      policy.link
    );
    await insertNotificationIfMissing(
      db,
      'policy',
      policy.title,
      `Updated policy: ${policy.title}`
    );
  }

  for (const faq of source.faqs || []) {
    await db.run('INSERT INTO faqs (question, answer) VALUES (?, ?)', faq.question, faq.answer);
  }

  for (const role of Object.entries(source.roles || {})) {
    await db.run('INSERT INTO roles (role, permissions) VALUES (?, ?)', role[0], JSON.stringify(role[1]));
  }

  await db.exec('COMMIT');
}

export async function getChurchData(db) {
  const church = await db.all('SELECT key, value FROM church');
  const departments = await db.all('SELECT name, lead, email FROM departments');
  const events = await db.all('SELECT title, date, description, location FROM events');
  const policies = await db.all('SELECT title, summary, link FROM policies');
  const faqs = await db.all('SELECT question, answer FROM faqs');
  const rolesRows = await db.all('SELECT role, permissions FROM roles');

  const roles = {};
  for (const row of rolesRows) {
    roles[row.role] = JSON.parse(row.permissions);
  }

  const churchData = {};
  for (const row of church) {
    churchData[row.key] = row.value;
  }

  return {
    church: churchData,
    departments,
    events,
    policies,
    faqs,
    roles,
  };
}

export async function getNotifications(db) {
  return db.all('SELECT id, type, title, message, is_read, created_at FROM notifications ORDER BY created_at DESC');
}

export async function addInquiry(db, inquiry) {
  const departmentRow = await db.get('SELECT email FROM departments WHERE LOWER(name) = LOWER(?)', inquiry.department);
  const routedTo = departmentRow ? departmentRow.email : 'info@foundationoftruth.org';
  const now = new Date().toISOString();

  const result = await db.run(
    'INSERT INTO inquiries (name, email, department, subject, message, routed_to, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    inquiry.name,
    inquiry.email,
    inquiry.department,
    inquiry.subject,
    inquiry.message,
    routedTo,
    'pending',
    now
  );

  return {
    id: result.lastID,
    routed_to: routedTo,
    status: 'pending',
    created_at: now,
  };
}
