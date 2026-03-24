import type { Response } from "express";
import { SseService } from "./sse.service.js";
import type { CaseUserViewDTO } from "shared/index.js";

class CaseSse extends SseService<CaseUserViewDTO> {
  private topic = "/cases";

  subscribeToGeneration(res: Response) {
    super.subscribe(this.topic, res);
  }

  publishCaseGeneration(generatedCase: CaseUserViewDTO) {
    super.publish(this.topic, "case_generation", generatedCase);
  }
}

export const caseSse = new CaseSse();
