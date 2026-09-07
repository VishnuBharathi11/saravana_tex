import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/types";
import { apiRequest } from "./client";
interface ApiDataResponse<T> { success: true; data: T; }
interface ApiMessageResponse { success: true; message: string; }
export type CreateOrderItemInput = Omit<OrderItem, "id" | "value">;
export interface CreateOrderInput { orderId: string; invoiceNumber?: string; customerId: string; items: CreateOrderItemInput[]; material?: string; materialType?: string; quantity?: number; units?: string; price?: number; paymentStatus?: PaymentStatus; status?: OrderStatus; employeeId?: string; deliveryDate: string; address: string; notes?: string; }
export type UpdateOrderInput = Partial<CreateOrderInput> & { items?: CreateOrderItemInput[] };
export async function getOrders(): Promise<Order[]> { const response = await apiRequest<ApiDataResponse<Order[]>>("/api/orders", { method: "GET" }); return response.data; }
export async function getOrder(id: string): Promise<Order> { const response = await apiRequest<ApiDataResponse<Order>>(`/api/orders/${id}`, { method: "GET" }); return response.data; }
export async function createOrder(input: CreateOrderInput): Promise<Order> { const response = await apiRequest<ApiDataResponse<Order>>("/api/orders", { method: "POST", body: JSON.stringify(input) }); return response.data; }
export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> { const response = await apiRequest<ApiDataResponse<Order>>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(input) }); return response.data; }
export async function deleteOrder(id: string): Promise<void> { await apiRequest<ApiMessageResponse>(`/api/orders/${id}`, { method: "DELETE" }); }
