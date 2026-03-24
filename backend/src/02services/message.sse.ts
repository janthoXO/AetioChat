import type { Response } from "express";
import { SseService } from "./sse.service.js";

class MessageSse extends SseService<string> {
  private getTopic(caseId: string, userId: string) {
    return `/cases/${caseId}/messages?userId=${userId}`;
  }

  subscribeToCaseMessages(userId: string, caseId: string, res: Response) {
    super.subscribe(this.getTopic(caseId, userId), res);
  }

  publishMessage(
    userId: string,
    caseId: string,
    message: string = "",
    type: "chunk" | "done" | "error" = "chunk"
  ) {
    super.publish(this.getTopic(caseId, userId), type, message);
  }
}

export const messageSse = new MessageSse();
