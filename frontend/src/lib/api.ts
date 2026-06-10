import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    try {
      const s = JSON.parse(localStorage.getItem('auralis-auth') || '{}');
      if (s.state?.token) cfg.headers.Authorization = `Bearer ${s.state.token}`;
    } catch {}
  }
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('auralis-auth');
    window.location.href = '/auth/login';
  }
  return Promise.reject(err);
});

export const authAPI = {
  register: (d: any) => api.post('/auth/register', d),
  login: (d: any) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
};

export const searchAPI = {
  all: (q: string, limit = 20) => api.get('/search', { params: { q, limit } }),
  songs: (q: string, limit = 20) => api.get('/search/songs', { params: { q, limit } }),
  artists: (q: string) => api.get('/search/artists', { params: { q } }),
  albums: (q: string) => api.get('/search/albums', { params: { q } }),
  suggest: (q: string) => api.get('/search/suggest', { params: { q } }),
  trending: () => api.get('/search/trending'),
};

export const playlistsAPI = {
  getAll: () => api.get('/playlists'),
  get: (id: string) => api.get(`/playlists/${id}`),
  create: (d: any) => api.post('/playlists', d),
  update: (id: string, d: any) => api.patch(`/playlists/${id}`, d),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addSong: (id: string, song: any) => api.post(`/playlists/${id}/songs`, song),
  removeSong: (id: string, songId: string) => api.delete(`/playlists/${id}/songs/${songId}`),
  getLikedSongs: () => api.get('/playlists/liked-songs'),
  likeSong: (song: any) => api.post('/playlists/songs/like', song),
  getRecentlyPlayed: () => api.get('/playlists/recently-played'),
  recordPlay: (song: any) => api.post('/playlists/play/record', song),
};

export const aiAPI = {
  chat: (d: any) => api.post('/ai/chat', d),
  generatePlaylist: (d: any) => api.post('/ai/playlist/generate', d),
  chatHistory: () => api.get('/ai/chat/history'),
  mood: (mood: string) => api.get(`/ai/mood/${mood}`),
  feed: () => api.get('/ai/feed'),
};

export const analyticsAPI = {
  stats: (period = 'month') => api.get('/analytics/stats', { params: { period } }),
  wrapped: () => api.get('/analytics/wrapped'),
};

export const usersAPI = {
  profile: () => api.get('/users/profile'),
  update: (d: any) => api.put('/users/profile', d),
  byUsername: (u: string) => api.get(`/users/${u}`),
  follow: (id: string) => api.post(`/users/${id}/follow`),
};

export const youtubeAPI = {
  find: (title: string, artist: string) =>
    api.get('/youtube/find', { params: { title, artist } }),
  batch: (songs: any[]) => api.post('/youtube/batch', { songs }),
};
