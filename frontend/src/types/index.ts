export type Role = "Admin" | "Sales Coordinator" | "Employee";

export type LeadStatus = "New" | "Contacted" | "Interested" | "Negotiation" | "Converted" | "Lost";
export type OrderStatus =
  "Draft" | "Confirmed" | "Processing" | "Packed" | "Dispatched" | "Delivered" | "Cancelled";
export type PaymentStatus = "Pending" | "Partial" | "Paid";
export type FollowUpStatus =
  "Pending" | "Completed" | "Important" | "Meeting" | "Order" | "Reminder" | "Missed";
export type Priority = "Low" | "Medium" | "High";

export interface Employee {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  createdAt: string;
  avatarHue: number;
  designation: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  material: string;
  units: string;
  quantity: number;
  duration: string;
  notes: string;
  employeeId: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  feedback: string;
  convertedCustomerId?: string;
}

export interface Customer extends Omit<Lead, "status"> {
  status: "Active" | "Dormant" | "VIP";
  totalOrders: number;
  totalValue: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  company: string;
  material: string;
  materialType: string;
  quantity: number;
  units: string;
  price: number;
  value: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  employeeId: string;
  createdAt: string;
  deliveryDate: string;
  address: string;
  notes: string;
}

export interface FollowUp {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
  time: string;
  status: FollowUpStatus;
  priority: Priority;
  reminder: boolean;
  employeeId: string;
  relatedName: string;
  relatedType: "Lead" | "Customer";
  relatedId: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "Follow-up" | "Missed" | "Lead" | "Order" | "Meeting";
  time: string;
  read: boolean;
}

export interface AccessPermission {
  id: string;
  resourceType: "Lead" | "Customer" | "Order" | "FollowUp";
  resourceId: string;
  employeeId: string;
  grantedBy: string;
  grantedAt: string;
}

export interface EmployeeAccess {
  employeeId: string;
  scope: "OWN" | "SHARED" | "FULL";
  sharedEmployeeIds: string[];
}
