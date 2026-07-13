import { describe, expect, it } from "vitest";
import { createFixturePlan } from "@/modules/plans/fixture-plan";
import {
  editPlanConstraints,
  recordAccessibilityEvidence,
  reorderPlace,
  updatePlace,
} from "@/modules/plans/actions";

describe("결정적 일정·제약 엔진", () => {
  it("대표 생태 계획을 승인 준비 상태로 만든다", () => {
    const plan = createFixturePlan();
    expect(plan.state).toBe("ReadyForApproval");
    expect(plan.itinerary).toHaveLength(4);
    expect(plan.findings.some((item) => item.blocking)).toBe(false);
  });

  it("예산 초과를 기계 판독 가능한 차단 항목으로 만든다", () => {
    const plan = editPlanConstraints(createFixturePlan(), {
      budgetPerPerson: 1000,
    });
    expect(plan.state).toBe("NeedsReview");
    expect(plan.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "BUDGET_LIMIT", blocking: true }),
      ]),
    );
  });

  it("휴관과 접근성 미확인을 각각 차단한다", () => {
    let plan = updatePlace(createFixturePlan(), "place-eco-lab", {
      openingHours: { open: "00:00", close: "00:00", verified: true },
    });
    expect(
      plan.findings.some((item) => item.ruleId === "OPERATING_HOURS"),
    ).toBe(true);
    plan = updatePlace(createFixturePlan(), "place-wetland", {
      accessibility: "unverified",
    });
    expect(
      plan.findings.some((item) => item.ruleId === "ACCESSIBILITY_EVIDENCE"),
    ).toBe(true);
  });

  it("장소 순서를 바꾸면 영향을 받는 이동 구간과 일정을 다시 만든다", () => {
    const before = createFixturePlan();
    const after = reorderPlace(before, "place-wetland", -1);
    expect(after.version).toBe(2);
    expect(after.routeLegs[0]).toMatchObject({
      fromPlaceId: "place-school",
      toPlaceId: "place-wetland",
    });
    expect(after.itinerary[1].placeId).toBe("place-wetland");
  });

  it("교사가 기록한 접근성 근거를 새 불변 버전에 보존한다", () => {
    const plan = recordAccessibilityEvidence(
      createFixturePlan(),
      "place-wetland",
      "verified-accessible",
      "전화 문의로 무단차 출입구와 엘리베이터 확인",
      new Date("2026-07-13T01:00:00Z"),
    );
    expect(plan.version).toBe(2);
    expect(plan.evidence.at(-1)).toMatchObject({
      provider: "교사 수동 확인 기록",
      status: "confirmed",
    });
  });
});
