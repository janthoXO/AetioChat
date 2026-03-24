import type { Patient } from "@/02models/Patient.js";
import { db } from "../database.js";
import type { ProcedureWithRelevance } from "@/02models/Procedure.js";
import type { Anamnesis } from "@/02models/Anamnesis.js";
import type { ChiefComplaint } from "@/02models/ChiefComplaint.js";

export const casesRepo = {
  async findAll() {
    return db.selectFrom("cases").selectAll().execute();
  },

  async findById(id: string) {
    return db
      .selectFrom("cases")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  },

  async create(caseData: {
    patient: Patient;
    chiefComplaint: ChiefComplaint;
    anamnesis: Anamnesis;
    procedures: ProcedureWithRelevance[];
    diagnosisName: string;
    diagnosisIcd: string | null;
  }) {
    return db
      .insertInto("cases")
      .values({
        patient: JSON.stringify(caseData.patient),
        chief_complaint: caseData.chiefComplaint,
        anamnesis: JSON.stringify(caseData.anamnesis),
        procedures: JSON.stringify(caseData.procedures),
        diagnosis_name: caseData.diagnosisName,
        diagnosis_icd: caseData.diagnosisIcd,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async createPartial(caseData: {
    diagnosisName: string;
    diagnosisIcd: string | null;
  }) {
    return db
      .insertInto("cases")
      .values({
        diagnosis_name: caseData.diagnosisName,
        diagnosis_icd: caseData.diagnosisIcd,
        created_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async updateGeneratingCase(
    id: string,
    caseData: {
      patient: Patient;
      chiefComplaint: ChiefComplaint;
      anamnesis: Anamnesis;
      procedures: ProcedureWithRelevance[];
    }
  ) {
    return db
      .updateTable("cases")
      .set({
        patient: JSON.stringify(caseData.patient),
        chief_complaint: caseData.chiefComplaint,
        anamnesis: JSON.stringify(caseData.anamnesis),
        procedures: JSON.stringify(caseData.procedures),
        created_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async getGeneratingCases() {
    return db
      .selectFrom("cases")
      .selectAll()
      .where("created_at", "is", null)
      .execute();
  },

  /** Get cases the user has already interacted with */
  async getUserCases(userId: string) {
    return db
      .selectFrom("cases")
      .innerJoin("user_cases", "user_cases.case_id", "cases.id")
      .selectAll("cases")
      .select(["user_cases.completed_at", "user_cases.started_at"])
      .where("user_cases.user_id", "=", userId)
      .orderBy("user_cases.started_at", "desc")
      .execute();
  },

  /** Get cases the user has NOT interacted with */
  async getNewCasesForUser(userId: string) {
    return db
      .selectFrom("cases")
      .selectAll()
      .where(
        "id",
        "not in",
        db
          .selectFrom("user_cases")
          .select("case_id")
          .where("user_id", "=", userId)
      )
      .orderBy("created_at", "desc")
      .execute();
  },

  /** Get all cases for a user with minimal DTO info */
  async getAllCasesMinimal(userId: string) {
    return db
      .selectFrom("cases")
      .leftJoin("user_cases", (join) =>
        join
          .onRef("user_cases.case_id", "=", "cases.id")
          .on("user_cases.user_id", "=", userId)
      )
      .select([
        "cases.id",
        "cases.chief_complaint",
        "cases.created_at",
        "user_cases.started_at",
        "user_cases.completed_at",
      ])
      .orderBy("cases.created_at", "desc")
      .execute();
  },

  async createUserCase(userId: string, caseId: string) {
    return db
      .insertInto("user_cases")
      .values({
        user_id: userId,
        case_id: caseId,
      })
      .onConflict((oc) => oc.columns(["user_id", "case_id"]).doNothing())
      .execute();
  },

  async markCompleted(userId: string, caseId: string) {
    return db
      .updateTable("user_cases")
      .set({ completed_at: new Date().toISOString() })
      .where("user_id", "=", userId)
      .where("case_id", "=", caseId)
      .execute();
  },

  /** Get all existing diagnosis ICD codes (for finding unused ones) */
  async getAllDiagnosisIcdCodes() {
    const rows = await db
      .selectFrom("cases")
      .select("diagnosis_icd")
      .where("diagnosis_icd", "is not", null)
      .execute();
    return rows.map((r) => r.diagnosis_icd).filter(Boolean) as string[];
  },
};
