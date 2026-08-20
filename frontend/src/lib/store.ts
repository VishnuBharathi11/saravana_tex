import { useSyncExternalStore } from "react";
import {
  customers as seedCustomers,
  employees as seedEmployees,
  followUps as seedFollowUps,
  leads as seedLeads,
  orders as seedOrders,
} from "@/data/mock";
import type {
  Customer,
  Employee,
  FollowUp,
  Lead,
  Order,
  AccessPermission,
  EmployeeAccess,
} from "@/types";
import { canEditRecord, canDeleteRecord, canManageEmployees } from "@/lib/permissions";

export interface CrmState {
  employees: Employee[];
  leads: Lead[];
  customers: Customer[];
  orders: Order[];
  followUps: FollowUp[];
  accessPermissions: AccessPermission[];
  employeeAccess: EmployeeAccess[];
}

let state: CrmState = {
  employees: seedEmployees,
  leads: seedLeads,
  customers: seedCustomers,
  orders: seedOrders,
  followUps: seedFollowUps,
  accessPermissions: [],
  employeeAccess: seedEmployees.map((e) => ({
    employeeId: e.id,
    scope: e.role === "Admin" ? "FULL" : "OWN",
    sharedEmployeeIds: [],
  })),
};

const TODAY_STR = new Date().toISOString().slice(0, 10);
state.followUps = state.followUps.map((f) => {
  if (f.status !== "Completed" && f.date < TODAY_STR) {
    return { ...f, status: "Missed" };
  }
  return f;
});

const listeners = new Set<() => void>();

function set(patch: Partial<CrmState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;

export const getCurrentUser = (): Employee | null => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("st-crm-user");
  return state.employees.find((e) => e.id === id) || null;
};

