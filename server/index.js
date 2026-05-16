const express = require('express');
const path = require('path');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/settings', settingsRoutes);

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server after DB init
initDB()
  .then(() => {
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🍼 Baby Tracker running at http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
