import { fetchApi } from "@/lib/api";
import type { Procedure } from "shared/index";

export async function fetchProcedures() {
  return fetchApi<Procedure[]>("/procedures");
}
