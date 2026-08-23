import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(30),
  role: z.enum(["Admin", "Employee"]).default("Employee"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  avatarHue: z.number().int().min(0).max(360).default(180),
  designation: z.string().trim().min(1).max(150),
  about: z.string().trim().max(2000).default(""),
  password: z.string().min(8).max(200),
});

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  role: z.enum(["Admin", "Employee"]).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  avatarHue: z.number().int().min(0).max(360).optional(),
  designation: z.string().trim().min(1).max(150).optional(),
  about: z.string().trim().max(2000).optional(),
  password: z.string().min(8).max(200).optional(),
});

export const updateEmployeeAccessSchema = z.object({
  scope: z.enum(["OWN", "SHARED", "FULL"]),
  sharedEmployeeIds: z.array(z.string().min(1)).default([]),
});

export type CreateEmployeeInput =
  z.infer<typeof createEmployeeSchema>;

export type UpdateEmployeeInput =
  z.infer<typeof updateEmployeeSchema>;

export type UpdateEmployeeAccessInput =
  z.infer<typeof updateEmployeeAccessSchema>;