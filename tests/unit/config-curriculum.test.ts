import { describe, expect, it } from "vitest";
import {
  assertNoSecretsInValue,
  getPublicConfig,
  getServerConfig,
} from "@/config/env";
import {
  getCurrentCurriculumDataset,
  importCurriculumDataset,
  searchCurriculum,
} from "@/modules/curriculum";
import { createFixturePlan } from "@/modules/plans/fixture-plan";

describe("환경 비밀과 교육과정 버전", () => {
  it("서버 키가 공개 설정이나 응답에 도달하면 거부한다", () => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "test",
      SUPRO_DATA_MODE: "fixture",
      KAKAO_REST_API_KEY: "test-key",
      NEXT_PUBLIC_KAKAO_MAP_APP_KEY: "public-app-key",
    };
    expect(getPublicConfig(env)).toEqual({ kakaoMapAppKey: "public-app-key" });
    expect(getServerConfig(env).secrets.KAKAO_REST_API_KEY).toBe("test-key");
    expect(() => assertNoSecretsInValue({ key: "test-key" }, env)).toThrow(
      "노출",
    );
  });

  it("새 교육과정 데이터셋을 가져와도 기존 계획의 참조 버전은 유지된다", () => {
    const existing = createFixturePlan();
    const current = getCurrentCurriculumDataset();
    const next = importCurriculumDataset({
      ...current,
      version: "2022-revised-demo-v2",
      records: current.records.map((record) => ({
        ...record,
        datasetVersion: "2022-revised-demo-v2",
      })),
    });
    expect(searchCurriculum(existing.constraints, next)[0].datasetVersion).toBe(
      "2022-revised-demo-v2",
    );
    expect(existing.curriculum[0].datasetVersion).toBe("2022-revised-demo-v1");
  });
});
