import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().trim().max(150).default("Unnamed lead"),
  company: z.string().trim().max(200).default("Unknown company"),
  phone: z.string().trim().max(30).default(""),
  email: z.string().trim().email().or(z.literal("")).default(""),
  address: z.string().trim().max(500).default(""),
  material: z.string().trim().max(100).default("Not specified"),
  units: z.string().trim().max(50).default("N/A"),
  quantity: z.number().int().positive().default(1),
  duration: z.string().trim().max(50).default("Not specified"),
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
  source: z.string().trim().max(100).default("Other"),
  feedback: z.string().trim().max(2000).default(""),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
});


export const updateLeadSchema = createLeadSchema.partial();
export type CreateLeadInput = z.infer<typeof createLeadSchema>;