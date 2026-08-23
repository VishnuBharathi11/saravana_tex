import type { CreateCustomerInput } from "../schemas/customer.schema";
import type { AuthenticatedEmployee } from "./auth.service";

export interface CustomerRecord {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  material: string;
  units: string;
  quantity: number;
  duration: string;
  notes: string;
  employee_id: string;
  status: string;
  source: string;
  created_at: string;
  feedback: string;
}

export async function getCustomerTotals(
  db: D1Database,
  customerId: string,
) {
  const result = await db
    .prepare(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(quantity * price), 0) AS total_value
      FROM orders
      WHERE customer_id = ?
        AND status <> 'Cancelled'
    `)
    .bind(customerId)
    .first<{
      total_orders: number;
      total_value: number;
    }>();

  return {
    totalOrders: Number(result?.total_orders ?? 0),
    totalValue: Number(result?.total_value ?? 0),
  };
}

export function toCustomerResponse(
  row: CustomerRecord,
  totals: {
    totalOrders: number;
    totalValue: number;
  },
) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    phone: row.phone,
    email: row.email,
    address: row.address,
    material: row.material,
    units: row.units,
    quantity: row.quantity,
    duration: row.duration,
    notes: row.notes,
    employeeId: row.employee_id,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    feedback: row.feedback,
    totalOrders: totals.totalOrders,
    totalValue: totals.totalValue,
  };
}

export async function createCustomer(
  db: D1Database,
  employee: AuthenticatedEmployee,
  input: CreateCustomerInput,
) {
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
      throw new Error(
        "Assigned employee not found or inactive",
      );
    }

    assignedEmployeeId = assigned.id;
  }

  const id = `CUS-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO customers (
        id,
        name,
        company,
        phone,
        email,
        address,
        material,
        units,
        quantity,
        duration,
        notes,
        employee_id,
        status,
        source,
        created_at,
        feedback
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.name,
      input.company,
      input.phone,
      input.email,
      input.address,
      input.material,
      input.units,
      input.quantity,
      input.duration,
      input.notes,
      assignedEmployeeId,
      input.status,
      input.source,
      createdAt,
      input.feedback,
    )
    .run();

  const row = await db
    .prepare(`
      SELECT *
      FROM customers
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<CustomerRecord>();

  if (!row) {
    throw new Error(
      "Customer was created but could not be retrieved",
    );
  }

  const totals = await getCustomerTotals(db, id);

  return toCustomerResponse(row, totals);
}