import type { Customer } from "@/types";
import { apiRequest } from "./client";

interface ApiDataResponse<T> {
  success: true;
  data: T;
}

interface ApiMessageResponse {
  success: true;
  message: string;
}

export interface CreateCustomerInput {
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  material: string;
  units: string;
  quantity: number;
  duration: string;
  notes?: string;
  employeeId?: string;
  status?: Customer["status"];
  source: string;
  feedback?: string;
}

export type UpdateCustomerInput = Partial<
  Pick<
    Customer,
    | "name"
    | "company"
    | "phone"
    | "email"
    | "address"
    | "material"
    | "units"
    | "quantity"
    | "duration"
    | "notes"
    | "status"
    | "source"
    | "feedback"
  >
>;

export async function getCustomers(): Promise<Customer[]> {
  const response = await apiRequest<ApiDataResponse<Customer[]>>("/api/customers", {
    method: "GET",
  });
  return response.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const response = await apiRequest<ApiDataResponse<Customer>>(`/api/customers/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const response = await apiRequest<ApiDataResponse<Customer>>("/api/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const response = await apiRequest<ApiDataResponse<Customer>>(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiRequest<ApiMessageResponse>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}
