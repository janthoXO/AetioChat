import { fetchApi } from "@/lib/api";
import type { CaseUserViewDTO } from "shared/index.js";

export async function fetchCases() {
  return fetchApi<CaseUserViewDTO[]>("/cases");
}

export async function generateCase() {
  return fetchApi<CaseUserViewDTO>("/cases/generate", { method: "POST" });
}
