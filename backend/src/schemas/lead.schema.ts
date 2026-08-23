import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(150),
  company: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email(),
  address: z.string().trim().min(1).max(500),
  material: z.string().trim().min(1).max(100),
  units: z.string().trim().min(1).max(50),
  quantity: z.number().int().positive(),
  duration: z.string().trim().min(1).max(50),
 notes: z.string().trim().max(2000).optional().default(""),
  employeeId: z.string().trim().optional(),
  status: z.enum([
    "New",
    "Contacted",
    "Interested",
    "Negotiation",
    "Converted",
    "Lost",
  ]).default("New"),
  source: z.string().trim().min(1).max(100),
  feedback: z.string().trim().max(2000).default(""),
});


export const updateLeadSchema = createLeadSchema.partial();
export type CreateLeadInput = z.infer<typeof createLeadSchema>;