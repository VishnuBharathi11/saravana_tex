import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import {
  getEmployeeScope,
  canAccessRecord,
} from "../middleware/authorization";
import type { AuthenticatedEmployee } from "../services/auth.service";
import { rollOverOverdueFollowUps } from "../services/followup.service";

type Bindings = {
  saravana_traders_db: D1Database;
};

type Variables = {
  employee: AuthenticatedEmployee;
};

const dashboard = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

dashboard.use("*", requireAuth);

dashboard.get("/summary", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const scope = await getEmployeeScope(db, employee.id);

  await rollOverOverdueFollowUps(db);

  const [
    leadCounts,
    customerCounts,
    orderCounts,
    followUpCounts,
  ] = await Promise.all([
    db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) AS new_count,
          SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) AS converted_count
        FROM leads
      `)
      .first<{
        total: number;
        new_count: number;
        converted_count: number;
      }>(),

    db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_count,
          SUM(CASE WHEN status = 'VIP' THEN 1 ELSE 0 END) AS vip_count
        FROM customers
      `)
      .first<{
        total: number;
        active_count: number;
        vip_count: number;
      }>(),

    db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          COALESCE(
            SUM(
              CASE
                WHEN status <> 'Cancelled'
                THEN quantity * price
                ELSE 0
              END
            ),
            0
          ) AS total_value,
          SUM(
            CASE
              WHEN status IN ('Draft', 'Confirmed', 'Processing', 'Packed', 'Dispatched')
              THEN 1
              ELSE 0
            END
          ) AS pending_count
        FROM orders
      `)
      .first<{
        total: number;
        total_value: number;
        pending_count: number;
      }>(),

    db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN date = ?
               AND status <> 'Completed'
              THEN 1
              ELSE 0
            END
          ) AS today_count,
          SUM(
            CASE
              WHEN status = 'Completed'
              THEN 1
              ELSE 0
            END
          ) AS completed_count
        FROM follow_ups
      `)
      .bind(new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()))
      .first<{
        total: number;
        today_count: number;
        completed_count: number;
      }>(),
  ]);

  if (employee.role !== "Admin" && scope !== "FULL") {
    const [
      leads,
      customers,
      orders,
      followUps,
    ] = await Promise.all([
      db
        .prepare(`
          SELECT id
          FROM leads
          WHERE employee_id = ?
        `)
        .bind(employee.id)
        .all<{ id: string }>(),

      db
        .prepare(`
          SELECT id
          FROM customers
          WHERE employee_id = ?
        `)
        .bind(employee.id)
        .all<{ id: string }>(),

      db
        .prepare(`
          SELECT id
          FROM orders
          WHERE employee_id = ?
        `)
        .bind(employee.id)
        .all<{ id: string }>(),

      db
        .prepare(`
          SELECT id
          FROM follow_ups
          WHERE employee_id = ?
        `)
        .bind(employee.id)
        .all<{ id: string }>(),
    ]);

    return c.json({
      success: true,
      data: {
        leads: {
          total: leads.results.length,
        },
        customers: {
          total: customers.results.length,
        },
        orders: {
          total: orders.results.length,
        },
        followUps: {
          total: followUps.results.length,
        },
      },
    });
  }

  return c.json({
    success: true,
    data: {
      leads: {
        total: Number(leadCounts?.total ?? 0),
        new: Number(leadCounts?.new_count ?? 0),
        converted: Number(leadCounts?.converted_count ?? 0),
      },

      customers: {
        total: Number(customerCounts?.total ?? 0),
        active: Number(customerCounts?.active_count ?? 0),
        vip: Number(customerCounts?.vip_count ?? 0),
      },

      orders: {
        total: Number(orderCounts?.total ?? 0),
        totalValue: Number(orderCounts?.total_value ?? 0),
        pending: Number(orderCounts?.pending_count ?? 0),
      },

      followUps: {
        total: Number(followUpCounts?.total ?? 0),
        today: Number(followUpCounts?.today_count ?? 0),
        completed: Number(followUpCounts?.completed_count ?? 0),
      },
    },
  });
});

dashboard.get("/follow-ups", async (c) => {
  const db = c.env.saravana_traders_db;
  const employee = c.get("employee");
  const scope = await getEmployeeScope(db, employee.id);

  await rollOverOverdueFollowUps(db);

  const date = c.req.query("date");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = `
    SELECT
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
    FROM follow_ups
    WHERE 1 = 1
  `;

  const values: string[] = [];

  if (date) {
    query += ` AND date = ?`;
    values.push(date);
  }

  if (from) {
    query += ` AND date >= ?`;
    values.push(from);
  }

  if (to) {
    query += ` AND date <= ?`;
    values.push(to);
  }

  query += `
    ORDER BY date ASC, time ASC
  `;

  const statement = db.prepare(query);

  const result = await statement.bind(...values).all<{
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
  }>();

  let rows = result.results;

  if (employee.role !== "Admin" && scope !== "FULL") {
    const visible = [];

    for (const row of rows) {
      if (
        await canAccessRecord(
          db,
          employee,
          "FollowUp",
          row.id,
        )
      ) {
        visible.push(row);
      }
    }

    rows = visible;
  }

  return c.json({
    success: true,
    data: rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      time: row.time,
      status: row.status,
      priority: row.priority,
      reminder: row.reminder === 1,
      employeeId: row.employee_id,
      relatedType: row.related_type,
      relatedId: row.related_id,
    })),
  });
});

export default dashboard;