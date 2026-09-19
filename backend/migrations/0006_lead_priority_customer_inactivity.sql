-- Migration number: 0006
-- Lead priority and customer inactivity tracking.

ALTER TABLE leads
ADD COLUMN priority TEXT NOT NULL DEFAULT 'Medium'
CHECK (priority IN ('Low', 'Medium', 'High'));

ALTER TABLE customers
ADD COLUMN activity_status TEXT NOT NULL DEFAULT 'Active'
CHECK (activity_status IN ('Active', 'Inactive'));

CREATE INDEX idx_customers_activity_status
    ON customers(activity_status);