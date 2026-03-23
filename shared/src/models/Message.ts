import z from "zod";

export const MessageRoleSchema = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.uuid(),
  caseId: z.uuid(),
  userId: z.uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
