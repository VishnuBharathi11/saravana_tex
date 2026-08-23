import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(150),
  company: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().max(254),
  address: z.string().trim().min(1).max(500),
  material: z.string().trim().min(1).max(100),
  units: z.string().trim().min(1).max(50),
  quantity: z.number().int().positive(),
  duration: z.string().trim().min(1).max(50),
  notes: z.string().trim().max(2000).default(""),
  employeeId: z.string().trim().min(1).optional(),
  status: z.enum(["Active", "Dormant", "VIP"]).default("Active"),
  source: z.string().trim().min(1).max(100),
  feedback: z.string().trim().max(2000).default(""),
});

export const updateCustomerSchema =
  createCustomerSchema.partial();

export type CreateCustomerInput =
  z.infer<typeof createCustomerSchema>;