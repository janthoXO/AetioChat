import z from "zod";

export const MessageDTOSchema = z.object({
  content: z.string(),
});

export type MessageDTO = z.infer<typeof MessageDTOSchema>;
