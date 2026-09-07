export type Role = "Admin" | "Employee";
export type LeadStatus = "New" | "Contacted" | "Interested" | "Negotiation" | "Converted" | "Lost";
export type OrderStatus = "Draft" | "Confirmed" | "Processing" | "Packed" | "Dispatched" | "Delivered" | "Cancelled";
export type PaymentStatus = "Pending" | "Partial" | "Paid";
export type FollowUpStatus = "Pending" | "Completed" | "Important" | "Meeting" | "Order" | "Reminder" | "Missed";
export type Priority = "Low" | "Medium" | "High";
export interface Employee { id: string; name: string; role: Role; email: string; phone: string; status: "Active" | "Inactive"; createdAt: string; avatarHue: number; designation: string; about?: string; }
export interface Lead { id: string; name: string; company: string; phone: string; email: string; address: string; material: string; units: string; quantity: number; duration: string; notes: string; employeeId: string; status: LeadStatus; source: string; createdAt: string; feedback: string; convertedCustomerId?: string; }
export interface Customer extends Omit<Lead, "status"> { status: "Active" | "Dormant" | "VIP"; totalOrders: number; totalValue: number; }
export interface OrderItem { id: string; material: string; materialType: string; quantity: number; units: string; price: number; value: number; deliveryDate: string; }
export interface Order { id: string; invoiceNumber: string; customerId: string; customerName: string; company: string; material: string; materialType: string; quantity: number; units: string; price: number; value: number; items: OrderItem[]; paymentStatus: PaymentStatus; status: OrderStatus; employeeId: string; createdAt: string; deliveryDate: string; address: string; notes: string; }
export interface FollowUp { id: string; title: string; description: string; date: string; time: string; status: FollowUpStatus; priority: Priority; reminder: boolean; employeeId: string; relatedName: string; relatedType: "Lead" | "Customer" | "Order"; relatedId: string; }
export type NotificationType = "FOLLOW_UP" | "LEAD" | "CUSTOMER" | "ORDER" | "EMPLOYEE";
export interface AppNotification { id: string; type: NotificationType; title: string; description: string; timestamp: string; targetId?: string; read: boolean; }
export interface AccessPermission { id: string; resourceType: "Lead" | "Customer" | "Order" | "FollowUp"; resourceId: string; employeeId: string; grantedBy: string; grantedAt: string; }
export interface EmployeeAccess { employeeId: string; scope: "OWN" | "SHARED" | "FULL"; sharedEmployeeIds: string[]; }
