require('dotenv').config();
// Must be set before any pg connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', db: process.env.DATABASE_URL ? 'postgres' : 'sqlite' })
);

initDatabase().then(() => {
  app.use('/api/auth',      require('./auth/auth.routes'));
  app.use('/api/search',    require('./search/search.routes'));
  app.use('/api/playlists', require('./playlists/playlists.routes'));
  app.use('/api/ai',        require('./ai/ai.routes'));
  app.use('/api/analytics', require('./analytics/analytics.routes'));
  app.use('/api/users',     require('./users/users.routes'));
  app.use('/api/youtube',   require('./youtube/youtube.routes'));
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));
  app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎵  Auralis  →  http://localhost:${PORT}`);
    console.log(`📦  DB: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
    console.log(`🔑  Groq: ${process.env.GROQ_API_KEY ? '✅' : '⚠️  not set'}`);
    console.log(`🎬  YouTube: ${process.env.YOUTUBE_API_KEY ? '✅' : '⚠️  not set'}\n`);
  });
}).catch(err => {
  console.error('❌ Startup failed:', err.message);
  process.exit(1);
});
