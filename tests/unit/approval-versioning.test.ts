import { describe, expect, it } from "vitest";
import { approvePlan } from "@/modules/agent/orchestrator";
import {
  editPlanConstraints,
  hasApprovalForCurrentVersion,
} from "@/modules/plans/actions";
import { createFixturePlan } from "@/modules/plans/fixture-plan";

describe("승인과 불변 버전", () => {
  it("승인 후 편집하면 승인 스냅샷을 보존하고 새 버전은 미승인이다", () => {
    const approved = approvePlan(
      createFixturePlan(),
      "교사가 공식 확인 책임을 검토했습니다.",
      new Date("2026-07-13T00:10:00Z"),
    );
    expect(hasApprovalForCurrentVersion(approved)).toBe(true);
    const edited = editPlanConstraints(
      approved,
      { returnTime: "16:00" },
      new Date("2026-07-13T00:11:00Z"),
    );
    expect(edited.version).toBe(2);
    expect(edited.approvals).toHaveLength(1);
    expect(edited.approvals[0].planVersion).toBe(1);
    expect(hasApprovalForCurrentVersion(edited)).toBe(false);
    expect(edited.state).toBe("ReadyForApproval");
  });

  it("검토 필요 상태는 승인할 수 없다", () => {
    const blocked = editPlanConstraints(createFixturePlan(), {
      budgetPerPerson: 1,
    });
    expect(() => approvePlan(blocked, "교사가 검토했습니다.")).toThrow(
      "검증을 통과한 계획",
    );
  });
});
