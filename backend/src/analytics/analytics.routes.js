const express = require('express');
const { requireAuth } = require('../auth/auth.routes');
const { getDb } = require('../db/database');

const router = express.Router();
router.use(requireAuth);

router.get('/stats', async (req, res) => {
  const period = req.query.period || 'month';
  const days = { week:7, month:30, year:365 }[period] || 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const history = await getDb().prepare(
    'SELECT * FROM listening_history WHERE user_id=? AND played_at>=? ORDER BY played_at ASC'
  ).all(req.userId, since);

  const totalMinutes = Math.round(history.reduce((s,h) => s + (h.duration||0), 0) / 60);

  const songCounts = {};
  const artistCounts = {};
  const byDayOfWeek = Array(7).fill(0);
  const byHour = Array(24).fill(0);

  for (const h of history) {
    if (!songCounts[h.song_id]) songCounts[h.song_id] = { id:h.song_id, title:h.song_title, artist:h.song_artist, coverUrl:h.cover_url, playCount:0 };
    songCounts[h.song_id].playCount++;
    if (!artistCounts[h.song_artist]) artistCounts[h.song_artist] = { artist:{name:h.song_artist}, count:0, minutes:0 };
    artistCounts[h.song_artist].count++;
    artistCounts[h.song_artist].minutes += Math.round((h.duration||0)/60);
    const d = new Date(h.played_at);
    byDayOfWeek[d.getDay()]++;
    byHour[d.getHours()]++;
  }

  const topSongs = Object.values(songCounts).sort((a,b) => b.playCount - a.playCount).slice(0,10);
  const topArtists = Object.values(artistCounts).sort((a,b) => b.count - a.count).slice(0,10);

  const uniqueDays = [...new Set(history.map(h => h.played_at.slice(0,10)))].sort();
  let streak = 0, cur = 1;
  for (let i=1; i<uniqueDays.length; i++) {
    const diff = (new Date(uniqueDays[i]) - new Date(uniqueDays[i-1])) / 86400000;
    cur = diff===1 ? cur+1 : 1;
    streak = Math.max(streak, cur);
  }

  res.json({ period, totalMinutes, totalSongs:history.length, topSongs, topArtists, byDayOfWeek, byHour, streak });
});

router.get('/wrapped', async (req, res) => {
  const since = new Date(Date.now() - 365*86400000).toISOString();
  const history = await getDb().prepare('SELECT * FROM listening_history WHERE user_id=? AND played_at>=?').all(req.userId, since);
  const totalMinutes = Math.round(history.reduce((s,h) => s+(h.duration||0),0)/60);
  const songCounts = {}, artistCounts = {};
  for (const h of history) {
    if (!songCounts[h.song_id]) songCounts[h.song_id] = { id:h.song_id, title:h.song_title, artist:h.song_artist, coverUrl:h.cover_url, playCount:0 };
    songCounts[h.song_id].playCount++;
    if (!artistCounts[h.song_artist]) artistCounts[h.song_artist] = { name:h.song_artist, count:0 };
    artistCounts[h.song_artist].count++;
  }
  res.json({
    year: new Date().getFullYear(), totalMinutes, totalSongs:history.length,
    topSongs: Object.values(songCounts).sort((a,b)=>b.playCount-a.playCount).slice(0,5),
    topArtists: Object.values(artistCounts).sort((a,b)=>b.count-a.count).slice(0,5),
    streak:0,
  });
});

module.exports = router;
