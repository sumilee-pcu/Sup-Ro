import type { ModelProvider } from "@/modules/providers/contracts";
import {
  assertSafeModelProposal,
  sanitizeUntrustedText,
} from "./tool-registry";

export interface StructuredModelResponse {
  summary: string;
  caveats: string[];
  evidenceIds: string[];
}

export class FixtureModelProvider implements ModelProvider {
  async explain(input: {
    learningGoal: string;
    placeNames: string[];
  }): Promise<{ summary: string; caveats: string[] }> {
    return {
      summary: `${sanitizeUntrustedText(input.learningGoal)}을 위해 ${input.placeNames.map(sanitizeUntrustedText).join(", ")}의 관찰 활동을 순서대로 연결했습니다.`,
      caveats: [
        "장소 운영·교통·비용은 교사가 공식 채널에서 다시 확인해야 합니다.",
      ],
    };
  }
}

export class StructuredModelAdapter implements ModelProvider {
  constructor(
    private readonly generate: (input: {
      learningGoal: string;
      placeNames: string[];
    }) => Promise<unknown>,
  ) {}

  async explain(input: {
    learningGoal: string;
    placeNames: string[];
  }): Promise<{ summary: string; caveats: string[] }> {
    const safeInput = {
      learningGoal: sanitizeUntrustedText(input.learningGoal),
      placeNames: input.placeNames.map(sanitizeUntrustedText),
    };
    const value = await this.generate(safeInput);
    assertSafeModelProposal(value);
    if (
      !value ||
      typeof value !== "object" ||
      !("summary" in value) ||
      typeof value.summary !== "string" ||
      !("caveats" in value) ||
      !Array.isArray(value.caveats) ||
      !value.caveats.every((item) => typeof item === "string")
    ) {
      throw new Error("모델 결과가 구조화 응답 계약과 일치하지 않습니다.");
    }
    return {
      summary: sanitizeUntrustedText(value.summary),
      caveats: value.caveats.map(sanitizeUntrustedText),
    };
  }
}

export function validateEvidenceReferences(
  response: StructuredModelResponse,
  availableEvidenceIds: string[],
): void {
  const available = new Set(availableEvidenceIds);
  const missing = response.evidenceIds.filter((id) => !available.has(id));
  if (missing.length > 0)
    throw new Error(`모델 설명의 근거 참조가 없습니다: ${missing.join(", ")}`);
}
