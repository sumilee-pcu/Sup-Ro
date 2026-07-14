import {
  buildActivities,
  buildItinerary,
  calculateCosts,
  validatePlan,
} from "@/modules/itinerary/engine";
import {
  haversineMeters,
  rankPlaceRecommendations,
} from "@/modules/recommendations/engine";
import type { ConstraintSet, PlaceCandidate, TripPlan } from "./types";

export function recalculatePlan(plan: TripPlan): TripPlan {
  const costs = recalculateAdmissionCost(plan);
  const totals = calculateCosts(costs);
  const canSchedule =
    /^\d{2}:\d{2}$/.test(plan.constraints.departureTime) &&
    /^\d{2}:\d{2}$/.test(plan.constraints.returnTime);
  const origin = plan.places.find((place) => place.visitMinutes === 0);
  let next: TripPlan = {
    ...plan,
    costs,
    itinerary: canSchedule
      ? buildItinerary(plan.places, plan.routeLegs, plan.constraints)
      : [],
    recommendations: rankPlaceRecommendations(
      plan.candidatePlaces,
      plan.constraints,
      origin,
    ),
    confirmedCostTotal: totals.confirmed,
    projectedCostTotal: totals.projected,
    activities: [],
    state: "Verify",
  };
  next = { ...next, activities: buildActivities(next) };
  next = { ...next, findings: validatePlan(next) };
  next.state = next.findings.some((item) => item.blocking)
    ? "NeedsReview"
    : "ReadyForApproval";
  return next;
}

function recalculateAdmissionCost(plan: TripPlan): TripPlan["costs"] {
  const admission =
    plan.constraints.participantCount *
    plan.places.reduce((total, place) => total + place.costPerStudent, 0);
  return plan.costs.map((item) =>
    item.id === "cost-admission" ? { ...item, amount: admission } : item,
  );
}

export function editPlanConstraints(
  plan: TripPlan,
  patch: Partial<ConstraintSet>,
  now = new Date(),
): TripPlan {
  const constraints = { ...plan.constraints, ...patch };
  const routeLegs =
    constraints.transportMode === plan.constraints.transportMode
      ? plan.routeLegs
      : rebuildEstimatedRouteLegs(plan.places, [], constraints.transportMode);
  return recalculatePlan({
    ...plan,
    version: plan.version + 1,
    state: "Intake",
    constraints,
    routeLegs,
    artifacts: [],
    updatedAt: now.toISOString(),
  });
}

export function selectRecommendedPlaces(
  plan: TripPlan,
  placeIds: string[],
  now = new Date(),
): TripPlan {
  const selectedIds = [...new Set(placeIds)];
  if (selectedIds.length < 1 || selectedIds.length > 3)
    throw new Error("후보 장소를 1곳 이상 3곳 이하로 선택하세요.");

  const missingMandatory = plan.constraints.mandatoryPlaceIds.filter(
    (placeId) => !selectedIds.includes(placeId),
  );
  if (missingMandatory.length > 0)
    throw new Error("필수 장소는 선택에서 제외할 수 없습니다.");

  const recommendationById = new Map(
    plan.recommendations.map((item) => [item.placeId, item]),
  );
  const selected = selectedIds.map((placeId) => {
    const place = plan.candidatePlaces.find((item) => item.id === placeId);
    if (!place) throw new Error("후보 장소를 찾을 수 없습니다.");
    if (plan.constraints.excludedPlaceIds.includes(placeId))
      throw new Error(`${place.name}은 제외한 후보입니다.`);
    if (recommendationById.get(placeId)?.eligibility === "blocked")
      throw new Error(`${place.name}은 필수 제약을 충족하지 못합니다.`);
    return place;
  });
  const origin = plan.places.find((place) => place.visitMinutes === 0);
  if (!origin) throw new Error("출발 장소를 찾을 수 없습니다.");
  const places = [origin, ...selected];
  const routeLegs = rebuildEstimatedRouteLegs(
    places,
    plan.routeLegs,
    plan.constraints.transportMode,
  );

  return recalculatePlan({
    ...plan,
    version: plan.version + 1,
    places,
    routeLegs,
    selectedPlaceIds: selectedIds,
    selectedPlaceId: selectedIds[0],
    artifacts: [],
    updatedAt: now.toISOString(),
  });
}

export function togglePlaceLock(plan: TripPlan, placeId: string): TripPlan {
  return {
    ...plan,
    places: plan.places.map((place) =>
      place.id === placeId ? { ...place, locked: !place.locked } : place,
    ),
    candidatePlaces: plan.candidatePlaces.map((place) =>
      place.id === placeId ? { ...place, locked: !place.locked } : place,
    ),
  };
}

