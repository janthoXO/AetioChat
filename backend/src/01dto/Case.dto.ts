import { type CaseUserViewDTO } from "shared/index.js";
import type { CaseUserView } from "../02models/Case.js";

export function caseToUserViewDTO(caseUserView: CaseUserView): CaseUserViewDTO {
  return {
    id: caseUserView.id,
    chiefComplaint: caseUserView.chiefComplaint,
    createdAt: caseUserView.createdAt,
    completed: caseUserView.completedAt,
    startedAt: caseUserView.startedAt,
  };
}
