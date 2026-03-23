import { casesRepo } from "@/03db/repos/cases.repo.js";
import { messagesRepo } from "@/03db/repos/messages.repo.js";
import { getLLM } from "./llm.service.js";
import { sseService } from "./sse.service.js";
import { createAgent } from "langchain";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  SystemMessage,
  AIMessage,
  HumanMessage,
} from "@langchain/core/messages";

export const agentService = {
  async handleMessage(userId: string, caseId: string, userMessage: string) {
    try {
      // 1. Fetch case details and history
      const currentCase = await casesRepo.findById(caseId);
      if (!currentCase) throw new Error("Case not found");

      const history = await messagesRepo.findByCaseAndUser(caseId, userId);

      // 2. Parse case data
      const anamnesis =
        typeof currentCase.anamnesis === "string"
          ? JSON.parse(currentCase.anamnesis)
          : currentCase.anamnesis;

      const procedures =
        typeof currentCase.procedures === "string"
          ? JSON.parse(currentCase.procedures)
          : currentCase.procedures;

      // 3. Define Tools
      const scheduleProcedureTool = tool(
        async ({ procedureName }) => {
          // In a real app we'd look up the exact procedure in the `procedures` array.
          // For now, we instruct the LLM to act as the lab and report expected results.
          return `LAB REPORT: Please provide the expected results for ${procedureName} given the patient has ${currentCase.diagnosis_name}. Never state the diagnosis directly.`;
        },
        {
          name: "schedule_procedure",
          description: "Schedule a medical procedure or lab test.",
          schema: z.object({
            procedureName: z
              .string()
              .describe("The name of the procedure to schedule"),
          }),
        }
      );

      const makeDiagnosisTool = tool(
        async ({ diagnosisName }) => {
          // Simple string match. In production, could use LLM eval or vector search against ICD.
          const isCorrect =
            diagnosisName
              .toLowerCase()
              .includes(currentCase.diagnosis_name.toLowerCase()) ||
            currentCase.diagnosis_name
              .toLowerCase()
              .includes(diagnosisName.toLowerCase());

          if (isCorrect) {
            await casesRepo.markCompleted(userId, caseId);
            return "SYSTEM: The diagnosis is CORRECT. The case is now completed. Congratulate the doctor.";
          }
          return "SYSTEM: The diagnosis is INCORRECT. Inform the doctor it is wrong.";
        },
        {
          name: "make_diagnosis",
          description: "Submit a final diagnosis for the patient.",
          schema: z.object({
            diagnosisName: z.string().describe("The name of the diagnosis"),
          }),
        }
      );

      const tools = [scheduleProcedureTool, makeDiagnosisTool];

      // 4. Construct System Prompt
      const systemPrompt = `You are a patient simulator and medical lab reporter for a case.
The doctor will ask you questions to figure out the diagnosis.
Here is the patient's data:
Patient Profile: ${JSON.stringify(currentCase.patient)}
Chief Complaint: ${currentCase.chief_complaint}
Anamnesis: ${JSON.stringify(anamnesis)}
Procedures/Lab results (if scheduled): ${JSON.stringify(procedures)}
REAL DIAGNOSIS: ${currentCase.diagnosis_name} (ICD: ${currentCase.diagnosis_icd || "none"})

CRITICAL RULES:
1. If the doctor asks anamnesis questions, answer as the patient using the Anamnesis data.
2. If the user asks for a procedure or lab, USE THE \`schedule_procedure\` TOOL.
3. If the user makes a diagnosis, USE THE \`make_diagnosis\` TOOL.
4. NEVER REVEAL THE REAL DIAGNOSIS directly to the user.
5. Keep answers concise.
Note: the most recent message from the user is: ${userMessage}`;

      // 5. Construct message history for LangChain
      const promptMessages = [
        new SystemMessage(systemPrompt),
        ...history.map((m: any) =>
          m.role === "user"
            ? new HumanMessage(m.content)
            : new AIMessage(m.content)
        ),
      ];

      // 6. Execute Agent Loop with Streaming
      const llm = getLLM();

      const agent = createAgent({
        model: llm,
        tools,
      });

      let fullResponse = "";

      const eventStream = await agent.streamEvents(
        { messages: promptMessages },
        { version: "v2" }
      );

      for await (const event of eventStream) {
        if (event.event === "on_chat_model_stream") {
          const chunk = event.data.chunk.content;
          if (chunk && typeof chunk === "string") {
            fullResponse += chunk;
            sseService.sendToUser(caseId, userId, {
              type: "chunk",
              content: chunk,
            });
          }
        }
      }

      sseService.sendToUser(caseId, userId, { type: "done" });

      // 7. Save assistant message to DB
      if (fullResponse) {
        await messagesRepo.create({
          userId,
          caseId,
          role: "assistant",
          content: fullResponse,
        });
      }
    } catch (error) {
      console.error("Agent Error:", error);
      sseService.sendToUser(caseId, userId, {
        type: "error",
        content: "The agent encountered an error processing your request.",
      });
    }
  },
};
