import type { Employee } from "../types";
import { apiRequest } from "./client";

export interface LoginResponse {
  success: true;
  employee: Employee;
  expiresAt: string;
}

export interface CurrentUserResponse {
  success: true;
  employee: Employee;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>("/api/auth/me", {
    method: "GET",
  });
}

export async function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>("/api/auth/logout", {
    method: "POST",
  });
}
