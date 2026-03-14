# Voltra Command Center — Setup Guide

## What This Is
Your personal operations dashboard. Shows all your projects, goals, daily plan, and job search in one place. Updates via plain text — just type "mark project X as done" and Claude applies it.

---

## Deploy in 5 Minutes

### Step 1: Push to GitHub
In your terminal, from the project folder:
```bash
git init
git add .
git commit -m "Voltra Command Center init"
gh repo create voltra-command-center --private --push
```
Or manually create a repo at github.com/new and push.

### Step 2: Deploy to Vercel
1. Go to vercel.com/new
2. Import your GitHub repo
3. Vercel detects Next.js automatically — click **Deploy**

### Step 3: Add Environment Variables
In Vercel → Project Settings → Environment Variables:

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Powers the text update feature |
| `UPSTASH_REDIS_REST_URL` | Yes | Redis database URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Redis database token |
| `GOOGLE_CLIENT_ID` | Optional | For Google Calendar sync |
| `GOOGLE_CLIENT_SECRET` | Optional | For Google Calendar sync |
| `GOOGLE_REFRESH_TOKEN` | Optional | For Google Calendar sync |
| `NOTION_API_KEY` | Optional | Ready to plug in — not active yet |

> You can deploy with just `ANTHROPIC_API_KEY` and Redis env vars and everything works. Calendar and Notion are optional add-ons.

### Step 4: Add to iPhone Home Screen
1. Open your Vercel URL in Safari
2. Share → Add to Home Screen
3. Done — it's a native-feeling app

---

## How to Use It

### Updating the Dashboard
Type anything natural in the "Update Dashboard" bar at the bottom:
- "Mark project X as done"
- "Add company Y to active conversations"
- "Set applications this week to 3"
- "Update clearance status to approved"
- "Add a new goal: prep for interview, high priority"

Claude reads your full context and applies the change automatically.

### Checking Off Weekly Goals
Click any goal to mark it done/undone.

### Scratchpad
Bottom left — local only, doesn't need a server. Just quick notes for the day. Doesn't persist across devices.

### Context Page
Top right → "Context JSON" — shows everything in a Claude-readable format. Copy it and paste it into a Claude conversation to give full context instantly.

---

## Local Development

```bash
cp .env.local.example .env.local
# Fill in your ANTHROPIC_API_KEY and Redis credentials at minimum

npm install
npm run dev
# Open http://localhost:3000
```

---

## Adding Google Calendar (Optional)

1. Go to Google Cloud Console → Create a project
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials
4. Get a refresh token using OAuth playground
5. Add all four GOOGLE_* env vars to Vercel
6. Redeploy

## Adding Notion (When Ready)

The code is already written — just uncomment the Notion block in `app/api/calendar/route.ts` and add:
- `NOTION_API_KEY` — from notion.so/my-integrations
- `NOTION_DATABASE_ID` — from your Notion database URL

---

## Activate Voltra Mode

When starting a Claude conversation, say **"Voltra Mode"** to load all your personal business context. Without it, Claude stays in neutral mode.
