import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CandidateComparison } from "@/components/candidate-comparison";
import { createFixturePlan } from "@/modules/plans/fixture-plan";

describe("후보 비교 선택 화면", () => {
  it("근거가 있는 5개 후보와 선택 비교표를 렌더링한다", () => {
    const html = renderToStaticMarkup(
      <CandidateComparison
        plan={createFixturePlan()}
        onApply={() => undefined}
        onFocus={() => undefined}
      />,
    );

    expect(html).toContain("추천 후보 비교·선택");
    expect(html).toContain("선택 후보 핵심 비교");
    expect(html).toContain("추천점수");
    expect(html.match(/type="checkbox"/g)).toHaveLength(5);
    expect(html).toContain("필수 장소");
  });

  it("차단 후보는 선택 제어를 비활성화한다", () => {
    const plan = createFixturePlan();
    plan.recommendations = plan.recommendations.map((recommendation) =>
      recommendation.placeId === "place-science-center"
        ? { ...recommendation, eligibility: "blocked" }
        : recommendation,
    );
    const html = renderToStaticMarkup(
      <CandidateComparison
        plan={plan}
        onApply={() => undefined}
        onFocus={() => undefined}
      />,
    );

    expect(html).toContain("선택 불가");
    expect(html).toMatch(/disabled=""[^>]*\/?>제약 미충족/);
  });
});
