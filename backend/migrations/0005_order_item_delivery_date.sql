-- Migration number: 0005
-- Store a delivery date for each order item.

ALTER TABLE order_items
ADD COLUMN delivery_date TEXT NOT NULL DEFAULT '';

UPDATE order_items
SET delivery_date = (
    SELECT delivery_date
    FROM orders
    WHERE orders.id = order_items.order_id
);
