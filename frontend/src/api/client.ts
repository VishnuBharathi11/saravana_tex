const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://backend.saravanatraders-web.workers.dev";

export interface ApiErrorResponse {
  success?: false;
  message?: string;
  errors?: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse | string;

  constructor(message: string, status: number, data: ApiErrorResponse | string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await window.fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Unable to connect to the server",
      0,
      "NETWORK_ERROR",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  let data: unknown;

  try {
    data = contentType.includes("application/json") ? await response.json() : await response.text();
  } catch {
    data = "";
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      message = data.message;
    }

    throw new ApiError(message, response.status, data as ApiErrorResponse | string);
  }

  return data as T;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
