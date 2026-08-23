import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AuthenticatedEmployee } from "../services/auth.service";

type Bindings = {
  saravana_traders_db: D1Database;
};

type Variables = {
  employee: AuthenticatedEmployee;
};

const notifications = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

notifications.use("*", requireAuth);

notifications.get("/", async (c) => {
  const db = c.env.saravana_traders_db;

  const result = await db
    .prepare(`
      SELECT
        id,
        type,
        title,
        description,
        timestamp,
        target_id,
        read
      FROM notifications
      ORDER BY timestamp DESC
      LIMIT 100
    `)
    .all<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
      target_id: string | null;
      read: number;
    }>();

  return c.json({
    success: true,
    data: result.results.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      timestamp: row.timestamp,
      ...(row.target_id
        ? { targetId: row.target_id }
        : {}),
      read: row.read === 1,
    })),
  });
});

notifications.patch("/:id/read", async (c) => {
  const db = c.env.saravana_traders_db;
  const id = c.req.param("id");

  const notification = await db
    .prepare(`
      SELECT id
      FROM notifications
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<{ id: string }>();

  if (!notification) {
    return c.json(
      {
        success: false,
        message: "Notification not found",
      },
      404,
    );
  }

  await db
    .prepare(`
      UPDATE notifications
      SET read = 1
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: "Notification marked as read",
  });
});

export default notifications;