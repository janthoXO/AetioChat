import type { Procedure } from "@/02models/Procedure.js";
import { ProcedureDTOSchema as ProcedureDTOSchemaShared } from "shared/index.js";

export const ProcedureDTOSchema = ProcedureDTOSchemaShared;

export type ProcedureDTO = ReturnType<typeof ProcedureDTOSchema.parse>;

export function procedureToDTO(procedure: Procedure): ProcedureDTO {
  return procedure;
}
