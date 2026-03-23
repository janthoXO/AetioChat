import z from "zod";
export const MessageRoleSchema = z.enum(["user", "assistant"]);
export const MessageSchema = z.object({
    id: z.string().uuid(),
    caseId: z.string().uuid(),
    userId: z.string().uuid(),
    role: MessageRoleSchema,
    content: z.string(),
    createdAt: z.string(),
});
//# sourceMappingURL=Message.js.map