const express = require('express');
const { v4: uuid } = require('uuid');
const { requireAuth } = require('../auth/auth.routes');
const { getDb } = require('../db/database');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const playlists = await getDb().prepare(
    `SELECT p.*, (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id=p.id) as song_count
     FROM playlists p WHERE p.user_id=? ORDER BY p.created_at DESC`
  ).all(req.userId);
  res.json(playlists.map(p => ({ ...p, _count: { songs: p.song_count } })));
});

router.get('/liked-songs', async (req, res) => {
  const liked = await getDb().prepare('SELECT * FROM liked_songs WHERE user_id=? ORDER BY liked_at DESC').all(req.userId);
  res.json(liked.map(ls => ({
    songId: ls.song_id, likedAt: ls.liked_at,
    song: { id: ls.song_id, title: ls.song_title, artist: ls.song_artist, album: ls.song_album, coverUrl: ls.cover_url, duration: ls.duration, previewUrl: ls.preview_url }
  })));
});

router.get('/recently-played', async (req, res) => {
  const rows = await getDb().prepare(
    `SELECT DISTINCT song_id, song_title, song_artist, cover_url, duration, played_at
     FROM listening_history WHERE user_id=? ORDER BY played_at DESC LIMIT 30`
  ).all(req.userId);
  res.json(rows.map(r => ({
    playedAt: r.played_at,
    song: { id: r.song_id, title: r.song_title, artist: r.song_artist, coverUrl: r.cover_url, duration: r.duration }
  })));
});

router.post('/songs/like', async (req, res) => {
  const { id, title, artist, album, coverUrl, duration, previewUrl } = req.body;
  if (!id || !title) return res.status(400).json({ message: 'Song id and title required' });
  const existing = await getDb().prepare('SELECT id FROM liked_songs WHERE user_id=? AND song_id=?').get(req.userId, id);
  if (existing) {
    await getDb().prepare('DELETE FROM liked_songs WHERE user_id=? AND song_id=?').run(req.userId, id);
    return res.json({ liked: false });
  }
  await getDb().prepare('INSERT INTO liked_songs (id,user_id,song_id,song_title,song_artist,song_album,cover_url,duration,preview_url) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(uuid(), req.userId, id, title, artist||'Unknown', album||null, coverUrl||null, duration||0, previewUrl||null);
  res.json({ liked: true });
});

router.post('/play/record', async (req, res) => {
  const { id, title, artist, coverUrl, duration } = req.body;
  if (!id || !title) return res.status(200).json({ ok: true });
  await getDb().prepare('INSERT INTO listening_history (id,user_id,song_id,song_title,song_artist,cover_url,duration) VALUES (?,?,?,?,?,?,?)')
    .run(uuid(), req.userId, id, title, artist||'Unknown', coverUrl||null, duration||0);
  res.json({ ok: true });
});

router.get('/:id', async (req, res) => {
  const playlist = await getDb().prepare(
    'SELECT p.*, u.username, u.display_name FROM playlists p JOIN users u ON u.id=p.user_id WHERE p.id=?'
  ).get(req.params.id);
  if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
  if (!playlist.is_public && playlist.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  const songs = await getDb().prepare('SELECT * FROM playlist_songs WHERE playlist_id=? ORDER BY position ASC').all(req.params.id);
  res.json({
    ...playlist,
    user: { id: playlist.user_id, username: playlist.username, displayName: playlist.display_name },
    songs: songs.map(s => ({
      song: { id: s.song_id, title: s.song_title, artist: s.song_artist, album: s.song_album, coverUrl: s.cover_url, duration: s.duration, previewUrl: s.preview_url }
    }))
  });
});

router.post('/', async (req, res) => {
  const { name, description, isPublic=true, isAiGenerated=false, aiPrompt } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name required' });
  const id = uuid();
  await getDb().prepare('INSERT INTO playlists (id,name,description,user_id,is_public,is_ai_generated,ai_prompt) VALUES (?,?,?,?,?,?,?)')
    .run(id, name.trim(), description||null, req.userId, isPublic?1:0, isAiGenerated?1:0, aiPrompt||null);
  res.status(201).json(await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(id));
});

router.patch('/:id', async (req, res) => {
  const pl = await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Not found' });
  if (pl.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  const { name, description, isPublic } = req.body;
  if (name) await getDb().prepare('UPDATE playlists SET name=? WHERE id=?').run(name, req.params.id);
  if (description !== undefined) await getDb().prepare('UPDATE playlists SET description=? WHERE id=?').run(description, req.params.id);
  if (isPublic !== undefined) await getDb().prepare('UPDATE playlists SET is_public=? WHERE id=?').run(isPublic?1:0, req.params.id);
  res.json(await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(req.params.id));
});

router.delete('/:id', async (req, res) => {
  const pl = await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Not found' });
  if (pl.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  await getDb().prepare('DELETE FROM playlist_songs WHERE playlist_id=?').run(req.params.id);
  await getDb().prepare('DELETE FROM playlists WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/songs', async (req, res) => {
  const pl = await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Not found' });
  if (pl.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  const { id, title, artist, album, coverUrl, duration, previewUrl } = req.body;
  if (!id || !title) return res.status(400).json({ message: 'Song id and title required' });
  const posRow = await getDb().prepare('SELECT COUNT(*) as c FROM playlist_songs WHERE playlist_id=?').get(req.params.id);
  const pos = posRow?.c || 0;
  await getDb().prepare('INSERT OR IGNORE INTO playlist_songs (id,playlist_id,song_id,song_title,song_artist,song_album,cover_url,duration,preview_url,position) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(uuid(), req.params.id, id, title, artist||'Unknown', album||null, coverUrl||null, duration||0, previewUrl||null, pos);
  res.json({ success: true });
});

router.delete('/:id/songs/:songId', async (req, res) => {
  const pl = await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(req.params.id);
  if (!pl) return res.status(404).json({ message: 'Not found' });
  if (pl.user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  await getDb().prepare('DELETE FROM playlist_songs WHERE playlist_id=? AND song_id=?').run(req.params.id, req.params.songId);
  res.json({ success: true });
});

module.exports = router;
