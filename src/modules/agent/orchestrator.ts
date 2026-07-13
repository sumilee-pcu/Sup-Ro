import type {
  AgentRun,
  PlanApproval,
  PlanState,
  TripPlan,
} from "@/modules/plans/types";
import type { ProviderSet as ProviderContracts } from "@/modules/providers/contracts";
import {
  buildActivities,
  buildItinerary,
  calculateCosts,
  validatePlan,
  validateRequiredInputs,
} from "@/modules/itinerary/engine";

export interface Clock {
  now(): Date;
}

const systemClock: Clock = { now: () => new Date() };
const transitionTable: Record<PlanState, PlanState[]> = {
  Intake: ["Gather", "NeedsReview"],
  Gather: ["Solve", "NeedsReview"],
  Solve: ["Verify"],
  Verify: ["NeedsReview", "ReadyForApproval"],
  NeedsReview: ["Gather"],
  ReadyForApproval: ["Approved", "Gather"],
  Approved: ["Rendered", "Gather"],
  Rendered: ["Gather"],
};

export function transitionPlan(plan: TripPlan, next: PlanState): TripPlan {
  if (!transitionTable[plan.state].includes(next))
    throw new Error(`허용되지 않은 상태 전이: ${plan.state} → ${next}`);
  return { ...plan, state: next, updatedAt: new Date().toISOString() };
}

export async function runPlanning(
  plan: TripPlan,
  providers: ProviderContracts,
  clock: Clock = systemClock,
): Promise<TripPlan> {
  const startedAt = clock.now();
  let working = {
    ...plan,
    state: "Intake" as PlanState,
    findings: validateRequiredInputs(plan.constraints),
  };
  if (working.findings.some((item) => item.blocking))
    return {
      ...working,
      state: "NeedsReview",
      updatedAt: clock.now().toISOString(),
    };

  working = transitionPlan(working, "Gather");
  const toolCalls: AgentRun["toolCalls"] = [];
  try {
    const curriculum = await timed(
      "curriculum.search",
      "Gather",
      providers.curriculum.search(plan.constraints),
      clock,
      toolCalls,
    );
    const places = await timed(
      "places.search",
      "Gather",
      providers.places.search(plan.constraints),
      clock,
      toolCalls,
    );
    const routes = await timed(
      "routes.get",
      "Gather",
      providers.routes.getLegs(places.data, plan.constraints),
      clock,
      toolCalls,
    );
    const [weather, airQuality, facilities] = await Promise.all([
      timed(
        "weather.get",
        "Gather",
        providers.weather.getAdvisories(plan.constraints),
        clock,
        toolCalls,
      ),
      timed(
        "air-quality.get",
        "Gather",
        providers.airQuality.getAdvisories(plan.constraints),
        clock,
        toolCalls,
      ),
      timed(
        "safety-facilities.get",
        "Gather",
        providers.safetyFacilities.getFacilities(places.data),
        clock,
        toolCalls,
      ),
    ]);

    working = transitionPlan(
      {
        ...working,
        curriculum: curriculum.data,
        places: places.data,
        routeLegs: routes.data,
        safety: [...weather.data, ...airQuality.data, ...facilities.data],
      },
      "Solve",
    );
    const itinerary = buildItinerary(
      working.places,
      working.routeLegs,
      working.constraints,
    );
    const costs = calculateCosts(working.costs);
    working = transitionPlan(
      {
        ...working,
        itinerary,
        activities: buildActivities(working),
        confirmedCostTotal: costs.confirmed,
        projectedCostTotal: costs.projected,
      },
      "Verify",
    );
    working = { ...working, findings: validatePlan(working) };
    working = transitionPlan(
      working,
      working.findings.some((item) => item.blocking)
        ? "NeedsReview"
        : "ReadyForApproval",
    );
  } catch {
    working = {
      ...working,
      state: "NeedsReview",
      findings: [
        ...working.findings,
        {
          id: "finding-provider-failure",
          ruleId: "PROVIDER_FAILURE",
          severity: "error",
          message: "필수 데이터 수집에 실패했습니다.",
          evidenceIds: [],
          recommendedAction:
            "fixture 모드로 전환하거나 공급자 상태를 확인하세요.",
          blocking: true,
        },
      ],
    };
  }

  const finishedAt = clock.now();
  const run: AgentRun = {
    id: `run-${plan.id}-v${plan.version}-${startedAt.getTime()}`,
    planId: plan.id,
    planVersion: plan.version,
    state: working.state,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    toolCalls,
    findingCount: working.findings.length,
  };
  return {
    ...working,
    runs: [...working.runs, run],
    updatedAt: finishedAt.toISOString(),
  };
}

export function approvePlan(
  plan: TripPlan,
  acknowledgement: string,
  now = new Date(),
): TripPlan {
  if (plan.state !== "ReadyForApproval")
    throw new Error("필수 검증을 통과한 계획만 승인할 수 있습니다.");
  if (plan.findings.some((item) => item.blocking))
    throw new Error("차단 문제가 남아 있어 승인할 수 없습니다.");
  if (acknowledgement.trim().length < 5)
    throw new Error("공식 재확인 책임에 대한 승인 확인 문구가 필요합니다.");
  const approval: PlanApproval = {
    id: `approval-${plan.id}-v${plan.version}`,
    planId: plan.id,
    planVersion: plan.version,
    approvedAt: now.toISOString(),
    approverRole: "teacher",
    acknowledgement,
  };
  return {
    ...plan,
    state: "Approved",
    approvals: [...plan.approvals, approval],
    updatedAt: now.toISOString(),
  };
}

export function createEditedVersion(
  plan: TripPlan,
  patch: Partial<TripPlan["constraints"]>,
  now = new Date(),
): TripPlan {
  return {
    ...plan,
    version: plan.version + 1,
    state: "Intake",
    constraints: { ...plan.constraints, ...patch },
    approvals: plan.approvals,
    artifacts: [],
    findings: [],
    updatedAt: now.toISOString(),
  };
}

async function timed<T>(
  name: string,
  stage: PlanState,
  promise: Promise<T & { mode: TripPlan["dataMode"]; warnings: string[] }>,
  clock: Clock,
  records: AgentRun["toolCalls"],
): Promise<T & { mode: TripPlan["dataMode"]; warnings: string[] }> {
  const started = clock.now();
  try {
    const result = await promise;
    records.push({
      id: `tool-${records.length + 1}`,
      toolName: name,
      stage,
      startedAt: started.toISOString(),
      durationMs: Math.max(0, clock.now().getTime() - started.getTime()),
      success: true,
      dataMode: result.mode,
      summary:
        result.warnings.join(" ").slice(0, 240) || "정규화 결과 수집 완료",
    });
    return result;
  } catch (error) {
    records.push({
      id: `tool-${records.length + 1}`,
      toolName: name,
      stage,
      startedAt: started.toISOString(),
      durationMs: Math.max(0, clock.now().getTime() - started.getTime()),
      success: false,
      dataMode: "live",
      summary:
        error instanceof Error
          ? error.message.slice(0, 160)
          : "알 수 없는 공급자 오류",
    });
    throw error;
  }
}
