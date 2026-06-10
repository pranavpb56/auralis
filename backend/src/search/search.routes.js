const express = require('express');
const { requireAuth } = require('../auth/auth.routes');
const searchService = require('./search.service');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { q = '', limit = 20 } = req.query;
  if (!q.trim()) return res.json({ songs: [], artists: [], albums: [], query: '' });
  try { res.json(await searchService.searchAll(q, +limit)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/songs', requireAuth, async (req, res) => {
  const { q = '', limit = 20 } = req.query;
  if (!q.trim()) return res.json([]);
  try { res.json(await searchService.searchSongs(q, +limit)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/artists', requireAuth, async (req, res) => {
  const { q = '' } = req.query;
  try { res.json(await searchService.searchArtists(q)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/albums', requireAuth, async (req, res) => {
  const { q = '' } = req.query;
  try { res.json(await searchService.searchAlbums(q)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/suggest', async (req, res) => {
  try { res.json(await searchService.getSuggestions(req.query.q || '')); }
  catch { res.json([]); }
});

router.get('/trending', async (req, res) => {
  try { res.json(await searchService.getTrending()); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
