import { fetchApi } from "@/lib/api";
import type { DiagnosisDTO } from "shared/index";

export async function fetchDiagnoses() {
  return fetchApi<DiagnosisDTO[]>("/diagnoses");
}
