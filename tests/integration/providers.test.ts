import { describe, expect, it } from "vitest";
import { fixtureProviders } from "@/modules/providers/fixtures";
import { createFixturePlan } from "@/modules/plans/fixture-plan";
import { runPlanning } from "@/modules/agent/orchestrator";
import {
  normalizeKakaoPlace,
  normalizeKakaoRoute,
} from "@/modules/providers/kakao";

describe("공급자 정규화와 오프라인 실행", () => {
  it("모든 fixture 공급자가 공통 메타데이터를 반환한다", async () => {
    const constraints = createFixturePlan().constraints;
    const places = await fixtureProviders.places.search(constraints);
    const curriculum = await fixtureProviders.curriculum.search(constraints);
    expect(places.mode).toBe("fixture");
    expect(places.retrievedAt).toMatch(/2026-07-13/);
    expect(curriculum.data[0].sourceText).not.toBe(
      curriculum.data[0].generatedInterpretation,
    );
  });

  it("네트워크와 API 키 없이 대표 계획을 완주한다", async () => {
    const plan = await runPlanning(
      { ...createFixturePlan(), state: "Intake", runs: [] },
      fixtureProviders,
      { now: () => new Date("2026-07-13T00:00:00Z") },
    );
    expect(plan.state).toBe("ReadyForApproval");
    expect(plan.runs[0].toolCalls).toHaveLength(6);
    expect(
      plan.runs[0].toolCalls.every((call) => call.dataMode === "fixture"),
    ).toBe(true);
  });

  it("기록된 Kakao Local 응답을 내부 장소로 정규화한다", () => {
    const place = normalizeKakaoPlace({
      id: "42",
      place_name: "생태관",
      category_group_name: "문화시설",
      road_address_name: "경기도 수원시",
      address_name: "",
      x: "127.01",
      y: "37.28",
    });
    expect(place).toMatchObject({
      id: "place-kakao-42",
      name: "생태관",
      accessibility: "unverified",
    });
    const to = { ...place, id: "place-kakao-43", name: "습지" };
    expect(
      normalizeKakaoRoute(
        { routes: [{ summary: { duration: 601, distance: 4200 } }] },
        place,
        to,
        "전세버스",
      ),
    ).toMatchObject({ durationMinutes: 11, distanceMeters: 4200 });
  });
});
