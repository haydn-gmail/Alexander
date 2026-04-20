const express = require('express');
const {
  createEntry,
  updateEntry,
  deleteEntry,
  getEntriesByDate,
  getEntriesByRange,
  getSummaryByDate,
  getEntryById,
} = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All entry routes require authentication
router.use(authenticateToken);

// GET /api/entries?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', (req, res) => {
  const { date, from, to } = req.query;

  if (date) {
    const entries = getEntriesByDate(date);
    return res.json(entries);
  }

  if (from && to) {
    const entries = getEntriesByRange(from, to);
    return res.json(entries);
  }

  // Default: today
  const today = new Date().toISOString().split('T')[0];
  const entries = getEntriesByDate(today);
  res.json(entries);
});

// GET /api/entries/summary?date=YYYY-MM-DD
router.get('/summary', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const summary = getSummaryByDate(date);
  res.json(summary);
});

// GET /api/entries/export?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/export', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to dates required' });
  }

  const entries = getEntriesByRange(from, to);

  // CSV header
  let csv = 'Date,Time,Breast Right,Breast Left,Formula (mL),Urine,Stool,Stool Color,Comments,Logged By\n';

  for (const e of entries) {
    csv += [
      e.date,
      e.time,
      e.breast_right || '',
      e.breast_left || '',
      e.formula_ml || '',
      e.urine ? 'Yes' : '',
      e.stool ? 'Yes' : '',
      e.stool_color || '',
      `"${(e.comments || '').replace(/"/g, '""')}"`,
      e.created_by || '',
    ].join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=baby_tracker_${from}_${to}.csv`);
  res.send(csv);
});

// POST /api/entries — admin only
router.post('/', requireAdmin, (req, res) => {
  const entry = req.body;
  entry.created_by = req.user.display_name;

  if (!entry.date || !entry.time) {
    return res.status(400).json({ error: 'Date and time are required' });
  }

  const id = createEntry(entry);
  const created = getEntryById(id);
  res.status(201).json(created);
});

// PUT /api/entries/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = getEntryById(Number(id));

  if (!existing) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  updateEntry(Number(id), req.body);
  const updated = getEntryById(Number(id));
  res.json(updated);
});

// DELETE /api/entries/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = getEntryById(Number(id));

  if (!existing) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  deleteEntry(Number(id));
  res.json({ message: 'Entry deleted' });
});

module.exports = router;
