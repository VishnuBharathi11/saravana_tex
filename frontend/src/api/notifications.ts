import type { AppNotification } from "@/types";
import { apiRequest } from "./client";

interface ApiDataResponse<T> {
  success: true;
  data: T;
}

interface ApiMessageResponse {
  success: true;
  message: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await apiRequest<ApiDataResponse<AppNotification[]>>("/api/notifications", { method: "GET" });
  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiRequest<ApiMessageResponse>(`/api/notifications/${id}/read`, { method: "PATCH" });
}