/** Whole-store subscription — the snapshot object identity is stable between writes. */
export function useCrm(): CrmState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const crm = {
  get state() {
    return state;
  },

  /* ---------------- leads ---------------- */
  addLead(lead: Lead) {
    set({ leads: [lead, ...state.leads] });
  },
  updateLead(id: string, patch: Partial<Lead>) {
    const user = getCurrentUser();
    const lead = state.leads.find((l) => l.id === id);
    if (!canEditRecord(user, lead)) return;
    set({ leads: state.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  },
  deleteLead(id: string) {
    const user = getCurrentUser();
    const lead = state.leads.find((l) => l.id === id);
    if (!canDeleteRecord(user, lead)) return;
    set({
      leads: state.leads.filter((l) => l.id !== id),
      followUps: state.followUps.filter((f) => f.relatedId !== id),
    });
  },
  /** Converts a lead into a customer, keeping history and follow-ups. Returns the customer id. */
  convertLead(id: string): string | null {
    const lead = state.leads.find((l) => l.id === id);
    if (!lead) return null;
    if (lead.convertedCustomerId) return lead.convertedCustomerId;

    const customerId = `CUS-${String(state.customers.length + 1).padStart(3, "0")}-${lead.id}`;
    const customer: Customer = {
      id: customerId,
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      material: lead.material,
      units: lead.units,
      quantity: lead.quantity,
      duration: lead.duration,
      notes: lead.notes,
      employeeId: lead.employeeId,
      source: lead.source,
      createdAt: new Date().toISOString().slice(0, 10),
      feedback: lead.feedback,
      status: "Active",
      totalOrders: 0,
      totalValue: 0,
    };

    const conversion: FollowUp = {
      id: `FU-C-${customerId}`,
      title: "Lead converted to customer",
      description: `${lead.name} was converted from lead ${lead.id}.`,
      date: customer.createdAt,
      time: "09:00",
      status: "Completed",
      priority: "Medium",
      reminder: false,
      employeeId: lead.employeeId,
      relatedName: lead.name,
      relatedType: "Customer",
      relatedId: customerId,
    };

    set({
      customers: [customer, ...state.customers],
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, status: "Converted", convertedCustomerId: customerId } : l,
      ),
      // keep the history: re-point this lead's follow-ups at the new customer
      followUps: [
        conversion,
        ...state.followUps.map((f) =>
          f.relatedId === id
            ? { ...f, relatedType: "Customer" as const, relatedId: customerId }
            : f,
        ),
      ],
    });
    return customerId;
  },

  /* ---------------- customers ---------------- */
  addCustomer(customer: Customer) {
    set({ customers: [customer, ...state.customers] });
  },
  updateCustomer(id: string, patch: Partial<Customer>) {
    const user = getCurrentUser();
    const customer = state.customers.find((c) => c.id === id);
    if (!canEditRecord(user, customer)) return;
    set({ customers: state.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },
  deleteCustomer(id: string) {
    const user = getCurrentUser();
    const customer = state.customers.find((c) => c.id === id);
    if (!canDeleteRecord(user, customer)) return;
    set({
      customers: state.customers.filter((c) => c.id !== id),
      orders: state.orders.filter((o) => o.customerId !== id),
      followUps: state.followUps.filter((f) => f.relatedId !== id),
    });
  },

  /* ---------------- orders ---------------- */
  addOrder(order: Order) {
    set({ orders: [order, ...state.orders] });
  },
  updateOrder(id: string, patch: Partial<Order>) {
    const user = getCurrentUser();
    const order = state.orders.find((o) => o.id === id);
    if (!canEditRecord(user, order)) return;
    set({ orders: state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  },
  deleteOrder(id: string) {
    const user = getCurrentUser();
    const order = state.orders.find((o) => o.id === id);
    if (!canDeleteRecord(user, order)) return;
    set({ orders: state.orders.filter((o) => o.id !== id) });
  },

  /* ---------------- employees ---------------- */
  addEmployee(employee: Employee) {
    const user = getCurrentUser();
    if (!canManageEmployees(user)) return;
    set({
      employees: [employee, ...state.employees],
      employeeAccess: [
        ...state.employeeAccess,
        {
          employeeId: employee.id,
          scope: employee.role === "Admin" ? "FULL" : "OWN",
          sharedEmployeeIds: [],
        },
      ],
    });
  },
  updateEmployee(id: string, patch: Partial<Employee>) {
    const user = getCurrentUser();
    if (!user || (!canManageEmployees(user) && user.id !== id)) return;
    set({ employees: state.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  },
  deleteEmployee(id: string, transferToId?: string) {
    const user = getCurrentUser();
    if (!canManageEmployees(user)) return;
    
    let nextLeads = state.leads;
    let nextCustomers = state.customers;
    let nextOrders = state.orders;
    let nextFollowUps = state.followUps;

    if (transferToId) {
      nextLeads = nextLeads.map((l) =>
        l.employeeId === id ? { ...l, employeeId: transferToId } : l,
      );
      nextCustomers = nextCustomers.map((c) =>
        c.employeeId === id ? { ...c, employeeId: transferToId } : c,
      );
      nextOrders = nextOrders.map((o) =>
        o.employeeId === id ? { ...o, employeeId: transferToId } : o,
      );
      nextFollowUps = nextFollowUps.map((f) =>
        f.employeeId === id ? { ...f, employeeId: transferToId } : f,
      );
    }

    set({
      employees: state.employees.filter((e) => e.id !== id),
      employeeAccess: state.employeeAccess.filter((ea) => ea.employeeId !== id),
      leads: nextLeads,
      customers: nextCustomers,
      orders: nextOrders,
      followUps: nextFollowUps,
    });
  },
  updateEmployeeAccess(employeeId: string, patch: Partial<EmployeeAccess>) {
    set({
      employeeAccess: state.employeeAccess.map((ea) =>
        ea.employeeId === employeeId ? { ...ea, ...patch } : ea,
      ),
    });
  },

  /* ---------------- follow-ups ---------------- */
  addFollowUp(followUp: FollowUp) {
    set({ followUps: [followUp, ...state.followUps] });
  },
  updateFollowUp(id: string, patch: Partial<FollowUp>) {
    const user = getCurrentUser();
    const followUp = state.followUps.find((f) => f.id === id);
    if (!canEditRecord(user, followUp)) return;
    set({ followUps: state.followUps.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  },
  deleteFollowUp(id: string) {
    const user = getCurrentUser();
    const followUp = state.followUps.find((f) => f.id === id);
    if (!canDeleteRecord(user, followUp)) return;
    set({ followUps: state.followUps.filter((f) => f.id !== id) });
  },
  completeFollowUp(id: string) {
    const user = getCurrentUser();
    const followUp = state.followUps.find((f) => f.id === id);
    if (!canEditRecord(user, followUp)) return;
    set({
      followUps: state.followUps.map((f) => (f.id === id ? { ...f, status: "Completed" } : f)),
    });
  },
};

export const nameOf = (employees: Employee[], id: string) =>
  employees.find((e) => e.id === id)?.name ?? "Unassigned";

export const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
