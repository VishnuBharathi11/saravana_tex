const SESSION_COOKIE_NAME = "st_crm_session";

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  maxAge?: number;
  expires?: Date;
}

export function createSessionCookie(
  token: string,
  maxAgeSeconds: number,
): string {
  const options: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: maxAgeSeconds,
  };

  return serializeCookie(
    SESSION_COOKIE_NAME,
    token,
    options,
  );
}

export function createClearedSessionCookie(): string {
  return serializeCookie(
    SESSION_COOKIE_NAME,
    "",
    {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 0,
    },
  );
}

export function getSessionToken(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookies(cookieHeader);

  return cookies[SESSION_COOKIE_NAME] ?? null;
}

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }

  cookie += `; Path=${options.path ?? "/"}`;

  if (options.httpOnly) {
    cookie += "; HttpOnly";
  }

  if (options.secure) {
    cookie += "; Secure";
  }

  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }

  return cookie;
}

function parseCookies(
  header: string,
): Record<string, string> {
  const cookies: Record<string, string> = {};

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = part
      .slice(0, separatorIndex)
      .trim();

    const value = part
      .slice(separatorIndex + 1)
      .trim();

    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}