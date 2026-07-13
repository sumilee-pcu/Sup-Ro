import type {
  ConstraintSet,
  PlaceCandidate,
  ProviderResult,
  RouteLeg,
} from "@/modules/plans/types";
import type {
  MapDisplayProvider,
  PlaceSearchProvider,
  RouteProvider,
} from "./contracts";

type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  category_group_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
};

export type KakaoRouteResponse = {
  routes?: Array<{ summary?: { duration?: number; distance?: number } }>;
};

export class KakaoMapDisplayProvider implements MapDisplayProvider {
  readonly name = "Kakao Maps";
  constructor(private readonly publicAppKey?: string) {}
  getPublicConfiguration() {
    return {
      provider: this.name,
      appKeyConfigured: Boolean(this.publicAppKey),
    };
  }
}

export class KakaoLocalProvider implements PlaceSearchProvider {
  constructor(
    private readonly restApiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async search(
    constraints: ConstraintSet,
  ): Promise<ProviderResult<PlaceCandidate[]>> {
    const query = encodeURIComponent(
      `${constraints.origin} ${constraints.subject} 체험학습`,
    );
    const response = await this.fetcher(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&size=10`,
      {
        headers: { Authorization: `KakaoAK ${this.restApiKey}` },
      },
    );
    if (!response.ok)
      throw new Error(`Kakao Local 응답 실패: HTTP ${response.status}`);
    const payload = (await response.json()) as {
      documents: KakaoPlaceDocument[];
    };
    return {
      data: payload.documents.map((item) => normalizeKakaoPlace(item)),
      source: {
        provider: "Kakao Local",
        url: "https://developers.kakao.com/docs/latest/ko/local/dev-guide",
      },
      retrievedAt: new Date().toISOString(),
      mode: "live",
      warnings: ["운영시간·비용·접근성은 별도 공식 출처 확인이 필요합니다."],
    };
  }
}

export function normalizeKakaoPlace(item: KakaoPlaceDocument): PlaceCandidate {
  return {
    id: `place-kakao-${item.id}`,
    providerId: item.id,
    name: item.place_name,
    category: item.category_group_name || "장소",
    address: item.road_address_name || item.address_name,
    mapUrl: `https://map.kakao.com/link/map/${encodeURIComponent(item.place_name)},${item.y},${item.x}`,
    latitude: Number(item.y),
    longitude: Number(item.x),
    openingHours: { open: "00:00", close: "00:00", verified: false },
    visitMinutes: 60,
    costPerStudent: 0,
    accessibility: "unverified",
    isIndoor: false,
    curriculumAlignment: "생성 전",
    sourceEvidenceId: `evidence-kakao-${item.id}`,
  };
}

export class KakaoMobilityRouteProvider implements RouteProvider {
  constructor(
    private readonly restApiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}
  async getLegs(
    places: PlaceCandidate[],
    constraints: ConstraintSet,
  ): Promise<ProviderResult<RouteLeg[]>> {
    if (constraints.transportMode !== "전세버스") {
      throw new Error(
        "현재 Kakao Mobility 어댑터는 자동차 기반 전세버스 추정만 지원합니다. 대중교통·도보는 전용 경로 공급자가 필요합니다.",
      );
    }
    if (places.length < 2)
      return {
        data: [],
        source: { provider: "Kakao Mobility" },
        retrievedAt: new Date().toISOString(),
        mode: "live",
        warnings: [],
      };
    const legs: RouteLeg[] = [];
    for (let index = 0; index < places.length - 1; index += 1) {
      const from = places[index];
      const to = places[index + 1];
      const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${from.longitude},${from.latitude}&destination=${to.longitude},${to.latitude}`;
      const response = await this.fetcher(url, {
        headers: { Authorization: `KakaoAK ${this.restApiKey}` },
      });
      if (!response.ok)
        throw new Error(
          `Kakao Mobility 경로 응답 실패: HTTP ${response.status}`,
        );
      legs.push(
        normalizeKakaoRoute(
          (await response.json()) as KakaoRouteResponse,
          from,
          to,
          constraints.transportMode,
          index,
        ),
      );
    }
    return {
      data: legs,
      source: {
        provider: "Kakao Mobility",
        url: "https://developers.kakaomobility.com/docs/navi-api/directions/",
      },
      retrievedAt: new Date().toISOString(),
      mode: "live",
      warnings:
        constraints.transportMode === "전세버스"
          ? ["승하차·대형차 운행 가능 여부는 운송업체 확인이 필요합니다."]
          : [],
    };
  }
}

export function normalizeKakaoRoute(
  payload: KakaoRouteResponse,
  from: PlaceCandidate,
  to: PlaceCandidate,
  mode: ConstraintSet["transportMode"],
  index = 0,
): RouteLeg {
  const summary = payload.routes?.[0]?.summary;
  return {
    id: `route-${from.id}-${to.id}`,
    fromPlaceId: from.id,
    toPlaceId: to.id,
    mode,
    durationMinutes: summary?.duration
      ? Math.ceil(summary.duration / 60)
      : undefined,
    distanceMeters: summary?.distance,
    status: summary?.duration ? "confirmed" : "unverified",
    sourceEvidenceId: `evidence-route-${index + 1}`,
  };
}
