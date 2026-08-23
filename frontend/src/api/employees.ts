import type { Employee, EmployeeAccess } from "@/types";
import { apiRequest } from "./client";

interface ApiDataResponse<T> {
  success: true;
  data: T;
}

interface ApiMessageResponse {
  success: true;
  message: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone: string;
  role: Employee["role"];
  status: Employee["status"];
  avatarHue: number;
  designation: string;
  about?: string;
  password: string;
}

export type UpdateEmployeeInput = Partial<
  Pick<
    Employee,
    "name" | "email" | "phone" | "role" | "status" | "avatarHue" | "designation" | "about"
  >
> & {
  password?: string;
};

export interface UpdateEmployeeAccessInput {
  scope: EmployeeAccess["scope"];
  sharedEmployeeIds: string[];
}

export async function getEmployees(): Promise<Employee[]> {
  const response = await apiRequest<ApiDataResponse<Employee[]>>("/api/employees", {
    method: "GET",
  });

  return response.data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const response = await apiRequest<ApiDataResponse<Employee>>(`/api/employees/${id}`, {
    method: "GET",
  });

  return response.data;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const response = await apiRequest<ApiDataResponse<Employee>>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const response = await apiRequest<ApiDataResponse<Employee>>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function deleteEmployee(id: string, transferToId?: string): Promise<void> {
  await apiRequest<ApiMessageResponse>(`/api/employees/${id}`, {
    method: "DELETE",
    body: JSON.stringify(transferToId ? { transferToId } : {}),
  });
}

export async function getEmployeeAccess(id: string): Promise<EmployeeAccess> {
  const response = await apiRequest<ApiDataResponse<EmployeeAccess>>(`/api/employees/${id}/access`, {
    method: "GET",
  });

  return response.data;
}

export async function updateEmployeeAccess(
  id: string,
  input: UpdateEmployeeAccessInput,
): Promise<EmployeeAccess> {
  const response = await apiRequest<ApiDataResponse<EmployeeAccess>>(
    `/api/employees/${id}/access`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}
