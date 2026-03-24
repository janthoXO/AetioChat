import { casesRepo } from "@/03db/repos/cases.repo.js";
import { messagesRepo } from "@/03db/repos/messages.repo.js";
import { XMLReasoningFilter } from "@/utils/ReasoningFilter.js";
import { messageSse } from "@/02services/message.sse.js";
import { handleMessage as agentHandleMessage } from "./orchestrator.js";
import { caseFromEntity } from "@/02models/Case.js";
import { messageFromEntity } from "@/02models/Message.js";

export const handleMessage = async (
  userId: string,
  caseId: string,
  userMessage: string
): Promise<void> => {
  try {
    const currentCase = await casesRepo
      .findById(caseId)
      .then((c) => (c ? caseFromEntity(c) : null));
    if (!currentCase) throw new Error(`Case not found: ${caseId}`);

    const history = await messagesRepo
      .findByCaseAndUser(caseId, userId)
      .then((msgs) => msgs.map((m) => messageFromEntity(m)));

    const chunkStream = agentHandleMessage(
      userMessage,
      currentCase,
      history,
      () => {
        casesRepo.markCompleted(userId, caseId).catch((err) => {
          console.error(
            "[DiagnosisTool] Failed to mark case as completed:",
            err
          );
        });
      }
    );

    const filter = new XMLReasoningFilter();
    let fullResponse = "";

    for await (const rawChunk of chunkStream) {
      const cleanChunk = filter.processChunk(rawChunk);
      if (!cleanChunk) continue;
      fullResponse += cleanChunk;
      messageSse.publishMessage(userId, caseId, cleanChunk, "chunk");
    }

    const trailing = filter.flush();
    if (trailing) {
      fullResponse += trailing;
      messageSse.publishMessage(userId, caseId, trailing, "chunk");
    }

    messageSse.publishMessage(userId, caseId, undefined, "done");
    fullResponse = fullResponse.trim();
    if (fullResponse) {
      await messagesRepo.create({
        userId,
        caseId,
        role: "assistant",
        content: fullResponse,
      });
    }
  } catch (error) {
    console.error("[MessageService] Error:", error);
    messageSse.publishMessage(userId, caseId, "An error occurred.", "error");
  }
};

export async function resumeInterruptedMessages() {
  try {
    const latestMessages = await messagesRepo.findLatestMessagePerCase();

    const interrupted = latestMessages.filter((m) => m.role === "user");
    console.log(`Resuming ${interrupted.length} interrupted AI responses...`);

    for (const msg of interrupted) {
      // Fire asynchronously
      handleMessage(msg.user_id, msg.case_id, msg.content).catch((e) => {
        console.error(`Failed to resume message for case ${msg.case_id}:`, e);
      });
    }
  } catch (error) {
    console.error("Failed to check for interrupted messages:", error);
  }
}
