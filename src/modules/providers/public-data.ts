import type {
  ConstraintSet,
  PlaceCandidate,
  ProviderResult,
  SafetyEvidence,
} from "@/modules/plans/types";
import type {
  AirQualityProvider,
  SafetyFacilityProvider,
  WeatherProvider,
} from "./contracts";

type NormalizedSafetyItem = {
  id: string;
  summary: string;
  status: "confirmed" | "estimated" | "unverified";
  observedOrForecast: "observed" | "forecast";
};

export interface PublicDataAdapterOptions {
  endpoint: string;
  serviceKey: string;
  providerName: string;
  officialUrl: string;
  fetcher?: typeof fetch;
  normalize: (payload: unknown) => NormalizedSafetyItem[];
}

abstract class PublicDataAdapter {
  constructor(protected readonly options: PublicDataAdapterOptions) {}

  protected async request(
    category: SafetyEvidence["category"],
    params: URLSearchParams,
  ): Promise<ProviderResult<SafetyEvidence[]>> {
    params.set("serviceKey", this.options.serviceKey);
    params.set("returnType", "json");
    const response = await (this.options.fetcher ?? fetch)(
      `${this.options.endpoint}?${params}`,
    );
    if (!response.ok)
      throw new Error(
        `${this.options.providerName} 응답 실패: HTTP ${response.status}`,
      );
    const retrievedAt = new Date().toISOString();
    const data = this.options.normalize(await response.json()).map((item) => ({
      id: item.id,
      category,
      summary: `${item.observedOrForecast === "observed" ? "측정" : "예보"}: ${item.summary}`,
      status: item.status,
      sourceEvidenceId: `evidence-${item.id}`,
      requiresOfficialConfirmation: true,
    }));
    return {
      data,
      source: {
        provider: this.options.providerName,
        url: this.options.officialUrl,
      },
      retrievedAt,
      mode: "live",
      warnings: [
        "자동 조회는 안전 보장이 아니며 학교 절차와 공식 발표를 함께 확인해야 합니다.",
      ],
    };
  }
}

export class KoreaWeatherAdapter
  extends PublicDataAdapter
  implements WeatherProvider
{
  async getAdvisories(
    constraints: ConstraintSet,
  ): Promise<ProviderResult<SafetyEvidence[]>> {
    return this.request(
      "weather",
      new URLSearchParams({
        date: constraints.tripDate,
        origin: constraints.origin,
      }),
    );
  }
}

export class KoreaAirQualityAdapter
  extends PublicDataAdapter
  implements AirQualityProvider
{
  async getAdvisories(
    constraints: ConstraintSet,
  ): Promise<ProviderResult<SafetyEvidence[]>> {
    return this.request(
      "air-quality",
      new URLSearchParams({
        date: constraints.tripDate,
        origin: constraints.origin,
      }),
    );
  }
}

export class KoreaSafetyFacilityAdapter
  extends PublicDataAdapter
  implements SafetyFacilityProvider
{
  async getFacilities(
    places: PlaceCandidate[],
  ): Promise<ProviderResult<SafetyEvidence[]>> {
    return this.request(
      "facility",
      new URLSearchParams({
        coordinates: places
          .map((place) => `${place.longitude},${place.latitude}`)
          .join("|"),
      }),
    );
  }
}
