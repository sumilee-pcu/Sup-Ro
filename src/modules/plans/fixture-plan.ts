import fixture from "../../../fixtures/v1/representative-ecology.json";
import type {
  ConstraintSet,
  CostItem,
  CurriculumReference,
  PlaceCandidate,
  RouteLeg,
  SafetyEvidence,
  SourceEvidence,
  TripPlan,
} from "./types";
import {
  buildActivities,
  buildItinerary,
  calculateCosts,
  validatePlan,
} from "@/modules/itinerary/engine";

const fixedNow = "2026-07-13T09:00:00+09:00";

export function createFixturePlan(): TripPlan {
  const constraints = structuredClone(fixture.constraints) as ConstraintSet;
  const places = structuredClone(fixture.places) as PlaceCandidate[];
  const routeLegs = structuredClone(fixture.routeLegs) as RouteLeg[];
  const costs = structuredClone(fixture.costs) as CostItem[];
  const totals = calculateCosts(costs);
  let plan: TripPlan = {
    id: "plan-ecology-demo",
    version: 1,
    title: "중2 과학 생태계 현장탐구",
    state: "Verify",
    dataMode: "fixture",
    constraints,
    curriculum: structuredClone(fixture.curriculum) as CurriculumReference[],
    places,
    routeLegs,
    itinerary: buildItinerary(places, routeLegs, constraints),
    costs,
    safety: structuredClone(fixture.safety) as SafetyEvidence[],
    activities: [],
    evidence: structuredClone(fixture.evidence) as SourceEvidence[],
    findings: [],
    approvals: [],
    artifacts: [],
    runs: [
      {
        id: "run-fixture-demo-v1",
        planId: "plan-ecology-demo",
        planVersion: 1,
        state: "ReadyForApproval",
        startedAt: fixedNow,
        finishedAt: "2026-07-13T09:00:00.420+09:00",
        toolCalls: [
          "curriculum.search",
          "places.search",
          "routes.get",
          "weather.get",
          "air-quality.get",
          "safety-facilities.get",
        ].map((toolName, index) => ({
          id: `tool-fixture-${index + 1}`,
          toolName,
          stage: "Gather",
          startedAt: fixedNow,
          durationMs: 45 + index * 5,
          success: true,
          dataMode: "fixture",
          summary: "버전 고정 fixture에서 정규화 결과 수집",
        })),
        findingCount: 1,
      },
    ],
    selectedPlaceId: "place-eco-lab",
    confirmedCostTotal: totals.confirmed,
    projectedCostTotal: totals.projected,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };
  plan = { ...plan, activities: buildActivities(plan) };
  plan = { ...plan, findings: validatePlan(plan) };
  plan.state = plan.findings.some((item) => item.blocking)
    ? "NeedsReview"
    : "ReadyForApproval";
  return plan;
}
