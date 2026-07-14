import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlanningWorkspace } from "@/components/planning-workspace";
import { createFixturePlan } from "@/modules/plans/fixture-plan";

describe("반응형 작업공간 렌더", () => {
  it("세 패널, 지도 대체 설명, 데이터 모드, 승인 제어를 렌더링한다", () => {
    const html = renderToStaticMarkup(
      <PlanningWorkspace initialPlan={createFixturePlan()} />,
    );
    expect(html).toContain("목표와 운영 제약");
    expect(html).toContain("장소와 이동 흐름");
    expect(html).toContain("확인 가능한 판단");
    expect(html).toContain("지도 대체 장소 목록");
    expect(html).toContain("FIXTURE v1");
    expect(html).toContain("교사 승인");
    expect(html).toContain("모바일 계획 단계");
    expect(html).toContain("접근성 근거 기록");
    expect(html).toContain("추천 후보 비교·선택");
    expect(html).toContain("학교 신청서 초안");
    expect(html).toContain("선택한 후보로 일정 다시 만들기");
    expect(html).toContain('for="');
  });
});
