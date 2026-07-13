import fixture from "../../../fixtures/v1/representative-ecology.json";
import type { ProviderSet } from "./contracts";
import type {
  CurriculumReference,
  PlaceCandidate,
  ProviderResult,
  RouteLeg,
  SafetyEvidence,
} from "@/modules/plans/types";

const retrievedAt = "2026-07-13T09:00:00+09:00";

function result<T>(
  data: T,
  provider: string,
  warnings: string[] = [],
): ProviderResult<T> {
  return {
    data,
    source: { provider, url: "fixture://sup-ro/v1/representative-ecology" },
    retrievedAt,
    staleAt: "2026-08-13T09:00:00+09:00",
    mode: "fixture",
    warnings: [
      "시연용 고정 데이터이며 실제 운영 전 공식 출처 확인이 필요합니다.",
      ...warnings,
    ],
  };
}

export const fixtureProviders: ProviderSet = {
  places: {
    async search() {
      return result(
        structuredClone(fixture.places) as PlaceCandidate[],
        "Sup-Ro Fixture Place Provider",
      );
    },
  },
  routes: {
    async getLegs() {
      return result(
        structuredClone(fixture.routeLegs) as RouteLeg[],
        "Sup-Ro Fixture Route Provider",
      );
    },
  },
  curriculum: {
    async search() {
      return result(
        structuredClone(fixture.curriculum) as CurriculumReference[],
        "NCIC-linked Synthetic Curriculum Fixture",
      );
    },
  },
  weather: {
    async getAdvisories() {
      return result(
        structuredClone(
          fixture.safety.filter((item) => item.category === "weather"),
        ) as SafetyEvidence[],
        "Sup-Ro Fixture Weather Provider",
      );
    },
  },
  airQuality: {
    async getAdvisories() {
      return result(
        structuredClone(
          fixture.safety.filter((item) => item.category === "air-quality"),
        ) as SafetyEvidence[],
        "Sup-Ro Fixture Air Provider",
      );
    },
  },
  safetyFacilities: {
    async getFacilities() {
      return result(
        structuredClone(
          fixture.safety.filter((item) =>
            ["facility", "accessibility", "transport"].includes(item.category),
          ),
        ) as SafetyEvidence[],
        "Sup-Ro Fixture Safety Provider",
      );
    },
  },
};
