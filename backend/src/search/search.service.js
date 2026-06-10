const cache = require('../db/cache');

const ITUNES = 'https://itunes.apple.com';
const CACHE_TTL = 600;

// iTunes requires a browser-like User-Agent
const FETCH_OPTS = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  },
};

function normalizeSong(r) {
  const id = String(r.trackId || r.collectionId || `it_${Math.random().toString(36).slice(2)}`);
  const cover = (r.artworkUrl100 || r.artworkUrl60 || '')
    .replace('100x100bb', '600x600bb').replace('60x60bb', '600x600bb');
  return {
    id,
    title: r.trackName || r.collectionName || 'Unknown',
    artist: r.artistName || 'Unknown Artist',
    album: r.collectionName || null,
    coverUrl: cover || null,
    duration: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : null,
    previewUrl: r.previewUrl || null,
    externalUrl: r.trackViewUrl || null,
    genre: r.primaryGenreName || null,
    source: 'itunes',
  };
}

function dedup(arr, keyFn) {
  const seen = new Set();
  return arr.filter(item => { const k = keyFn(item); if (seen.has(k)) return false; seen.add(k); return true; });
}

async function itunesSearch(params) {
  const url = `${ITUNES}/search?${new URLSearchParams({ country: 'us', ...params })}`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

const searchService = {
  async searchSongs(query, limit = 20) {
    const key = `songs:${query}:${limit}`;
    const hit = cache.getJson(key);
    if (hit) return hit;
    try {
      const results = await itunesSearch({ term: query, media: 'music', entity: 'song', limit: Math.min(limit, 50) });
      const songs = dedup(results.map(normalizeSong), s => s.id).slice(0, limit);
      cache.setJson(key, songs, CACHE_TTL);
      return songs;
    } catch (e) {
      console.error('searchSongs error:', e.message);
      return [];
    }
  },

  async searchArtists(query, limit = 10) {
    const key = `artists:${query}:${limit}`;
    const hit = cache.getJson(key);
    if (hit) return hit;
    try {
      const results = await itunesSearch({ term: query, media: 'music', entity: 'musicArtist', limit: Math.min(limit, 25) });
      const artists = dedup(
        results.map(r => ({ id: String(r.artistId), name: r.artistName, genre: r.primaryGenreName || null })),
        a => a.name.toLowerCase()
      ).slice(0, limit);
      cache.setJson(key, artists, CACHE_TTL);
      return artists;
    } catch (e) { return []; }
  },

  async searchAlbums(query, limit = 10) {
    const key = `albums:${query}:${limit}`;
    const hit = cache.getJson(key);
    if (hit) return hit;
    try {
      const results = await itunesSearch({ term: query, media: 'music', entity: 'album', limit: Math.min(limit, 25) });
      const albums = dedup(
        results.map(r => ({
          id: String(r.collectionId), title: r.collectionName, artist: r.artistName,
          coverUrl: r.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
          year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : null,
          trackCount: r.trackCount || null,
        })),
        a => a.title.toLowerCase()
      ).slice(0, limit);
      cache.setJson(key, albums, CACHE_TTL);
      return albums;
    } catch (e) { return []; }
  },

  async searchAll(query, limit = 20) {
    const key = `all:${query}:${limit}`;
    const hit = cache.getJson(key);
    if (hit) return hit;
    const [songs, artists, albums] = await Promise.all([
      this.searchSongs(query, limit),
      this.searchArtists(query, 8),
      this.searchAlbums(query, 8),
    ]);
    const result = { songs, artists, albums, query };
    cache.setJson(key, result, CACHE_TTL);
    return result;
  },

  async getSuggestions(query) {
    if (!query || query.length < 2) return [];
    const key = `suggest:${query}`;
    const hit = cache.getJson(key);
    if (hit) return hit;
    const songs = await this.searchSongs(query, 6);
    const suggestions = [...new Set([...songs.map(s => s.title), ...songs.map(s => s.artist)])].slice(0, 8);
    cache.setJson(key, suggestions, 120);
    return suggestions;
  },

  async getTrending() {
    const key = 'trending';
    const hit = cache.getJson(key);
    if (hit) return hit;
    const genres = [
      { name: 'Bollywood', query: 'bollywood hindi songs 2024' },
      { name: 'Telugu', query: 'telugu songs 2024' },
      { name: 'Pop', query: 'pop hits 2024' },
      { name: 'Hip Hop', query: 'hip hop songs 2024' },
    ];
    const genreResults = await Promise.all(
      genres.map(async g => ({ name: g.name, songs: await this.searchSongs(g.query, 8).catch(() => []) }))
    );
    const allSongs = dedup(genreResults.flatMap(g => g.songs), s => s.id).slice(0, 20);
    const result = { songs: allSongs, genres: genreResults };
    cache.setJson(key, result, 3600);
    return result;
  },
};

module.exports = searchService;
