import z from "zod";

export const ProcedureRelevanceSchema = z.enum([
  "obligatory",
  "optional",
  "contraindicated",
]);
export type ProcedureRelevance = z.infer<typeof ProcedureRelevanceSchema>;

export const ProcedureSchema = z.object({
  name: z.string().describe("Procedure name"),
  relevance: ProcedureRelevanceSchema.describe(
    "Relevance of the procedure to the diagnosis"
  ),
});

export type Procedure = z.infer<typeof ProcedureSchema>;
