import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { canAccessRecord, getEmployeeScope } from '../middleware/authorization';
import type { AuthenticatedEmployee } from '../services/auth.service';
import { createOrder, getOrderWithCustomer, type OrderRecord } from '../services/order.service';
import { createOrderSchema, updateOrderSchema } from '../schemas/order.schema';

type Bindings = {
	saravana_traders_db: D1Database;
};

type Variables = {
	employee: AuthenticatedEmployee;
};

const orders = new Hono<{
	Bindings: Bindings;
	Variables: Variables;
}>();

orders.use('*', requireAuth);

orders.get('/', async (c) => {
	const db = c.env.saravana_traders_db;
	const employee = c.get('employee');

	const scope = await getEmployeeScope(db, employee.id);

	const result = await db
		.prepare(
			`
      SELECT
        o.id,
        o.invoice_number,
        o.customer_id,
        o.material,
        o.material_type,
        o.quantity,
        o.units,
        o.price,
        o.payment_status,
        o.status,
        o.employee_id,
        o.created_at,
        o.delivery_date,
        o.address,
        o.notes,
        c.name AS customer_name,
        c.company AS customer_company,
        c.address AS customer_address,
        c.employee_id AS customer_employee_id
      FROM orders o
      INNER JOIN customers c
        ON c.id = o.customer_id
      ORDER BY o.created_at DESC
    `,
		)
		.all<
			OrderRecord & {
				customer_name: string;
				customer_company: string;
				customer_address: string;
				customer_employee_id: string;
			}
		>();

	let rows = result.results;

	if (employee.role !== 'Admin' && scope !== 'FULL') {
		const visibleRows: typeof rows = [];

		for (const row of rows) {
			if (await canAccessRecord(db, employee, 'Order', row.id)) {
				visibleRows.push(row);
			}
		}

		rows = visibleRows;
	}

	const data = rows.map((row) => ({
		id: row.id,
		invoiceNumber: row.invoice_number,
		customerId: row.customer_id,
		customerName: row.customer_name,
		company: row.customer_company,
		material: row.material,
		materialType: row.material_type,
		quantity: row.quantity,
		units: row.units,
		price: row.price,
		value: row.quantity * row.price,
		paymentStatus: row.payment_status,
		status: row.status,
		employeeId: row.employee_id,
		createdAt: row.created_at,
		deliveryDate: row.delivery_date,
		address: row.address,
		notes: row.notes,
	}));

	return c.json({
		success: true,
		data,
	});
});

orders.get('/:id', async (c) => {
	const db = c.env.saravana_traders_db;
	const employee = c.get('employee');
	const id = c.req.param('id');

	const order = await getOrderWithCustomer(db, id);

	if (!order) {
		return c.json(
			{
				success: false,
				message: 'Order not found',
			},
			404,
		);
	}

	const allowed = await canAccessRecord(db, employee, 'Order', id);

	if (!allowed) {
		return c.json(
			{
				success: false,
				message: 'Access denied',
			},
			403,
		);
	}

	return c.json({
		success: true,
		data: order,
	});
});

orders.post('/', async (c) => {
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

	const parsed = createOrderSchema.safeParse(body);

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
		const order = await createOrder(c.env.saravana_traders_db, employee, parsed.data);

		return c.json(
			{
				success: true,
				data: order,
			},
			201,
		);
	} catch (error) {
		console.error('Create order failed:', error);

		const message = error instanceof Error ? error.message : 'Failed to create order';

		if (message === 'Customer not found' || message === 'Assigned employee not found or inactive') {
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
				message: 'Failed to create order',
			},
			500,
		);
	}
});

