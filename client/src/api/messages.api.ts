import { fetchApi } from "@/lib/api";
import type { MessageDTO } from "shared/index";

export async function fetchMessages(caseId: string) {
  return fetchApi<MessageDTO[]>(`/cases/${caseId}/messages`);
}

export async function sendMessage(caseId: string, content: string): Promise<MessageDTO> {
  return fetchApi(`/cases/${caseId}/message`, {
    method: "POST",
    body: { content },
  });
}
