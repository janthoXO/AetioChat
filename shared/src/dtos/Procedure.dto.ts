import z from "zod";

export const ProcedureDTOSchema = z.object({
  name: z.string().describe("Procedure name"),
});

export type ProcedureDTO = z.infer<typeof ProcedureDTOSchema>;
