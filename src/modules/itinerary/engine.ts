import type {
  ConstraintSet,
  CostItem,
  ItineraryStop,
  LearningActivity,
  PlaceCandidate,
  RouteLeg,
  SourceEvidence,
  TripPlan,
  ValidationFinding,
} from "@/modules/plans/types";

export function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes))
    throw new Error(`올바르지 않은 시간: ${value}`);
  return hours * 60 + minutes;
}

export function toTime(minutes: number): string {
  const normalized = Math.max(0, minutes);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function validateRequiredInputs(
  constraints: ConstraintSet,
): ValidationFinding[] {
  const required: Array<[keyof ConstraintSet, string]> = [
    ["subject", "교과"],
    ["learningGoal", "학습 목표"],
    ["origin", "출발지"],
    ["tripDate", "체험학습일"],
    ["departureTime", "출발 시각"],
    ["returnTime", "귀교 시각"],
  ];
  const findings = required.flatMap(([key, label]) =>
    constraints[key]
      ? []
      : [
          finding(
            "REQUIRED_INPUT",
            `${label} 입력이 필요합니다.`,
            String(key),
            [],
            "필수 입력을 채워 다시 실행하세요.",
            true,
          ),
        ],
  );
  if (constraints.participantCount < 1)
    findings.push(
      finding(
        "PARTICIPANT_COUNT",
        "학생 수는 1명 이상이어야 합니다.",
        "participantCount",
        [],
        "학생 수를 확인하세요.",
        true,
      ),
    );
  if (
    constraints.returnTime &&
    constraints.departureTime &&
    toMinutes(constraints.returnTime) <= toMinutes(constraints.departureTime)
  ) {
    findings.push(
      finding(
        "TIME_RANGE",
        "귀교 시각은 출발 시각보다 늦어야 합니다.",
        "returnTime",
        [],
        "운영 시간을 다시 입력하세요.",
        true,
      ),
    );
  }
  return findings;
}

export function buildItinerary(
  places: PlaceCandidate[],
  legs: RouteLeg[],
  constraints: ConstraintSet,
): ItineraryStop[] {
  if (places.length === 0) return [];
  let cursor = toMinutes(constraints.departureTime);
  const stops: ItineraryStop[] = [
    {
      id: "stop-origin",
      placeId: places[0].id,
      arrivalTime: toTime(cursor),
      departureTime: toTime(cursor),
      purpose: "집결·안전교육 후 출발",
      activityIds: ["activity-pre"],
    },
  ];

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index];
    if (leg.durationMinutes === undefined) continue;
    cursor += leg.durationMinutes + 10;
    const place = places.find((candidate) => candidate.id === leg.toPlaceId);
    if (!place) continue;
    const arrival = cursor;
    let purpose = place.curriculumAlignment;
    if (constraints.mealRequired && index === 1) {
      purpose = `점심·휴식 45분, ${purpose}`;
      cursor += 45;
    }
    cursor += place.visitMinutes;
    stops.push({
      id: `stop-${index + 1}`,
      placeId: place.id,
      arrivalTime: toTime(arrival),
      departureTime: toTime(cursor),
      purpose,
      activityIds:
        place.id === places[0].id
          ? ["activity-post"]
          : [`activity-on-${place.id}`],
    });
  }
  return stops;
}

export function calculateCosts(costs: CostItem[]): {
  confirmed: number;
  projected: number;
} {
  return costs.reduce(
    (totals, item) => ({
      confirmed:
        totals.confirmed + (item.status === "confirmed" ? item.amount : 0),
      projected:
        totals.projected + (item.status === "unverified" ? 0 : item.amount),
    }),
    { confirmed: 0, projected: 0 },
  );
}