orders.patch('/:id', async (c) => {
	const db = c.env.saravana_traders_db;
	const employee = c.get('employee');
	const id = c.req.param('id');

	const existing = await db
		.prepare(
			`
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
		)
		.bind(id)
		.first<OrderRecord>();

	if (!existing) {
		return c.json(
			{
				success: false,
				message: 'Order not found',
			},
			404,
		);
	}

	const allowed = await canAccessRecord(db, employee, 'Order', id);

	if (!allowed) {
		return c.json(
			{
				success: false,
				message: 'Access denied',
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
				message: 'Request body must be valid JSON',
			},
			400,
		);
	}

	const parsed = updateOrderSchema.safeParse(body);

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

	const data = parsed.data;

	// Validate customer if the customer is being changed.
	let customerId = existing.customer_id;

	if (data.customerId !== undefined) {
		const customer = await db
			.prepare(
				`
        SELECT id
        FROM customers
        WHERE id = ?
        LIMIT 1
      `,
			)
			.bind(data.customerId)
			.first<{ id: string }>();

		if (!customer) {
			return c.json(
				{
					success: false,
					message: 'Customer not found',
				},
				400,
			);
		}

		customerId = customer.id;
	}

	// Normal employees cannot transfer order ownership.
	let employeeId = existing.employee_id;

	if (employee.role === 'Admin' && data.employeeId !== undefined) {
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
			.bind(data.employeeId)
			.first<{ id: string }>();

		if (!assignedEmployee) {
			return c.json(
				{
					success: false,
					message: 'Assigned employee not found or inactive',
				},
				400,
			);
		}

		employeeId = assignedEmployee.id;
	}

	const updated = {
		invoiceNumber: data.invoiceNumber ?? existing.invoice_number,

		material: data.material ?? existing.material,

		materialType: data.materialType ?? existing.material_type,

		quantity: data.quantity ?? existing.quantity,

		units: data.units ?? existing.units,

		price: data.price ?? existing.price,

		paymentStatus: data.paymentStatus ?? existing.payment_status,

		status: data.status ?? existing.status,

		deliveryDate: data.deliveryDate ?? existing.delivery_date,

		address: data.address ?? existing.address,

		notes: data.notes ?? existing.notes,
	};

	try {
		await db
			.prepare(
				`
        UPDATE orders
        SET
          invoice_number = ?,
          customer_id = ?,
          material = ?,
          material_type = ?,
          quantity = ?,
          units = ?,
          price = ?,
          payment_status = ?,
          status = ?,
          employee_id = ?,
          delivery_date = ?,
          address = ?,
          notes = ?
        WHERE id = ?
      `,
			)
			.bind(
				updated.invoiceNumber,
				customerId,
				updated.material,
				updated.materialType,
				updated.quantity,
				updated.units,
				updated.price,
				updated.paymentStatus,
				updated.status,
				employeeId,
				updated.deliveryDate,
				updated.address,
				updated.notes,
				id,
			)
			.run();
	} catch (error) {
		console.error('Update order failed:', error);

		return c.json(
			{
				success: false,
				message: 'Failed to update order',
			},
			500,
		);
	}

	const order = await getOrderWithCustomer(db, id);

	if (!order) {
		return c.json(
			{
				success: false,
				message: 'Order update completed but order could not be retrieved',
			},
			500,
		);
	}

	return c.json({
		success: true,
		data: order,
	});
});

orders.delete('/:id', async (c) => {
	const db = c.env.saravana_traders_db;
	const employee = c.get('employee');
	const id = c.req.param('id');

	const existing = await db
		.prepare(
			`
      SELECT id
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
		)
		.bind(id)
		.first<{ id: string }>();

	if (!existing) {
		return c.json(
			{
				success: false,
				message: 'Order not found',
			},
			404,
		);
	}

	const allowed = await canAccessRecord(db, employee, 'Order', id);

	if (!allowed) {
		return c.json(
			{
				success: false,
				message: 'Access denied',
			},
			403,
		);
	}

	await db
		.prepare(
			`
      DELETE FROM orders
      WHERE id = ?
    `,
		)
		.bind(id)
		.run();

	return c.json({
		success: true,
		message: 'Order deleted successfully',
	});
});

export default orders;
