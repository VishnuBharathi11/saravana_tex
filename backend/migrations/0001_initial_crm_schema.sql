-- Migration number: 0001 	 2026-08-22T06:44:29.059Z

-- ============================================================
-- Migration: Initial CRM Schema
-- Saravana Traders CRM
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- Employees
-- ============================================================

CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive')),
    avatar_hue INTEGER NOT NULL DEFAULT 180,
    designation TEXT NOT NULL,
    about TEXT,
    password_hash TEXT,
    created_at TEXT NOT NULL
        DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_employees_status
    ON employees(status);

CREATE INDEX idx_employees_role
    ON employees(role);

-- ============================================================
-- Employee access
-- ============================================================

CREATE TABLE employee_access (
    employee_id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('OWN', 'SHARED', 'FULL')),
    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE
);

CREATE TABLE employee_access_shared (
    employee_id TEXT NOT NULL,
    shared_employee_id TEXT NOT NULL,

    PRIMARY KEY (employee_id, shared_employee_id),

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    FOREIGN KEY (shared_employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CHECK (employee_id <> shared_employee_id)
);

CREATE INDEX idx_employee_access_shared_target
    ON employee_access_shared(shared_employee_id);

-- ============================================================
-- Leads
-- ============================================================

CREATE TABLE leads (
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
            'New',
            'Contacted',
            'Interested',
            'Negotiation',
            'Converted',
            'Lost'
        )
    ),

    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    feedback TEXT NOT NULL,
    converted_customer_id TEXT,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_leads_employee
    ON leads(employee_id);

CREATE INDEX idx_leads_status
    ON leads(status);

CREATE INDEX idx_leads_created_at
    ON leads(created_at);

CREATE INDEX idx_leads_converted_customer
    ON leads(converted_customer_id);

-- ============================================================
-- Customers
-- ============================================================

CREATE TABLE customers (
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

CREATE INDEX idx_customers_employee
    ON customers(employee_id);

CREATE INDEX idx_customers_status
    ON customers(status);

CREATE INDEX idx_customers_created_at
    ON customers(created_at);

-- ============================================================
-- Orders
-- ============================================================

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    material TEXT NOT NULL,
    material_type TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    units TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),

    payment_status TEXT NOT NULL CHECK (
        payment_status IN (
            'Pending',
            'Partial',
            'Paid'
        )
    ),

    status TEXT NOT NULL CHECK (
        status IN (
            'Draft',
            'Confirmed',
            'Processing',
            'Packed',
            'Dispatched',
            'Delivered',
            'Cancelled'
        )
    ),

    employee_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT NOT NULL,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_orders_customer
    ON orders(customer_id);

CREATE INDEX idx_orders_employee
    ON orders(employee_id);

CREATE INDEX idx_orders_status
    ON orders(status);

CREATE INDEX idx_orders_payment_status
    ON orders(payment_status);

CREATE INDEX idx_orders_delivery_date
    ON orders(delivery_date);

-- ============================================================
-- Follow-ups
-- ============================================================

CREATE TABLE follow_ups (
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
            'Customer'
        )
    ),

    related_id TEXT NOT NULL,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_followups_employee
    ON follow_ups(employee_id);

CREATE INDEX idx_followups_date
    ON follow_ups(date);

CREATE INDEX idx_followups_status
    ON follow_ups(status);

CREATE INDEX idx_followups_related
    ON follow_ups(related_type, related_id);

-- ============================================================
-- Notifications
-- ============================================================

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,

    type TEXT NOT NULL CHECK (
        type IN (
            'FOLLOW_UP',
            'LEAD',
            'CUSTOMER',
            'ORDER',
            'EMPLOYEE'
        )
    ),

    title TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    target_id TEXT,
    read INTEGER NOT NULL DEFAULT 0
        CHECK (read IN (0, 1))
);

CREATE INDEX idx_notifications_timestamp
    ON notifications(timestamp);

CREATE INDEX idx_notifications_read
    ON notifications(read);

CREATE INDEX idx_notifications_target
    ON notifications(target_id);

-- ============================================================
-- Record-level access permissions
-- ============================================================

CREATE TABLE access_permissions (
    id TEXT PRIMARY KEY,

    resource_type TEXT NOT NULL CHECK (
        resource_type IN (
            'Lead',
            'Customer',
            'Order',
            'FollowUp'
        )
    ),

    resource_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    granted_by TEXT NOT NULL,
    granted_at TEXT NOT NULL,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    FOREIGN KEY (granted_by)
        REFERENCES employees(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_access_permissions_employee
    ON access_permissions(employee_id);

CREATE INDEX idx_access_permissions_resource
    ON access_permissions(resource_type, resource_id);

CREATE INDEX idx_access_permissions_granted_by
    ON access_permissions(granted_by);