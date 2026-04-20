const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByName, getUsers } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { name, pin } = req.body;

  if (!name || !pin) {
    return res.status(400).json({ error: 'Name and PIN are required' });
  }

  const user = getUserByName(name.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(pin, user.pin_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, display_name: user.display_name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      display_name: user.display_name,
      role: user.role,
    },
  });
});

// GET /api/auth/users — list available users (names only, for login dropdown)
router.get('/users', (req, res) => {
  const users = getUsers();
  res.json(
    users.map((u) => ({ name: u.name, display_name: u.display_name }))
  );
});

module.exports = router;
