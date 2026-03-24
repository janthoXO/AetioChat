import type { CasesTable, UserCasesTable } from "../03db/schema.js";
import type { Insertable, Selectable } from "kysely";
import { z } from "zod";

export const CaseDomainSchema = z.object({
  id: z.uuid().optional(),
  patient: z.any().optional(),
  diagnosis: z.any(),
  chiefComplaint: z.any().optional(),
  anamnesis: z.any().optional(),
  procedures: z.any().optional(),
  createdAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().optional(),
  startedAt: z.iso.datetime().optional(),
});

export type CaseDomain = z.infer<typeof CaseDomainSchema>;

/**
 * Domain -> Entity
 */
export function caseToEntity(domain: CaseDomain): Insertable<CasesTable> {
  return {
    id: domain.id,
    patient: domain.patient ?? null,
    chief_complaint: domain.chiefComplaint ?? null,
    anamnesis: domain.anamnesis ?? null,
    procedures: domain.procedures ?? null,
    diagnosis_name: domain.diagnosis.name,
    diagnosis_icd: domain.diagnosis.icd ?? null,
    created_at: domain.createdAt ?? null,
  };
}

/**
 * Entity -> Domain
 */
export function caseFromEntity(entity: Selectable<CasesTable>): CaseDomain {
  return {
    id: entity.id,
    patient: entity.patient ?? undefined,
    chiefComplaint: entity.chief_complaint ?? undefined,
    anamnesis: entity.anamnesis ?? undefined,
    procedures: entity.procedures ?? undefined,
    diagnosis: {
      name: entity.diagnosis_name,
      icd: entity.diagnosis_icd ?? undefined,
    },
    createdAt: entity.created_at ?? undefined,
    completedAt: undefined,
    startedAt: undefined,
  };
}

export const CaseUserViewSchema = CaseDomainSchema.pick({
  id: true,
  chiefComplaint: true,
  createdAt: true,
  completedAt: true,
  startedAt: true,
});

export type CaseUserView = z.infer<typeof CaseUserViewSchema>;

export function caseUserViewFromEntity(
  caseEntity: Selectable<CasesTable>,
  userCaseEntity: Selectable<UserCasesTable>
): CaseUserView {
  return {
    id: caseEntity.id,
    chiefComplaint: caseEntity.chief_complaint ?? undefined,
    createdAt: caseEntity.created_at ?? undefined,
    completedAt: userCaseEntity.completed_at ?? undefined,
    startedAt: userCaseEntity.started_at ?? undefined,
  };
}
