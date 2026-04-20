const express = require('express');
const { getSetting, setSetting } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/settings/:key
router.get('/:key', (req, res) => {
  const value = getSetting(req.params.key);
  res.json({ value });
});

// PUT /api/settings/:key
router.put('/:key', requireAdmin, (req, res) => {
  setSetting(req.params.key, req.body.value);
  res.json({ success: true, value: req.body.value });
});

module.exports = router;