export function excludePlace(plan: TripPlan, placeId: string): TripPlan {
  const place =
    plan.places.find((candidate) => candidate.id === placeId) ??
    plan.candidatePlaces.find((candidate) => candidate.id === placeId);
  if (!place) throw new Error("장소를 찾을 수 없습니다.");
  if (place.locked || plan.constraints.mandatoryPlaceIds.includes(placeId))
    throw new Error("잠금 또는 필수 장소는 제외할 수 없습니다.");
  const places = plan.places.filter((candidate) => candidate.id !== placeId);
  const routeLegs = rebuildEstimatedRouteLegs(
    places,
    plan.routeLegs,
    plan.constraints.transportMode,
  );
  return recalculatePlan({
    ...plan,
    version: plan.version + 1,
    places,
    routeLegs,
    selectedPlaceIds: plan.selectedPlaceIds.filter((id) => id !== placeId),
    constraints: {
      ...plan.constraints,
      excludedPlaceIds: [
        ...new Set([...plan.constraints.excludedPlaceIds, placeId]),
      ],
    },
    artifacts: [],
  });
}

export function reorderPlace(
  plan: TripPlan,
  placeId: string,
  direction: -1 | 1,
): TripPlan {
  const index = plan.places.findIndex((place) => place.id === placeId);
  const target = index + direction;
  if (index <= 0 || target <= 0 || target >= plan.places.length) return plan;
  if (plan.places[index].locked) return plan;
  const places = [...plan.places];
  [places[index], places[target]] = [places[target], places[index]];
  const routeLegs = rebuildEstimatedRouteLegs(
    places,
    plan.routeLegs,
    plan.constraints.transportMode,
  );
  return recalculatePlan({
    ...plan,
    version: plan.version + 1,
    places,
    routeLegs,
    selectedPlaceIds: places
      .filter((place) => place.visitMinutes > 0)
      .map((place) => place.id),
    artifacts: [],
  });
}

export function updatePlace(
  plan: TripPlan,
  placeId: string,
  patch: Partial<PlaceCandidate>,
): TripPlan {
  return recalculatePlan({
    ...plan,
    version: plan.version + 1,
    places: plan.places.map((place) =>
      place.id === placeId ? { ...place, ...patch } : place,
    ),
    candidatePlaces: plan.candidatePlaces.map((place) =>
      place.id === placeId ? { ...place, ...patch } : place,
    ),
    artifacts: [],
  });
}

export function recordAccessibilityEvidence(
  plan: TripPlan,
  placeId: string,
  accessibility: PlaceCandidate["accessibility"],
  note: string,
  now = new Date(),
): TripPlan {
  if (note.trim().length < 3)
    throw new Error("접근성 확인 방법이나 문의 결과를 3자 이상 기록하세요.");
  const place =
    plan.places.find((candidate) => candidate.id === placeId) ??
    plan.candidatePlaces.find((candidate) => candidate.id === placeId);
  if (!place) throw new Error("장소를 찾을 수 없습니다.");
  const version = plan.version + 1;
  const evidenceId = `evidence-access-user-${placeId}-v${version}`;
  const updated: TripPlan = {
    ...plan,
    version,
    places: plan.places.map((candidate) =>
      candidate.id === placeId ? { ...candidate, accessibility } : candidate,
    ),
    candidatePlaces: plan.candidatePlaces.map((candidate) =>
      candidate.id === placeId ? { ...candidate, accessibility } : candidate,
    ),
    evidence: [
      ...plan.evidence,
      {
        id: evidenceId,
        label: `${place.name} 접근성 사용자 확인`,
        provider: "교사 수동 확인 기록",
        retrievedAt: now.toISOString(),
        mode: plan.dataMode,
        status: accessibility === "unverified" ? "unverified" : "confirmed",
        note: note.trim(),
      },
    ],
    safety: [
      ...plan.safety,
      {
        id: `safety-access-user-${placeId}-v${version}`,
        category: "accessibility",
        summary: `${place.name}: ${note.trim()}`,
        status: accessibility === "unverified" ? "unverified" : "confirmed",
        sourceEvidenceId: evidenceId,
        requiresOfficialConfirmation: accessibility === "unverified",
      },
    ],
    artifacts: [],
    updatedAt: now.toISOString(),
  };
  return recalculatePlan(updated);
}

export function hasApprovalForCurrentVersion(plan: TripPlan): boolean {
  return plan.approvals.some(
    (approval) => approval.planVersion === plan.version,
  );
}

function rebuildEstimatedRouteLegs(
  places: PlaceCandidate[],
  existing: TripPlan["routeLegs"],
  mode: ConstraintSet["transportMode"],
): TripPlan["routeLegs"] {
  if (places.length < 2) return [];
  const sequence = [...places, places[0]];
  return sequence.slice(0, -1).map((from, index) => {
    const to = sequence[index + 1];
    const known = existing.find(
      (leg) =>
        (leg.fromPlaceId === from.id && leg.toPlaceId === to.id) ||
        (leg.fromPlaceId === to.id && leg.toPlaceId === from.id),
    );
    const distanceMeters = Math.round(haversineMeters(from, to));
    const metersPerMinute =
      mode === "도보" ? 70 : mode === "대중교통" ? 300 : 450;
    return {
      id: `route-${from.id}-${to.id}`,
      fromPlaceId: from.id,
      toPlaceId: to.id,
      mode,
      durationMinutes:
        known?.durationMinutes ??
        Math.max(5, Math.ceil(distanceMeters / metersPerMinute)),
      distanceMeters: known?.distanceMeters ?? distanceMeters,
      status: known?.status ?? "estimated",
      sourceEvidenceId: known?.sourceEvidenceId ?? "evidence-route",
    };
  });
}
