const express = require('express');
const { v4: uuid } = require('uuid');
const { requireAuth } = require('../auth/auth.routes');
const { getDb } = require('../db/database');

const router = express.Router();
router.use(requireAuth);

function safeUser(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

router.get('/profile', async (req, res) => {
  const user = await getDb().prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const followers = (await getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE following_id=?').get(req.userId))?.c || 0;
  const following = (await getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id=?').get(req.userId))?.c || 0;
  const playlists = (await getDb().prepare('SELECT COUNT(*) as c FROM playlists WHERE user_id=?').get(req.userId))?.c || 0;
  res.json({ ...safeUser(user), _count: { followers, following, playlists } });
});

router.put('/profile', async (req, res) => {
  const { displayName, bio, avatarUrl, isPublic } = req.body;
  if (displayName) await getDb().prepare('UPDATE users SET display_name=? WHERE id=?').run(displayName, req.userId);
  if (bio !== undefined) await getDb().prepare('UPDATE users SET bio=? WHERE id=?').run(bio, req.userId);
  if (avatarUrl) await getDb().prepare('UPDATE users SET avatar_url=? WHERE id=?').run(avatarUrl, req.userId);
  if (isPublic !== undefined) await getDb().prepare('UPDATE users SET is_public=? WHERE id=?').run(isPublic?1:0, req.userId);
  res.json(safeUser(await getDb().prepare('SELECT * FROM users WHERE id=?').get(req.userId)));
});

router.get('/:username', async (req, res) => {
  const user = await getDb().prepare('SELECT * FROM users WHERE username=?').get(req.params.username);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const playlists = await getDb().prepare('SELECT * FROM playlists WHERE user_id=? AND is_public=1 ORDER BY created_at DESC LIMIT 12').all(user.id);
  const followers = (await getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE following_id=?').get(user.id))?.c || 0;
  const following = (await getDb().prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id=?').get(user.id))?.c || 0;
  res.json({ ...safeUser(user), playlists, _count: { followers, following, playlists: playlists.length } });
});

router.post('/:id/follow', async (req, res) => {
  if (req.params.id === req.userId) return res.status(400).json({ message: 'Cannot follow yourself' });
  const existing = await getDb().prepare('SELECT id FROM follows WHERE follower_id=? AND following_id=?').get(req.userId, req.params.id);
  if (existing) {
    await getDb().prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.userId, req.params.id);
    return res.json({ following: false });
  }
  await getDb().prepare('INSERT INTO follows (id,follower_id,following_id) VALUES (?,?,?)').run(uuid(), req.userId, req.params.id);
  res.json({ following: true });
});

module.exports = router;
