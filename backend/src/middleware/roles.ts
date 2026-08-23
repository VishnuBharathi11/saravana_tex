import { requireRole } from "./authorization";

export const requireAdmin = requireRole("Admin");