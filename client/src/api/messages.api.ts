import { fetchApi } from "@/lib/api";
import type { Message } from "shared/index";

export async function fetchMessages(caseId: string) {
  return fetchApi<Message[]>(`/cases/${caseId}/messages`);
}

export async function sendMessage(caseId: string, content: string): Promise<Message> {
  return fetchApi(`/cases/${caseId}/message`, {
    method: "POST",
    body: { content },
  });
}
