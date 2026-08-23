export type NotificationType =
  | "FOLLOW_UP"
  | "LEAD"
  | "CUSTOMER"
  | "ORDER"
  | "EMPLOYEE";

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  description: string;
  targetId?: string | null;
}

export async function createNotification(
  db: D1Database,
  input: CreateNotificationInput,
) {
  const id = `NOTIF-${crypto.randomUUID()}`;
  const timestamp = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO notifications (
        id,
        type,
        title,
        description,
        timestamp,
        target_id,
        read
      )
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `)
    .bind(
      id,
      input.type,
      input.title,
      input.description,
      timestamp,
      input.targetId ?? null,
    )
    .run();

  return {
    id,
    type: input.type,
    title: input.title,
    description: input.description,
    timestamp,
    targetId: input.targetId ?? null,
    read: false,
  };
}
