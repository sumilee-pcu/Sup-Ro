# 수업로 AI

수업로 AI(Sup-Ro AI)는 교실 밖 배움의 목표, 장소, 이동, 안전, 접근성을 하나의 경로로 연결하는 교육과정 기반 지리공간 에이전트 플랫폼입니다.

첫 번째 서비스는 교육과정 성취기준, 학년, 출발지, 시간, 예산, 안전, 접근성 조건을 함께 고려해 체험학습 장소와 일정을 설계하는 AI 체험학습 코디네이터입니다.

현재 저장소는 외부 API 키 없이 완주하는 **fixture-first 공개 MVP**입니다. 실제 장소·경로·기상 정보로 오인되지 않도록 모든 시연 데이터에 모드, 출처, 조회 시각, 확인 상태를 표시합니다.

**공개 데모:** [https://sup-ro.vercel.app](https://sup-ro.vercel.app)

공개 데모는 Kakao 지도를 표시하지만 계획·장소·경로·기상·안전 데이터는 `FIXTURE v1` 합성 시나리오입니다. 예약·결제·실시간 위치 추적은 수행하지 않습니다.

## 구현된 흐름

1. 학교급·교과·학습목표·시간·예산·접근성 조건 입력
2. 교육과정·장소·경로·기상·안전 fixture 수집
3. 결정적 코드로 일정, 운영시간, 비용, 접근성, 출처 검증
4. 지도·일정·근거의 3패널 검토와 장소 선택 동기화
5. 사람 승인 후 운영계획서·활동지·보호자 안내문 생성
6. 12개 합성 시나리오 평가와 실행 근거 기록

언어모델은 향후 후보 설명에 사용할 수 있지만 승인 상태, 시간·예산 계산, 예약·결제·메시지·셸 실행을 변경할 수 없습니다.

## 빠른 시작

필수 환경은 Node.js 22.19.0 이상과 pnpm 11.1.2입니다. Docker는 필요하지 않습니다.

macOS/Linux:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Windows PowerShell:

```powershell
git clone https://github.com/sumilee-pcu/Sup-Ro.git
Set-Location Sup-Ro
powershell -ExecutionPolicy Bypass -File .\scripts\windows-verify.ps1
corepack pnpm dev
```

브라우저에서 `http://localhost:3000`을 열면 대표 중2 과학 생태계 계획이 fixture 모드로 표시됩니다.

Windows 검증 스크립트는 Node·pnpm 버전, 의존성 잠금, 포맷, lint, 타입, 21개 테스트, 12개 평가 시나리오, 프로덕션 빌드와 실제 HTTP 200 응답을 한 번에 확인합니다. API 키가 없어도 fixture 데모는 완주됩니다.

## 검증

```bash
pnpm test
pnpm smoke:fixture
pnpm smoke:http
pnpm evaluate
pnpm build
pnpm validate:openspec
```

전체 로컬 게이트는 `pnpm check`로 실행합니다. 평가 결과는 `reports/generated/`에 생성되며 Git에는 포함하지 않습니다.

## 외부 연동

`.env.example`을 `.env.local`로 복사할 수 있습니다. 기본 `SUPRO_DATA_MODE=fixture`에서는 키가 전혀 필요하지 않습니다. `NEXT_PUBLIC_` 접두사가 붙은 Kakao JavaScript 키만 브라우저에 포함될 수 있으며 REST·모델 키는 서버 전용입니다.

Kakao localhost와 공개 HTTPS 도메인의 지도 표시를 검증했으며 실제 키는 GitHub에 포함하지 않습니다. 배포 환경에는 JavaScript 지도 키와 `SUPRO_DATA_MODE=fixture`만 설정했고, 서버용 REST 키·유료 API·BizWallet은 활성화하지 않았습니다. 공개 라이선스 선택, 지정 Windows 11 물리 장비 검증, 2026-07-21 경로 API 최종 반영은 후속 게이트입니다. GitHub Actions는 Ubuntu와 Windows Server에서 동일한 품질 게이트를 실행합니다.

## 문서

- `docs/PRD.md`: 제품 요구사항 정의서
- `docs/NAMING.md`: 제품명 결정과 충돌 조사
- `docs/EXECUTION_PLAN.md`: 무승인 실행 단계와 승인 게이트
- `docs/CURRICULUM_SOURCES.md`: 교육과정 출처와 지원 범위
- `docs/PROVIDER_POLICY.md`: 지도·공공데이터 연동 정책 메모
- `docs/OPERATIONS.md`: 로컬 운영, 초기화, 장애 대응
- `docs/DEMO_SCRIPT.md`: 대표 3분 데모 진행 순서
- `docs/VALIDATION.md`: 인수조건과 자동 검증 증거
- `docs/PUBLICATION_HANDOFF.md`: GitHub 게시 직전 인수인계
- `openspec/changes/build-ai-field-trip-coordinator-mvp/`: 구현 제안, 설계, 기능 명세, 작업 목록
