-- SecureTrack initial schema
-- Matches Assessment 1 ERD (Section 6.3): 5 entities, 3NF, indexed FKs
-- FR-08 (insert-only audit log), NFR-01 (encryption/hashing), NFR-02 (RBAC)

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ==========================================================
-- Users
-- ==========================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,           -- bcrypt salted hash, never plain text (NFR-01)
    role            VARCHAR(20)   NOT NULL             -- employee | admin | manager (NFR-02)
                        CHECK (role IN ('employee', 'admin', 'manager')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ==========================================================
-- Categories
-- ==========================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)  NOT NULL UNIQUE
);

-- ==========================================================
-- Incidents
-- ==========================================================
CREATE TABLE incidents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),          -- FR-02: unique ID
    description         TEXT          NOT NULL,
    category_id         UUID          NOT NULL REFERENCES categories(id),   -- FR-01
    reported_by_id      UUID          NOT NULL REFERENCES users(id),        -- FR-01
    assigned_user_id    UUID          NULL     REFERENCES users(id),        -- FR-04
    severity            VARCHAR(10)   NOT NULL DEFAULT 'Low'                -- FR-03
                            CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status              VARCHAR(20)   NOT NULL DEFAULT 'New'                -- FR-05
                            CHECK (status IN ('New', 'In Progress', 'Resolved', 'Closed')),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),               -- FR-02: timestamp
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_category_id      ON incidents(category_id);
CREATE INDEX idx_incidents_reported_by_id   ON incidents(reported_by_id);
CREATE INDEX idx_incidents_assigned_user_id ON incidents(assigned_user_id);

-- ==========================================================
-- Attachments
-- ==========================================================
CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id     UUID          NOT NULL REFERENCES incidents(id),  -- FR-01
    file_url        VARCHAR(500)  NOT NULL,
    uploaded_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_incident_id ON attachments(incident_id);

-- ==========================================================
-- AuditLogs  (FR-08: permanent, insert-only record of every action)
-- ==========================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id     UUID          NOT NULL REFERENCES incidents(id),
    user_id         UUID          NOT NULL REFERENCES users(id),
    action          VARCHAR(100)  NOT NULL,   -- e.g. 'CREATED', 'STATUS_CHANGED', 'ASSIGNED'
    details         TEXT          NULL,
    timestamp       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_incident_id ON audit_logs(incident_id);
CREATE INDEX idx_audit_logs_user_id     ON audit_logs(user_id);

-- ----------------------------------------------------------
-- Enforce insert-only at the DATABASE level (this is what TC-09 checks)
-- Any UPDATE or DELETE on audit_logs is rejected by Postgres itself,
-- not just by the application layer.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is insert-only: % is not permitted (FR-08)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- ==========================================================
-- Seed categories (needed for TC-01 form submission to work)
-- ==========================================================
INSERT INTO categories (name) VALUES
    ('Phishing'), ('Malware'), ('Unauthorized Access'), ('Data Leak'), ('Other');
