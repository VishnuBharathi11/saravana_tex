import { z } from "zod";

export const orderItemSchema = z.object({
  material: z.string().trim().min(1).max(100),
  materialType: z.string().trim().min(1).max(100),
  quantity: z.number().int().positive(),
  units: z.string().trim().min(1).max(50),
  price: z.number().nonnegative(),
});

const orderFields = {
  invoiceNumber: z.string().trim().min(1).max(100),
  customerId: z.string().trim().min(1),
  items: z.array(orderItemSchema).min(1).optional(),
  material: z.string().trim().min(1).max(100).optional(),
  materialType: z.string().trim().min(1).max(100).optional(),
  quantity: z.number().int().positive().optional(),
  units: z.string().trim().min(1).max(50).optional(),
  price: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["Pending", "Partial", "Paid"]).default("Pending"),
  status: z.enum(["Draft", "Confirmed", "Processing", "Packed", "Dispatched", "Delivered", "Cancelled"]).default("Draft"),
  employeeId: z.string().trim().min(1).optional(),
  deliveryDate: z.string().trim().min(1),
  address: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).default(""),
};

export const createOrderSchema = z.object(orderFields).superRefine((value, ctx) => {
  const hasItems = Boolean(value.items?.length);
  const hasLegacyItem = Boolean(value.material && value.materialType && value.units && value.quantity !== undefined && value.price !== undefined);
  if (!hasItems && !hasLegacyItem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one order item is required", path: ["items"] });
});

export const updateOrderSchema = z.object({
  invoiceNumber: orderFields.invoiceNumber.optional(),
  customerId: orderFields.customerId.optional(),
  items: orderFields.items,
  material: orderFields.material,
  materialType: orderFields.materialType,
  quantity: orderFields.quantity,
  units: orderFields.units,
  price: orderFields.price,
  paymentStatus: z.enum(["Pending", "Partial", "Paid"]).optional(),
  status: z.enum(["Draft", "Confirmed", "Processing", "Packed", "Dispatched", "Delivered", "Cancelled"]).optional(),
  employeeId: orderFields.employeeId,
  deliveryDate: orderFields.deliveryDate.optional(),
  address: orderFields.address.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
