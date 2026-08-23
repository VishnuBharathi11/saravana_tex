import type { FollowUp } from "@/types";
import { apiRequest } from "./client";

interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface DashboardSummary {
  leads: { total: number; new?: number; converted?: number };
  customers: { total: number; active?: number; vip?: number };
  orders: { total: number; totalValue?: number; pending?: number };
  followUps: { total: number; today?: number; completed?: number };
}

export interface DashboardFollowUp extends Omit<FollowUp, "relatedName"> {
  relatedName?: string;
}

export interface DashboardFollowUpFilters {
  date?: string;
  from?: string;
  to?: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiRequest<ApiDataResponse<DashboardSummary>>("/api/dashboard/summary", {
    method: "GET",
  });
  return response.data;
}

export async function getDashboardFollowUps(
  filters: DashboardFollowUpFilters = {},
): Promise<DashboardFollowUp[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  const response = await apiRequest<ApiDataResponse<DashboardFollowUp[]>>(
    `/api/dashboard/follow-ups${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  return response.data;
}
