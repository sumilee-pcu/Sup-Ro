import type {
  ConstraintSet,
  PlaceCandidate,
  PlaceRecommendation,
  RecommendationDimensionScores,
} from "@/modules/plans/types";

const eligibilityOrder = { eligible: 0, review: 1, blocked: 2 } as const;

export function rankPlaceRecommendations(
  candidates: PlaceCandidate[],
  constraints: ConstraintSet,
  origin?: PlaceCandidate,
): PlaceRecommendation[] {
  return candidates
    .map((place) => evaluateCandidate(place, constraints, origin))
    .sort(
      (left, right) =>
        eligibilityOrder[left.eligibility] -
          eligibilityOrder[right.eligibility] ||
        right.score - left.score ||
        left.placeId.localeCompare(right.placeId),
    )
    .map((recommendation, index) => ({
      ...recommendation,
      rank: index + 1,
    }));
}

export function evaluateCandidate(
  place: PlaceCandidate,
  constraints: ConstraintSet,
  origin?: PlaceCandidate,
): PlaceRecommendation {
  const reasons: string[] = [];
  const caveats: string[] = [];
  let eligibility: PlaceRecommendation["eligibility"] = "eligible";
  const block = (message: string) => {
    eligibility = "blocked";
    caveats.push(message);
  };
  const review = (message: string) => {
    if (eligibility !== "blocked") eligibility = "review";
    caveats.push(message);
  };

  const distanceKm = origin ? haversineMeters(origin, place) / 1000 : undefined;
  const dimensions: RecommendationDimensionScores = {
    curriculum: place.alignmentEvidenceId ? 100 : 45,
    travel: travelScore(distanceKm),
    cost: costScore(place.costPerStudent, constraints.budgetPerPerson),
    accessibility: accessibilityScore(place, constraints),
    weatherResilience: place.isIndoor ? 100 : 55,
    evidence:
      place.sourceEvidenceId && place.alignmentEvidenceId
        ? 100
        : place.sourceEvidenceId
          ? 65
          : 0,
  };

  if (constraints.excludedPlaceIds.includes(place.id))
    block("교사가 제외한 장소입니다.");
  if (
    constraints.wheelchairAccessRequired &&
    place.accessibility === "verified-not-accessible"
  )
    block("필수 무단차 동선 조건을 충족하지 못합니다.");
  else if (
    constraints.wheelchairAccessRequired &&
    place.accessibility === "unverified"
  )
    review("무단차 동선은 장소 공식 확인이 필요합니다.");

  if (place.costPerStudent > constraints.budgetPerPerson)
    block("입장비만으로 1인 예산 상한을 넘습니다.");

  if (!place.openingHours.verified) {
    review("운영시간과 휴관일이 미확인입니다.");
  } else if (!fitsOpeningWindow(place, constraints)) {
    block("체험 가능 시간과 확인된 운영시간이 맞지 않습니다.");
  }

  if (!place.alignmentEvidenceId) review("교육과정 연계 근거가 미확인입니다.");

  if (place.alignmentEvidenceId)
    reasons.push(`학습 목표 연계: ${place.curriculumAlignment}`);
  if (distanceKm !== undefined)
    reasons.push(`출발지 직선거리 약 ${formatDistance(distanceKm)}`);
  reasons.push(
    place.costPerStudent === 0
      ? "학생 입장비가 없는 후보입니다."
      : `학생 1인 입장비 ${place.costPerStudent.toLocaleString("ko-KR")}원`,
  );
  if (place.accessibility === "verified-accessible")
    reasons.push("무단차 접근 근거가 확인된 후보입니다.");
  if (place.isIndoor) reasons.push("우천 시에도 운영 가능한 실내 후보입니다.");
  else caveats.push("야외 활동은 우천·대기질 대안이 필요합니다.");
  if (constraints.mandatoryPlaceIds.includes(place.id))
    reasons.unshift("교사가 지정한 필수 장소입니다.");

  const score = Math.round(
    dimensions.curriculum * 0.3 +
      dimensions.travel * 0.15 +
      dimensions.cost * 0.15 +
      dimensions.accessibility * 0.2 +
      dimensions.weatherResilience * 0.1 +
      dimensions.evidence * 0.1,
  );

  return {
    placeId: place.id,
    rank: 0,
    score,
    eligibility,
    dimensions,
    reasons,
    caveats: [...new Set(caveats)],
    evidenceIds: [place.sourceEvidenceId, place.alignmentEvidenceId].filter(
      (value): value is string => Boolean(value),
    ),
  };
}

function fitsOpeningWindow(
  place: PlaceCandidate,
  constraints: ConstraintSet,
): boolean {
  const start = Math.max(
    toMinutes(place.openingHours.open),
    toMinutes(constraints.departureTime),
  );
  const end = Math.min(
    toMinutes(place.openingHours.close),
    toMinutes(constraints.returnTime),
  );
  return end - start >= place.visitMinutes;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return 0;
  return hours * 60 + minutes;
}

function travelScore(distanceKm?: number): number {
  if (distanceKm === undefined) return 50;
  if (distanceKm <= 5) return 100;
  if (distanceKm <= 10) return 85;
  if (distanceKm <= 20) return 65;
  if (distanceKm <= 30) return 45;
  return 25;
}

function costScore(cost: number, budget: number): number {
  if (cost === 0) return 100;
  if (budget <= 0) return 0;
  const ratio = cost / budget;
  if (ratio <= 0.25) return 95;
  if (ratio <= 0.5) return 80;
  if (ratio <= 1) return 55;
  return 0;
}

function accessibilityScore(
  place: PlaceCandidate,
  constraints: ConstraintSet,
): number {
  if (place.accessibility === "verified-accessible") return 100;
  if (place.accessibility === "verified-not-accessible")
    return constraints.wheelchairAccessRequired ? 0 : 45;
  return constraints.wheelchairAccessRequired ? 30 : 65;
}

function formatDistance(distanceKm: number): string {
  return distanceKm < 10
    ? `${distanceKm.toFixed(1)}km`
    : `${Math.round(distanceKm)}km`;
}

export function haversineMeters(
  from: Pick<PlaceCandidate, "latitude" | "longitude">,
  to: Pick<PlaceCandidate, "latitude" | "longitude">,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}
