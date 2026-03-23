import z from "zod";
import { ProcedureSchema as BaseProcedureSchema } from "shared/index.js";

export const ProcedureRelevanceSchema = z.enum([
  "obligatory",
  "optional",
  "contraindicated",
]);
export type ProcedureRelevance = z.infer<typeof ProcedureRelevanceSchema>;

export const ProcedureWithRelevanceSchema = BaseProcedureSchema.extend({
  relevance: ProcedureRelevanceSchema.describe(
    "Relevance of the procedure to the diagnosis"
  ),
  result: z.string().describe("Result of the procedure, if applicable").optional(),
});

export type ProcedureWithRelevance = z.infer<typeof ProcedureWithRelevanceSchema>;
