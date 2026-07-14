import { createFixturePlan } from "../src/modules/plans/fixture-plan";
import { assertPrivacySafeSchema } from "../src/modules/plans/privacy";
import { renderDocument } from "../src/modules/documents/render";

const plan = createFixturePlan();
assertPrivacySafeSchema(plan);
if (plan.state !== "ReadyForApproval")
  throw new Error(`대표 계획이 승인 준비 상태가 아닙니다: ${plan.state}`);
if (plan.findings.some((finding) => finding.blocking))
  throw new Error("대표 계획에 차단 검증 항목이 남았습니다.");
if (plan.itinerary.length < 4)
  throw new Error("대표 일정에 출발·방문·귀교 구간이 충분하지 않습니다.");
for (const type of [
  "teacher-plan",
  "student-worksheet",
  "parent-notice",
  "school-application-draft",
] as const) {
  const artifact = renderDocument(
    plan,
    type,
    new Date("2026-07-13T09:00:00+09:00"),
  );
  if (artifact.status !== "draft" || artifact.markdown.length < 200)
    throw new Error(`${type} 초안 생성에 실패했습니다.`);
}
console.log(
  `SUPRO_FIXTURE_SMOKE_PASS plan=${plan.id} state=${plan.state} stops=${plan.itinerary.length} findings=${plan.findings.length}`,
);
