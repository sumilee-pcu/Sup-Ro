import type { EvaluationMetrics, TripPlan } from "@/modules/plans/types";
import {
  sourceCoverage,
  validateRequiredInputs,
} from "@/modules/itinerary/engine";

export function evaluatePlan(plan: TripPlan): EvaluationMetrics {
  const referencedIds = [
    ...plan.places.map((item) => item.sourceEvidenceId),
    ...plan.routeLegs.map((item) => item.sourceEvidenceId),
    ...plan.safety.map((item) => item.sourceEvidenceId),
  ];
  const toolCalls = plan.runs.flatMap((run) => run.toolCalls);
  const passedHard = plan.findings.filter((item) => item.blocking).length === 0;
  return {
    completeness: validateRequiredInputs(plan.constraints).length === 0 ? 1 : 0,
    hardConstraintPassRate: passedHard ? 1 : 0,
    sourceCoverage: sourceCoverage(plan.evidence, referencedIds),
    unresolvedFactCount:
      plan.evidence.filter((item) => item.status === "unverified").length +
      plan.findings.filter(
        (item) =>
          item.ruleId.includes("UNVERIFIED") ||
          item.ruleId === "UNRESOLVED_ROUTE",
      ).length,
    toolSuccessRate:
      toolCalls.length === 0
        ? 1
        : toolCalls.filter((item) => item.success).length / toolCalls.length,
    latencyMs: plan.runs.reduce(
      (sum, run) =>
        sum +
        (new Date(run.finishedAt).getTime() -
          new Date(run.startedAt).getTime()),
      0,
    ),
    humanEditCount: Math.max(0, plan.version - 1),
  };
}
