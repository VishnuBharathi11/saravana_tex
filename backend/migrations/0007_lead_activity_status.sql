ALTER TABLE leads
ADD COLUMN activity_status TEXT NOT NULL DEFAULT 'Active'
CHECK (activity_status IN ('Active', 'Inactive'));

CREATE INDEX idx_leads_activity_status
ON leads(activity_status);
