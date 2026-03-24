import z from "zod";

export const MessageRoleDTOSchema = z.enum(["user", "assistant"]);
export type MessageRoleDTO = z.infer<typeof MessageRoleDTOSchema>;

export const MessageDTOSchema = z.object({
  id: z.uuid(),
  caseId: z.uuid(),
  userId: z.uuid(),
  role: MessageRoleDTOSchema,
  content: z.string(),
  createdAt: z.string(),
});

export type MessageDTO = z.infer<typeof MessageDTOSchema>;
