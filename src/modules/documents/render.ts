import type { DocumentArtifact, TripPlan } from "@/modules/plans/types";
import { buildResilientAlternatives } from "@/modules/itinerary/engine";

const titles: Record<DocumentArtifact["type"], string> = {
  "teacher-plan": "교사용 체험학습 운영계획서",
  "student-worksheet": "학생용 현장탐구 활동지",
  "parent-notice": "보호자 안내문 초안",
};

export interface DocumentSection {
  id: string;
  heading: string;
  content: string[];
}

export interface StructuredDocumentModel {
  title: string;
  status: "draft" | "final";
  planId: string;
  planVersion: number;
  dataMode: TripPlan["dataMode"];
  blockingFindingCount: number;
  sections: DocumentSection[];
  disclaimer: string;
}

export function renderDocument(
  plan: TripPlan,
  type: DocumentArtifact["type"],
  now = new Date(),
): DocumentArtifact {
  const model = buildDocumentModel(plan, type);
  const markdown = [
    `# ${model.title}`,
    "",
    `> ${model.status === "final" ? "승인본" : "검토용 초안"} · 계획 ${model.planId} v${model.planVersion} · 데이터 모드 ${model.dataMode}`,
    "",
    model.status === "draft"
      ? `> ⚠️ 사람 승인 전 문서입니다. 차단 항목 ${model.blockingFindingCount}건을 확인하십시오.`
      : "",
    ...model.sections.flatMap((section) => [
      "",
      `## ${section.heading}`,
      "",
      ...section.content,
    ]),
    "",
    "## 공통 확인 문구",
    "",
    model.disclaimer,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return {
    id: `artifact-${type}-${plan.id}-v${plan.version}`,
    planId: plan.id,
    planVersion: plan.version,
    type,
    status: model.status,
    markdown,
    generatedAt: now.toISOString(),
  };
}

export function buildDocumentModel(
  plan: TripPlan,
  type: DocumentArtifact["type"],
): StructuredDocumentModel {
  const status =
    plan.state === "Approved" || plan.state === "Rendered" ? "final" : "draft";
  const base = {
    title: titles[type],
    status,
    planId: plan.id,
    planVersion: plan.version,
    dataMode: plan.dataMode,
    blockingFindingCount: plan.findings.filter((item) => item.blocking).length,
    disclaimer:
      "이 문서는 예약·결제·안전을 보장하지 않습니다. 출발 전 장소 운영, 교통, 비용, 기상, 대기질, 접근 동선을 각 공식 채널에서 다시 확인해야 합니다.",
  } satisfies Omit<StructuredDocumentModel, "sections">;

  if (type === "student-worksheet") {
    return {
      ...base,
      sections: [
        {
          id: "goal",
          heading: "학습 목표",
          content: [plan.constraints.learningGoal],
        },
        ...(["pre-visit", "on-site", "post-visit"] as const).map((phase) => ({
          id: phase,
          heading: {
            "pre-visit": "사전 활동",
            "on-site": "현장 활동",
            "post-visit": "사후 활동",
          }[phase],
          content: plan.activities
            .filter((item) => item.phase === phase)
            .map(
              (item, index) =>
                `${index + 1}. **${item.title}** — ${item.prompt}`,
            ),
        })),
      ],
    };
  }
  if (type === "parent-notice") {
    return {
      ...base,
      sections: [
        {
          id: "overview",
          heading: "행사 개요",
          content: [
            `- 일자: ${plan.constraints.tripDate}\n- 출발/귀교 예정: ${plan.constraints.departureTime} / ${plan.constraints.returnTime}\n- 학습 주제: ${plan.title}\n- 교통수단: ${plan.constraints.transportMode}`,
          ],
        },
        {
          id: "preparation",
          heading: "준비 및 확인",
          content: [
            "세부 비용과 운영시간은 학교의 최종 확인 후 별도로 안내됩니다. 건강·개인정보는 이 서비스에 입력하지 않고 학교의 기존 안전 절차를 따릅니다.",
          ],
        },
      ],
    };
  }
  const itineraryRows = plan.itinerary.map((stop) => {
    const place = plan.places.find(
      (candidate) => candidate.id === stop.placeId,
    );
    const mapReference =
      place?.mapUrl ?? `fixture://sueop-ro/map/${place?.id ?? stop.placeId}`;
    return `| ${stop.arrivalTime}–${stop.departureTime} | ${place?.name ?? stop.placeId} ([지도 참조](${mapReference})) | ${stop.purpose} |`;
  });
  return {
    ...base,
    sections: [
      {
        id: "overview",
        heading: "계획 개요",
        content: [
          `- 일자: ${plan.constraints.tripDate}\n- 대상: ${plan.constraints.schoolLevel} ${plan.constraints.grade}학년 ${plan.constraints.participantCount}명, 인솔 ${plan.constraints.adultCount}명\n- 학습 목표: ${plan.constraints.learningGoal}\n- 출발/귀교 제한: ${plan.constraints.departureTime} / ${plan.constraints.returnTime}`,
        ],
      },
      {
        id: "itinerary",
        heading: "일정",
        content: [
          "| 시각 | 장소 | 운영 목적 |",
          "|---|---|---|",
          ...itineraryRows,
        ],
      },
      {
        id: "budget",
        heading: "예산",
        content: [
          `- 확인 총액: ${plan.confirmedCostTotal.toLocaleString("ko-KR")}원\n- 예상 총액: ${plan.projectedCostTotal.toLocaleString("ko-KR")}원\n- 1인 예산 상한: ${plan.constraints.budgetPerPerson.toLocaleString("ko-KR")}원`,
        ],
      },
      {
        id: "safety",
        heading: "안전·접근성·대체 계획",
        content: [
          ...plan.safety.map((item) => `- [${item.status}] ${item.summary}`),
          ...buildResilientAlternatives(plan).map((item) => `- ${item}`),
        ],
      },
      {
        id: "sources",
        heading: "출처·가정",
        content: plan.evidence.map(
          (item) =>
            `- ${item.label} — ${item.provider}, ${item.retrievedAt}, ${item.mode}/${item.status}${item.url ? `, ${item.url}` : ""}`,
        ),
      },
      {
        id: "checklist",
        heading: "출발 전 확인 체크리스트",
        content: [
          "- [ ] 장소 운영·휴관 확인\n- [ ] 차량 승하차·운행시간 확인\n- [ ] 비용·예약 조건 확인\n- [ ] 기상·대기질 확인\n- [ ] 무단차 동선과 화장실 확인\n- [ ] 학교 안전·비상연락 절차 확인",
        ],
      },
    ],
  };
}

export function toPrintHtml(artifact: DocumentArtifact): string {
  const escaped = artifact.markdown
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${titles[artifact.type]}</title><style>@page{size:A4;margin:18mm}body{font:12pt/1.65 system-ui;color:#172824;white-space:pre-wrap}h1{color:#135d46}@media print{.no-print{display:none}}</style></head><body>${escaped}</body></html>`;
}
