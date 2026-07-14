export type DataMode = "live" | "cache" | "fixture";
export type EvidenceStatus = "confirmed" | "estimated" | "unverified";
export type PlanState =
  | "Intake"
  | "Gather"
  | "Solve"
  | "Verify"
  | "NeedsReview"
  | "ReadyForApproval"
  | "Approved"
  | "Rendered";

export interface SourceEvidence {
  id: string;
  label: string;
  provider: string;
  url?: string;
  retrievedAt: string;
  mode: DataMode;
  status: EvidenceStatus;
  note?: string;
}

export interface ProviderResult<T> {
  data: T;
  source: Pick<SourceEvidence, "provider" | "url">;
  retrievedAt: string;
  staleAt?: string;
  mode: DataMode;
  warnings: string[];
}

export interface ConstraintSet {
  schoolLevel: "초등학교" | "중학교" | "고등학교";
  grade: number;
  subject: string;
  learningGoal: string;
  origin: string;
  tripDate: string;
  departureTime: string;
  returnTime: string;
  participantCount: number;
  adultCount: number;
  budgetPerPerson: number;
  transportMode: "대중교통" | "전세버스" | "도보";
  wheelchairAccessRequired: boolean;
  avoidStairs: boolean;
  quietSpaceRequired: boolean;
  mealRequired: boolean;
  notes: string;
  mandatoryPlaceIds: string[];
  excludedPlaceIds: string[];
}

export interface CurriculumReference {
  id: string;
  datasetVersion: string;
  authority: string;
  notice: string;
  schoolLevel: ConstraintSet["schoolLevel"];
  grade: number;
  subject: string;
  standardId: string;
  sourceText: string;
  generatedInterpretation: string;
  sourceUrl: string;
  status: EvidenceStatus;
}

export interface PlaceCandidate {
  id: string;
  providerId?: string;
  name: string;
  category: string;
  address: string;
  mapUrl?: string;
  latitude: number;
  longitude: number;
  openingHours: { open: string; close: string; verified: boolean };
  visitMinutes: number;
  costPerStudent: number;
  accessibility:
    | "verified-accessible"
    | "verified-not-accessible"
    | "unverified";
  isIndoor: boolean;
  curriculumAlignment: string;
  alignmentEvidenceId?: string;
  sourceEvidenceId: string;
  locked?: boolean;
}

export type RecommendationEligibility = "eligible" | "review" | "blocked";

export interface RecommendationDimensionScores {
  curriculum: number;
  travel: number;
  cost: number;
  accessibility: number;
  weatherResilience: number;
  evidence: number;
}

export interface PlaceRecommendation {
  placeId: string;
  rank: number;
  score: number;
  eligibility: RecommendationEligibility;
  dimensions: RecommendationDimensionScores;
  reasons: string[];
  caveats: string[];
  evidenceIds: string[];
}

export interface RouteLeg {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  mode: ConstraintSet["transportMode"];
  durationMinutes?: number;
  distanceMeters?: number;
  status: EvidenceStatus;
  sourceEvidenceId: string;
}

export interface ItineraryStop {
  id: string;
  placeId: string;
  arrivalTime: string;
  departureTime: string;
  purpose: string;
  activityIds: string[];
}

export interface CostItem {
  id: string;
  label: string;
  amount: number;
  status: EvidenceStatus;
  sourceEvidenceId?: string;
}

export interface SafetyEvidence {
  id: string;
  category:
    | "weather"
    | "air-quality"
    | "facility"
    | "accessibility"
    | "transport";
  summary: string;
  status: EvidenceStatus;
  sourceEvidenceId: string;
  requiresOfficialConfirmation: boolean;
}

export interface LearningActivity {
  id: string;
  phase: "pre-visit" | "on-site" | "post-visit";
  title: string;
  prompt: string;
  itineraryStopId?: string;
  curriculumReferenceId: string;
}

export interface ValidationFinding {
  id: string;
  ruleId: string;
  severity: "info" | "warning" | "error";
  message: string;
  affectedEntityId?: string;
  evidenceIds: string[];
  recommendedAction: string;
  blocking: boolean;
}

export interface PlanApproval {
  id: string;
  planId: string;
  planVersion: number;
  approvedAt: string;
  approverRole: "teacher";
  acknowledgement: string;
}

export interface DocumentArtifact {
  id: string;
  planId: string;
  planVersion: number;
  type:
    | "teacher-plan"
    | "student-worksheet"
    | "parent-notice"
    | "school-application-draft";
  status: "draft" | "final";
  markdown: string;
  generatedAt: string;
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  stage: PlanState;
  startedAt: string;
  durationMs: number;
  success: boolean;
  dataMode: DataMode;
  summary: string;
}

export interface AgentRun {
  id: string;
  planId: string;
  planVersion: number;
  state: PlanState;
  startedAt: string;
  finishedAt: string;
  toolCalls: ToolCallRecord[];
  findingCount: number;
  sanitizedError?: string;
}

export interface TripPlan {
  id: string;
  version: number;
  title: string;
  state: PlanState;
  dataMode: DataMode;
  constraints: ConstraintSet;
  curriculum: CurriculumReference[];
  candidatePlaces: PlaceCandidate[];
  recommendations: PlaceRecommendation[];
  selectedPlaceIds: string[];
  places: PlaceCandidate[];
  routeLegs: RouteLeg[];
  itinerary: ItineraryStop[];
  costs: CostItem[];
  safety: SafetyEvidence[];
  activities: LearningActivity[];
  evidence: SourceEvidence[];
  findings: ValidationFinding[];
  approvals: PlanApproval[];
  artifacts: DocumentArtifact[];
  runs: AgentRun[];
  selectedPlaceId?: string;
  confirmedCostTotal: number;
  projectedCostTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationMetrics {
  completeness: number;
  hardConstraintPassRate: number;
  sourceCoverage: number;
  unresolvedFactCount: number;
  toolSuccessRate: number;
  latencyMs: number;
  humanEditCount: number;
}
