const express = require('express');
const { v4: uuid } = require('uuid');
const { requireAuth } = require('../auth/auth.routes');
const { getDb } = require('../db/database');
const searchService = require('../search/search.service');
const cache = require('../db/cache');

const router = express.Router();
router.use(requireAuth);

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const Groq = require('groq-sdk');
  return new Groq({ apiKey: key });
}
const MODEL = 'llama-3.3-70b-versatile';

router.post('/chat', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message required' });
  const groq = getGroq();
  if (!groq) return res.json({ message: "AI needs a GROQ_API_KEY in your environment variables (free at console.groq.com)", songs: [] });

  try {
    const recentHistory = await getDb().prepare(
      'SELECT song_title, song_artist FROM listening_history WHERE user_id=? ORDER BY played_at DESC LIMIT 10'
    ).all(req.userId);
    const historyCtx = recentHistory.length
      ? `User recently listened to: ${recentHistory.map(h=>`${h.song_title} by ${h.song_artist}`).join(', ')}.`
      : 'No listening history yet.';

    const completion = await groq.chat.completions.create({
      model: MODEL, max_tokens: 600, temperature: 0.8,
      messages: [
        { role:'system', content:`You are Auralis AI, an enthusiastic music assistant. Help users discover music.\n${historyCtx}\nWhen recommending songs format them as:\nSONG: [Title] | ARTIST: [Artist] | REASON: [reason]\nKeep responses under 250 words.` },
        ...conversationHistory.slice(-8),
        { role:'user', content:message }
      ]
    });

    const reply = completion.choices[0].message.content || '';
    const songPattern = /SONG:\s*(.+?)\s*\|\s*ARTIST:\s*(.+?)\s*\|\s*REASON:\s*(.+?)(?=\nSONG:|$)/gi;
    const recs = [];
    let m;
    while ((m = songPattern.exec(reply)) !== null) recs.push({ title:m[1].trim(), artist:m[2].trim() });

    let songs = [];
    if (recs.length) {
      const results = await Promise.all(recs.slice(0,3).map(r => searchService.searchSongs(`${r.title} ${r.artist}`, 2).catch(()=>[])));
      songs = results.flat().slice(0,6);
    }

    await getDb().prepare('INSERT INTO ai_interactions (id,user_id,prompt,response,type) VALUES (?,?,?,?,?)')
      .run(uuid(), req.userId, message, reply, 'chat');

    res.json({ message: reply, songs });
  } catch (e) {
    console.error('AI chat error:', e.message);
    res.status(500).json({ message: 'AI error: ' + e.message, songs: [] });
  }
});

router.post('/playlist/generate', async (req, res) => {
  const { prompt, name } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ message: 'Prompt required' });
  const groq = getGroq();

  try {
    let analysis = { playlistName: name||prompt, searchQueries: [prompt, `best ${prompt}`, `${prompt} songs`] };

    if (groq) {
      try {
        const r = await groq.chat.completions.create({
          model: MODEL, max_tokens:400,
          messages: [
            { role:'system', content:'Respond ONLY with valid JSON, no markdown.' },
            { role:'user', content:`Analyze playlist request: "${prompt}"\nFormat: {"playlistName":"...","description":"...","mood":"...","energy":"low|medium|high","genres":[],"searchQueries":["q1","q2","q3","q4","q5"]}` }
          ]
        });
        analysis = JSON.parse(r.choices[0].message.content.replace(/```json|```/g,'').trim());
      } catch {}
    }

    const queries = analysis.searchQueries?.slice(0,5) || [prompt];
    const results = await Promise.all(queries.map(q => searchService.searchSongs(q, 5).catch(()=>[])));
    const seen = new Set();
    const songs = results.flat().filter(s => {
      const k = `${s.title}:${s.artist}`.toLowerCase();
      if (seen.has(k)) return false; seen.add(k); return true;
    }).slice(0,20);

    const id = uuid();
    await getDb().prepare('INSERT INTO playlists (id,name,description,user_id,is_public,is_ai_generated,ai_prompt) VALUES (?,?,?,?,1,1,?)')
      .run(id, analysis.playlistName||name||prompt, analysis.description||`AI: ${prompt}`, req.userId, prompt);
    await getDb().prepare('INSERT INTO ai_interactions (id,user_id,prompt,response,type) VALUES (?,?,?,?,?)')
      .run(uuid(), req.userId, prompt, JSON.stringify({playlistId:id, songCount:songs.length}), 'playlist_generation');

    const playlist = await getDb().prepare('SELECT * FROM playlists WHERE id=?').get(id);
    res.json({ playlist, songs, analysis: { mood:analysis.mood, genres:analysis.genres, energy:analysis.energy } });
  } catch (e) {
    console.error('Playlist gen error:', e.message);
    res.status(500).json({ message: e.message });
  }
});

router.get('/mood/:mood', async (req, res) => {
  const { mood } = req.params;
  const hit = cache.getJson(`mood:${mood}`);
  if (hit) return res.json(hit);
  const moodMap = {
    happy:'happy upbeat feel good pop', sad:'sad emotional melancholic', energetic:'high energy workout',
    chill:'chill relaxing lofi', focus:'concentration study ambient', romantic:'romantic love slow',
    angry:'intense aggressive rock', party:'party dance club hits', telugu:'telugu hits 2024',
    bollywood:'bollywood romantic hits'
  };
  const songs = await searchService.searchSongs(moodMap[mood.toLowerCase()]||`${mood} music`, 16);
  const result = { mood, songs };
  cache.setJson(`mood:${mood}`, result, 1800);
  res.json(result);
});

router.get('/feed', async (req, res) => {
  try {
    const topArtist = await getDb().prepare(
      'SELECT song_artist, COUNT(*) as c FROM listening_history WHERE user_id=? GROUP BY song_artist ORDER BY c DESC LIMIT 1'
    ).get(req.userId);
    const query = topArtist ? `${topArtist.song_artist} similar songs` : 'trending music 2024';
    const songs = await searchService.searchSongs(query, 16);
    res.json({ songs, basedOn: topArtist?.song_artist || null });
  } catch { res.json({ songs:[], basedOn:null }); }
});

router.get('/chat/history', async (req, res) => {
  const rows = await getDb().prepare(
    'SELECT prompt, response, created_at FROM ai_interactions WHERE user_id=? AND type=? ORDER BY created_at ASC LIMIT 50'
  ).all(req.userId, 'chat');
  res.json(rows);
});

module.exports = router;
