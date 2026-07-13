import { describe, expect, it } from "vitest";
import { PlanRepository } from "@/modules/plans/repository";
import { createFixturePlan } from "@/modules/plans/fixture-plan";
import { editPlanConstraints } from "@/modules/plans/actions";

describe("SQLite 불변 저장소", () => {
  it("계획 버전을 덮어쓰지 않고 순서대로 보존한다", () => {
    const repository = new PlanRepository(":memory:");
    const v1 = createFixturePlan();
    const v2 = editPlanConstraints(v1, { returnTime: "16:00" });
    repository.saveVersion(v1);
    repository.saveVersion(v2);
    expect(repository.listVersions(v1.id)).toEqual([1, 2]);
    expect(repository.getVersion(v1.id, 1)?.constraints.returnTime).toBe(
      "15:30",
    );
    expect(repository.getVersion(v1.id, 2)?.constraints.returnTime).toBe(
      "16:00",
    );
    expect(() => repository.saveVersion(v1)).toThrow();
    repository.close();
  });
});
