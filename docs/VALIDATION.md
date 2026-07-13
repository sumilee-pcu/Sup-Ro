# 구현 검증 기록

검증 기준: 2026-07-14, Apple Silicon macOS 로컬 환경, Node.js 26.0.0. 지원 기준 버전은 Node.js 22.19.0 이상이며 Windows 11 물리 장비 검증은 외부 게이트로 남아 있다.

## PRD 인수조건 매핑

| 인수조건             | 구현·테스트 증거                                 | 상태 |
| -------------------- | ------------------------------------------------ | ---- |
| AC-001 정상 계획     | 대표 fixture의 일정 4개·교육과정·예산·출처 생성  | PASS |
| AC-002 운영시간 충돌 | `OPERATING_HOURS` 차단 단위 테스트               | PASS |
| AC-003 예산 초과     | `BUDGET_LIMIT` 차단과 대안 행동                  | PASS |
| AC-004 접근성 근거   | `ACCESSIBILITY_EVIDENCE` 차단                    | PASS |
| AC-005 우천 대안     | 실내 중심 우천 대안·변경 시 재계산 함수          | PASS |
| AC-006 API 장애      | 실패를 기록하고 명시적 fixture로만 전환          | PASS |
| AC-007 사람 승인     | 차단 상태 승인 거부, 편집 시 새 미승인 버전      | PASS |
| AC-008 문서 내보내기 | 3종 Markdown·인쇄 HTML, 계획 버전·출처·지도 참조 | PASS |

## 자동 검증 명령

| 명령                         | 기대 증거                               |
| ---------------------------- | --------------------------------------- |
| `pnpm format:check`          | 변경 없이 포맷 확인                     |
| `pnpm lint`                  | 오류·경고 0건                           |
| `pnpm typecheck`             | TypeScript 오류 0건                     |
| `pnpm test`                  | 9개 파일, 21개 자동 테스트 PASS         |
| `pnpm smoke:fixture`         | `SUPRO_FIXTURE_SMOKE_PASS`              |
| `pnpm evaluate`              | `SUPRO_EVALUATION_PASS 12/12`           |
| `pnpm build`                 | `/` 정적 페이지와 3개 API 라우트 빌드   |
| `pnpm validate:openspec`     | strict 1/1 PASS                         |
| `pnpm preflight:publication` | staged 공개검사 PASS, 승인된 origin 1개 |

## 실제 브라우저 검증

- Next.js 개발 서버 준비: 161ms
- 데스크톱 3패널: 조건·지도·근거 패널과 fixture 상태 표시 확인
- 예산 1,000원 입력: `BUDGET_LIMIT`, `NeedsReview`, 승인 버튼 비활성 확인
- 예산 30,000원 복구: `ReadyForApproval`, 승인 버튼 활성 확인
- 교사 승인: `Approved`, 문서 `승인본`, 초안 문구 제거 확인
- 390×844 viewport: 작업공간 block 전환, 지도 대체 목록 표시, 패널 347px, 가로 overflow 없음
- 브라우저 console warning/error: 0건

## 로컬 릴리스 후보

- 전체 품질 게이트 `pnpm check`: PASS
- 첫 구현 커밋: `2e5ba4f` (`feat: build fixture-first field trip coordinator`)
- staged-tree 공개 검사: 86개 파일 PASS
- Git remote: 승인된 `origin` 1개, 아직 push하지 않음
- 영문 브랜드·패키지·환경변수·fixture URI를 `Sup-Ro AI`/`sup-ro`/`SUPRO`로 일괄 변경 후 동일 품질 게이트를 재실행했다.
- 로컬 Git 작성자 이메일은 공개 개인정보 노출을 피하기 위해 저장소 전용 noreply 값을 사용했다. GitHub 계정 귀속이 필요하면 게시 전에 커밋 작성자를 사용자의 확인된 noreply 주소로 재작성한다.

## 미검증 경계

- Kakao·공공데이터 실키의 응답, 쿼터, 비용, 등록 도메인
- 실제 장소 운영시간·가격·접근성·차량 동선
- Windows 11 물리 장비의 설치·브라우저·성능
- 학교 공식 양식의 출력 정합성과 공개 라이선스 범위
- GitHub Actions의 원격 실행 결과
