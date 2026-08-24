import type { FollowUp, FollowUpStatus, Priority } from "@/types";
import { apiRequest } from "./client";

interface ApiDataResponse<T> {
  success: true;
  data: T;
}

interface ApiMessageResponse {
  success: true;
  message: string;
}

export interface CreateFollowUpInput {
  title: string;
  description: string;
  date: string;
  time: string;
  status?: FollowUpStatus;
  priority?: Priority;
  reminder?: boolean;
  employeeId?: string;
  relatedType: "Lead" | "Customer" | "Order";
  relatedId: string;
}

export type UpdateFollowUpInput = Partial<CreateFollowUpInput>;

export async function getFollowUps(): Promise<FollowUp[]> {
  const response = await apiRequest<ApiDataResponse<FollowUp[]>>("/api/follow-ups", { method: "GET" });
  return response.data;
}

export async function getFollowUp(id: string): Promise<FollowUp> {
  const response = await apiRequest<ApiDataResponse<FollowUp>>(`/api/follow-ups/${id}`, { method: "GET" });
  return response.data;
}

export async function createFollowUp(input: CreateFollowUpInput): Promise<FollowUp> {
  const response = await apiRequest<ApiDataResponse<FollowUp>>("/api/follow-ups", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateFollowUp(id: string, input: UpdateFollowUpInput): Promise<FollowUp> {
  const response = await apiRequest<ApiDataResponse<FollowUp>>(`/api/follow-ups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteFollowUp(id: string): Promise<void> {
  await apiRequest<ApiMessageResponse>(`/api/follow-ups/${id}`, { method: "DELETE" });
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const response = await apiRequest<ApiDataResponse<FollowUp>>(`/api/follow-ups/${id}/complete`, {
    method: "POST",
  });
  return response.data;
}
