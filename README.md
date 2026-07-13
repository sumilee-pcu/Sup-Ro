# 수업로 AI

수업로 AI(SueopRo AI)는 교실 밖 배움의 목표, 장소, 이동, 안전, 접근성을 하나의 경로로 연결하는 교육과정 기반 지리공간 에이전트 플랫폼입니다.

첫 번째 서비스는 교육과정 성취기준, 학년, 출발지, 시간, 예산, 안전, 접근성 조건을 함께 고려해 체험학습 장소와 일정을 설계하는 AI 체험학습 코디네이터입니다.

현재 저장소는 외부 API 키 없이 완주하는 **fixture-first 로컬 MVP**입니다. 실제 장소·경로·기상 정보로 오인되지 않도록 모든 시연 데이터에 모드, 출처, 조회 시각, 확인 상태를 표시합니다.

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
pnpm install --frozen-lockfile
pnpm dev
```

브라우저에서 `http://localhost:3000`을 열면 대표 중2 과학 생태계 계획이 fixture 모드로 표시됩니다.

## 검증

```bash
pnpm test
pnpm smoke:fixture
pnpm evaluate
pnpm build
pnpm validate:openspec
```

전체 로컬 게이트는 `pnpm check`로 실행합니다. 평가 결과는 `reports/generated/`에 생성되며 Git에는 포함하지 않습니다.

## 외부 연동

`.env.example`을 `.env.local`로 복사할 수 있습니다. 기본 `SUEOPRO_DATA_MODE=fixture`에서는 키가 전혀 필요하지 않습니다. `NEXT_PUBLIC_` 접두사가 붙은 Kakao JavaScript 키만 브라우저에 포함될 수 있으며 REST·모델 키는 서버 전용입니다.

라이브 연동 활성화, 상표·도메인 확정, 공개 라이선스 선택, Windows 11 실기기 검증, GitHub 원격 생성과 push는 소유자 승인 게이트로 남겨 두었습니다.

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
