import {
  hashPassword,
} from "../utils/crypto";

import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UpdateEmployeeAccessInput,
} from "../schemas/employee.schema";
import { createNotification } from "./notification.service";

export interface EmployeeRecord {
  id: string;
  name: string;
  role: "Admin" | "Employee";
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  avatar_hue: number;
  designation: string;
  about: string | null;
  created_at: string;
}

export function toEmployeeResponse(
  row: EmployeeRecord,
) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    avatarHue: row.avatar_hue,
    designation: row.designation,
    about: row.about ?? undefined,
  };
}

export async function createEmployee(
  db: D1Database,
  input: CreateEmployeeInput,
) {
  const existing = await db
    .prepare(`
      SELECT id
      FROM employees
      WHERE lower(email) = ?
      LIMIT 1
    `)
    .bind(input.email.toLowerCase())
    .first<{ id: string }>();

  if (existing) {
    throw new Error("Email already exists");
  }

  const id = `EMP-${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(input.password);

  await db.batch([
    db
      .prepare(`
        INSERT INTO employees (
          id,
          name,
          role,
          email,
          phone,
          status,
          avatar_hue,
          designation,
          about,
          password_hash
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        input.name,
        input.role,
        input.email.toLowerCase(),
        input.phone,
        input.status,
        input.avatarHue,
        input.designation,
        input.about,
        passwordHash,
      ),

    db
      .prepare(`
        INSERT INTO employee_access (
          employee_id,
          scope
        )
        VALUES (?, ?)
      `)
      .bind(
        id,
        input.role === "Admin"
          ? "FULL"
          : "OWN",
      ),
  ]);

  await createNotification(db, {
    type: "EMPLOYEE",
    title: "New employee created",
    description: `${input.name} was added as a ${input.role.toLowerCase()}.`,
    targetId: id,
  });

  const row = await db
    .prepare(`
      SELECT
        id,
        name,
        role,
        email,
        phone,
        status,
        avatar_hue,
        designation,
        about,
        created_at
      FROM employees
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<EmployeeRecord>();

  if (!row) {
    throw new Error(
      "Employee was created but could not be retrieved",
    );
  }

  return toEmployeeResponse(row);
}

export async function getEmployee(
  db: D1Database,
  id: string,
) {
  const row = await db
    .prepare(`
      SELECT
        id,
        name,
        role,
        email,
        phone,
        status,
        avatar_hue,
        designation,
        about,
        created_at
      FROM employees
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<EmployeeRecord>();

  return row
    ? toEmployeeResponse(row)
    : null;
}

export async function getEmployeeAccess(
  db: D1Database,
  employeeId: string,
) {
  const access = await db
    .prepare(`
      SELECT scope
      FROM employee_access
      WHERE employee_id = ?
      LIMIT 1
    `)
    .bind(employeeId)
    .first<{
      scope: "OWN" | "SHARED" | "FULL";
    }>();

  const shared = await db
    .prepare(`
      SELECT shared_employee_id
      FROM employee_access_shared
      WHERE employee_id = ?
      ORDER BY shared_employee_id
    `)
    .bind(employeeId)
    .all<{ shared_employee_id: string }>();

  return {
    employeeId,
    scope: access?.scope ?? "OWN",
    sharedEmployeeIds: shared.results.map(
      (row) => row.shared_employee_id,
    ),
  };
}

export async function updateEmployeeAccess(
  db: D1Database,
  employeeId: string,
  input: UpdateEmployeeAccessInput,
) {
  const employee = await getEmployee(db, employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

  for (const sharedId of input.sharedEmployeeIds) {
    if (sharedId === employeeId) {
      throw new Error(
        "Employee cannot share access with itself",
      );
    }

    const sharedEmployee = await getEmployee(
      db,
      sharedId,
    );

    if (!sharedEmployee) {
      throw new Error(
        `Shared employee ${sharedId} not found`,
      );
    }
  }

  await db
    .prepare(`
      INSERT INTO employee_access (
        employee_id,
        scope
      )
      VALUES (?, ?)
      ON CONFLICT(employee_id)
      DO UPDATE SET scope = excluded.scope
    `)
    .bind(employeeId, input.scope)
    .run();

  await db
    .prepare(`
      DELETE FROM employee_access_shared
      WHERE employee_id = ?
    `)
    .bind(employeeId)
    .run();

  if (
    input.scope === "SHARED" &&
    input.sharedEmployeeIds.length > 0
  ) {
    await db.batch(
      input.sharedEmployeeIds.map(
        (sharedId) =>
          db
            .prepare(`
              INSERT INTO employee_access_shared (
                employee_id,
                shared_employee_id
              )
              VALUES (?, ?)
            `)
            .bind(employeeId, sharedId),
      ),
    );
  }

  return getEmployeeAccess(db, employeeId);
}