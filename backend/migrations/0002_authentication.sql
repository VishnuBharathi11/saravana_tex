-- Migration number: 0002 	 2026-08-22T08:12:48.594Z
-- ============================================================
-- Migration: Authentication
-- Saravana Traders CRM
-- ============================================================

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_seen_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sessions_employee
    ON sessions(employee_id);

CREATE INDEX idx_sessions_expires_at
    ON sessions(expires_at);