export function validatePlan(plan: TripPlan): ValidationFinding[] {
  const findings = [...validateRequiredInputs(plan.constraints)];
  const evidenceIds = new Set(plan.evidence.map((item) => item.id));

  for (const leg of plan.routeLegs) {
    if (leg.durationMinutes === undefined)
      findings.push(
        finding(
          "UNRESOLVED_ROUTE",
          "이동 시간이 확인되지 않은 구간이 있습니다.",
          leg.id,
          [leg.sourceEvidenceId],
          "경로를 다시 조회하거나 수동 확인 시간을 기록하세요.",
          true,
        ),
      );
    if (!evidenceIds.has(leg.sourceEvidenceId))
      findings.push(
        finding(
          "SOURCE_COVERAGE",
          "경로 근거가 연결되지 않았습니다.",
          leg.id,
          [],
          "경로 출처를 연결하세요.",
          true,
        ),
      );
  }

  for (const stop of plan.itinerary) {
    const place = plan.places.find(
      (candidate) => candidate.id === stop.placeId,
    );
    if (!place || place.visitMinutes === 0) continue;
    if (!place.openingHours.verified) {
      findings.push(
        finding(
          "OPERATING_HOURS_UNVERIFIED",
          `${place.name} 운영시간이 확인되지 않았습니다.`,
          place.id,
          [place.sourceEvidenceId],
          "장소 공식 채널에 운영시간을 확인하세요.",
          true,
        ),
      );
    } else if (
      toMinutes(stop.arrivalTime) < toMinutes(place.openingHours.open) ||
      toMinutes(stop.departureTime) > toMinutes(place.openingHours.close)
    ) {
      findings.push(
        finding(
          "OPERATING_HOURS",
          `${place.name} 운영시간과 일정이 충돌합니다.`,
          place.id,
          [place.sourceEvidenceId],
          "방문 시간을 조정하거나 대체 장소를 선택하세요.",
          true,
        ),
      );
    }
    if (
      plan.constraints.wheelchairAccessRequired &&
      place.accessibility !== "verified-accessible"
    ) {
      findings.push(
        finding(
          "ACCESSIBILITY_EVIDENCE",
          `${place.name}의 무단차 접근 근거가 충분하지 않습니다.`,
          place.id,
          [place.sourceEvidenceId],
          "장소에 접근 동선을 직접 확인하고 근거를 기록하세요.",
          true,
        ),
      );
    }
  }

  const lastStop = plan.itinerary.at(-1);
  if (
    lastStop &&
    toMinutes(lastStop.departureTime) > toMinutes(plan.constraints.returnTime)
  ) {
    findings.push(
      finding(
        "RETURN_TIME",
        `예상 귀교 시각 ${lastStop.departureTime}이 제한 ${plan.constraints.returnTime}을 넘습니다.`,
        lastStop.id,
        [],
        "체류시간 또는 방문 장소를 줄이세요.",
        true,
      ),
    );
  }

  const budget =
    plan.constraints.participantCount * plan.constraints.budgetPerPerson;
  if (plan.projectedCostTotal > budget) {
    findings.push(
      finding(
        "BUDGET_LIMIT",
        `예상 총액 ${plan.projectedCostTotal.toLocaleString("ko-KR")}원이 예산 ${budget.toLocaleString("ko-KR")}원을 넘습니다.`,
        "costs",
        plan.costs.flatMap((item) => item.sourceEvidenceId ?? []),
        "무료 장소 또는 저비용 교통 대안을 비교하세요.",
        true,
      ),
    );
  }

  for (const place of plan.places) {
    if (!evidenceIds.has(place.sourceEvidenceId))
      findings.push(
        finding(
          "SOURCE_COVERAGE",
          `${place.name}의 출처가 누락되었습니다.`,
          place.id,
          [],
          "장소 출처를 연결하세요.",
          true,
        ),
      );
    if (!place.alignmentEvidenceId)
      findings.push(
        finding(
          "CURRICULUM_ALIGNMENT",
          `${place.name}의 교육과정 연계는 미검증 제안입니다.`,
          place.id,
          [],
          "교육과정 원문 또는 미검증 라벨을 연결하세요.",
          false,
        ),
      );
  }

  if (plan.safety.some((item) => item.requiresOfficialConfirmation)) {
    findings.push(
      finding(
        "OFFICIAL_RECHECK",
        "출발 전 기상·대기질·운영·차량 동선을 공식 채널에서 다시 확인해야 합니다.",
        "safety",
        plan.safety.map((item) => item.sourceEvidenceId),
        "운영계획서의 확인 체크리스트를 완료하세요.",
        false,
      ),
    );
  }
  return findings;
}

