import type { MessagesTable } from "../03db/schema.js";
import type { Insertable, Selectable } from "kysely";
import { z } from "zod";

export const MessageSchema = z.object({
  id: z.uuid(),
  caseId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.iso.datetime(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Domain -> Entity
 */
export function messageToEntity(domain: Message): Insertable<MessagesTable> {
  return {
    id: domain.id,
    case_id: domain.caseId,
    user_id: domain.userId,
    role: domain.role,
    content: domain.content,
    created_at: domain.createdAt,
  };
}

/**
 * Entity -> Domain
 */
export function messageFromEntity(entity: Selectable<MessagesTable>): Message {
  return {
    id: entity.id,
    caseId: entity.case_id,
    userId: entity.user_id,
    role: entity.role as "user" | "assistant",
    content: entity.content,
    createdAt: entity.created_at,
  };
}
