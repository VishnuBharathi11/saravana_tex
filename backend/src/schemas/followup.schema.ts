import { z } from "zod";

export const createFollowUpSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum([
    "Pending",
    "Completed",
    "Important",
    "Meeting",
    "Order",
    "Reminder",
    "Missed",
  ]).default("Pending"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  reminder: z.boolean().default(false),
  employeeId: z.string().trim().min(1).optional(),
  relatedType: z.enum(["Lead", "Customer"]),
  relatedId: z.string().trim().min(1),
});

export const updateFollowUpSchema =
  createFollowUpSchema.partial();

export type CreateFollowUpInput =
  z.infer<typeof createFollowUpSchema>;