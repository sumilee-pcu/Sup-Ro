import { describe, expect, it } from "vitest";
import { renderDocument, toPrintHtml } from "@/modules/documents/render";
import { selectRecommendedPlaces } from "@/modules/plans/actions";
import { createFixturePlan } from "@/modules/plans/fixture-plan";

describe("학교 양식 작성용 초안", () => {
  it("선택한 후보만 신청서 매핑 항목과 일정에 넣는다", () => {
    const plan = selectRecommendedPlaces(createFixturePlan(), [
      "place-eco-lab",
      "place-science-center",
    ]);
    const artifact = renderDocument(plan, "school-application-draft");

    expect(artifact.status).toBe("draft");
    expect(artifact.markdown).toContain("도시생태학습관(시연용)");
    expect(artifact.markdown).toContain("생활과학체험관(시연용)");
    expect(artifact.markdown).not.toContain("버드나무습지 관찰원");
    expect(artifact.markdown).toContain("원당중학교 2025 현장체험학습");
    expect(artifact.markdown).toContain("학생 성명, 학년·반·번호");
    expect(artifact.markdown).toContain("실제 체험 후 학생이 작성");
  });

  it("계획 승인 후에도 제출본으로 오인되지 않게 초안을 유지한다", () => {
    const plan = { ...createFixturePlan(), state: "Approved" as const };
    const artifact = renderDocument(plan, "school-application-draft");

    expect(artifact.status).toBe("draft");
    expect(artifact.markdown).toContain("작성용 초안");
    expect(artifact.markdown).toContain("개인정보·동의·서명을 자동 생성하지");
  });

  it("A4 인쇄 HTML에 표와 초안 워터마크를 만들고 HTML을 이스케이프한다", () => {
    const artifact = renderDocument(
      createFixturePlan(),
      "school-application-draft",
    );
    const html = toPrintHtml({
      ...artifact,
      markdown: `${artifact.markdown}\n\n<script>alert(1)</script>`,
    });

    expect(html).toContain("<table>");
    expect(html).toContain("검토용 초안");
    expect(html).toContain("@page{size:A4");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
