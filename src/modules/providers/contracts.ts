import type {
  ConstraintSet,
  CurriculumReference,
  PlaceCandidate,
  ProviderResult,
  RouteLeg,
  SafetyEvidence,
} from "@/modules/plans/types";

export interface MapDisplayProvider {
  readonly name: string;
  getPublicConfiguration(): { provider: string; appKeyConfigured: boolean };
}

export interface PlaceSearchProvider {
  search(constraints: ConstraintSet): Promise<ProviderResult<PlaceCandidate[]>>;
}

export interface RouteProvider {
  getLegs(
    places: PlaceCandidate[],
    constraints: ConstraintSet,
  ): Promise<ProviderResult<RouteLeg[]>>;
}

export interface TourismProvider {
  enrich(places: PlaceCandidate[]): Promise<ProviderResult<PlaceCandidate[]>>;
}

export interface CurriculumProvider {
  search(
    constraints: ConstraintSet,
  ): Promise<ProviderResult<CurriculumReference[]>>;
}

export interface WeatherProvider {
  getAdvisories(
    constraints: ConstraintSet,
  ): Promise<ProviderResult<SafetyEvidence[]>>;
}

export interface AirQualityProvider {
  getAdvisories(
    constraints: ConstraintSet,
  ): Promise<ProviderResult<SafetyEvidence[]>>;
}

export interface SafetyFacilityProvider {
  getFacilities(
    places: PlaceCandidate[],
  ): Promise<ProviderResult<SafetyEvidence[]>>;
}

export interface ModelProvider {
  explain(input: {
    learningGoal: string;
    placeNames: string[];
  }): Promise<{ summary: string; caveats: string[] }>;
}

export interface ProviderSet {
  places: PlaceSearchProvider;
  routes: RouteProvider;
  curriculum: CurriculumProvider;
  weather: WeatherProvider;
  airQuality: AirQualityProvider;
  safetyFacilities: SafetyFacilityProvider;
}
