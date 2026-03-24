import type { Anamnesis } from "@/02models/Anamnesis.js";
import type { ChiefComplaint } from "@/02models/ChiefComplaint.js";
import type { Patient } from "@/02models/Patient.js";
import type { ProcedureWithRelevance } from "@/02models/Procedure.js";
import type { Generated, JSONColumnType } from "kysely";

export interface Database {
  users: UsersTable;
  cases: CasesTable;
  user_cases: UserCasesTable;
  messages: MessagesTable;
}

export interface UsersTable {
  id: Generated<string>;
  username: string;
  password_hash: string;
  role: Generated<"user" | "admin">;
  created_at: Generated<string>;
}

export interface CasesTable {
  id: Generated<string>;
  patient?: JSONColumnType<Patient> | null; // JSON string
  chief_complaint?: ChiefComplaint | null;
  anamnesis?: JSONColumnType<Anamnesis> | null; // JSON string
  procedures?: JSONColumnType<ProcedureWithRelevance[]> | null; // JSON string
  diagnosis_name: string;
  diagnosis_icd: string | null;
  created_at: Generated<string | null>;
}

export interface UserCasesTable {
  user_id: string;
  case_id: string;
  completed_at?: Generated<string>;
  started_at: Generated<string>;
}

export interface MessagesTable {
  id: Generated<string>;
  user_id: string;
  case_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: Generated<string>;
}
