-- Migration number: 0006
-- Lead priority and customer inactivity status.

ALTER TABLE leads
ADD COLUMN priority TEXT NOT NULL DEFAULT 'Medium'
CHECK (priority IN ('Low', 'Medium', 'High'));

PRAGMA foreign_keys = OFF;

CREATE TABLE customers_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    material TEXT NOT NULL,
    units TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    duration TEXT NOT NULL,
    notes TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN (
            'Active',
            'Inactive',
            'Dormant',
            'VIP'
        )
    ),
    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    feedback TEXT NOT NULL,
    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT
);

INSERT INTO customers_new (
    id, name, company, phone, email, address, material, units,
    quantity, duration, notes, employee_id, status, source, created_at, feedback
)
SELECT
    id, name, company, phone, email, address, material, units,
    quantity, duration, notes, employee_id, status, source, created_at, feedback
FROM customers;

DROP TABLE customers;

ALTER TABLE customers_new RENAME TO customers;

CREATE INDEX idx_customers_employee
    ON customers(employee_id);

CREATE INDEX idx_customers_status
    ON customers(status);

CREATE INDEX idx_customers_created_at
    ON customers(created_at);

PRAGMA foreign_keys = ON;