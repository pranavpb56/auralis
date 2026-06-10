# 🎵 Auralis — AI-Powered Music Platform

> A full-stack Spotify-inspired music streaming platform built with Next.js 14, Express.js, SQLite, and Groq AI.
> **No Docker. No PostgreSQL. No Redis. Just Node.js.**

---

## ✨ What You Get

- 🔍 **Real music search** — iTunes API (free, no key needed, millions of songs)
- ▶️ **Audio playback** — 30-second previews via iTunes
- 🤖 **AI Playlist Generator** — describe any vibe, get a playlist (Groq AI)
- 💬 **AI Chat Assistant** — ask for recommendations in natural language
- ❤️ **Like songs** + create playlists
- 🕐 **Listening history** + Recently played
- 📊 **Your Wrapped** — listening stats, top songs, top artists, charts
- 👤 **User profiles** + follow system
- 🎨 **Glassmorphism UI** — dark, modern, animated

---

## 🚀 Setup (Windows)

### Step 1 — Install Node.js
Download from **https://nodejs.org** (LTS version). Restart your PC after installing.

### Step 2 — Get a Groq API Key (free)
1. Go to **https://console.groq.com**
2. Sign up (free)
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)

### Step 3 — Setup the project

Double-click **`setup.bat`** — it installs everything automatically.

Or run manually in Command Prompt:
```
cd D:\auralis
copy .env.example .env
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Step 4 — Add your Groq key

Open `.env` in Notepad and change:
```
GROQ_API_KEY=gsk_your_key_here
```
to your actual key.

### Step 5 — Start the app
```
node start.js
```

Open your browser: **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
auralis/
├── start.js          ← Run this to start everything
├── setup.bat         ← Double-click for first-time setup (Windows)
├── .env.example      ← Copy to .env and add your Groq key
├── .env              ← Your secrets (create this)
│
├── backend/          ← Express.js API server (port 4000)
│   ├── src/
│   │   ├── server.js          ← Entry point
│   │   ├── db/
│   │   │   ├── database.js    ← SQLite (auto-creates data/auralis.db)
│   │   │   └── cache.js       ← In-memory cache (replaces Redis)
│   │   ├── auth/              ← JWT login/signup
│   │   ├── search/            ← iTunes API integration
│   │   ├── playlists/         ← CRUD + likes + history
│   │   ├── ai/                ← Groq chat + playlist generator
│   │   ├── analytics/         ← Stats + Wrapped
│   │   └── users/             ← Profiles + follow
│   └── package.json
│
├── frontend/         ← Next.js 14 app (port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          ← Landing page
│   │   │   ├── auth/             ← Login + Signup
│   │   │   ├── dashboard/        ← Home feed
│   │   │   ├── search/           ← Search + Browse genres
│   │   │   ├── library/          ← Playlists + Liked + Recent
│   │   │   ├── playlist/[id]/    ← Playlist detail
│   │   │   ├── ai/               ← AI chat + generator
│   │   │   ├── analytics/        ← Wrapped stats
│   │   │   ├── settings/         ← Profile + preferences
│   │   │   └── profile/[username]/ ← Public profiles
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx
│   │   │   ├── player/Player.tsx       ← Full player with audio
│   │   │   ├── player/FullscreenPlayer.tsx ← Immersive view
│   │   │   └── music/SongCard.tsx
│   │   ├── store/index.ts    ← Zustand (player + auth state)
│   │   └── lib/api.ts        ← Axios API client
│   └── package.json
│
└── data/
    └── auralis.db    ← Auto-created SQLite database
```

---

## 🎵 How Music Works

```
You search → Backend → iTunes Search API (free) → Results shown
You click play → iTunes 30-sec preview URL → Browser plays it
```

- Every song has a real 30-second audio preview
- Real album artwork from Apple's CDN
- Millions of songs including Bollywood, Telugu, Pop, Hip Hop, etc.
- **Not full songs** — iTunes only provides previews legally

---

## 🤖 AI Features

Requires `GROQ_API_KEY` in your `.env`.

**AI Chat** — ask naturally:
- *"Recommend songs for a late night drive"*
- *"Find music similar to Arijit Singh"*
- *"What are the best Bollywood party tracks?"*

**AI Playlist Generator** — one sentence → full playlist:
- *"Telugu night drive songs 🌙"*
- *"Gym pump-up tracks with heavy bass"*
- *"Relaxing lo-fi beats for studying"*

---

## 🔌 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/search?q=query` | Search all |
| GET | `/api/search/songs?q=query` | Search songs |
| GET | `/api/search/trending` | Trending music |
| GET | `/api/playlists` | Your playlists |
| POST | `/api/playlists` | Create playlist |
| POST | `/api/playlists/songs/like` | Like a song |
| POST | `/api/ai/chat` | AI chat |
| POST | `/api/ai/playlist/generate` | Generate playlist |
| GET | `/api/ai/mood/:mood` | Mood recommendations |
| GET | `/api/analytics/stats` | Listening stats |

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand |
| Data Fetching | TanStack Query |
| Backend | Express.js (Node.js) |
| Database | SQLite via better-sqlite3 |
| Cache | In-memory (no Redis) |
| Auth | JWT + bcrypt |
| AI | Groq SDK (LLaMA 3.3 70B) — free |
| Music | iTunes Search API — free, no key |

---

## ❓ Troubleshooting

**`node start.js` — backend crashes?**
→ Make sure you ran `cd backend && npm install` first

**Can't play songs?**
→ Normal — some songs don't have iTunes previews. Try a different song.

**AI features not working?**
→ Check your `GROQ_API_KEY` in `.env`. Get one free at console.groq.com

**Port already in use?**
→ Kill existing processes: `npx kill-port 3000 4000`

**Frontend shows white screen?**
→ Make sure `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

---

## 📄 License

MIT — free to use for portfolio, interviews, and commercial projects.

---

## 🎵 Full Song Playback (YouTube)

When you click any song:
1. Backend calls YouTube Data API to find the best matching video
2. A hidden YouTube iframe loads and plays the **full song**
3. Your player controls (play, pause, seek, volume, speed) control the YouTube player
4. The player shows **"Full song via YouTube"** in green when ready

**Flow:**
```
Click song → iTunes metadata + artwork shown → YouTube video found → Full song plays
```

The YouTube video is completely hidden — you only see the Auralis player UI.
