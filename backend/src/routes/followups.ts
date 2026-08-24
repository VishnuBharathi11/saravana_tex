import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import {
  canAccessRecord,
  getEmployeeScope,
} from "../middleware/authorization";
import type { AuthenticatedEmployee } from "../services/auth.service";
import {
  createFollowUp,
  getRelatedName,
  rollOverOverdueFollowUps,
  toFollowUpResponse,
  type FollowUpRecord,
} from "../services/followup.service";
import {
  createFollowUpSchema,
  updateFollowUpSchema,
} from "../schemas/followup.schema";

type Bindings = {
  saravana_traders_db: D1Database;
};

type Variables = {
  employee: AuthenticatedEmployee;
};

const followups = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

followups.use("*", requireAuth);

followups.get("/", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");

  await rollOverOverdueFollowUps(db);

  const scope = await getEmployeeScope(db, employee.id);

  const result = await db
    .prepare(`
      SELECT *
      FROM follow_ups
      ORDER BY date DESC, time DESC
    `)
    .all<FollowUpRecord>();

  let rows = result.results;

  if (employee.role !== "Admin" && scope !== "FULL") {
    const visibleRows: FollowUpRecord[] = [];

    for (const row of rows) {
      const allowed = await canAccessRecord(
        db,
        employee,
        "FollowUp",
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
      const relatedName = await getRelatedName(
        db,
        row.related_type,
        row.related_id,
      );

      return toFollowUpResponse(
        row,
        relatedName ?? "Unknown",
      );
    }),
  );

  return c.json({
    success: true,
    data,
  });
});

followups.get("/:id", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  await rollOverOverdueFollowUps(db);

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
    return c.json(
      {
        success: false,
        message: "Follow-up not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "FollowUp",
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

  const relatedName = await getRelatedName(
    db,
    row.related_type,
    row.related_id,
  );

  return c.json({
    success: true,
    data: toFollowUpResponse(
      row,
      relatedName ?? "Unknown",
    ),
  });
});

followups.post("/", async (c) => {
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

  const parsed = createFollowUpSchema.safeParse(body);

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
    const followUp = await createFollowUp(
      c.env.saravana_traders_db,
      employee,
      parsed.data,
    );

    return c.json(
      {
        success: true,
        data: followUp,
      },
      201,
    );
  } catch (error) {
    console.error("Create follow-up failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create follow-up";

    if (
      message === "Related record not found" ||
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
        message: "Failed to create follow-up",
      },
      500,
    );
  }
});

followups.patch("/:id", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  const existing = await db
    .prepare(`
      SELECT *
      FROM follow_ups
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<FollowUpRecord>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Follow-up not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "FollowUp",
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

  const parsed = updateFollowUpSchema.safeParse(body);

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

  const relatedType =
    data.relatedType ?? existing.related_type;

  const relatedId =
    data.relatedId ?? existing.related_id;

  const relatedName = await getRelatedName(
    db,
    relatedType,
    relatedId,
  );

  if (!relatedName) {
    return c.json(
      {
        success: false,
        message: "Related record not found",
      },
      400,
    );
  }

  await db
    .prepare(`
      UPDATE follow_ups
      SET
        title = ?,
        description = ?,
        date = ?,
        time = ?,
        status = ?,
        priority = ?,
        reminder = ?,
        related_type = ?,
        related_id = ?
      WHERE id = ?
    `)
    .bind(
      data.title ?? existing.title,
      data.description ?? existing.description,
      data.date ?? existing.date,
      data.time ?? existing.time,
      data.status ?? existing.status,
      data.priority ?? existing.priority,
      data.reminder === undefined
        ? existing.reminder
        : data.reminder
          ? 1
          : 0,
      relatedType,
      relatedId,
      id,
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
    return c.json(
      {
        success: false,
        message: "Follow-up update failed",
      },
      500,
    );
  }

  return c.json({
    success: true,
    data: toFollowUpResponse(row, relatedName),
  });
});

followups.delete("/:id", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  const existing = await db
    .prepare(`
      SELECT id
      FROM follow_ups
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Follow-up not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "FollowUp",
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

  await db
    .prepare(`
      DELETE FROM follow_ups
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: "Follow-up deleted successfully",
  });
});

followups.post("/:id/complete", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const id = c.req.param("id");

  const existing = await db
    .prepare(`
      SELECT *
      FROM follow_ups
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<FollowUpRecord>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Follow-up not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "FollowUp",
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

  await db
    .prepare(`
      UPDATE follow_ups
      SET status = 'Completed'
      WHERE id = ?
    `)
    .bind(id)
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
    return c.json(
      {
        success: false,
        message: "Follow-up completion failed",
      },
      500,
    );
  }

  const relatedName = await getRelatedName(
    db,
    row.related_type,
    row.related_id,
  );

  return c.json({
    success: true,
    data: toFollowUpResponse(
      row,
      relatedName ?? "Unknown",
    ),
  });
});

export default followups;