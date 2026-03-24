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
import type { Diagnosis } from "shared/index.js";
import type { ProcedureWithRelevance } from "@/02models/Procedure.js";
import { XMLReasoningFilter } from "@/utils/ReasoningFilter.js";

export const agentService = {
  getDiagnosisTool(actualDiagnosis: Diagnosis, userId: string, caseId: string) {
    return tool(
      async ({ proposedDiagnosis }) => {
        const prompt = `You are an Attending Physician evaluating a medical student's final diagnosis.

=== DATA ===
ACTUAL DIAGNOSIS: ${actualDiagnosis.name}
STUDENT'S GUESS: "${proposedDiagnosis}"
============

[EVALUATION RULES]
STATE 1: CORRECT -> Congratulate them.
STATE 2: PARTIAL MATCH -> Tell them to be more specific. DO NOT reveal actual diagnosis.
STATE 3: INCORRECT -> Tell them it's incorrect. DO NOT reveal actual diagnosis.

[FORMATTING RULES]
1. First, you MUST write your private clinical evaluation enclosed in <reasoning>...</reasoning> tags.
2. If the guess is STATE 1 (Correct), include the exact word [SOLVED] inside your reasoning tag.
3. Immediately after the closing </reasoning> tag, write your natural language feedback to the student.`;

        console.debug("Diagnosis Tool Prompt:", prompt);

        const result = await getLLM()
          .withConfig({ runName: "medical_evaluator" })
          .invoke(prompt);

        console.debug("Diagnosis Tool Raw Result:", result.text);

        // We handle the database completion silently after the stream is done
        if (result.text.includes("[SOLVED]")) {
          await casesRepo.markCompleted(userId, caseId);
        }

        return result.text;
      },
      {
        name: "make_diagnosis",
        description: "Submit a final diagnosis for the patient.",
        schema: z.object({ proposedDiagnosis: z.string() }),
        returnDirect: true,
      }
    );
  },

  getScheduleProcedureTool(caseProcedures?: ProcedureWithRelevance[]) {
    return tool(
      async ({ procedureName }) => {
        const prompt = `You are a Lab Technician AI. 
USER'S REQUEST: "${procedureName}"
AVAILABLE PROCEDURES: ${caseProcedures ? JSON.stringify(caseProcedures, null, 2) : "None available."}

[FORMATTING RULES]
1. First, you MUST write your fuzzy matching logic enclosed in <reasoning>...</reasoning> tags.
2. Immediately after the closing </reasoning> tag, write the concise, professional natural language report for the doctor.`;

        console.debug("Schedule Procedure Tool Prompt:", prompt);

        const result = await getLLM()
          .withConfig({ runName: "lab_technician" })
          .invoke(prompt);

        console.debug("Schedule Procedure Tool Raw Result:", result.text);

        return result.text;
      },
      {
        name: "schedule_procedure",
        description: "Schedule a medical procedure or lab test.",
        schema: z.object({ procedureName: z.string() }),
        returnDirect: true,
      }
    );
  },

  async handleMessage(userId: string, caseId: string, userMessage: string) {
    try {
      // 1. Fetch case details and history
      const currentCase = await casesRepo.findById(caseId);
      if (!currentCase) throw new Error("Case not found");

      const history = await messagesRepo.findByCaseAndUser(caseId, userId);

      // 2. Define Tools
      const tools = [
        this.getScheduleProcedureTool(currentCase.procedures || undefined),
        this.getDiagnosisTool(
          {
            name: currentCase.diagnosis_name,
            icd: currentCase.diagnosis_icd || undefined,
          },
          userId,
          caseId
        ),
      ];

      // 3. Construct System Prompt
      const systemPrompt = `You are playing the role of a patient in a medical training simulator. 
The user is a doctor who will interview you to figure out your diagnosis.

=== YOUR IDENTITY & HISTORY ===
Patient Profile: 
${JSON.stringify(currentCase.patient, null, 2)}

Chief Complaint: 
${currentCase.chief_complaint}

Your Anamnesis (Symptoms, History, Lifestyle): 
${JSON.stringify(currentCase.anamnesis, null, 2)}
=========================

[HOW TO ACT]
1. Speak in the first person ("I", "my") as the patient.
2. Use layman's terms and match your tone to your age/demographic.
3. Answer ONLY based on the Anamnesis data provided. If the doctor asks about a symptom not listed, say you don't have it.
4. Keep answers concise. Do not dump your whole history at once.

[SYSTEM INSTRUCTIONS]
- If the doctor says "I want to order a blood test" or asks for ANY medical procedure/lab, you MUST use the \`schedule_procedure\` tool.
- If the doctor says "My diagnosis is X" or "I think you have Y," you MUST use the \`make_diagnosis\` tool.
- IMPORTANT: When you receive the result from ANY tool, forward that EXACT result directly to the user word-for-word. Do not alter it, do not roleplay as the patient for that specific message, and do not call the tool again. Just output the tool's result.`;

      // 5. Construct message history for LangChain
      const promptMessages = [
        new SystemMessage(systemPrompt),
        ...history.map((m: any) =>
          m.role === "user"
            ? new HumanMessage(m.content)
            : new AIMessage(m.content)
        ),
        new HumanMessage(userMessage), // Ensure the latest message is appended as a distinct HumanMessage
      ];

      // 6. Execute Agent Loop with Streaming
      const llm = getLLM().withConfig({ runName: "patient_model" });

      const agent = createAgent({
        model: llm,
        tools,
      });

      const eventStream = agent.streamEvents(
        { messages: promptMessages },
        { version: "v2" }
      );

      let fullResponse = "";
      const streamFilter = new XMLReasoningFilter();
      for await (const event of eventStream) {
        // Ensure we are only grabbing chunks from our LLMs
        if (
          event.event === "on_chat_model_stream" &&
          ["patient_model", "lab_technician", "medical_evaluator"].includes(
            event.name
          )
        ) {
          const rawChunk = event.data.chunk.content;

          if (rawChunk && typeof rawChunk === "string") {
            // 2. Pass the raw chunk through the filter
            const cleanChunk = streamFilter.processChunk(rawChunk);

            // 3. Only stream to the user if the filter returned safe text
            if (cleanChunk !== "") {
              fullResponse += cleanChunk;
              sseService.sendToUser(caseId, userId, {
                type: "chunk",
                content: cleanChunk,
              });
            }
          }
        }
      }

      // 4. Flush any remaining safe text when the stream ends
      const finalChunk = streamFilter.flush();
      if (finalChunk !== "") {
        fullResponse += finalChunk;
        sseService.sendToUser(caseId, userId, {
          type: "chunk",
          content: finalChunk,
        });
      }

      sseService.sendToUser(caseId, userId, { type: "done" });

      // 7. Save assistant message to DB
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
      console.error("Agent Error:", error);
      sseService.sendToUser(caseId, userId, {
        type: "error",
        content: "The agent encountered an error processing your request.",
      });
    }
  },

  async resumeInterruptedMessages() {
    try {
      const latestMessages = await messagesRepo.findLatestMessagePerCase();

      const interrupted = latestMessages.filter((m) => m.role === "user");

      if (interrupted.length > 0) {
        console.log(
          `Resuming ${interrupted.length} interrupted AI responses...`
        );

        for (const msg of interrupted) {
          // Fire asynchronously
          this.handleMessage(msg.user_id, msg.case_id, msg.content).catch(
            (e) => {
              console.error(
                `Failed to resume message for case ${msg.case_id}:`,
                e
              );
            }
          );
        }
      }
    } catch (error) {
      console.error("Failed to check for interrupted messages:", error);
    }
  },
};
