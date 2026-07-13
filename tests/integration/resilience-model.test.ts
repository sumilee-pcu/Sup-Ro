import { describe, expect, it } from "vitest";
import {
  StructuredModelAdapter,
  validateEvidenceReferences,
} from "@/modules/agent/model-provider";
import {
  withCompatibleFallback,
  withRetries,
} from "@/modules/providers/resilience";

describe("부분 실패와 모델 근거 경계", () => {
  it("라이브 실패 시에만 명시된 fixture로 전환하고 실패를 숨기지 않는다", async () => {
    const result = await withCompatibleFallback(
      async () => {
        throw new Error("HTTP 503 token=dummy");
      },
      {
        fixture: async () => ({
          data: ["fixture"],
          source: { provider: "fixture" },
          retrievedAt: "2026-07-13T00:00:00Z",
          mode: "fixture",
          warnings: [],
        }),
      },
    );
    expect(result.mode).toBe("fixture");
    expect(result.warnings.join(" ")).toContain("라이브 공급자 실패");
    expect(result.warnings.join(" ")).not.toContain("token=dummy");
  });

  it("구조화되지 않은 모델 출력과 존재하지 않는 근거를 거부한다", async () => {
    const invalid = new StructuredModelAdapter(async () => ({
      text: "자유형",
    }));
    await expect(
      invalid.explain({ learningGoal: "생태계", placeNames: ["습지"] }),
    ).rejects.toThrow("구조화 응답");
    expect(() =>
      validateEvidenceReferences(
        { summary: "설명", caveats: [], evidenceIds: ["missing"] },
        ["known"],
      ),
    ).toThrow("근거 참조");
  });

  it("재시도 가능한 일시 오류만 제한된 횟수로 재시도한다", async () => {
    let attempts = 0;
    const value = await withRetries(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("HTTP 503");
        return "ok";
      },
      { attempts: 3, shouldRetry: (error) => String(error).includes("503") },
    );
    expect(value).toBe("ok");
    expect(attempts).toBe(3);
  });
});
