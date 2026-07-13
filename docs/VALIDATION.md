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

| 명령                         | 기대 증거                                  |
| ---------------------------- | ------------------------------------------ |
| `pnpm format:check`          | 변경 없이 포맷 확인                        |
| `pnpm lint`                  | 오류·경고 0건                              |
| `pnpm typecheck`             | TypeScript 오류 0건                        |
| `pnpm test`                  | 9개 파일, 21개 자동 테스트 PASS            |
| `pnpm smoke:fixture`         | `SUPRO_FIXTURE_SMOKE_PASS`                 |
| `pnpm smoke:http`            | 빌드 서버 HTTP 200과 `FIXTURE v1` 표식     |
| `pnpm smoke:kakao`           | 로컬 비밀키로 SDK·Local 각 1회 라이브 검증 |
| `pnpm evaluate`              | `SUPRO_EVALUATION_PASS 12/12`              |
| `pnpm build`                 | `/` 정적 페이지와 3개 API 라우트 빌드      |
| `pnpm validate:openspec`     | strict 1/1 PASS                            |
| `pnpm preflight:publication` | staged 공개검사 PASS, 승인된 origin 1개    |

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
- Git remote: 승인된 `origin` 1개, 2026-07-14 초기 게시 승인 완료
- 영문 브랜드·패키지·환경변수·fixture URI를 `Sup-Ro AI`/`sup-ro`/`SUPRO`로 일괄 변경 후 동일 품질 게이트를 재실행했다.
- 로컬 Git 작성자 이메일은 공개 개인정보 노출을 피하기 위해 저장소 전용 noreply 값을 사용했다. GitHub 계정 귀속이 필요하면 게시 전에 커밋 작성자를 사용자의 확인된 noreply 주소로 재작성한다.
- GitHub Actions는 `ubuntu-latest`와 `windows-latest`에서 같은 테스트·빌드·HTTP 스모크를 실행하도록 구성했다. 이는 자동 Windows 호환성 증거이며 지정 물리 장비 검증을 대체하지 않는다.

## GitHub Actions Windows 자동 검증

- [CI 실행 29290164853](https://github.com/sumilee-pcu/Sup-Ro/actions/runs/29290164853)에서 Ubuntu와 Windows 작업이 모두 성공했다.
- Windows Server 2025 러너에서 Node.js 22.19.0·pnpm 11.1.2 설치, 테스트 9개 파일·21개 케이스, fixture 스모크, 평가 12/12, Next.js 프로덕션 빌드, OpenSpec strict 검증이 통과했다.
- 빌드 서버가 `SUPRO_HTTP_SMOKE_PASS platform=win32 http=200 fixture=true`를 반환했고 원클릭 스크립트가 `SUPRO_WINDOWS_READY`를 반환했다.
- 이 결과는 Windows 코드·셸·줄바꿈·빌드·HTTP 호환성 증거다. 지정 물리 장비의 Chrome/Edge 화면·성능 검증은 별도 게이트로 유지한다.

## Kakao Maps·Local 라이브 설정

- 2026-07-14 `Sup-Ro` 개발자 앱을 교육 카테고리로 생성하고 지도 제품을 활성화했다.
- 대시보드에서 확인된 기존 앱 3개는 지도 기능이 모두 꺼져 있어 `Sup-Ro`가 현재 계정의 첫 번째이자 유일한 지도 활성 앱이다.
- JavaScript 키에는 `http://localhost:3000`만 등록했고 REST 키에는 로컬 동적 IP 제한을 걸지 않았다. 유료 API와 BizWallet은 활성화하지 않았다.
- 실제 키는 Git에서 제외된 `.env.local`에만 저장했고 추적 파일·문서·로그에는 값을 기록하지 않았다.
- `pnpm dev`는 `.env.local`을 읽어 로컬 HTTP 200을 반환했고, 렌더링 HTML에는 Kakao 지도 컨테이너와 fixture 데이터 모드가 함께 확인됐다.
- `pnpm smoke:kakao`와 동등한 1회 검증에서 등록 도메인 Referer의 Maps SDK가 HTTP 200·3,898바이트를 반환했고 Local 키워드 검색도 HTTP 200·결과 1건을 반환했다.
- 이 실행 환경의 브라우저 보안 클라이언트가 localhost 화면 접근을 차단해 실제 지도 타일의 시각 렌더링은 아직 증거로 남기지 못했다. SDK 수신·REST 응답·서버 HTML 계약까지는 확인했다.

## 미검증 경계

- 공개 HTTPS 도메인에서의 Kakao 지도 타일 시각 렌더링과 2026-07-21 경로 API 최종 명세
- Kakao 외 공공데이터 실키의 응답, 쿼터, 비용, 등록 도메인
- 실제 장소 운영시간·가격·접근성·차량 동선
- Windows 11 물리 장비의 설치·브라우저·성능
- 학교 공식 양식의 출력 정합성과 공개 라이선스 범위
- 지정 물리 장비의 Windows 11·Chrome/Edge 실행 결과
