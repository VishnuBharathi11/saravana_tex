import { Hono } from "hono";
import {
  authenticateEmployee,
  deleteSession,
  getEmployeeFromSession,
  SESSION_DURATION_SECONDS,
} from "../services/auth.service";

import {
  createClearedSessionCookie,
  createSessionCookie,
  getSessionToken,
} from "../utils/cookies";

type Bindings = {
  saravana_traders_db: D1Database;
};

const auth = new Hono<{ Bindings: Bindings }>();

auth.post("/login", async (c) => {
  let body: {
    email?: unknown;
    password?: unknown;
  };

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

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return c.json(
      {
        success: false,
        message: "Email and password are required",
      },
      400,
    );
  }

  const result = await authenticateEmployee(
    c.env.saravana_traders_db,
    body.email,
    body.password,
  );

  if (!result) {
    return c.json(
      {
        success: false,
        message: "Invalid email or password",
      },
      401,
    );
  }

  c.header(
    "Set-Cookie",
    createSessionCookie(
      result.sessionToken,
      SESSION_DURATION_SECONDS,
    ),
  );

  return c.json({
    success: true,
    employee: result.employee,
    expiresAt: result.expiresAt,
  });
});

auth.get("/me", async (c) => {
  const sessionToken = getSessionToken(c.req.raw);

  if (!sessionToken) {
    return c.json(
      {
        success: false,
        message: "Authentication required",
      },
      401,
    );
  }

  const employee = await getEmployeeFromSession(
    c.env.saravana_traders_db,
    sessionToken,
  );

  if (!employee) {
    c.header(
      "Set-Cookie",
      createClearedSessionCookie(),
    );

    return c.json(
      {
        success: false,
        message: "Session is invalid or expired",
      },
      401,
    );
  }

  return c.json({
    success: true,
    employee,
  });
});

auth.post("/logout", async (c) => {
  const sessionToken = getSessionToken(c.req.raw);

  if (sessionToken) {
    await deleteSession(
      c.env.saravana_traders_db,
      sessionToken,
    );
  }

  c.header(
    "Set-Cookie",
    createClearedSessionCookie(),
  );

  return c.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default auth;