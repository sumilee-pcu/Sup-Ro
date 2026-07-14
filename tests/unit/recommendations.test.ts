import { describe, expect, it } from "vitest";
import {
  editPlanConstraints,
  hasApprovalForCurrentVersion,
  selectRecommendedPlaces,
} from "@/modules/plans/actions";
import { createFixturePlan } from "@/modules/plans/fixture-plan";
import { rankPlaceRecommendations } from "@/modules/recommendations/engine";

describe("후보 추천과 선택", () => {
  it("같은 입력에서 근거가 있는 안정적 순위를 만든다", () => {
    const plan = createFixturePlan();
    const origin = plan.places[0];
    const repeated = rankPlaceRecommendations(
      plan.candidatePlaces,
      plan.constraints,
      origin,
    );

    expect(plan.recommendations).toEqual(repeated);
    expect(repeated).toHaveLength(5);
    expect(repeated.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(repeated.every((item) => item.evidenceIds.length > 0)).toBe(true);
    expect(
      repeated.find((item) => item.placeId === "place-water-center"),
    ).toMatchObject({ eligibility: "review" });
  });

  it("필수 접근성을 위반한 후보는 점수와 관계없이 차단한다", () => {
    const plan = createFixturePlan();
    const candidates = plan.candidatePlaces.map((place) =>
      place.id === "place-science-center"
        ? { ...place, accessibility: "verified-not-accessible" as const }
        : place,
    );
    const recommendations = rankPlaceRecommendations(
      candidates,
      plan.constraints,
      plan.places[0],
    );

    expect(
      recommendations.find((item) => item.placeId === "place-science-center"),
    ).toMatchObject({ eligibility: "blocked" });
  });

  it("선택한 후보만 새 일정과 입장료에 반영한다", () => {
    const plan = createFixturePlan();
    const next = selectRecommendedPlaces(plan, [
      "place-eco-lab",
      "place-science-center",
    ]);

    expect(next.version).toBe(plan.version + 1);
    expect(next.selectedPlaceIds).toEqual([
      "place-eco-lab",
      "place-science-center",
    ]);
    expect(next.places.map((place) => place.id)).toEqual([
      "place-school",
      "place-eco-lab",
      "place-science-center",
    ]);
    expect(
      next.itinerary.some((stop) => stop.placeId === "place-wetland"),
    ).toBe(false);
    expect(
      next.costs.find((item) => item.id === "cost-admission")?.amount,
    ).toBe(252_000);
    expect(hasApprovalForCurrentVersion(next)).toBe(false);
  });

  it("필수 장소 누락과 차단 후보 선택을 거부한다", () => {
    const plan = createFixturePlan();
    expect(() =>
      selectRecommendedPlaces(plan, ["place-science-center"]),
    ).toThrow("필수 장소");

    const blocked = {
      ...plan,
      recommendations: plan.recommendations.map((item) =>
        item.placeId === "place-science-center"
          ? { ...item, eligibility: "blocked" as const }
          : item,
      ),
    };
    expect(() =>
      selectRecommendedPlaces(blocked, [
        "place-eco-lab",
        "place-science-center",
      ]),
    ).toThrow("필수 제약");
  });

  it("학생 수 변경 시 후보 입장료를 다시 계산한다", () => {
    const plan = createFixturePlan();
    const next = editPlanConstraints(plan, { participantCount: 30 });

    expect(
      next.costs.find((item) => item.id === "cost-admission")?.amount,
    ).toBe(150_000);
  });
});
