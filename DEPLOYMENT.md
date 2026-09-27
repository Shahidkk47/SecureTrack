# Deploying SecureTrack live

This project is now deployment-ready: the API URL and CORS origin are read
from environment variables instead of being hardcoded, and `render.yaml` /
`frontend/vercel.json` are included so both platforms auto-detect the setup.

## 1. Database (Neon or Supabase — free tier)
1. Create a project at neon.tech or supabase.com.
2. Copy the connection details (host, port, user, password, database name).
3. Run the schema against it:
   ```
   psql "<your-connection-string>" -f db/migrations/001_init_schema.sql
   ```

## 2. Backend (Render)
1. Push this repo to GitHub.
2. On render.com: **New → Blueprint**, point it at your repo — it will read
   `render.yaml` automatically. Or manually: **New → Web Service**, root
   directory `backend`, build command `npm install`, start command
   `node src/server.js`.
3. Set these environment variables in the Render dashboard:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — from step 1
   - `JWT_SECRET` — Render can auto-generate this (see `render.yaml`)
   - `FRONTEND_URL` — set once you have your Vercel URL (step 3)
4. Deploy. You'll get a URL like `https://securetrack-backend.onrender.com`.
   Note: Render's free tier sleeps after 15 min idle — the first request
   after that can take 20–30s to wake up.

## 3. Frontend (Vercel)
1. On vercel.com: **Import Project**, pick this repo, set root directory to
   `frontend` (framework preset: Vite).
2. Add environment variable `VITE_API_URL` = your Render backend URL from
   step 2.
3. Deploy. You'll get a URL like `https://securetrack.vercel.app` — this is
   your shareable live link.
4. Go back to Render and set `FRONTEND_URL` to this Vercel URL, then
   redeploy the backend so CORS allows it.

## 4. Test it
Open the Vercel URL, sign up, log in, submit an incident, and (as an admin
promoted via `PATCH /api/users/:id/role`) triage it. This is the link to
use for the live demo and to put in your report.
