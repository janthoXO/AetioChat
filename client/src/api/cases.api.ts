import { fetchApi } from "@/lib/api";
import type { CaseDTO } from "../../../shared/src/index.js";

export async function fetchCases() {
  return fetchApi<CaseDTO[]>("/cases");
}

export async function generateCase() {
  return fetchApi<CaseDTO>("/cases/generate", { method: "POST" });
}
