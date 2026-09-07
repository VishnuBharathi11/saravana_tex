import type { CreateOrderInput, OrderItemInput } from "../schemas/order.schema";
import type { AuthenticatedEmployee } from "./auth.service";
import { canAccessRecord } from "../middleware/authorization";
import { createNotification } from "./notification.service";

export interface OrderRecord { id: string; invoice_number: string; customer_id: string; material: string; material_type: string; quantity: number; units: string; price: number; payment_status: string; status: string; employee_id: string; created_at: string; delivery_date: string; address: string; notes: string; }
export interface OrderItemRecord { id: string; order_id: string; material: string; material_type: string; quantity: number; units: string; price: number; delivery_date: string; }
interface CustomerInfo { id: string; name: string; company: string; address: string; employee_id: string; }

const dbOrderStatus = (status: string) => {
  if (status === "Cancel") return "Cancelled";
  if (status === "Pending") return "Draft";
  return status;
};
const apiOrderStatus = (status: string) => {
  if (status === "Cancelled") return "Cancel";
  if (status === "Draft") return "Pending";
  return status;
};

export function normalizeItems(input: CreateOrderInput): OrderItemInput[] {
  if (input.items?.length) return input.items;
  return [{ material: input.material!, materialType: input.materialType!, quantity: input.quantity!, units: input.units!, price: input.price!, deliveryDate: input.deliveryDate }];
}

export async function getOrderItems(db: D1Database, orderId: string) {
  const result = await db.prepare(`SELECT id, order_id, material, material_type, quantity, units, price, delivery_date FROM order_items WHERE order_id = ? ORDER BY rowid ASC`).bind(orderId).all<OrderItemRecord>();
  return result.results.map((item) => ({ id: item.id, material: item.material, materialType: item.material_type, quantity: item.quantity, units: item.units, price: item.price, value: item.quantity * item.price, deliveryDate: item.delivery_date }));
}

export async function replaceOrderItems(db: D1Database, orderId: string, items: OrderItemInput[]) {
  if (!items.length) throw new Error("At least one order item is required");
  const statements = [db.prepare(`DELETE FROM order_items WHERE order_id = ?`).bind(orderId), ...items.map((item, index) => db.prepare(`INSERT INTO order_items (id, order_id, material, material_type, quantity, units, price, delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(`OI-${crypto.randomUUID()}-${index}`, orderId, item.material, item.materialType, item.quantity, item.units, item.price, item.deliveryDate))];
  await db.batch(statements);
}

function toOrderResponse(row: OrderRecord, customer: CustomerInfo, items: Array<{ id: string; material: string; materialType: string; quantity: number; units: string; price: number; value: number; deliveryDate: string }>) {
  const normalizedItems = items.length ? items : [{ id: `OI-${row.id}`, material: row.material, materialType: row.material_type, quantity: row.quantity, units: row.units, price: row.price, value: row.quantity * row.price, deliveryDate: row.delivery_date }];
  return {
    id: row.id, invoiceNumber: row.invoice_number, customerId: row.customer_id, customerName: customer.name, company: customer.company,
    material: normalizedItems[0].material, materialType: normalizedItems[0].materialType,
    quantity: normalizedItems.reduce((sum, item) => sum + item.quantity, 0), units: normalizedItems[0].units, price: normalizedItems[0].price,
    value: normalizedItems.reduce((sum, item) => sum + item.value, 0), items: normalizedItems,
    paymentStatus: row.payment_status, status: apiOrderStatus(row.status), employeeId: row.employee_id, createdAt: row.created_at, deliveryDate: row.delivery_date, address: row.address, notes: row.notes,
  };
}

export async function getOrderWithCustomer(db: D1Database, id: string) {
  const row = await db.prepare(`SELECT o.*, c.id AS customer_ref_id, c.name AS customer_name, c.company AS customer_company, c.address AS customer_address, c.employee_id AS customer_employee_id FROM orders o INNER JOIN customers c ON c.id = o.customer_id WHERE o.id = ? LIMIT 1`).bind(id).first<OrderRecord & { customer_ref_id: string; customer_name: string; customer_company: string; customer_address: string; customer_employee_id: string }>();
  if (!row) return null;
  return toOrderResponse(row, { id: row.customer_ref_id, name: row.customer_name, company: row.customer_company, address: row.customer_address, employee_id: row.customer_employee_id }, await getOrderItems(db, id));
}

export async function createOrder(db: D1Database, employee: AuthenticatedEmployee, input: CreateOrderInput) {
  const customer = await db.prepare(`SELECT id, name, company, address, employee_id FROM customers WHERE id = ? LIMIT 1`).bind(input.customerId).first<CustomerInfo>();
  if (!customer) throw new Error("Customer not found");
  if (!(await canAccessRecord(db, employee, "Customer", customer.id))) throw new Error("Access denied to customer");
  let assignedEmployeeId = employee.id;
  if (employee.role === "Admin" && input.employeeId) {
    const assigned = await db.prepare(`SELECT id FROM employees WHERE id = ? AND status = 'Active' LIMIT 1`).bind(input.employeeId).first<{ id: string }>();
    if (!assigned) throw new Error("Assigned employee not found or inactive");
    assignedEmployeeId = assigned.id;
  }
  const items = normalizeItems(input); const first = items[0]; if (!first) throw new Error("At least one order item is required");
  const id = input.orderId.trim(); const invoiceNumber = input.invoiceNumber?.trim() || id; const createdAt = new Date().toISOString(); const status = dbOrderStatus(input.status);
  const existing = await db.prepare(`SELECT id FROM orders WHERE id = ? LIMIT 1`).bind(id).first<{ id: string }>();
  if (existing) throw new Error("Order ID already exists");
  await db.batch([
    db.prepare(`INSERT INTO orders (id, invoice_number, customer_id, material, material_type, quantity, units, price, payment_status, status, employee_id, created_at, delivery_date, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, invoiceNumber, input.customerId, first.material, first.materialType, first.quantity, first.units, first.price, input.paymentStatus, status, assignedEmployeeId, createdAt, input.deliveryDate, input.address, input.notes),
    ...items.map((item, index) => db.prepare(`INSERT INTO order_items (id, order_id, material, material_type, quantity, units, price, delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(`OI-${crypto.randomUUID()}-${index}`, id, item.material, item.materialType, item.quantity, item.units, item.price, item.deliveryDate)),
  ]);
  await createNotification(db, { type: "ORDER", title: "New order created", description: `Order ${id} was created for ${customer.name}.`, targetId: id });
  const order = await getOrderWithCustomer(db, id); if (!order) throw new Error("Order was created but could not be retrieved"); return order;
}

export { toOrderResponse };
