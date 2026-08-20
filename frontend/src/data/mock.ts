import type {
  AppNotification,
  Customer,
  Employee,
  FollowUp,
  FollowUpStatus,
  Lead,
  LeadStatus,
  Order,
  OrderStatus,
  PaymentStatus,
  Priority,
  Role,
} from "@/types";
import { TEXTILE_TYPES, TEXTILE_UNITS } from "@/lib/constants";

/** Deterministic pseudo-random so SSR and client render identically. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = rng(20260804);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const BASE = new Date("2026-08-04T00:00:00Z");
export const TODAY = BASE.toISOString().slice(0, 10);

function shiftDate(days: number) {
  const d = new Date(BASE);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const FIRST = [
  "Saravanan",
  "Meena",
  "Karthik",
  "Divya",
  "Ramesh",
  "Priya",
  "Vignesh",
  "Anitha",
  "Suresh",
  "Lakshmi",
  "Arun",
  "Kavya",
  "Manoj",
  "Sneha",
  "Prakash",
  "Deepa",
  "Naveen",
  "Revathi",
  "Gokul",
  "Bhavani",
  "Hari",
  "Nandini",
  "Vijay",
  "Ilakkiya",
  "Surya",
];
const LAST = [
  "Kumar",
  "Raj",
  "Iyer",
  "Nathan",
  "Murthy",
  "Selvam",
  "Pillai",
  "Balan",
  "Krishnan",
  "Menon",
];
const COMPANIES = [
  "Tirupur Textiles",
  "Coimbatore Fabrics",
  "Nilgiri Garments",
  "Sri Balaji Textiles",
  "Chennai Cotton Mills",
  "Salem Silks",
  "Erode Yarn Traders",
  "Velan Weavers",
  "Kaveri Apparel",
  "Trichy Textiles",
  "Amman Garments",
  "Vetri Threads",
  "Anand Clothing",
  "Madurai Cotton Mart",
  "Kongu Spinners",
];
const MATERIALS = [
  "Cotton Cone",
  "Cotton Hank",
  "Grey Fabric",
  "Recycled Fabric",
  "Customised Fabric",
  "Cotton Yarn",
  "Denim Fabric",
  "Knitted Fabric",
  "Woven Fabric",
  "Printed Fabric",
];
const MATERIAL_TYPES = TEXTILE_TYPES;
const UNITS = TEXTILE_UNITS;
const SOURCES = ["Website", "Referral", "Walk-in", "Exhibition", "Cold Call", "IndiaMART"];
const DURATIONS = ["Immediate", "1 Week", "2 Weeks", "1 Month", "Quarterly"];
const LEAD_STATUS: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Negotiation",
  "Converted",
  "Lost",
];
const ORDER_STATUS: OrderStatus[] = [
  "Draft",
  "Confirmed",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
  "Cancelled",
];
const PAY_STATUS: PaymentStatus[] = ["Pending", "Partial", "Paid"];
const FU_STATUS: FollowUpStatus[] = [
  "Pending",
  "Completed",
  "Important",
  "Meeting",
  "Order",
  "Reminder",
];
const PRIORITY: Priority[] = ["Low", "Medium", "High"];

const name = () => `${pick(FIRST)} ${pick(LAST)}`;
const slug = (n: string) => n.toLowerCase().replace(/[^a-z]/g, ".");

export const employees: Employee[] = Array.from({ length: 25 }, (_, i) => {
  const n = name();
  const role: Role = i === 0 ? "Admin" : "Employee";
  return {
    id: `EMP-${String(i + 1).padStart(3, "0")}`,
    name: n,
    role,
    email: `${slug(n)}@saravanatraders.in`,
    phone: `+91 9${int(100000000, 899999999)}`,
    status: rand() > 0.12 ? "Active" : "Inactive",
    createdAt: shiftDate(-int(60, 900)),
    avatarHue: int(120, 260),
    designation: role === "Admin" ? "Managing Director" : "Sales Executive",
    about: "Handling industrial material sales across Coimbatore and Erode regions.",
  };
});

export const adminUser = employees[0]!;

export const leads: Lead[] = Array.from({ length: 50 }, (_, i) => {
  const n = name();
  return {
    id: `LEAD-${String(i + 1).padStart(3, "0")}`,
    name: n,
    company: pick(COMPANIES),
    phone: `+91 9${int(100000000, 899999999)}`,
    email: `${slug(n)}@${pick(["gmail.com", "outlook.com", "corp.in"])}`,
    address: `${int(1, 90)}, ${pick(["Gandhi Road", "Mettupalayam St", "Bazaar Street", "Trichy Main Rd"])}, Tamil Nadu`,
    material: pick(MATERIALS),
    units: pick(UNITS),
    quantity: int(5, 900),
    duration: pick(DURATIONS),
    notes: "Requested a bulk quotation and delivery schedule for grey fabric.",
    employeeId: employees[int(0, employees.length - 1)]!.id,
    status: pick(LEAD_STATUS),
    source: pick(SOURCES),
    createdAt: shiftDate(-int(0, 180)),
    feedback: pick([
      "Interested, awaiting price revision.",
      "Comparing with competitor quotes.",
      "Asked for a sample batch.",
      "Positive response, decision next week.",
    ]),
  };
});

export const customers: Customer[] = Array.from({ length: 50 }, (_, i) => {
  const n = name();
  return {
    id: `CUS-${String(i + 1).padStart(3, "0")}`,
    name: n,
    company: pick(COMPANIES),
    phone: `+91 9${int(100000000, 899999999)}`,
    email: `${slug(n)}@${pick(["gmail.com", "corp.in", "works.co"])}`,
    address: `${int(1, 90)}, ${pick(["Race Course", "Avinashi Rd", "KK Nagar", "Anna Salai"])}, Tamil Nadu`,
    material: pick(MATERIALS),
    units: pick(UNITS),
    quantity: int(10, 1200),
    duration: pick(DURATIONS),
    notes: "Long standing account with recurring monthly requirements.",
    employeeId: employees[int(0, employees.length - 1)]!.id,
    status: pick(["Active", "Dormant", "VIP"] as const),
    source: pick(SOURCES),
    createdAt: shiftDate(-int(30, 700)),
    feedback: "Happy with delivery timelines.",
    totalOrders: int(1, 22),
    totalValue: int(80000, 4200000),
  };
});

export const orders: Order[] = Array.from({ length: 150 }, (_, i) => {
  const c = customers[int(0, customers.length - 1)]!;
  const qty = int(5, 600);
  const price = int(450, 9500);
  const sub = qty * price;
  return {
    id: `ORD-${String(i + 1).padStart(4, "0")}`,
    invoiceNumber: `ST/26-27/${String(1000 + i)}`,
    customerId: c.id,
    customerName: c.name,
    company: c.company,
    material: pick(MATERIALS),
    materialType: pick(MATERIAL_TYPES),
    quantity: qty,
    units: pick(UNITS),
    price,
    value: sub,
    paymentStatus: pick(PAY_STATUS),
    status: pick(ORDER_STATUS),
    employeeId: employees[int(0, employees.length - 1)]!.id,
    createdAt: shiftDate(-int(0, 240)),
    deliveryDate: shiftDate(int(-30, 45)),
    address: c.address,
    notes: "Delivery to site gate; unloading by customer.",
  };
});

export const followUps: FollowUp[] = Array.from({ length: 300 }, (_, i) => {
  const isLead = rand() > 0.45;
  const rel = isLead ? leads[int(0, leads.length - 1)]! : customers[int(0, customers.length - 1)]!;
  return {
    id: `FU-${String(i + 1).padStart(4, "0")}`,
    title: pick([
      "Quotation follow-up",
      "Site visit",
      "Payment reminder",
      "Sample delivery",
      "Price negotiation call",
      "Order confirmation",
      "Client meeting",
      "Dispatch update",
    ]),
    description: "Discuss pending requirements and confirm next steps with the client.",
    date: shiftDate(int(-25, 32)),
    time: `${String(int(9, 18)).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}`,
    status: pick(FU_STATUS),
    priority: pick(PRIORITY),
    reminder: rand() > 0.4,
    employeeId: employees[int(0, employees.length - 1)]!.id,
    relatedName: rel.name,
    relatedType: isLead ? "Lead" : "Customer",
    relatedId: rel.id,
  };
});

export const notifications: AppNotification[] = [
  {
    id: "N1",
    title: "Upcoming follow-up",
    body: "Quotation follow-up with Vetri Steels at 11:30",
    type: "Follow-up",
    time: "10m ago",
    read: false,
  },
  {
    id: "N2",
    title: "Missed follow-up",
    body: "Payment reminder for Salem Pipes was not completed",
    type: "Missed",
    time: "1h ago",
    read: false,
  },
  {
    id: "N3",
    title: "New lead assigned",
    body: "Kongu Spinners enquiry for 240 Bags Cotton cone",
    type: "Lead",
    time: "3h ago",
    read: false,
  },
  {
    id: "N4",
    title: "Order confirmed",
    body: "ST/26-27/1042 moved to Processing",
    type: "Order",
    time: "Yesterday",
    read: true,
  },
  {
    id: "N5",
    title: "Meeting reminder",
    body: "Site meeting with Amman Industries tomorrow 09:00",
    type: "Meeting",
    time: "Yesterday",
    read: true,
  },
];

export const revenueSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][i]!,
  revenue: int(1800000, 6400000),
  orders: int(20, 90),
  leads: int(15, 70),
}));

export const sourceSeries = SOURCES.map((s) => ({
  name: s,
  value: leads.filter((l) => l.source === s).length,
}));

export const statusSeries = LEAD_STATUS.map((s) => ({
  name: s,
  value: leads.filter((l) => l.status === s).length,
}));

export const employeeById = (id: string) => employees.find((e) => e.id === id);
export const employeeName = (id: string) => employeeById(id)?.name ?? "Unassigned";

export const dashboardStats = {
  totalLeads: leads.length,
  newLeadsToday: leads.filter((l) => l.createdAt === TODAY).length + 6,
  customers: customers.length,
  newCustomers: 8,
  orders: orders.length,
  revenue: orders.reduce((a, o) => a + o.value, 0),
  pendingFollowUps: followUps.filter((f) => f.status === "Pending").length,
  todaysMeetings: followUps.filter((f) => f.date === TODAY && f.status === "Meeting").length + 3,
};

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
