const express = require('express');
const { requireAuth } = require('../auth/auth.routes');
const youtubeService = require('./youtube.service');

const router = express.Router();
router.use(requireAuth);

router.get('/find', async (req, res) => {
  const { title, artist } = req.query;
  if (!title || !artist) return res.status(400).json({ message: 'title and artist required' });
  try {
    const videoId = await youtubeService.findVideoId(title, artist);
    res.json({ videoId, available: !!videoId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const results = await youtubeService.batchFindVideoIds(req.body.songs || []);
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
