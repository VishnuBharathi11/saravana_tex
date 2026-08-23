import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import {
  canAccessRecord,
  getEmployeeScope,
} from "../middleware/authorization";
import type { AuthenticatedEmployee } from "../services/auth.service";
import {
  createCustomerSchema, updateCustomerSchema
} from "../schemas/customer.schema";
import {
  createCustomer,
  getCustomerTotals,
  toCustomerResponse,
  type CustomerRecord,
} from "../services/customer.service";

type Bindings = {
  saravana_traders_db: D1Database;
};

type Variables = {
  employee: AuthenticatedEmployee;
};

const customers = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

customers.use("*", requireAuth);

function mapCustomerRow(
  row: CustomerRecord,
  totals: {
    totalOrders: number;
    totalValue: number;
  },
) {
  return toCustomerResponse(row, totals);
}

/*
 * GET /api/customers
 */
customers.get("/", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");

  const scope = await getEmployeeScope(db, employee.id);

  const result = await db
    .prepare(`
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
        feedback
      FROM customers
      ORDER BY created_at DESC
    `)
    .all<CustomerRecord>();

  let rows = result.results;

  if (employee.role !== "Admin" && scope !== "FULL") {
    const visibleRows: CustomerRecord[] = [];

    for (const row of rows) {
      const allowed = await canAccessRecord(
        db,
        employee,
        "Customer",
        row.id,
      );

      if (allowed) {
        visibleRows.push(row);
      }
    }

    rows = visibleRows;
  }

  const data = await Promise.all(
    rows.map(async (row) => {
      const totals = await getCustomerTotals(db, row.id);
      return mapCustomerRow(row, totals);
    }),
  );

  return c.json({
    success: true,
    data,
  });
});

/*
 * GET /api/customers/:id
 */
customers.get("/:id", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  const row = await db
    .prepare(`
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
        feedback
      FROM customers
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<CustomerRecord>();

  if (!row) {
    return c.json(
      {
        success: false,
        message: "Customer not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "Customer",
    id,
  );

  if (!allowed) {
    return c.json(
      {
        success: false,
        message: "Access denied",
      },
      403,
    );
  }

  const totals = await getCustomerTotals(db, id);

  return c.json({
    success: true,
    data: mapCustomerRow(row, totals),
  });
});

/*
 * POST /api/customers
 */
customers.post("/", async (c) => {
  const employee = c.get("employee");

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

  const parsed = createCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  try {
    const customer = await createCustomer(
      c.env.saravana_traders_db,
      employee,
      parsed.data,
    );

    return c.json(
      {
        success: true,
        data: customer,
      },
      201,
    );
  } catch (error) {
    console.error("Create customer failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create customer";

    if (
      message ===
      "Assigned employee not found or inactive"
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        400,
      );
    }

    return c.json(
      {
        success: false,
        message: "Failed to create customer",
      },
      500,
    );
  }
});

customers.patch("/:id", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  const existing = await db
    .prepare(`
      SELECT *
      FROM customers
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<CustomerRecord>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Customer not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "Customer",
    id,
  );

  if (!allowed) {
    return c.json(
      {
        success: false,
        message: "Access denied",
      },
      403,
    );
  }

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

  const parsed = updateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const data = parsed.data;

  const updated = {
    name: data.name ?? existing.name,
    company: data.company ?? existing.company,
    phone: data.phone ?? existing.phone,
    email: data.email ?? existing.email,
    address: data.address ?? existing.address,
    material: data.material ?? existing.material,
    units: data.units ?? existing.units,
    quantity: data.quantity ?? existing.quantity,
    duration: data.duration ?? existing.duration,
    notes: data.notes ?? existing.notes,
    status: data.status ?? existing.status,
    source: data.source ?? existing.source,
    feedback: data.feedback ?? existing.feedback,
  };

  await db
    .prepare(`
      UPDATE customers
      SET
        name = ?,
        company = ?,
        phone = ?,
        email = ?,
        address = ?,
        material = ?,
        units = ?,
        quantity = ?,
        duration = ?,
        notes = ?,
        status = ?,
        source = ?,
        feedback = ?
      WHERE id = ?
    `)
    .bind(
      updated.name,
      updated.company,
      updated.phone,
      updated.email,
      updated.address,
      updated.material,
      updated.units,
      updated.quantity,
      updated.duration,
      updated.notes,
      updated.status,
      updated.source,
      updated.feedback,
      id,
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
    return c.json(
      {
        success: false,
        message: "Customer update failed",
      },
      500,
    );
  }

  const totals = await getCustomerTotals(db, id);

  return c.json({
    success: true,
    data: toCustomerResponse(row, totals),
  });
});

customers.delete("/:id", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  const existing = await db
    .prepare(`
      SELECT id
      FROM customers
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Customer not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "Customer",
    id,
  );

  if (!allowed) {
    return c.json(
      {
        success: false,
        message: "Access denied",
      },
      403,
    );
  }

  const orderCount = await db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE customer_id = ?
    `)
    .bind(id)
    .first<{ count: number }>();

  if (Number(orderCount?.count ?? 0) > 0) {
    return c.json(
      {
        success: false,
        message: "Customer cannot be deleted while orders exist",
      },
      409,
    );
  }

  await db.batch([
    db
      .prepare(`
        DELETE FROM follow_ups
        WHERE related_type = 'Customer'
          AND related_id = ?
      `)
      .bind(id),

    db
      .prepare(`
        DELETE FROM access_permissions
        WHERE resource_type = 'Customer'
          AND resource_id = ?
      `)
      .bind(id),

    db
      .prepare(`
        DELETE FROM customers
        WHERE id = ?
      `)
      .bind(id),
  ]);

  return c.json({
    success: true,
    message: "Customer deleted successfully",
  });
});

export default customers;