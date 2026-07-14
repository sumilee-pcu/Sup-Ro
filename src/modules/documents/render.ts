import type { DocumentArtifact, TripPlan } from "@/modules/plans/types";
import { buildResilientAlternatives } from "@/modules/itinerary/engine";

const titles: Record<DocumentArtifact["type"], string> = {
  "teacher-plan": "교사용 체험학습 운영계획서",
  "student-worksheet": "학생용 현장탐구 활동지",
  "parent-notice": "보호자 안내문 초안",
  "school-application-draft":
    "원당중학교 학교장허가 교외체험학습 신청서 작성용 초안",
};

const wondangFormSource =
  "https://wondang-m.goegy.kr/wondang-m/na/ntt/selectNttInfo.do?mi=18084&bbsId=10405&nttSn=1093902";

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
    type !== "school-application-draft" &&
    (plan.state === "Approved" || plan.state === "Rendered")
      ? "final"
      : "draft";
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

  if (type === "school-application-draft") {
    const destinations = plan.selectedPlaceIds.flatMap((placeId) => {
      const place = plan.places.find((candidate) => candidate.id === placeId);
      return place ? [place.name] : [];
    });
    const itineraryRows = plan.itinerary
      .filter((stop) => plan.selectedPlaceIds.includes(stop.placeId))
      .map((stop) => {
        const place = plan.places.find((item) => item.id === stop.placeId);
        return `| ${stop.arrivalTime}–${stop.departureTime} | ${place?.name ?? stop.placeId} | ${stop.purpose} |`;
      });
    return {
      ...base,
      status: "draft",
      sections: [
        {
          id: "compatibility",
          heading: "양식 호환 안내",
          content: [
            `- 참고 양식: [원당중학교 2025 현장체험학습 신청서 및 보고서](${wondangFormSource})`,
            "- 원본 형식: HWPX · 확인 기준일: 2026-07-14",
            "- 이 원본은 개인 학교장허가 교외체험학습용입니다. 단체 현장수업 운영계획서를 대체할 수 있는지는 학교에 확인하십시오.",
            "- 수업로 AI는 개인정보·동의·서명을 자동 생성하지 않으므로 이 문서는 제출 완료본이 아닌 작성용 초안입니다.",
          ],
        },
        {
          id: "mapped-fields",
          heading: "신청서 자동 매핑 항목",
          content: [
            `- 신청 기간: ${plan.constraints.tripDate} (1일 기준)`,
            "- 학습형태: 답사·견학 활동 / 체험활동 중 학교 기준에 맞게 직접 표시",
            `- 목적지: ${destinations.join(", ") || "선택 장소 없음"}`,
            `- 목적: ${plan.constraints.learningGoal}`,
            "- 숙박장소: 해당 없음(당일형 계획)",
          ],
        },
        {
          id: "learning-plan",
          heading: "교외체험학습 계획",
          content: [
            "| 시간 | 목적지 | 학습 내용 |",
            "|---|---|---|",
            ...itineraryRows,
          ],
        },
        {
          id: "manual-fields",
          heading: "보호자·학생이 직접 작성할 항목",
          content: [
            "- [ ] 학생 성명, 학년·반·번호, 휴대폰",
            "- [ ] 보호자·인솔자 성명, 관계, 휴대폰",
            "- [ ] 학교 세부 규칙·불허기간 확인 표시",
            "- [ ] 학생안전 동의",
            "- [ ] 신청일과 보호자·학생 서명",
            "- [ ] 담임·부장·교감·교장 결재 및 허가 통보",
          ],
        },
        {
          id: "after-trip",
          heading: "사후 결과보고서",
          content: [
            "결과보고서의 느낀 점·배운 점·사진·티켓은 실제 체험 후 학생이 작성해야 하므로 이 계획 단계에서 자동 생성하지 않습니다.",
          ],
        },
      ],
    };
  }

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
      place?.mapUrl ?? `fixture://sup-ro/map/${place?.id ?? stop.placeId}`;
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
  const watermark =
    artifact.status === "draft"
      ? '<div class="watermark" aria-hidden="true">검토용 초안</div>'
      : "";
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(titles[artifact.type])}</title>
  <style>
    @page{size:A4;margin:16mm}
    *{box-sizing:border-box}
    body{margin:0;background:#eef2ef;color:#172824;font:11pt/1.65 "Noto Sans KR",system-ui,sans-serif}
    article{position:relative;max-width:210mm;min-height:297mm;margin:20px auto;padding:16mm;background:#fff;box-shadow:0 10px 35px rgba(0,0,0,.12)}
    h1{margin:0 0 18px;color:#135d46;font-size:22pt;line-height:1.3;border-bottom:3px solid #135d46;padding-bottom:10px}
    h2{margin:22px 0 8px;color:#194d3e;font-size:14pt;border-left:5px solid #f6bb42;padding-left:9px}
    p{margin:6px 0} ul,ol{margin:6px 0;padding-left:24px}
    blockquote{margin:8px 0;padding:9px 12px;border-left:4px solid #d69a22;background:#fff8e7;color:#4a514e}
    table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:9.5pt}
    caption{text-align:left;font-weight:700;margin-bottom:6px}
    th,td{border:1px solid #aebdb6;padding:7px 8px;text-align:left;vertical-align:top}
    thead th{background:#e8f2ed} a{color:#0b6047;overflow-wrap:anywhere}
    .watermark{position:fixed;inset:45% auto auto 50%;transform:translate(-50%,-50%) rotate(-28deg);z-index:2;color:rgba(177,60,50,.13);font-size:48pt;font-weight:900;white-space:nowrap;pointer-events:none}
    @media print{body{background:#fff}article{margin:0;padding:0;min-height:auto;box-shadow:none}.watermark{position:fixed}}
  </style>
</head>
<body>${watermark}<article>${markdownToHtml(artifact.markdown)}</article></body>
</html>`;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      html.push(`<h1>${renderInline(line.slice(2))}</h1>`);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quote.push(renderInline(lines[index].trim().slice(2)));
        index += 1;
      }
      html.push(`<blockquote>${quote.join("<br>")}</blockquote>`);
      continue;
    }
    if (
      line.startsWith("|") &&
      index + 1 < lines.length &&
      isTableDivider(lines[index + 1])
    ) {
      const headers = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      html.push(
        `<table><thead><tr>${headers.map((cell) => `<th scope="col">${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table>`,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        const item = lines[index]
          .trim()
          .slice(2)
          .replace(/^\[ \]\s*/, "☐ ");
        items.push(`<li>${renderInline(item)}</li>`);
        index += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(
          `<li>${renderInline(lines[index].trim().replace(/^\d+\.\s*/, ""))}</li>`,
        );
        index += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    html.push(`<p>${renderInline(line)}</p>`);
    index += 1;
  }
  return html.join("");
}

function isTableDivider(line: string): boolean {
  return /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
}

function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(value: string): string {
  const links = /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/g;
  let output = "";
  let cursor = 0;
  for (const match of value.matchAll(links)) {
    const start = match.index ?? 0;
    output += renderStrong(value.slice(cursor, start));
    output += `<a href="${escapeHtml(match[2])}" target="_blank" rel="noreferrer">${renderStrong(match[1])}</a>`;
    cursor = start + match[0].length;
  }
  return output + renderStrong(value.slice(cursor));
}

function renderStrong(value: string): string {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
