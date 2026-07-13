import curriculumFixture from "../../../fixtures/v1/curriculum.json";
import type { ConstraintSet, CurriculumReference } from "@/modules/plans/types";

export interface CurriculumDataset {
  version: string;
  publishedAt: string;
  sourceUrl: string;
  records: CurriculumReference[];
}

export function importCurriculumDataset(value: unknown): CurriculumDataset {
  const data = value as Partial<CurriculumDataset>;
  if (!data.version || !data.sourceUrl || !Array.isArray(data.records))
    throw new Error("교육과정 데이터셋 형식이 올바르지 않습니다.");
  for (const record of data.records) {
    if (
      !record.id ||
      !record.standardId ||
      !record.sourceText ||
      !record.generatedInterpretation
    ) {
      throw new Error("교육과정 원문과 생성 해석은 분리된 필수 필드입니다.");
    }
  }
  return data as CurriculumDataset;
}

export function getCurrentCurriculumDataset(): CurriculumDataset {
  return importCurriculumDataset(curriculumFixture);
}

export function searchCurriculum(
  constraints: ConstraintSet,
  dataset = getCurrentCurriculumDataset(),
): CurriculumReference[] {
  const keywords = `${constraints.learningGoal} ${constraints.subject}`
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return dataset.records.filter((record) => {
    if (
      record.schoolLevel !== constraints.schoolLevel ||
      record.grade !== constraints.grade ||
      record.subject !== constraints.subject
    )
      return false;
    const haystack =
      `${record.sourceText} ${record.generatedInterpretation} ${record.standardId}`.toLowerCase();
    return (
      keywords.some((word) => haystack.includes(word)) || keywords.length === 0
    );
  });
}

export function assertFormalAlignment(
  reference: CurriculumReference | undefined,
): void {
  if (!reference || reference.status !== "confirmed" || !reference.sourceUrl) {
    throw new Error(
      "공식 교육과정 연계 주장에는 확인된 원문 출처가 필요합니다.",
    );
  }
}
