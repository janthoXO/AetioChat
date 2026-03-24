import { fetchApi } from "@/lib/api";
import type { ProcedureDTO } from "shared/index";

export async function fetchProcedures() {
  return fetchApi<ProcedureDTO[]>("/procedures");
}
