import { fetchApi } from "@/lib/api";
import type { Diagnosis } from "shared/index";

export async function fetchDiagnoses() {
  return fetchApi<Diagnosis[]>("/diagnoses");
}
