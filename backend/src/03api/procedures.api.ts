import { ProcedureSchema, type Procedure } from "@/02models/Procedure.js";
import { config } from "@/config.js";

export async function fetchProcedures(): Promise<Procedure[]> {
  const res = await fetch(`${config.GENERATOR_URL}/procedures`);
  if (!res.ok) throw new Error("Failed to fetch procedures");
  return ProcedureSchema.array().parse(await res.json());
}