export function scorePreferredConstraints(plan: TripPlan): number {
  const scoredPlaces = plan.places.filter((place) => place.visitMinutes > 0);
  if (scoredPlaces.length === 0) return 0;
  const indoor =
    scoredPlaces.filter((place) => place.isIndoor).length / scoredPlaces.length;
  const aligned =
    scoredPlaces.filter((place) => place.alignmentEvidenceId).length /
    scoredPlaces.length;
  const accessible =
    scoredPlaces.filter(
      (place) => place.accessibility === "verified-accessible",
    ).length / scoredPlaces.length;
  return Math.round((indoor * 0.2 + aligned * 0.5 + accessible * 0.3) * 100);
}

export function buildActivities(
  plan: Pick<TripPlan, "curriculum" | "places" | "itinerary">,
): LearningActivity[] {
  const reference = plan.curriculum[0];
  if (!reference) return [];
  return [
    {
      id: "activity-pre",
      phase: "pre-visit",
      title: "관찰 기준 세우기",
      prompt:
        "생물 요소와 비생물 요소를 구분할 관찰 기준을 두 가지 이상 정합니다.",
      curriculumReferenceId: reference.id,
    },
    ...plan.places
      .filter((place) => place.visitMinutes > 0)
      .map((place) => ({
        id: `activity-on-${place.id}`,
        phase: "on-site" as const,
        title: `${place.name} 근거 수집`,
        prompt: `${place.curriculumAlignment}에 해당하는 관찰 근거를 사진 대신 비식별 스케치와 문장으로 기록합니다.`,
        itineraryStopId: plan.itinerary.find(
          (stop) => stop.placeId === place.id,
        )?.id,
        curriculumReferenceId: reference.id,
      })),
    {
      id: "activity-post",
      phase: "post-visit",
      title: "생태계 변화 설명하기",
      prompt:
        "현장 근거 세 가지를 사용해 한 요소의 변화가 다른 요소에 미치는 영향을 설명합니다.",
      curriculumReferenceId: reference.id,
    },
  ];
}

export function buildResilientAlternatives(plan: TripPlan): string[] {
  const indoor = plan.places
    .filter((place) => place.isIndoor && place.visitMinutes > 0)
    .map((place) => place.name);
  return [
    `우천 시 ${indoor.join(", ") || "교내 탐구실"} 중심으로 활동을 재배치합니다.`,
    "대기질 악화 시 야외 관찰을 실내 표본·공개 데이터 분석으로 대체합니다.",
    "장소 휴관 시 같은 학습목표와 접근성 조건을 만족하는 후보를 다시 검색합니다.",
    "교통 장애 시 해당 구간을 미확인 상태로 전환하고 귀교 제한을 기준으로 일정을 재계산합니다.",
  ];
}

export function buildLowerCostAlternativeInputs(plan: TripPlan): {
  currentProjectedTotal: number;
  budgetLimit: number;
  removableCostItems: CostItem[];
  freeOrLowCostPlaces: PlaceCandidate[];
} {
  return {
    currentProjectedTotal: plan.projectedCostTotal,
    budgetLimit:
      plan.constraints.participantCount * plan.constraints.budgetPerPerson,
    removableCostItems: plan.costs
      .filter((item) => item.status !== "confirmed")
      .sort((a, b) => b.amount - a.amount),
    freeOrLowCostPlaces: plan.places
      .filter((place) => place.costPerStudent <= 5000)
      .sort((a, b) => a.costPerStudent - b.costPerStudent),
  };
}

function finding(
  ruleId: string,
  message: string,
  affectedEntityId: string,
  evidenceIds: string[],
  recommendedAction: string,
  blocking: boolean,
): ValidationFinding {
  return {
    id: `finding-${ruleId.toLowerCase()}-${affectedEntityId}`,
    ruleId,
    severity: blocking ? "error" : "warning",
    message,
    affectedEntityId,
    evidenceIds,
    recommendedAction,
    blocking,
  };
}

export function sourceCoverage(
  evidence: SourceEvidence[],
  referencedIds: string[],
): number {
  if (referencedIds.length === 0) return 1;
  const available = new Set(evidence.map((item) => item.id));
  return (
    referencedIds.filter((id) => available.has(id)).length /
    referencedIds.length
  );
}
