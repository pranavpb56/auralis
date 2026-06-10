const path = require('path');
const fs = require('fs');

const IS_POSTGRES = !!process.env.DATABASE_URL;
let _db = null;

// ── PostgreSQL ────────────────────────────────────────────────────────────────
async function initPostgres() {
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 15000,
  });

  const c = await pool.connect();
  await c.query('SELECT 1');
  c.release();
  console.log('✅ PostgreSQL connected');
  return pool;
}

// ── SQLite (local only) ───────────────────────────────────────────────────────
async function initSqlite() {
  const initSqlJs = require('sql.js');
  const DB_PATH = path.join(__dirname, '../../../data/auralis.db');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const SQL = await initSqlJs();
  const raw = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();
  const save = () => { try { fs.writeFileSync(DB_PATH, Buffer.from(raw.export())); } catch {} };
  setInterval(save, 5000);
  ['exit','SIGINT','SIGTERM'].forEach(s => process.on(s, () => { save(); if (s!=='exit') process.exit(0); }));
  console.log('✅ SQLite ready (local)');
  return raw;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const SCHEMA_PG = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL, password_hash TEXT, avatar_url TEXT, bio TEXT,
    is_public INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW());

  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, user_id TEXT NOT NULL,
    is_public INTEGER DEFAULT 1, is_ai_generated INTEGER DEFAULT 0, ai_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW());

  CREATE TABLE IF NOT EXISTS playlist_songs (
    id TEXT PRIMARY KEY, playlist_id TEXT NOT NULL, song_id TEXT NOT NULL,
    song_title TEXT NOT NULL, song_artist TEXT NOT NULL, song_album TEXT,
    cover_url TEXT, duration INTEGER DEFAULT 0, preview_url TEXT,
    position INTEGER DEFAULT 0, added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, song_id));

  CREATE TABLE IF NOT EXISTS liked_songs (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, song_id TEXT NOT NULL,
    song_title TEXT NOT NULL, song_artist TEXT NOT NULL, song_album TEXT,
    cover_url TEXT, duration INTEGER DEFAULT 0, preview_url TEXT,
    liked_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, song_id));

  CREATE TABLE IF NOT EXISTS listening_history (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, song_id TEXT NOT NULL,
    song_title TEXT NOT NULL, song_artist TEXT NOT NULL,
    cover_url TEXT, duration INTEGER DEFAULT 0, played_at TIMESTAMPTZ DEFAULT NOW());

  CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY, follower_id TEXT NOT NULL, following_id TEXT NOT NULL,
    UNIQUE(follower_id, following_id));

  CREATE TABLE IF NOT EXISTS ai_interactions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, prompt TEXT NOT NULL,
    response TEXT NOT NULL, type TEXT DEFAULT 'chat', created_at TIMESTAMPTZ DEFAULT NOW());
`;

const SCHEMA_SQLITE = SCHEMA_PG
  .replace(/TIMESTAMPTZ DEFAULT NOW\(\)/g, "TEXT DEFAULT (datetime('now'))");

// ── Wrapper ───────────────────────────────────────────────────────────────────
function makeAdapter(engine, isPg) {
  if (isPg) {
    // engine = pg Pool
    function toPg(sql) {
      let i = 0;
      return sql
        .replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO')
        .replace(/INSERT OR REPLACE INTO/gi, 'INSERT INTO')
        .replace(/\?/g, () => `$${++i}`);
    }
    return {
      async exec(sql) {
        // run multi-statement schema
        await engine.query(sql).catch(e => {
          if (!e.message.includes('already exists')) throw e;
        });
      },
      prepare(sql) {
        return {
          async run(...a) {
            try { await engine.query(toPg(sql), a.flat()); return { changes:1 }; }
            catch(e) { if (e.code==='23505') return { changes:0 }; throw e; }
          },
          async get(...a) {
            const q = toPg(sql);
            const r = await engine.query(q.toLowerCase().includes('limit') ? q : q+' LIMIT 1', a.flat());
            return r.rows[0];
          },
          async all(...a) {
            const r = await engine.query(toPg(sql), a.flat());
            return r.rows;
          },
        };
      },
    };
  } else {
    // engine = sql.js Database
    const save = () => {};
    return {
      exec(sql) { engine.run(sql); return Promise.resolve(); },
      prepare(sql) {
        return {
          run(...a) {
            try { engine.run(sql, a.flat()); } catch(e) { if (!String(e).includes('UNIQUE')) throw e; }
            return Promise.resolve({ changes:1 });
          },
          get(...a) {
            const s = engine.prepare(sql);
            try {
              s.bind(a.flat());
              if (!s.step()) return Promise.resolve(undefined);
              const cols = s.getColumnNames(), vals = s.get();
              const o = {}; cols.forEach((c,i) => o[c]=vals[i]);
              return Promise.resolve(o);
            } finally { s.free(); }
          },
          all(...a) {
            const s = engine.prepare(sql), rows = [];
            try {
              s.bind(a.flat());
              while (s.step()) {
                const cols = s.getColumnNames(), vals = s.get();
                const o = {}; cols.forEach((c,i) => o[c]=vals[i]);
                rows.push(o);
              }
            } finally { s.free(); }
            return Promise.resolve(rows);
          },
        };
      },
    };
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function initDatabase() {
  const isPg = IS_POSTGRES;
  const engine = isPg ? await initPostgres() : await initSqlite();
  _db = makeAdapter(engine, isPg);
  const schema = isPg ? SCHEMA_PG : SCHEMA_SQLITE;
  await _db.exec(schema);
  console.log('✅ All tables ready');
  return _db;
}

function getDb() { return _db; }
module.exports = { initDatabase, getDb };
