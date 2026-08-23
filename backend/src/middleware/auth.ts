import { createMiddleware } from "hono/factory";
import { getEmployeeFromSession } from "../services/auth.service";
import { getSessionToken } from "../utils/cookies";
import type { AuthenticatedEmployee } from "../services/auth.service";

type Bindings = {
  saravana_traders_db: D1Database;
};

type Variables = {
  employee: AuthenticatedEmployee;
};

export const requireAuth = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
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
    c.header("Set-Cookie", "st_crm_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax");

    return c.json(
      {
        success: false,
        message: "Session is invalid or expired",
      },
      401,
    );
  }

  c.set("employee", employee);

  await next();
});