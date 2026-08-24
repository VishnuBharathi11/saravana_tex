-- Migration number: 0003  2026-08-24
-- Allow follow-ups to reference orders.

CREATE TABLE follow_ups_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN (
            'Pending',
            'Completed',
            'Important',
            'Meeting',
            'Order',
            'Reminder',
            'Missed'
        )
    ),
    priority TEXT NOT NULL CHECK (
        priority IN (
            'Low',
            'Medium',
            'High'
        )
    ),
    reminder INTEGER NOT NULL DEFAULT 0
        CHECK (reminder IN (0, 1)),
    employee_id TEXT NOT NULL,
    related_type TEXT NOT NULL CHECK (
        related_type IN (
            'Lead',
            'Customer',
            'Order'
        )
    ),
    related_id TEXT NOT NULL,
    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT
);

INSERT INTO follow_ups_new (
    id,
    title,
    description,
    date,
    time,
    status,
    priority,
    reminder,
    employee_id,
    related_type,
    related_id
)
SELECT
    id,
    title,
    description,
    date,
    time,
    status,
    priority,
    reminder,
    employee_id,
    related_type,
    related_id
FROM follow_ups;

DROP TABLE follow_ups;
ALTER TABLE follow_ups_new RENAME TO follow_ups;

CREATE INDEX idx_follow_ups_date
    ON follow_ups(date);

CREATE INDEX idx_follow_ups_employee
    ON follow_ups(employee_id);

CREATE INDEX idx_follow_ups_related
    ON follow_ups(related_type, related_id);