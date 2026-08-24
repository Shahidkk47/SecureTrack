# SecureTrack

A cloud-based cybersecurity incident reporting system for SMEs, built for
ICT503 Assessment 2 (Project Audit Review), matching the Assessment 1 design.

## What's in here

- `db/migrations/001_init_schema.sql` — the 5-table schema (Users, Incidents,
  Categories, AuditLogs, Attachments) with the exact constraints from the
  ERD, plus a database-level trigger that makes `audit_logs` truly insert-only
  (this is what TC-09 checks).
- `backend/` — Express API: signup/login (bcrypt + JWT), incident endpoints
  (Section 6.4), severity/assignment/status updates, and the admin report/list
  endpoint.
- `frontend/` — React app: signup, login, incident submission form, incident
  detail view, and an admin dashboard for triage.
- `jira_backlog_import.csv` — epics/stories mapped to FR/NFR IDs, sprint,
  and owner (Shakeel/Rehman).

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
4. Install and run the backend:
   ```
   cd backend
   npm install
   npm run dev
   ```
5. In a second terminal, install and run the frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
6. Open `http://localhost:5173` in your browser.

## Sprint 1 — Database + Auth (FR-01, FR-02, FR-08, NFR-01, NFR-02)

- 5-table schema with insert-only audit log trigger
- Signup/login with bcrypt password hashing + JWT
- Incident creation (`POST /api/incidents`) with server-side validation
- Role-based access middleware

**Test cases covered:** TC-01, TC-02, TC-03, TC-07, TC-08

## Sprint 2 — Admin Dashboard (FR-03, FR-04, FR-05, FR-07)

- `PATCH /api/incidents/:id/severity` — classify severity
- `PATCH /api/incidents/:id/assign` — assign/escalate to staff
- `GET /api/users` — staff list for the assignment dropdown
- `AdminDashboard.jsx` — table view with inline severity/status/assignment
  editing and status filtering, admin/manager only

**Test cases covered:** TC-04, TC-05, plus FR-04/FR-07 functional evidence

## Try the actual test cases

```bash
# TC-01 / TC-07: signup, then confirm the DB stores a bcrypt hash, not plaintext
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Shakeel Adnan","email":"shakeel@test.com","password":"Test1234!","role":"admin"}'

# then in psql / SQL editor:
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

# TC-09: audit log immutability — run in your SQL editor
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5;
UPDATE audit_logs SET action = 'TAMPERED' WHERE id = '<paste an id from above>';
# -> should return an ERROR, never succeed
```

Run each command, screenshot/record the result, and log it into the test
evidence table in the Assessment 2 report.

## Commit convention (for traceable version-control evidence)

Every commit message references the requirement it implements, e.g.:

```
git add db/migrations/001_init_schema.sql
git commit -m "FR-08/NFR-01: initial schema with insert-only audit log"
```

## Evidence folder

Screenshots proving each test case passes live in `evidence/`, named by
test ID, e.g. `evidence/01_signup_form.png`, `evidence/09_severity_update.png`.

## Next steps

1. TC-09 — audit log immutability (SQL test above)
2. TC-06 — notification on status change (FR-06, not yet implemented)
3. TC-10 — response time check
4. Update risk register and Jira board with real Week 6 status
5. Prepare for the in-class audit review (Assessment 2)
