import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { canAccessRecord, getEmployeeScope } from '../middleware/authorization';
import type { AuthenticatedEmployee } from '../services/auth.service';
import { createLeadSchema, updateLeadSchema } from '../schemas/lead.schema';
import {
  createLead,
  type LeadRecord,
  toLeadResponse,
} from '../services/lead.service';

type Bindings = {
	saravana_traders_db: D1Database;
};

type Variables = {
	employee: AuthenticatedEmployee;
};

const leads = new Hono<{
	Bindings: Bindings;
	Variables: Variables;
}>();

leads.use('*', requireAuth);

leads.get('/', async (c) => {
	const db = c.env.saravana_traders_db;
	const employee = c.get('employee');

	const scope = await getEmployeeScope(db, employee.id);

	const result = await db
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
      ORDER BY created_at DESC
    `,
		)
		.all();

	let rows = result.results as Array<{
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
	}>;

	if (employee.role !== 'Admin' && scope !== 'FULL') {
		const visibleRows = [];

		for (const row of rows) {
			const allowed = await canAccessRecord(db, employee, 'Lead', row.id);

			if (allowed) {
				visibleRows.push(row);
			}
		}

		rows = visibleRows;
	}

	const data = rows.map((row) => ({
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
		...(row.converted_customer_id ? { convertedCustomerId: row.converted_customer_id } : {}),
	}));

	return c.json({
		success: true,
		data,
	});
});

leads.post('/', async (c) => {
	const employee = c.get('employee');

	let body: unknown;

	try {
		body = await c.req.json();
	} catch {
		return c.json(
			{
				success: false,
				message: 'Request body must be valid JSON',
			},
			400,
		);
	}

	const parsed = createLeadSchema.safeParse(body);

	if (!parsed.success) {
		return c.json(
			{
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			},
			400,
		);
	}

	try {
		const lead = await createLead(c.env.saravana_traders_db, employee, parsed.data);

		return c.json(
			{
				success: true,
				data: lead,
			},
			201,
		);
	} catch (error) {
		console.error('Create lead failed:', error);

		const message = error instanceof Error ? error.message : 'Failed to create lead';

		if (message === 'Assigned employee not found or inactive') {
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
				message: 'Failed to create lead',
			},
			500,
		);
	}
});

leads.get("/:id", async (c) => {
  const employee = c.get("employee");
  const id = c.req.param("id");

  const row = await c.env.saravana_traders_db
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
        feedback,
        converted_customer_id
      FROM leads
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<LeadRecord>();

  if (!row) {
    return c.json(
      {
        success: false,
        message: "Lead not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    c.env.saravana_traders_db,
    employee,
    "Lead",
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

  return c.json({
    success: true,
    data: toLeadResponse(row),
  });
});

leads.patch("/:id", async (c) => {
  const employee = c.get("employee");
  const id = c.req.param("id");
  const db = c.env.saravana_traders_db;

  const existing = await db
    .prepare(`
      SELECT *
      FROM leads
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<LeadRecord>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Lead not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "Lead",
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

  const parsed = updateLeadSchema.safeParse(body);

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
      UPDATE leads
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
    `)
    .bind(id)
    .first<LeadRecord>();

  return c.json({
    success: true,
    data: row ? toLeadResponse(row) : null,
  });
});

leads.delete("/:id", async (c) => {
  const employee = c.get("employee");
  const id = c.req.param("id");
  const db = c.env.saravana_traders_db;

  const existing = await db
    .prepare(`
      SELECT id
      FROM leads
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        message: "Lead not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "Lead",
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

  await db.batch([
    db
      .prepare(`
        DELETE FROM follow_ups
        WHERE related_type = 'Lead'
          AND related_id = ?
      `)
      .bind(id),

    db
      .prepare(`
        DELETE FROM access_permissions
        WHERE resource_type = 'Lead'
          AND resource_id = ?
      `)
      .bind(id),

    db
      .prepare(`
        DELETE FROM leads
        WHERE id = ?
      `)
      .bind(id),
  ]);

  return c.json({
    success: true,
    message: "Lead deleted successfully",
  });
});

leads.post("/:id/convert", async (c) => {
  const employee = c.get("employee");
  const id = c.req.param("id");
  const db = c.env.saravana_traders_db;

  const lead = await db
    .prepare(`
      SELECT *
      FROM leads
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<LeadRecord>();

  if (!lead) {
    return c.json(
      {
        success: false,
        message: "Lead not found",
      },
      404,
    );
  }

  const allowed = await canAccessRecord(
    db,
    employee,
    "Lead",
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

  if (lead.converted_customer_id) {
    const existingCustomer = await db
      .prepare(`
        SELECT id
        FROM customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(lead.converted_customer_id)
      .first<{ id: string }>();

    return c.json({
      success: true,
      alreadyConverted: true,
      customerId: existingCustomer?.id ?? lead.converted_customer_id,
    });
  }

  const customerId = `CUS-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const followUpId = `FU-C-${crypto.randomUUID()}`;

  await db.batch([
    db
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
      `)
      .bind(
        customerId,
        lead.name,
        lead.company,
        lead.phone,
        lead.email,
        lead.address,
        lead.material,
        lead.units,
        lead.quantity,
        lead.duration,
        lead.notes,
        lead.employee_id,
        lead.source,
        now,
        lead.feedback,
      ),

    db
      .prepare(`
        UPDATE leads
        SET
          status = 'Converted',
          converted_customer_id = ?
        WHERE id = ?
      `)
      .bind(customerId, id),

    db
      .prepare(`
        UPDATE follow_ups
        SET
          related_type = 'Customer',
          related_id = ?
        WHERE related_type = 'Lead'
          AND related_id = ?
      `)
      .bind(customerId, id),

    db
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
        VALUES (?, ?, ?, ?, ?, 'Completed', 'Medium', 0, ?, 'Customer', ?)
      `)
      .bind(
        followUpId,
        "Lead converted to customer",
        `${lead.name} was converted from lead ${lead.id}.`,
        now.slice(0, 10),
        "09:00",
        lead.employee_id,
        customerId,
      ),
  ]);

  return c.json(
    {
      success: true,
      data: {
        customerId,
        leadId: id,
      },
    },
    201,
  );
});

export default leads;
