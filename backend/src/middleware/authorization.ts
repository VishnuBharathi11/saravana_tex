import { createMiddleware } from 'hono/factory';
import type { AuthenticatedEmployee } from '../services/auth.service';

export type ResourceType = 'Lead' | 'Customer' | 'Order' | 'FollowUp';

export type AccessScope = 'OWN' | 'SHARED' | 'FULL';

interface RecordInfo {
	employee_id: string;
}

const resourceTables: Record<ResourceType, string> = {
	Lead: 'leads',
	Customer: 'customers',
	Order: 'orders',
	FollowUp: 'follow_ups',
};

export const requireRole = (...allowedRoles: AuthenticatedEmployee['role'][]) =>
	createMiddleware<{
		Bindings: {
			saravana_traders_db: D1Database;
		};
		Variables: {
			employee: AuthenticatedEmployee;
		};
	}>(async (c, next) => {
		const employee = c.get('employee');

		if (!employee) {
			return c.json(
				{
					success: false,
					message: 'Authentication required',
				},
				401,
			);
		}

		if (!allowedRoles.includes(employee.role)) {
			return c.json(
				{
					success: false,
					message: 'Insufficient permissions',
				},
				403,
			);
		}

		await next();
	});

export async function getEmployeeScope(db: D1Database, employeeId: string): Promise<AccessScope> {
	const result = await db
		.prepare(
			`
      SELECT scope
      FROM employee_access
      WHERE employee_id = ?
      LIMIT 1
      `,
		)
		.bind(employeeId)
		.first<{ scope: AccessScope }>();

	return result?.scope ?? 'OWN';
}

export async function canAccessRecord(
	db: D1Database,
	employee: AuthenticatedEmployee,
	resourceType: ResourceType,
	resourceId: string,
): Promise<boolean> {
	// Admins always have access.
	if (employee.role === 'Admin') {
		return true;
	}

	const scope = await getEmployeeScope(db, employee.id);

	// FULL scope can access every CRM record.
	if (scope === 'FULL') {
		return true;
	}

	const tableName = resourceTables[resourceType];

	const record = await db
		.prepare(
			`
      SELECT employee_id
      FROM ${tableName}
      WHERE id = ?
      LIMIT 1
      `,
		)
		.bind(resourceId)
		.first<RecordInfo>();

	if (!record) {
		return false;
	}

	// OWN and SHARED employees can always access their own records.
	if (record.employee_id === employee.id) {
		return true;
	}

	// A SHARED employee can access records explicitly granted
	// through access_permissions.
	if (scope === 'SHARED') {
		const permission = await db
			.prepare(
				`
        SELECT 1
        FROM access_permissions
        WHERE resource_type = ?
          AND resource_id = ?
          AND employee_id = ?
        LIMIT 1
        `,
			)
			.bind(resourceType, resourceId, employee.id)
			.first();

		return permission !== null;
	}

	return false;
}

export async function canManageEmployees(employee: AuthenticatedEmployee): Promise<boolean> {
	return employee.role === 'Admin';
}
