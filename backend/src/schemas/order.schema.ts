import { z } from "zod";

export const orderItemSchema = z.object({
  material: z.string().trim().min(1).max(100),
  materialType: z.string().trim().min(1).max(100),
  quantity: z.number().int().positive(),
  units: z.string().trim().min(1).max(50),
  price: z.number().nonnegative(),
});

export const createOrderSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(100),
  customerId: z.string().trim().min(1),
  items: z.array(orderItemSchema).min(1).optional(),
  material: z.string().trim().min(1).max(100).optional(),
  materialType: z.string().trim().min(1).max(100).optional(),
  quantity: z.number().int().positive().optional(),
  units: z.string().trim().min(1).max(50).optional(),
  price: z.number().nonnegative().optional(),
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
}).superRefine((value, ctx) => {
  if (!value.items?.length && (!value.material || !value.materialType || !value.units || value.quantity === undefined || value.price === undefined)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one order item is required", path: ["items"] });
  }
});

export const updateOrderSchema = createOrderSchema.partial();
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
