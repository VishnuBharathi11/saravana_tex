import { z } from "zod";

export const createOrderSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(100),
  customerId: z.string().trim().min(1),
  material: z.string().trim().min(1).max(100),
  materialType: z.string().trim().min(1).max(100),
  quantity: z.number().int().positive(),
  units: z.string().trim().min(1).max(50),
  price: z.number().nonnegative(),
  paymentStatus: z.enum(["Pending", "Partial", "Paid"]).default("Pending"),
  status: z
    .enum([
      "Draft",
      "Confirmed",
      "Processing",
      "Packed",
      "Dispatched",
      "Delivered",
      "Cancelled",
    ])
    .default("Draft"),
  employeeId: z.string().trim().min(1).optional(),
  deliveryDate: z.string().trim().min(1),
  address: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).default(""),
});

export const updateOrderSchema = createOrderSchema.partial();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;