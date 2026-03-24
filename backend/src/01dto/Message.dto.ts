import type { Message } from "@/02models/Message.js";
import { MessageDTOSchema as MessageDTOSchemaShared } from "shared/index.js";
import z from "zod";

export const MessageDTOSchema = MessageDTOSchemaShared;

export type MessageDTO = z.infer<typeof MessageDTOSchema>;

export function messageToDTO(domain: Message): MessageDTO {
  return {
    ...domain,
  };
}
