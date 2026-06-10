const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'auralis-dev-secret';

function makeToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function safeUser(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body;

    if (!email || !username || !password)
      return res.status(400).json({ message: 'Email, username and password required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ message: 'Username: letters, numbers and underscores only' });

    const existing = await getDb().prepare(
      'SELECT id FROM users WHERE email=? OR username=?'
    ).get(email, username);
    if (existing) return res.status(409).json({ message: 'Email or username already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuid();

    await getDb().prepare(
      'INSERT INTO users (id,email,username,display_name,password_hash) VALUES (?,?,?,?,?)'
    ).run(id, email, username, displayName || username, passwordHash);

    const user = await getDb().prepare('SELECT * FROM users WHERE id=?').get(id);
    if (!user) return res.status(500).json({ message: 'User created but could not be fetched' });

    res.status(201).json({ user: safeUser(user), token: makeToken(user) });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ message: 'Registration failed: ' + e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await getDb().prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !user.password_hash)
      return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ user: safeUser(user), token: makeToken(user) });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ message: 'Login failed: ' + e.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await getDb().prepare('SELECT * FROM users WHERE id=?').get(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const followers = (await getDb().prepare(
      'SELECT COUNT(*) as c FROM follows WHERE following_id=?'
    ).get(req.userId))?.c || 0;
    const following = (await getDb().prepare(
      'SELECT COUNT(*) as c FROM follows WHERE follower_id=?'
    ).get(req.userId))?.c || 0;
    const playlists = (await getDb().prepare(
      'SELECT COUNT(*) as c FROM playlists WHERE user_id=?'
    ).get(req.userId))?.c || 0;

    res.json({ ...safeUser(user), _count: { followers, following, playlists } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
