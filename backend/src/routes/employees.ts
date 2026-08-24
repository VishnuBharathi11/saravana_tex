import { Hono } from "hono";

import {
  requireAuth,
} from "../middleware/auth";

import {
  requireAdmin,
} from "../middleware/roles";

import type {
  AuthenticatedEmployee,
} from "../services/auth.service";

import {
  createEmployee,
  getEmployee,
  getEmployeeAccess,
  updateEmployeeAccess,
  toEmployeeResponse,
  type EmployeeRecord,
} from "../services/employee.service";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeAccessSchema,
} from "../schemas/employee.schema";

type Bindings = {
  saravana_traders_db: D1Database;
};

type Variables = {
  employee: AuthenticatedEmployee;
};

const employees = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

employees.use("*", requireAuth);

employees.get("/", async (c) => {
  const result = await c.env.saravana_traders_db
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
      ORDER BY created_at DESC
    `)
    .all<EmployeeRecord>();

  return c.json({
    success: true,
    data: result.results.map(
      toEmployeeResponse,
    ),
  });
});

employees.get("/:id", async (c) => {
  const id = c.req.param("id");

  const employee = await getEmployee(
    c.env.saravana_traders_db,
    id,
  );

  if (!employee) {
    return c.json(
      {
        success: false,
        message: "Employee not found",
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: employee,
  });
});

employees.post(
  "/",
  requireAdmin,
  async (c) => {
    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          message:
            "Request body must be valid JSON",
        },
        400,
      );
    }

    const parsed =
      createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            parsed.error.flatten()
              .fieldErrors,
        },
        400,
      );
    }

    try {
      const employee =
        await createEmployee(
          c.env.saravana_traders_db,
          parsed.data,
        );

      return c.json(
        {
          success: true,
          data: employee,
        },
        201,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create employee";

      if (message === "Email already exists") {
        return c.json(
          {
            success: false,
            message,
          },
          409,
        );
      }

      console.error(
        "Create employee failed:",
        error,
      );

      return c.json(
        {
          success: false,
          message:
            "Failed to create employee",
        },
        500,
      );
    }
  },
);

employees.patch("/:id", async (c) => {
  const current = c.get("employee");
  const id = c.req.param("id");
  const db = c.env.saravana_traders_db;

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        message: "Request body must be valid JSON",
      },
      400,
    );
  }

  const parsed =
    updateEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        message: "Validation failed",
        errors:
          parsed.error.flatten()
            .fieldErrors,
      },
      400,
    );
  }

  // Admin can update anyone.
  // Employee can update only themselves.
  if (
    current.role !== "Admin" &&
    current.id !== id
  ) {
    return c.json(
      {
        success: false,
        message: "Access denied",
      },
      403,
    );
  }

  const existing = await getEmployee(db, id);

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Employee not found",
      },
      404,
    );
  }

  const data = parsed.data;

  if (data.password !== undefined && current.role !== "Admin") {
    return c.json(
      {
        success: false,
        message: "Only administrators can change passwords",
      },
      403,
    );
  }

  if (
    data.email &&
    data.email.toLowerCase() !==
      existing.email.toLowerCase()
  ) {
    const emailOwner =
      await db
        .prepare(`
          SELECT id
          FROM employees
          WHERE lower(email) = ?
            AND id <> ?
          LIMIT 1
        `)
        .bind(
          data.email.toLowerCase(),
          id,
        )
        .first<{ id: string }>();

    if (emailOwner) {
      return c.json(
        {
          success: false,
          message: "Email already exists",
        },
        409,
      );
    }
  }

  // Normal employees cannot change role/status.
  if (current.role !== "Admin") {
    delete data.role;
    delete data.status;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }

  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email.toLowerCase());
  }

  if (data.phone !== undefined) {
    fields.push("phone = ?");
    values.push(data.phone);
  }

  if (data.role !== undefined) {
    fields.push("role = ?");
    values.push(data.role);
  }

  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }

  if (data.avatarHue !== undefined) {
    fields.push("avatar_hue = ?");
    values.push(data.avatarHue);
  }

  if (data.designation !== undefined) {
    fields.push("designation = ?");
    values.push(data.designation);
  }

  if (data.about !== undefined) {
    fields.push("about = ?");
    values.push(data.about);
  }

  if (data.password !== undefined) {
    const hash = await import(
      "../utils/crypto"
    ).then((module) =>
      module.hashPassword(data.password!),
    );

    fields.push("password_hash = ?");
    values.push(hash);
  }

  if (fields.length > 0) {
    values.push(id);

    await db
      .prepare(`
        UPDATE employees
        SET ${fields.join(", ")}
        WHERE id = ?
      `)
      .bind(...values)
      .run();
  }

  const updated =
    await getEmployee(db, id);

  return c.json({
    success: true,
    data: updated,
  });
});

employees.delete(
  "/:id",
  requireAdmin,
  async (c) => {
    const db = c.env.saravana_traders_db;
    const id = c.req.param("id");

    let body: {
      transferToId?: string;
    } = {};

    try {
      body = await c.req.json();
    } catch {
      // Empty body is acceptable.
    }

    const existing =
      await getEmployee(db, id);

    if (!existing) {
      return c.json(
        {
          success: false,
          message: "Employee not found",
        },
        404,
      );
    }

    if (body.transferToId === id) {
      return c.json(
        {
          success: false,
          message:
            "Employee cannot transfer records to itself",
        },
        400,
      );
    }

    if (body.transferToId) {
      const target =
        await getEmployee(
          db,
          body.transferToId,
        );

      if (!target) {
        return c.json(
          {
            success: false,
            message:
              "Transfer employee not found",
          },
          400,
        );
      }
    }

    if (body.transferToId) {
      await db.batch([
        db
          .prepare(`
            UPDATE leads
            SET employee_id = ?
            WHERE employee_id = ?
          `)
          .bind(
            body.transferToId,
            id,
          ),

        db
          .prepare(`
            UPDATE customers
            SET employee_id = ?
            WHERE employee_id = ?
          `)
          .bind(
            body.transferToId,
            id,
          ),

        db
          .prepare(`
            UPDATE orders
            SET employee_id = ?
            WHERE employee_id = ?
          `)
          .bind(
            body.transferToId,
            id,
          ),

        db
          .prepare(`
            UPDATE follow_ups
            SET employee_id = ?
            WHERE employee_id = ?
          `)
          .bind(
            body.transferToId,
            id,
          ),
      ]);
    }

    await db
      .prepare(`
        DELETE FROM employees
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return c.json({
      success: true,
      message:
        "Employee deleted successfully",
    });
  },
);

employees.get(
  "/:id/access",
  requireAdmin,
  async (c) => {
    const id = c.req.param("id");

    const access =
      await getEmployeeAccess(
        c.env.saravana_traders_db,
        id,
      );

    return c.json({
      success: true,
      data: access,
    });
  },
);

employees.patch(
  "/:id/access",
  requireAdmin,
  async (c) => {
    const id = c.req.param("id");

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          message:
            "Request body must be valid JSON",
        },
        400,
      );
    }

    const parsed =
      updateEmployeeAccessSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            parsed.error.flatten()
              .fieldErrors,
        },
        400,
      );
    }

    try {
      const access =
        await updateEmployeeAccess(
          c.env.saravana_traders_db,
          id,
          parsed.data,
        );

      return c.json({
        success: true,
        data: access,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update access";

      return c.json(
        {
          success: false,
          message,
        },
        400,
      );
    }
  },
);

export default employees;