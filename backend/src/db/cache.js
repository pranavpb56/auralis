// Simple in-memory cache — replaces Redis, zero dependencies
const store = new Map();

const cache = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  set(key, value, ttlSeconds = 600) {
    store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  },

  del(key) {
    store.delete(key);
  },

  // Delete all keys matching a prefix
  delPattern(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  getJson(key) {
    const val = this.get(key);
    if (!val) return null;
    try { return typeof val === 'string' ? JSON.parse(val) : val; }
    catch { return null; }
  },

  setJson(key, value, ttlSeconds = 600) {
    this.set(key, value, ttlSeconds);
  },
};

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt && now > entry.expiresAt) store.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = cache;
