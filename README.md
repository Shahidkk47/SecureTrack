# SecureTrack — Sprint 1 Scaffold

This is a real, runnable starting point for Sprint 1 (Database + Login),
matching your Assessment 1 design exactly.

## What's in here

- `db/migrations/001_init_schema.sql` — the 5-table schema (Users, Incidents,
  Categories, AuditLogs, Attachments) with the exact constraints from your
  ERD, plus a database-level trigger that makes `audit_logs` truly insert-only
  (this is what TC-09 checks).
- `backend/` — Express API: signup/login (bcrypt + JWT) and the 4 incident
  endpoints from your API spec (Section 6.4).
- `jira_backlog_import.csv` — epics/stories mapped to your FR/NFR IDs, sprint,
  and owner (Shakeel/Rehman). Import into Jira via **Project settings →
  Import issues from CSV**, or open it directly in Trello/Excel if you're
  using another board.

## Run it locally

1. Install PostgreSQL locally (or use a free-tier cloud instance — Supabase,
   Neon, Railway all have one).
2. Create the database and run the migration:
   ```
   createdb securetrack
   psql securetrack -f db/migrations/001_init_schema.sql
   ```
3. In `backend/`, copy `.env.example` to `.env` and fill in your real DB
   credentials and a random `JWT_SECRET`. **Never commit `.env`.**
4. Install and run:
   ```
   cd backend
   npm install
   npm run dev
   ```
5. Test it's alive: `curl http://localhost:3000/health`

## Try the actual test cases now

```bash
# TC-01 / TC-07: signup, then confirm the DB stores a bcrypt hash, not plaintext
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Shakeel Adnan","email":"shakeel@test.com","password":"Test1234!","role":"admin"}'

# then in psql:
# SELECT password_hash FROM users WHERE email='shakeel@test.com';
# -> should start with $2b$ (bcrypt), never the plain password

# login -> get a JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shakeel@test.com","password":"Test1234!"}'

# TC-01 / TC-02 / TC-03: submit an incident with the token from above
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"description":"Suspicious login attempt","category_id":"<A_CATEGORY_UUID>"}'
```

Run each command, screenshot/record the result, and log it straight into
your test evidence table — this is the "actual result" column for TC-01,
TC-02, TC-03, and TC-07.

## Commit convention (for traceable version-control evidence)

Every commit message references the requirement it implements, e.g.:

```
git add db/migrations/001_init_schema.sql
git commit -m "FR-08/NFR-01: initial schema with insert-only audit log"
```

## Next steps (in order)

1. Push this to a GitHub repo, both of you as collaborators.
2. Import `jira_backlog_import.csv` into your board.
3. Run the signup/login/incident commands above, capture evidence.
4. Move the Sprint 1 cards to Done **only** once TC-01, TC-02, TC-03, TC-07
   actually pass against your running system.
5. Then move to Sprint 2 (incident submission React form, FR-01–FR-05) —
   say the word and I'll scaffold that next.
