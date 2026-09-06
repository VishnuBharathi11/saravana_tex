-- Migration number: 0004
-- Add normalized line items so one order can contain one or more materials.

PRAGMA foreign_keys = ON;

CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    material TEXT NOT NULL,
    material_type TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    units TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_order_items_order
    ON order_items(order_id);

-- Backfill one line item for every existing order.
INSERT INTO order_items (
    id,
    order_id,
    material,
    material_type,
    quantity,
    units,
    price
)
SELECT
    'OI-' || id,
    id,
    material,
    material_type,
    quantity,
    units,
    price
FROM orders;
