import type { Lead, LeadStatus } from "@/types";
import { apiRequest } from "./client";

interface ApiDataResponse<T> {
  success: true;
  data: T;
}

interface ApiMessageResponse {
  success: true;
  message: string;
}

export interface CreateLeadInput {
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
  status?: LeadStatus;
  source: string;
  feedback?: string;
}

export type UpdateLeadInput = Partial<
  Pick<
    Lead,
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

export interface ConvertLeadResponse {
  success: true;
  data?: {
    customerId: string;
    leadId: string;
  };
  alreadyConverted?: boolean;
  customerId?: string;
}

export async function getLeads(): Promise<Lead[]> {
  const response = await apiRequest<ApiDataResponse<Lead[]>>("/api/leads", {
    method: "GET",
  });
  return response.data;
}

export async function getLead(id: string): Promise<Lead> {
  const response = await apiRequest<ApiDataResponse<Lead>>(`/api/leads/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const response = await apiRequest<ApiDataResponse<Lead>>("/api/leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
  const response = await apiRequest<ApiDataResponse<Lead>>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteLead(id: string): Promise<void> {
  await apiRequest<ApiMessageResponse>(`/api/leads/${id}`, {
    method: "DELETE",
  });
}

export async function convertLead(id: string): Promise<ConvertLeadResponse> {
  return apiRequest<ConvertLeadResponse>(`/api/leads/${id}/convert`, {
    method: "POST",
  });
}
