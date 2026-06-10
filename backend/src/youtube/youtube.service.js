const cache = require('../db/cache');

const YT_API = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY || '';
const CACHE_TTL = 86400; // 24 hours — video IDs don't change

const youtubeService = {
  /**
   * Find the best YouTube video ID for a song.
   * Returns null if not found or API key missing.
   */
  async findVideoId(title, artist) {
    if (!API_KEY) return null;

    const query = `${title} ${artist} official audio`;
    const cacheKey = `yt:${query}`;
    const cached = cache.getJson(cacheKey);
    if (cached !== null) return cached;

    try {
      const params = new URLSearchParams({
        part: 'id,snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: '5',
        key: API_KEY,
      });

      const res = await fetch(`${YT_API}/search?${params}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        console.error('YouTube API error:', res.status, await res.text());
        return null;
      }

      const data = await res.json();
      const items = data.items || [];

      // Pick best result: prefer "official audio" or "official video" in title
      let videoId = null;
      for (const item of items) {
        const t = (item.snippet?.title || '').toLowerCase();
        if (t.includes('official audio') || t.includes('official video') || t.includes('lyric')) {
          videoId = item.id?.videoId;
          break;
        }
      }
      // Fallback to first result
      if (!videoId && items.length > 0) {
        videoId = items[0].id?.videoId || null;
      }

      cache.setJson(cacheKey, videoId, CACHE_TTL);
      return videoId;
    } catch (e) {
      console.error('YouTube search failed:', e.message);
      return null;
    }
  },

  /**
   * Batch find video IDs for multiple songs (used for queue preloading).
   */
  async batchFindVideoIds(songs) {
    const results = {};
    // Sequential to avoid hammering the API
    for (const song of songs.slice(0, 5)) {
      const id = await this.findVideoId(song.title, song.artist);
      if (id) results[song.id] = id;
      await new Promise(r => setTimeout(r, 100)); // small delay
    }
    return results;
  },
};

module.exports = youtubeService;
