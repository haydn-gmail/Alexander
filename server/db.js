const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'baby_tracker.db');
const DATA_DIR = path.join(__dirname, '..', 'data');

let db = null;

async function initDB() {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing DB or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      breast_right TEXT,
      breast_left TEXT,
      formula_ml INTEGER,
      bottle_ml INTEGER,
      urine INTEGER DEFAULT 0,
      stool INTEGER DEFAULT 0,
      stool_color TEXT,
      comments TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add bottle_ml column if missing
  try {
    db.exec('SELECT bottle_ml FROM entries LIMIT 1');
  } catch {
    db.run('ALTER TABLE entries ADD COLUMN bottle_ml INTEGER');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date)`);

  // Seed default users if none exist
  const userCount = db.exec('SELECT COUNT(*) as count FROM users');
  if (userCount[0].values[0][0] === 0) {
    const users = [
      { name: 'dad', display_name: 'Dad', pin: '1234', role: 'admin' },
      { name: 'mom', display_name: 'Mom', pin: '5678', role: 'admin' },
      { name: 'family', display_name: 'Family', pin: '0000', role: 'viewer' },
    ];

    const stmt = db.prepare(
      'INSERT INTO users (name, display_name, pin_hash, role) VALUES (?, ?, ?, ?)'
    );

    for (const user of users) {
      const hash = bcrypt.hashSync(user.pin, 10);
      stmt.run([user.name, user.display_name, hash, user.role]);
    }
    stmt.free();
    console.log('Default users seeded (dad:1234, mom:5678, family:0000)');
  }

  saveDB();
  return db;
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDB() {
  return db;
}

// --- Query Helpers ---

function getUsers() {
  const result = db.exec('SELECT id, name, display_name, role FROM users');
  if (!result.length) return [];
  return result[0].values.map((row) => ({
    id: row[0],
    name: row[1],
    display_name: row[2],
    role: row[3],
  }));
}

function getUserByName(name) {
  const stmt = db.prepare('SELECT * FROM users WHERE name = ?');
  stmt.bind([name]);
  let user = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    user = row;
  }
  stmt.free();
  return user;
}

function createEntry(entry) {
  const stmt = db.prepare(`
    INSERT INTO entries (date, time, breast_right, breast_left, formula_ml, bottle_ml, urine, stool, stool_color, comments, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    entry.date,
    entry.time,
    entry.breast_right || null,
    entry.breast_left || null,
    entry.formula_ml || null,
    entry.bottle_ml || null,
    entry.urine ? 1 : 0,
    entry.stool ? 1 : 0,
    entry.stool_color || null,
    entry.comments || null,
    entry.created_by || null,
  ]);
  stmt.free();

  const idResult = db.exec('SELECT last_insert_rowid()');
  const id = idResult[0].values[0][0];
  saveDB();
  return id;
}

function updateEntry(id, entry) {
  const stmt = db.prepare(`
    UPDATE entries SET
      date = ?, time = ?, breast_right = ?, breast_left = ?,
      formula_ml = ?, bottle_ml = ?, urine = ?, stool = ?, stool_color = ?,
      comments = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run([
    entry.date,
    entry.time,
    entry.breast_right || null,
    entry.breast_left || null,
    entry.formula_ml || null,
    entry.bottle_ml || null,
    entry.urine ? 1 : 0,
    entry.stool ? 1 : 0,
    entry.stool_color || null,
    entry.comments || null,
    id,
  ]);
  stmt.free();
  saveDB();
}

function deleteEntry(id) {
  const stmt = db.prepare('DELETE FROM entries WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  saveDB();
}

function getEntriesByDate(date) {
  const stmt = db.prepare(
    'SELECT * FROM entries WHERE date = ? ORDER BY time ASC'
  );
  stmt.bind([date]);
  const entries = [];
  while (stmt.step()) {
    entries.push(stmt.getAsObject());
  }
  stmt.free();
  return entries;
}

function getEntriesByRange(from, to) {
  const stmt = db.prepare(
    'SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date ASC, time ASC'
  );
  stmt.bind([from, to]);
  const entries = [];
  while (stmt.step()) {
    entries.push(stmt.getAsObject());
  }
  stmt.free();
  return entries;
}

function getSummaryByDate(date) {
  const entries = getEntriesByDate(date);
  const summary = {
    date,
    total_feedings: 0,
    breast_right_count: 0,
    breast_left_count: 0,
    formula_count: 0,
    total_formula_ml: 0,
    bottle_count: 0,
    total_bottle_ml: 0,
    urine_count: 0,
    stool_count: 0,
    last_feed_time: null,
    last_diaper_time: null,
    entries_count: entries.length,
  };

  for (const e of entries) {
    if (e.breast_right || e.breast_left || e.formula_ml || e.bottle_ml) {
      summary.total_feedings++;
      summary.last_feed_time = e.time;
    }
    if (e.breast_right) summary.breast_right_count++;
    if (e.breast_left) summary.breast_left_count++;
    if (e.formula_ml) {
      summary.formula_count++;
      summary.total_formula_ml += e.formula_ml;
    }
    if (e.bottle_ml) {
      summary.bottle_count++;
      summary.total_bottle_ml += e.bottle_ml;
    }
    if (e.urine) {
      summary.urine_count++;
      summary.last_diaper_time = e.time;
    }
    if (e.stool) {
      summary.stool_count++;
      summary.last_diaper_time = e.time;
    }
  }

  return summary;
}

function getEntryById(id) {
  const stmt = db.prepare('SELECT * FROM entries WHERE id = ?');
  stmt.bind([id]);
  let entry = null;
  if (stmt.step()) {
    entry = stmt.getAsObject();
  }
  stmt.free();
  return entry;
}

function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  let value = null;
  if (stmt.step()) {
    value = stmt.getAsObject().value;
  }
  stmt.free();
  return value;
}

function setSetting(key, value) {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run([key, value]);
  stmt.free();
  saveDB();
}

module.exports = {
  initDB,
  getDB,
  saveDB,
  getUsers,
  getUserByName,
  createEntry,
  updateEntry,
  deleteEntry,
  getEntriesByDate,
  getEntriesByRange,
  getSummaryByDate,
  getEntryById,
  getSetting,
  setSetting,
};
