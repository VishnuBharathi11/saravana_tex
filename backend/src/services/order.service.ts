import type { CreateOrderInput } from "../schemas/order.schema";
import type { AuthenticatedEmployee } from "./auth.service";
import { createNotification } from "./notification.service";

export interface OrderRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  material: string;
  material_type: string;
  quantity: number;
  units: string;
  price: number;
  payment_status: string;
  status: string;
  employee_id: string;
  created_at: string;
  delivery_date: string;
  address: string;
  notes: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  company: string;
  address: string;
  employee_id: string;
}

function toOrderResponse(
  row: OrderRecord,
  customer: CustomerInfo,
) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: customer.name,
    company: customer.company,
    material: row.material,
    materialType: row.material_type,
    quantity: row.quantity,
    units: row.units,
    price: row.price,
    value: row.quantity * row.price,
    paymentStatus: row.payment_status,
    status: row.status,
    employeeId: row.employee_id,
    createdAt: row.created_at,
    deliveryDate: row.delivery_date,
    address: row.address,
    notes: row.notes,
  };
}

export async function getOrderWithCustomer(
  db: D1Database,
  id: string,
) {
  const row = await db
    .prepare(`
      SELECT
        o.id,
        o.invoice_number,
        o.customer_id,
        o.material,
        o.material_type,
        o.quantity,
        o.units,
        o.price,
        o.payment_status,
        o.status,
        o.employee_id,
        o.created_at,
        o.delivery_date,
        o.address,
        o.notes,
        c.id AS customer_ref_id,
        c.name AS customer_name,
        c.company AS customer_company,
        c.address AS customer_address,
        c.employee_id AS customer_employee_id
      FROM orders o
      INNER JOIN customers c
        ON c.id = o.customer_id
      WHERE o.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<
      OrderRecord & {
        customer_ref_id: string;
        customer_name: string;
        customer_company: string;
        customer_address: string;
        customer_employee_id: string;
      }
    >();

  if (!row) {
    return null;
  }

  return toOrderResponse(row, {
    id: row.customer_ref_id,
    name: row.customer_name,
    company: row.customer_company,
    address: row.customer_address,
    employee_id: row.customer_employee_id,
  });
}

export async function createOrder(
  db: D1Database,
  employee: AuthenticatedEmployee,
  input: CreateOrderInput,
) {
  const customer = await db
    .prepare(`
      SELECT id, name, company, address, employee_id
      FROM customers
      WHERE id = ?
      LIMIT 1
    `)
    .bind(input.customerId)
    .first<CustomerInfo>();

  if (!customer) {
    throw new Error("Customer not found");
  }

  let assignedEmployeeId = employee.id;

  if (employee.role === "Admin" && input.employeeId) {
    const assigned = await db
      .prepare(`
        SELECT id
        FROM employees
        WHERE id = ?
          AND status = 'Active'
        LIMIT 1
      `)
      .bind(input.employeeId)
      .first<{ id: string }>();

    if (!assigned) {
      throw new Error("Assigned employee not found or inactive");
    }

    assignedEmployeeId = assigned.id;
  }

  const id = `ORD-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO orders (
        id,
        invoice_number,
        customer_id,
        material,
        material_type,
        quantity,
        units,
        price,
        payment_status,
        status,
        employee_id,
        created_at,
        delivery_date,
        address,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.invoiceNumber,
      input.customerId,
      input.material,
      input.materialType,
      input.quantity,
      input.units,
      input.price,
      input.paymentStatus,
      input.status,
      assignedEmployeeId,
      createdAt,
      input.deliveryDate,
      input.address,
      input.notes,
    )
    .run();

  await createNotification(db, {
    type: "ORDER",
    title: "New order created",
    description: `Order ${input.invoiceNumber} was created for ${customer.name}.`,
    targetId: id,
  });

  const order = await getOrderWithCustomer(db, id);

  if (!order) {
    throw new Error(
      "Order was created but could not be retrieved",
    );
  }

  return order;
}

export { toOrderResponse };