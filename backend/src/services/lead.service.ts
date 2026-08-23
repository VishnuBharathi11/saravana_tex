import type { CreateLeadInput } from "../schemas/lead.schema";
import type { AuthenticatedEmployee } from "./auth.service";

export interface LeadRecord {
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
  converted_customer_id: string | null;
}

export function toLeadResponse(row: LeadRecord) {
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
    ...(row.converted_customer_id
      ? { convertedCustomerId: row.converted_customer_id }
      : {}),
  };
}

export async function createLead(
  db: D1Database,
  employee: AuthenticatedEmployee,
  input: CreateLeadInput,
) {
  let assignedEmployeeId = employee.id;

  if (employee.role === "Admin" && input.employeeId) {
    const assignedEmployee = await db
      .prepare(
        `
        SELECT id
        FROM employees
        WHERE id = ?
          AND status = 'Active'
        LIMIT 1
        `,
      )
      .bind(input.employeeId)
      .first<{ id: string }>();

    if (!assignedEmployee) {
      throw new Error("Assigned employee not found or inactive");
    }

    assignedEmployeeId = assignedEmployee.id;
  }

  const id = `LEAD-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();

  await db
    .prepare(
      `
      INSERT INTO leads (
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
      `,
    )
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
    .prepare(
      `
      SELECT
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
        feedback,
        converted_customer_id
      FROM leads
      WHERE id = ?
      LIMIT 1
      `,
    )
    .bind(id)
    .first<LeadRecord>();

  if (!row) {
    throw new Error("Lead was created but could not be retrieved");
  }

  return toLeadResponse(row);
}