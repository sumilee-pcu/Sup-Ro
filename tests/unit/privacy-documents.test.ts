import { describe, expect, it } from "vitest";
import { createFixturePlan } from "@/modules/plans/fixture-plan";
import {
  assertPrivacySafeSchema,
  findSensitiveText,
  redactSensitiveText,
} from "@/modules/plans/privacy";
import { renderDocument, toPrintHtml } from "@/modules/documents/render";
import { approvePlan } from "@/modules/agent/orchestrator";

describe("개인정보와 문서", () => {
  it("민감한 자유입력을 찾아 삭제한다", () => {
    const text = "학생 이름: 김수업, 보호자 010-1234-5678, test@example.com";
    expect(findSensitiveText(text).length).toBeGreaterThanOrEqual(3);
    expect(redactSensitiveText(text)).not.toContain("010-1234-5678");
    expect(() => assertPrivacySafeSchema(createFixturePlan())).not.toThrow();
  });

  it("승인 전은 초안, 승인 후는 최종 문서이며 안전 보장을 하지 않는다", () => {
    const draft = renderDocument(
      createFixturePlan(),
      "teacher-plan",
      new Date("2026-07-13T00:00:00Z"),
    );
    expect(draft.status).toBe("draft");
    expect(draft.markdown).toContain("예약·결제·안전을 보장하지 않습니다");
    const approved = approvePlan(
      createFixturePlan(),
      "교사가 공식 확인 책임을 검토했습니다.",
    );
    const final = renderDocument(approved, "parent-notice");
    expect(final.status).toBe("final");
    expect(toPrintHtml(final)).toContain("@page");
  });
});
