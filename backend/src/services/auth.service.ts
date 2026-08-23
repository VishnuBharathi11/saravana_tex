import { hashPassword, verifyPassword } from "../utils/crypto";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AuthenticatedEmployee {
  id: string;
  name: string;
  role: "Admin" | "Employee";
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  createdAt: string;
  avatarHue: number;
  designation: string;
  about: string | null;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: "Admin" | "Employee";
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  avatar_hue: number;
  designation: string;
  about: string | null;
  password_hash: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  employee_id: string;
  expires_at: string;
}

function toEmployee(row: EmployeeRow): AuthenticatedEmployee {
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
    about: row.about,
  };
}

function generateToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function hashSessionToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);

  const bytes = new Uint8Array(digest);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function authenticateEmployee(
  db: D1Database,
  email: string,
  password: string,
): Promise<{
  employee: AuthenticatedEmployee;
  sessionToken: string;
  expiresAt: string;
} | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const employee = await db
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
        password_hash,
        created_at
      FROM employees
      WHERE lower(email) = ?
      LIMIT 1
    `)
    .bind(normalizedEmail)
    .first<EmployeeRow>();

  if (!employee || !employee.password_hash) {
    return null;
  }

  if (employee.status !== "Active") {
    return null;
  }

  const validPassword = await verifyPassword(
    password,
    employee.password_hash,
  );

  if (!validPassword) {
    return null;
  }

  const sessionToken = generateToken();
  const tokenHash = await hashSessionToken(sessionToken);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000,
  ).toISOString();

  const sessionId = crypto.randomUUID();

  await db
    .prepare(`
      INSERT INTO sessions (
        id,
        employee_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `)
    .bind(
      sessionId,
      employee.id,
      tokenHash,
      expiresAt,
    )
    .run();

  return {
    employee: toEmployee(employee),
    sessionToken,
    expiresAt,
  };
}

export async function getEmployeeFromSession(
  db: D1Database,
  sessionToken: string,
): Promise<AuthenticatedEmployee | null> {
  const tokenHash = await hashSessionToken(sessionToken);

  const session = await db
    .prepare(`
      SELECT
        id,
        employee_id,
        expires_at
      FROM sessions
      WHERE token_hash = ?
        AND expires_at > ?
      LIMIT 1
    `)
    .bind(
      tokenHash,
      new Date().toISOString(),
    )
    .first<SessionRow>();

  if (!session) {
    return null;
  }

  const employee = await db
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
        password_hash,
        created_at
      FROM employees
      WHERE id = ?
        AND status = 'Active'
      LIMIT 1
    `)
    .bind(session.employee_id)
    .first<EmployeeRow>();

  if (!employee) {
    return null;
  }

  await db
    .prepare(`
      UPDATE sessions
      SET last_seen_at = ?
      WHERE id = ?
    `)
    .bind(
      new Date().toISOString(),
      session.id,
    )
    .run();

  return toEmployee(employee);
}

export async function deleteSession(
  db: D1Database,
  sessionToken: string,
): Promise<void> {
  const tokenHash = await hashSessionToken(sessionToken);

  await db
    .prepare(`
      DELETE FROM sessions
      WHERE token_hash = ?
    `)
    .bind(tokenHash)
    .run();
}

export { SESSION_DURATION_SECONDS };