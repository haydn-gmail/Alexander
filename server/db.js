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
      bath INTEGER DEFAULT 0,
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

  // Migration: add bath column if missing
  try {
    db.exec('SELECT bath FROM entries LIMIT 1');
  } catch {
    db.run('ALTER TABLE entries ADD COLUMN bath INTEGER DEFAULT 0');
  }

  // Migration: add feeding time columns if missing
  try {
    db.exec('SELECT feed_start FROM entries LIMIT 1');
  } catch {
    db.run('ALTER TABLE entries ADD COLUMN feed_start TEXT');
    db.run('ALTER TABLE entries ADD COLUMN feed_end TEXT');
  }

  // Migration: add or update grandparents user
  const gpCount = db.exec("SELECT COUNT(*) FROM users WHERE name = 'grandparents'");
  if (gpCount.length > 0 && gpCount[0].values[0][0] === 0) {
    const hash = bcrypt.hashSync('7890', 10);
    db.run(`INSERT INTO users (name, display_name, pin_hash, role) VALUES ('grandparents', 'Grandparents', '${hash}', 'admin')`);
    console.log('Migration: added grandparents user (admin)');
  } else {
    db.run("UPDATE users SET role = 'admin' WHERE name = 'grandparents' AND role != 'admin'");
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
      { name: 'grandparents', display_name: 'Grandparents', pin: '7890', role: 'admin' },
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
    INSERT INTO entries (date, time, feed_start, feed_end, breast_right, breast_left, formula_ml, bottle_ml, urine, stool, stool_color, bath, comments, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    entry.date,
    entry.time,
    entry.feed_start || null,
    entry.feed_end || null,
    entry.breast_right || null,
    entry.breast_left || null,
    entry.formula_ml || null,
    entry.bottle_ml || null,
    entry.urine ? 1 : 0,
    entry.stool ? 1 : 0,
    entry.stool_color || null,
    entry.bath ? 1 : 0,
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
      date = ?, time = ?, feed_start = ?, feed_end = ?, breast_right = ?, breast_left = ?,
      formula_ml = ?, bottle_ml = ?, urine = ?, stool = ?, stool_color = ?,
      bath = ?, comments = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run([
    entry.date,
    entry.time,
    entry.feed_start || null,
    entry.feed_end || null,
    entry.breast_right || null,
    entry.breast_left || null,
    entry.formula_ml || null,
    entry.bottle_ml || null,
    entry.urine ? 1 : 0,
    entry.stool ? 1 : 0,
    entry.stool_color || null,
    entry.bath ? 1 : 0,
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

function getAllEntries() {
  const stmt = db.prepare(
    'SELECT * FROM entries ORDER BY date ASC, time ASC'
  );
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
    total_feed_duration: 0,
    breast_right_count: 0,
    breast_left_count: 0,
    formula_count: 0,
    total_formula_ml: 0,
    bottle_count: 0,
    total_bottle_ml: 0,
    urine_count: 0,
    stool_count: 0,
    diaper_count: 0,
    bath_count: 0,
    days_since_last_bath: null,
    last_feed_time: null,
    last_diaper_time: null,
    entries_count: entries.length,
  };

  const calcDur = (start, end) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let d1 = h1 * 60 + m1;
    let d2 = h2 * 60 + m2;
    if (d2 < d1) d2 += 1440; // 24 * 60
    return d2 - d1;
  };

  for (const e of entries) {
    if (e.breast_right || e.breast_left || e.formula_ml || e.bottle_ml) {
      summary.total_feedings++;
      if (e.feed_start && e.feed_end) {
        summary.total_feed_duration += calcDur(e.feed_start, e.feed_end);
      }
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
    }
    if (e.stool) {
      summary.stool_count++;
    }
    if (e.urine || e.stool) {
      summary.diaper_count++;
    }
    if (e.bath) {
      summary.bath_count++;
    }
  }

  const stmt = db.prepare('SELECT date FROM entries WHERE bath = 1 AND date <= ? ORDER BY date DESC LIMIT 1');
  stmt.bind([date]);
  if (stmt.step()) {
    const lastBathDate = stmt.getAsObject().date;
    if (lastBathDate === date) {
      summary.days_since_last_bath = 0;
    } else {
      const d1 = new Date(lastBathDate);
      const d2 = new Date(date);
      summary.days_since_last_bath = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    }
  }
  stmt.free();

  const lastFeedStmt = db.prepare(`
    SELECT date, time, feed_start, feed_end
    FROM entries
    WHERE (breast_right IS NOT NULL OR breast_left IS NOT NULL OR formula_ml IS NOT NULL OR bottle_ml IS NOT NULL)
      AND date <= ?
    ORDER BY date DESC, time DESC
    LIMIT 20
  `);
  lastFeedStmt.bind([date]);
  let latestFeedObj = null;
  let latestFeedStr = null;
  let latestFeedDate = null;

  while (lastFeedStmt.step()) {
    const e = lastFeedStmt.getAsObject();
    let feedEnd = e.feed_end || e.time;
    let feedStart = e.feed_start || e.time;
    let feedDate = e.date;
    if (feedEnd < feedStart) {
        const d = new Date(feedDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        feedDate = d.toISOString().split('T')[0];
    }
    const candObj = new Date(`${feedDate}T${feedEnd}:00`);
    if (!latestFeedObj || candObj > latestFeedObj) {
        latestFeedObj = candObj;
        latestFeedStr = feedEnd;
        latestFeedDate = feedDate;
    }
  }
  lastFeedStmt.free();
  
  summary.last_feed_time = latestFeedStr;
  summary.last_feed_date = latestFeedDate;

  const lastDiaperStmt = db.prepare(`
    SELECT date, time
    FROM entries
    WHERE (urine = 1 OR stool = 1)
      AND date <= ?
    ORDER BY date DESC, time DESC
    LIMIT 1
  `);
  lastDiaperStmt.bind([date]);
  if (lastDiaperStmt.step()) {
     const d = lastDiaperStmt.getAsObject();
     summary.last_diaper_time = d.time;
     summary.last_diaper_date = d.date;
  }
  lastDiaperStmt.free();

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
  getAllEntries,
  getSummaryByDate,
  getEntryById,
  getSetting,
  setSetting,
};
