"use client";

import { useMemo, useState } from "react";
import type { TripPlan } from "@/modules/plans/types";

const eligibilityLabel = {
  eligible: "추천 가능",
  review: "확인 후 선택",
  blocked: "선택 불가",
} as const;

export function CandidateComparison({
  plan,
  onApply,
  onFocus,
}: {
  plan: TripPlan;
  onApply: (placeIds: string[]) => void;
  onFocus: (placeId: string) => void;
}) {
  const [draftIds, setDraftIds] = useState(plan.selectedPlaceIds);
  const [message, setMessage] = useState("");
  const candidates = useMemo(
    () =>
      plan.recommendations.flatMap((recommendation) => {
        const place = plan.candidatePlaces.find(
          (candidate) => candidate.id === recommendation.placeId,
        );
        return place ? [{ place, recommendation }] : [];
      }),
    [plan.candidatePlaces, plan.recommendations],
  );
  const selectedCandidates = candidates.filter(({ place }) =>
    draftIds.includes(place.id),
  );

  const toggle = (placeId: string, checked: boolean) => {
    if (checked && draftIds.length >= 3) {
      setMessage("후보는 최대 3곳까지 선택할 수 있습니다.");
      return;
    }
    setDraftIds((current) =>
      checked ? [...current, placeId] : current.filter((id) => id !== placeId),
    );
    setMessage("");
  };

  return (
    <section className="candidate-comparison" aria-labelledby="candidate-title">
      <div className="candidate-heading">
        <div>
          <span className="eyebrow">AI 후보 추천 · FIXTURE</span>
          <h3 id="candidate-title">추천 후보 비교·선택</h3>
        </div>
        <span className="selection-count">{draftIds.length}/3곳</span>
      </div>
      <p className="panel-subtitle">
        교육과정, 거리, 비용, 접근성, 날씨 대안을 같은 기준으로 계산했습니다.
        실제 예약 전 공식 정보를 다시 확인하세요.
      </p>

      <div className="candidate-grid">
        {candidates.map(({ place, recommendation }) => {
          const mandatory = plan.constraints.mandatoryPlaceIds.includes(
            place.id,
          );
          const checked = draftIds.includes(place.id);
          const blocked = recommendation.eligibility === "blocked";
          return (
            <article
              className={`candidate-card ${recommendation.eligibility}`}
              key={place.id}
            >
              <div className="candidate-card-top">
                <span className="candidate-rank">{recommendation.rank}위</span>
                <span className={`eligibility ${recommendation.eligibility}`}>
                  {eligibilityLabel[recommendation.eligibility]}
                </span>
              </div>
              <button
                type="button"
                className="candidate-focus"
                onClick={() => onFocus(place.id)}
              >
                <strong>{place.name}</strong>
                <span>
                  {place.category} · 추천점수 {recommendation.score}/100
                </span>
              </button>
              <p>{place.curriculumAlignment}</p>
              <ul>
                {recommendation.reasons.slice(0, 2).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
                {recommendation.caveats.slice(0, 1).map((caveat) => (
                  <li className="candidate-caveat" key={caveat}>
                    확인: {caveat}
                  </li>
                ))}
              </ul>
              <label className="candidate-select">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={blocked || mandatory}
                  onChange={(event) => toggle(place.id, event.target.checked)}
                />
                {mandatory
                  ? "필수 장소"
                  : blocked
                    ? "제약 미충족"
                    : "일정에 선택"}
              </label>
            </article>
          );
        })}
      </div>

      {selectedCandidates.length > 0 && (
        <div className="comparison-scroll" tabIndex={0}>
          <table>
            <caption>선택 후보 핵심 비교</caption>
            <thead>
              <tr>
                <th scope="col">장소</th>
                <th scope="col">입장비</th>
                <th scope="col">체류</th>
                <th scope="col">접근성</th>
                <th scope="col">실내</th>
              </tr>
            </thead>
            <tbody>
              {selectedCandidates.map(({ place }) => (
                <tr key={place.id}>
                  <th scope="row">{place.name}</th>
                  <td>{place.costPerStudent.toLocaleString("ko-KR")}원</td>
                  <td>{place.visitMinutes}분</td>
                  <td>{accessibilityText(place.accessibility)}</td>
                  <td>{place.isIndoor ? "예" : "아니요"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <p className="candidate-message" role="alert">
          {message}
        </p>
      )}
      <button
        className="primary-button candidate-apply"
        type="button"
        disabled={draftIds.length < 1 || draftIds.length > 3}
        onClick={() => onApply(draftIds)}
      >
        선택한 후보로 일정 다시 만들기
      </button>
    </section>
  );
}

function accessibilityText(
  status: TripPlan["candidatePlaces"][number]["accessibility"],
): string {
  if (status === "verified-accessible") return "확인됨";
  if (status === "verified-not-accessible") return "접근 불가";
  return "미확인";
}
