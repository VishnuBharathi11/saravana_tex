import type { Employee } from "@/types";

export function isAdmin(user: Employee | null | undefined): boolean {
  return user?.role === "Admin";
}

export function isEmployee(user: Employee | null | undefined): boolean {
  return user?.role === "Employee";
}

/**
 * Admins can edit any record.
 * Employees can only edit records where they are the assigned employee.
 */
export function canEditRecord(
  user: Employee | null | undefined,
  record: { employeeId: string } | null | undefined
): boolean {
  if (!user || !record) return false;
  if (isAdmin(user)) return true;
  return record.employeeId === user.id;
}

/**
 * Deletion follows the same rules as editing by default.
 */
export function canDeleteRecord(
  user: Employee | null | undefined,
  record: { employeeId: string } | null | undefined
): boolean {
  return canEditRecord(user, record);
}

/**
 * Only admins can re-assign records to other employees.
 */
export function canAssignRecord(user: Employee | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Only admins can manage employees, roles, and settings.
 */
export function canManageEmployees(user: Employee | null | undefined): boolean {
  return isAdmin(user);
}
