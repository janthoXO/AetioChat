import { DiagnosisDTOSchema as DiagnosisDTOSchemaShared } from "shared/index.js";
import type z from "zod";

export const DiagnosisDTOSchema = DiagnosisDTOSchemaShared;

export type DiagnosisDTO = z.infer<typeof DiagnosisDTOSchema>;

export function diagnosisToDTO(diagnosis: DiagnosisDTO): DiagnosisDTO {
  return diagnosis;
}
