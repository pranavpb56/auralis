# 🚀 Deploying Auralis — Complete Guide

After this guide your app will be live at:
- **Frontend**: `https://auralis-xxxx.vercel.app`
- **Backend**:  `https://auralis-backend.onrender.com`

Accessible from your phone, desktop, anywhere. Free forever.

---

## Step 1 — Push code to GitHub

1. Go to **https://github.com** → click **"New repository"**
2. Name it `auralis` → **Create repository** (keep it Public)
3. Open **Command Prompt** in your `D:\auralis` folder and run:

```cmd
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/auralis.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Deploy Backend on Render

1. Go to **https://render.com** → Log in
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect a repository"** → select your `auralis` repo
4. Fill in:
   - **Name**: `auralis-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **"Advanced"** → **"Add Environment Variable"** and add ALL of these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | any random string like `auralis-super-secret-abc123xyz` |
| `JWT_EXPIRES_IN` | `7d` |
| `GROQ_API_KEY` | your Groq key |
| `YOUTUBE_API_KEY` | `AIzaSyDMJz7jgdpNIB12YrwmSSZdZcfcyqgK-h0` |
| `FRONTEND_URL` | `*` (set properly in Step 4) |

6. Click **"Create Web Service"** — wait ~3 minutes for deploy
7. Copy your backend URL: `https://auralis-backend.onrender.com`

### Add a Database on Render
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `auralis-db` → Plan: **Free** → **Create Database**
3. Once created, click on it → copy the **"Internal Database URL"**
4. Go back to your backend service → **Environment** tab → Add:
   - `DATABASE_URL` = paste the Internal Database URL

5. Click **"Manual Deploy"** → **"Deploy latest commit"** to restart with DB

---

## Step 3 — Deploy Frontend on Vercel

1. Go to **https://vercel.com** → Log in
2. Click **"Add New"** → **"Project"**
3. Import your `auralis` GitHub repo
4. Settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
5. Click **"Environment Variables"** and add:
   - `NEXT_PUBLIC_API_URL` = `https://auralis-backend.onrender.com/api`
6. Click **"Deploy"** — wait ~2 minutes
7. Copy your frontend URL: `https://auralis-xxxx.vercel.app`

---

## Step 4 — Connect Frontend ↔ Backend

1. Go to **Render** → your `auralis-backend` service → **Environment**
2. Update `FRONTEND_URL` to your Vercel URL:
   - Value: `https://auralis-xxxx.vercel.app`
3. Click **"Save Changes"** → Render auto-redeploys

---

## Step 5 — Test it!

Open `https://auralis-xxxx.vercel.app` on your phone or desktop.
- Sign up → search songs → click play → full song via YouTube ✅

---

## After initial setup — updating your app

Just push to GitHub and both services auto-redeploy:
```cmd
git add .
git commit -m "your changes"
git push
```

---

## Troubleshooting

**Backend shows "Service unavailable"**
→ Free Render services sleep after 15 min. First request takes ~30s to wake up. This is normal.

**Songs not playing**
→ Check `YOUTUBE_API_KEY` is set in Render environment variables.

**AI not working**
→ Check `GROQ_API_KEY` is set in Render environment variables.

**CORS errors in browser**
→ Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash).

**Database errors on Render**
→ Make sure `DATABASE_URL` is set to the Internal Database URL (not External).
