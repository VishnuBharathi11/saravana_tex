import type { CreateFollowUpInput } from "../schemas/followup.schema";
import type { AuthenticatedEmployee } from "./auth.service";

export interface FollowUpRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: string;
  priority: string;
  reminder: number;
  employee_id: string;
  related_type: "Lead" | "Customer";
  related_id: string;
}

export function toFollowUpResponse(
  row: FollowUpRecord,
  relatedName: string,
) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    status: row.status,
    priority: row.priority,
    reminder: row.reminder === 1,
    employeeId: row.employee_id,
    relatedName,
    relatedType: row.related_type,
    relatedId: row.related_id,
  };
}

export async function getRelatedName(
  db: D1Database,
  type: "Lead" | "Customer",
  id: string,
): Promise<string | null> {
  const table = type === "Lead" ? "leads" : "customers";

  const row = await db
    .prepare(`
      SELECT name
      FROM ${table}
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<{ name: string }>();

  return row?.name ?? null;
}

export async function createFollowUp(
  db: D1Database,
  employee: AuthenticatedEmployee,
  input: CreateFollowUpInput,
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

  const relatedName = await getRelatedName(
    db,
    input.relatedType,
    input.relatedId,
  );

  if (!relatedName) {
    throw new Error("Related record not found");
  }

  const id = `FU-${crypto.randomUUID()}`;

  await db
    .prepare(`
      INSERT INTO follow_ups (
        id,
        title,
        description,
        date,
        time,
        status,
        priority,
        reminder,
        employee_id,
        related_type,
        related_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.title,
      input.description,
      input.date,
      input.time,
      input.status,
      input.priority,
      input.reminder ? 1 : 0,
      assignedEmployeeId,
      input.relatedType,
      input.relatedId,
    )
    .run();

  const row = await db
    .prepare(`
      SELECT *
      FROM follow_ups
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<FollowUpRecord>();

  if (!row) {
    throw new Error(
      "Follow-up was created but could not be retrieved",
    );
  }

  return toFollowUpResponse(row, relatedName);
}