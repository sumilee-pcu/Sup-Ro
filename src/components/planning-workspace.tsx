"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import type {
  ConstraintSet,
  DocumentArtifact,
  TripPlan,
} from "@/modules/plans/types";
import { approvePlan } from "@/modules/agent/orchestrator";
import {
  editPlanConstraints,
  excludePlace,
  recordAccessibilityEvidence,
  reorderPlace,
  selectRecommendedPlaces,
  togglePlaceLock,
} from "@/modules/plans/actions";
import {
  findSensitiveText,
  redactSensitiveText,
} from "@/modules/plans/privacy";
import { renderDocument, toPrintHtml } from "@/modules/documents/render";
import { evaluatePlan } from "@/modules/evaluation/metrics";
import { CandidateComparison } from "./candidate-comparison";
import { MapCanvas } from "./map-canvas";

export function PlanningWorkspace({ initialPlan }: { initialPlan: TripPlan }) {
  const [plan, setPlan] = useState(initialPlan);
  const [draft, setDraft] = useState(initialPlan.constraints);
  const [documentType, setDocumentType] =
    useState<DocumentArtifact["type"]>("teacher-plan");
  const [notice, setNotice] = useState("");
  const [accessibilityNote, setAccessibilityNote] = useState(
    "장소 공식 문의 또는 현장 확인 결과를 입력하세요.",
  );
  const [accessibilityStatus, setAccessibilityStatus] =
    useState<TripPlan["places"][number]["accessibility"]>("unverified");
  const artifact = useMemo(
    () =>
      renderDocument(plan, documentType, new Date("2026-07-13T09:00:00+09:00")),
    [plan, documentType],
  );
  const metrics = useMemo(() => evaluatePlan(plan), [plan]);
  const mapPlaces = useMemo(() => {
    const origin = plan.places.find((place) => place.visitMinutes === 0);
    return origin ? [origin, ...plan.candidatePlaces] : plan.candidatePlaces;
  }, [plan.candidatePlaces, plan.places]);
  const selected = mapPlaces.find((place) => place.id === plan.selectedPlaceId);
  const sensitive = findSensitiveText(draft.notes);
  const focusPlace = useCallback(
    (placeId: string) => {
      const place = mapPlaces.find((candidate) => candidate.id === placeId);
      if (place) setAccessibilityStatus(place.accessibility);
      setAccessibilityNote("장소 공식 문의 또는 현장 확인 결과를 입력하세요.");
      setPlan((current) =>
        current.selectedPlaceId === placeId
          ? current
          : { ...current, selectedPlaceId: placeId },
      );
    },
    [mapPlaces],
  );

  const updateDraft = <K extends keyof ConstraintSet>(
    key: K,
    value: ConstraintSet[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const applyDraft = () => {
    try {
      const safeDraft = { ...draft, notes: redactSensitiveText(draft.notes) };
      const next = editPlanConstraints(
        plan,
        safeDraft,
        new Date("2026-07-13T09:05:00+09:00"),
      );
      setPlan(next);
      setDraft(next.constraints);
      setNotice(
        next.state === "ReadyForApproval"
          ? "검증이 완료되어 사람 승인을 기다립니다."
          : "검토가 필요한 항목이 있습니다.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "계획을 검증할 수 없습니다.",
      );
    }
  };
  const handleApprove = () => {
    try {
      const next = approvePlan(
        plan,
        "교사가 공식 재확인 책임과 계획 내용을 검토함",
        new Date("2026-07-13T09:10:00+09:00"),
      );
      setPlan(next);
      setNotice(
        "현재 버전이 사람 승인되었습니다. 문서가 최종 상태로 전환됩니다.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "승인할 수 없습니다.");
    }
  };
  const handleExclude = (placeId: string) => {
    try {
      setPlan(excludePlace(plan, placeId));
      setNotice("해당 장소와 영향을 받는 구간을 다시 계산했습니다.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "장소를 제외할 수 없습니다.",
      );
    }
  };
  const downloadMarkdown = () => {
    const url = URL.createObjectURL(
      new Blob([artifact.markdown], { type: "text/markdown;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${plan.id}-v${plan.version}-${documentType}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const printDocument = () => {
    const popup = window.open("", "_blank");
    if (!popup) {
      setNotice("팝업을 허용한 뒤 인쇄/PDF를 다시 눌러주세요.");
      return;
    }
    popup.opener = null;
    popup.addEventListener(
      "load",
      () => {
        popup.focus();
        popup.print();
      },
      { once: true },
    );
    popup.document.open();
    popup.document.write(toPrintHtml(artifact));
    popup.document.close();
  };
  const applyCandidateSelection = (placeIds: string[]) => {
    try {
      const next = selectRecommendedPlaces(
        plan,
        placeIds,
        new Date("2026-07-13T09:07:00+09:00"),
      );
      setPlan(next);
      setDraft(next.constraints);
      setNotice(
        `${placeIds.length}개 후보를 반영해 일정·이동·비용을 다시 계산했습니다.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "후보를 선택할 수 없습니다.",
      );
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            路
          </div>
          <div>
            <h1>수업로 AI</h1>
            <p>교실 밖 배움을 하나의 길로</p>
          </div>
        </div>
        <div className="status-line" aria-label="계획 상태">
          <span className="pill fixture">● FIXTURE v1</span>
          <span
            className={`pill ${plan.state === "ReadyForApproval" || plan.state === "Approved" ? "ready" : ""}`}
          >
            {plan.state}
          </span>
          <span className="pill">v{plan.version}</span>
        </div>
      </header>
      {notice && (
        <p role="status" className="notice-banner">
          {notice}
        </p>
      )}

      <nav className="mobile-step-nav" aria-label="모바일 계획 단계">
        <a href="#step-input">1 조건</a>
        <a href="#step-map">2 지도</a>
        <a href="#step-evidence">3 근거·승인</a>
      </nav>

      <div className="workspace">
        <section
          id="step-input"
          className="panel intake-panel"
          aria-labelledby="intake-title"
        >
          <div className="panel-header">
            <span className="eyebrow">01 · 수업 조건</span>
            <h2 id="intake-title">목표와 운영 제약</h2>
            <p className="panel-subtitle">
              학생 개인 정보 대신 학급 단위 조건만 입력합니다.
            </p>
          </div>
          <div className="panel-body">
            <div className="field-grid">
              <Field label="학교급">
                <select
                  value={draft.schoolLevel}
                  onChange={(event) =>
                    updateDraft(
                      "schoolLevel",
                      event.target.value as ConstraintSet["schoolLevel"],
                    )
                  }
                >
                  <option>초등학교</option>
                  <option>중학교</option>
                  <option>고등학교</option>
                </select>
              </Field>
              <Field label="학년">
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={draft.grade}
                  onChange={(event) =>
                    updateDraft("grade", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="교과">
                <input
                  value={draft.subject}
                  onChange={(event) =>
                    updateDraft("subject", event.target.value)
                  }
                />
              </Field>
              <Field label="출발지">
                <input
                  value={draft.origin}
                  onChange={(event) =>
                    updateDraft("origin", event.target.value)
                  }
                />
              </Field>
              <Field label="학습 목표" full>
                <textarea
                  rows={2}
                  value={draft.learningGoal}
                  onChange={(event) =>
                    updateDraft("learningGoal", event.target.value)
                  }
                />
              </Field>
              <Field label="날짜">
                <input
                  type="date"
                  value={draft.tripDate}
                  onChange={(event) =>
                    updateDraft("tripDate", event.target.value)
                  }
                />
              </Field>
              <Field label="교통">
                <select
                  value={draft.transportMode}
                  onChange={(event) =>
                    updateDraft(
                      "transportMode",
                      event.target.value as ConstraintSet["transportMode"],
                    )
                  }
                >
                  <option>전세버스</option>
                  <option>대중교통</option>
                  <option>도보</option>
                </select>
              </Field>
              <Field label="출발">
                <input
                  type="time"
                  value={draft.departureTime}
                  onChange={(event) =>
                    updateDraft("departureTime", event.target.value)
                  }
                />
              </Field>
              <Field label="귀교 제한">
                <input
                  type="time"
                  value={draft.returnTime}
                  onChange={(event) =>
                    updateDraft("returnTime", event.target.value)
                  }
                />
              </Field>
              <Field label="학생 수">
                <input
                  type="number"
                  min="1"
                  value={draft.participantCount}
                  onChange={(event) =>
                    updateDraft("participantCount", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="인솔자 수">
                <input
                  type="number"
                  min="1"
                  value={draft.adultCount}
                  onChange={(event) =>
                    updateDraft("adultCount", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="1인 예산">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={draft.budgetPerPerson}
                  onChange={(event) =>
                    updateDraft("budgetPerPerson", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="접근·운영 조건" full>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.wheelchairAccessRequired}
                    onChange={(event) =>
                      updateDraft(
                        "wheelchairAccessRequired",
                        event.target.checked,
                      )
                    }
                  />{" "}
                  무단차 동선 필수
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.mealRequired}
                    onChange={(event) =>
                      updateDraft("mealRequired", event.target.checked)
                    }
                  />{" "}
                  점심·휴식 포함
                </label>
              </Field>
              <Field label="메모(개인정보 입력 금지)" full>
                <textarea
                  rows={2}
                  value={draft.notes}
                  onChange={(event) => updateDraft("notes", event.target.value)}
                />
                {sensitive.length > 0 && (
                  <small role="alert">
                    ⚠ {sensitive.join(", ")} 형태를 자동 삭제합니다.
                  </small>
                )}
              </Field>
            </div>
            <div className="button-row">
              <button
                className="primary-button"
                type="button"
                onClick={applyDraft}
              >
                계획 다시 검증
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={plan.state !== "ReadyForApproval"}
                onClick={handleApprove}
              >
                교사 승인
              </button>
            </div>

            <CandidateComparison
              key={plan.version}
              plan={plan}
              onApply={applyCandidateSelection}
              onFocus={focusPlace}
            />

            <h3 className="section-title">
              일정 · 예상 {plan.projectedCostTotal.toLocaleString("ko-KR")}원
            </h3>
            <ol className="timeline">
              {plan.itinerary.map((stop) => {
                const place = plan.places.find(
                  (item) => item.id === stop.placeId,
                );
                if (!place) return null;
                return (
                  <li
                    key={stop.id}
                    className="stop-card"
                    aria-current={plan.selectedPlaceId === place.id}
                    onClick={() => focusPlace(place.id)}
                  >
                    <div className="stop-time">{stop.arrivalTime}</div>
                    <div>
                      <h3>{place.name}</h3>
                      <p>{stop.purpose}</p>
                      <div className="stop-actions">
                        <button
                          className="icon-button"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlan(togglePlaceLock(plan, place.id));
                          }}
                        >
                          {place.locked ? "🔒 잠금" : "🔓 잠금"}
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`${place.name} 위로 이동`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlan(reorderPlace(plan, place.id, -1));
                          }}
                        >
                          ↑
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`${place.name} 아래로 이동`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlan(reorderPlace(plan, place.id, 1));
                          }}
                        >
                          ↓
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleExclude(place.id);
                          }}
                        >
                          제외
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section
          id="step-map"
          className="panel map-panel"
          aria-labelledby="map-title"
        >
          <div className="panel-header">
            <span className="eyebrow">02 · 대한민국 지도</span>
            <h2 id="map-title">장소와 이동 흐름</h2>
            <p className="panel-subtitle">
              지도·카드·일정은 같은 내부 장소 ID로 연결됩니다.
            </p>
          </div>
          <MapCanvas
            places={mapPlaces}
            selectedPlaceId={plan.selectedPlaceId}
            selectedPlaceIds={plan.selectedPlaceIds}
            onSelect={focusPlace}
          />
          {selected && (
            <div className="panel-body">
              <b>{selected.name}</b>
              <p className="panel-subtitle">
                {selected.address} · 접근성 {selected.accessibility} ·{" "}
                {selected.curriculumAlignment}
              </p>
              <div className="access-record">
                <label htmlFor="accessibility-status">접근성 확인 결과</label>
                <select
                  id="accessibility-status"
                  value={accessibilityStatus}
                  onChange={(event) =>
                    setAccessibilityStatus(
                      event.target.value as typeof accessibilityStatus,
                    )
                  }
                >
                  <option value="verified-accessible">접근 가능 확인</option>
                  <option value="verified-not-accessible">
                    접근 불가 확인
                  </option>
                  <option value="unverified">미확인</option>
                </select>
                <label htmlFor="accessibility-note">확인 근거</label>
                <input
                  id="accessibility-note"
                  value={accessibilityNote}
                  onChange={(event) => setAccessibilityNote(event.target.value)}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    try {
                      const next = recordAccessibilityEvidence(
                        plan,
                        selected.id,
                        accessibilityStatus,
                        accessibilityNote,
                      );
                      setPlan(next);
                      setNotice(
                        "접근성 확인 근거를 새 계획 버전에 기록했습니다.",
                      );
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : "접근성 근거를 기록할 수 없습니다.",
                      );
                    }
                  }}
                >
                  접근성 근거 기록
                </button>
              </div>
            </div>
          )}
        </section>

        <section
          id="step-evidence"
          className="panel evidence-panel"
          aria-labelledby="evidence-title"
        >
          <div className="panel-header">
            <span className="eyebrow">03 · 근거와 승인</span>
            <h2 id="evidence-title">확인 가능한 판단</h2>
            <p className="panel-subtitle">
              확정·추정·미확인을 분리하고 출처 시각을 남깁니다.
            </p>
          </div>
          <div className="panel-body">
            <div>
              <h3 className="section-title">검증 항목</h3>
              <ul className="warning-list">
                {plan.findings.map((finding) => (
                  <li
                    className={`warning-card ${finding.blocking ? "blocking" : ""}`}
                    key={finding.id}
                  >
                    <strong>
                      {finding.blocking ? "⛔ 차단" : "⚠ 확인"} ·{" "}
                      {finding.ruleId}
                    </strong>
                    <p>
                      {finding.message}
                      <br />
                      다음 행동: {finding.recommendedAction}
                    </p>
                  </li>
                ))}
              </ul>
              <h3 className="section-title">핵심 지표</h3>
              <div className="metrics">
                <Metric
                  value={`${Math.round(metrics.hardConstraintPassRate * 100)}%`}
                  label="필수 제약 통과"
                />
                <Metric
                  value={`${Math.round(metrics.sourceCoverage * 100)}%`}
                  label="출처 연결률"
                />
                <Metric
                  value={String(metrics.unresolvedFactCount)}
                  label="미확인 사실"
                />
                <Metric
                  value={`${Math.round(metrics.toolSuccessRate * 100)}%`}
                  label="도구 성공률"
                />
              </div>
            </div>
            <div>
              <h3 className="section-title">출처</h3>
              <ul className="evidence-list">
                {plan.evidence.slice(0, 6).map((item) => (
                  <li className="evidence-card" key={item.id}>
                    <strong>
                      {item.label}{" "}
                      <span className="data-mode">{item.mode}</span>
                    </strong>
                    <p>
                      {item.provider} · {item.status}
                      <br />
                      조회 {item.retrievedAt}
                    </p>
                  </li>
                ))}
              </ul>
              <h3 className="section-title">에이전트 실행 추적</h3>
              <ul className="evidence-list">
                {plan.runs
                  .flatMap((run) => run.toolCalls)
                  .map((call) => (
                    <li className="evidence-card" key={call.id}>
                      <strong>
                        {call.success ? "✓" : "✕"} {call.toolName}{" "}
                        <span className="data-mode">{call.dataMode}</span>
                      </strong>
                      <p>
                        {call.stage} · {call.durationMs}ms · {call.summary}
                      </p>
                    </li>
                  ))}
              </ul>
              <h3 className="section-title print-title">문서 미리보기</h3>
              <div className="document-tabs">
                {(
                  [
                    "teacher-plan",
                    "student-worksheet",
                    "parent-notice",
                    "school-application-draft",
                  ] as const
                ).map((type) => (
                  <button
                    type="button"
                    aria-pressed={type === documentType}
                    onClick={() => setDocumentType(type)}
                    key={type}
                  >
                    {type === "teacher-plan"
                      ? "운영계획서"
                      : type === "student-worksheet"
                        ? "활동지"
                        : type === "parent-notice"
                          ? "안내문"
                          : "학교 신청서 초안"}
                  </button>
                ))}
              </div>
              <pre className="document-preview">{artifact.markdown}</pre>
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={downloadMarkdown}
                >
                  Markdown 저장
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={printDocument}
                >
                  인쇄/PDF 열기
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const items = Children.toArray(children);
  const controlIndex = items.findIndex(
    (child) =>
      isValidElement(child) &&
      typeof child.type === "string" &&
      ["input", "select", "textarea"].includes(child.type),
  );
  if (controlIndex >= 0 && isValidElement(items[controlIndex])) {
    items[controlIndex] = cloneElement(
      items[controlIndex] as React.ReactElement<{ id?: string }>,
      { id },
    );
  }
  return (
    <div className={`field ${full ? "full" : ""}`}>
      {controlIndex >= 0 ? (
        <label htmlFor={id}>{label}</label>
      ) : (
        <span className="field-label">{label}</span>
      )}
      {items}
    </div>
  );
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="metric">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
