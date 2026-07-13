import { mkdir, writeFile } from "node:fs/promises";
import benchmarks from "../fixtures/v1/benchmarks.json";
import { createFixturePlan } from "../src/modules/plans/fixture-plan";
import { recalculatePlan } from "../src/modules/plans/actions";
import { evaluatePlan } from "../src/modules/evaluation/metrics";
import type { TripPlan } from "../src/modules/plans/types";

type BenchmarkCase = (typeof benchmarks.cases)[number];

function mutate(base: TripPlan, test: BenchmarkCase): TripPlan {
  const plan = structuredClone(base);
  plan.id = `plan-${test.id}`;
  plan.constraints = {
    ...plan.constraints,
    schoolLevel: test.schoolLevel as TripPlan["constraints"]["schoolLevel"],
    grade: test.grade,
    origin: `${test.region} 시연학교`,
    transportMode: test.transport as TripPlan["constraints"]["transportMode"],
  };
  if (test.condition === "overtime") plan.constraints.returnTime = "11:00";
  if (test.condition === "closed")
    plan.places[1].openingHours = {
      open: "00:00",
      close: "00:00",
      verified: true,
    };
  if (test.condition === "budget") plan.constraints.budgetPerPerson = 1000;
  if (test.condition === "accessibility")
    plan.places[1].accessibility = "unverified";
  if (test.condition === "route-failure")
    plan.routeLegs[0].durationMinutes = undefined;
  if (test.condition === "missing-input") plan.constraints.learningGoal = "";
  if (test.condition === "provider-outage")
    plan.routeLegs[1].durationMinutes = undefined;
  return recalculatePlan(plan);
}

async function main() {
  const results = benchmarks.cases.map((test) => {
    const plan = mutate(createFixturePlan(), test);
    const ready = plan.state === "ReadyForApproval";
    return {
      ...test,
      actualReady: ready,
      passed: ready === test.expectedReady,
      blockingRules: plan.findings
        .filter((item) => item.blocking)
        .map((item) => item.ruleId),
      metrics: evaluatePlan(plan),
    };
  });
  const passCount = results.filter((result) => result.passed).length;
  const report = {
    schemaVersion: 1,
    benchmarkVersion: benchmarks.version,
    generatedAt: "2026-07-13T09:00:00+09:00",
    passCount,
    total: results.length,
    results,
  };
  const markdown = [
    `# 수업로 AI 평가 보고서 — ${benchmarks.version}`,
    "",
    `- 결과: **${passCount}/${results.length} PASS**`,
    "- 데이터: 합성 fixture 전용",
    "- 생성 기준시각: 2026-07-13 09:00 KST",
    "",
    "| ID | 지역/학교급 | 조건 | 기대 | 실제 | 결과 | 차단 규칙 |",
    "|---|---|---|---|---|---|---|",
    ...results.map(
      (result) =>
        `| ${result.id} | ${result.region}/${result.schoolLevel} | ${result.condition} | ${result.expectedReady ? "Ready" : "Review"} | ${result.actualReady ? "Ready" : "Review"} | ${result.passed ? "PASS" : "FAIL"} | ${result.blockingRules.join(", ") || "-"} |`,
    ),
    "",
    "> 이 평가는 실제 장소·경로·기상 품질을 보증하지 않으며 결정적 규칙과 실패 표시를 검증합니다.",
  ].join("\n");

  await mkdir("reports/generated", { recursive: true });
  await writeFile(
    `reports/generated/evaluation-${benchmarks.version}.json`,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    `reports/generated/evaluation-${benchmarks.version}.md`,
    `${markdown}\n`,
    "utf8",
  );
  if (passCount !== results.length)
    throw new Error(`BENCHMARK_FAIL ${passCount}/${results.length}`);
  console.log(`SUEOPRO_EVALUATION_PASS ${passCount}/${results.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
