# 로컬 운영과 장애 대응

## 요구 환경

- Node.js 22.19.0 이상
- pnpm 11.1.2
- Chrome 또는 Edge 최신 안정 버전
- Docker·WSL 불필요

## 설치와 실행

macOS/Linux:

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

기본값은 외부 네트워크나 API 키가 필요 없는 `fixture` 모드다. 프로덕션 빌드는 `pnpm build` 후 `pnpm start`로 실행한다.

## 환경 변수

| 변수                            | 공개 여부     | 기본/역할                                        |
| ------------------------------- | ------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 브라우저 공개 | 비어 있으면 접근 가능한 fixture 지도             |
| `KAKAO_REST_API_KEY`            | 서버 전용     | Kakao Local 라이브 검색                          |
| `KAKAO_MOBILITY_REST_API_KEY`   | 서버 전용     | 라이브 경로                                      |
| `OPENAI_API_KEY`                | 서버 전용     | 선택적 모델 공급자, 현재 fixture 데모에는 불필요 |
| `SUEOPRO_DATA_MODE`             | 서버 설정     | `fixture`, `cache`, `live`                       |
| `SUEOPRO_DATABASE_PATH`         | 서버 설정     | 기본 `.data/sueop-ro.sqlite`                     |

## 백업과 초기화

1. 서버를 중지한다.
2. `.data/sueop-ro.sqlite`, `-wal`, `-shm` 파일을 같은 시점에 복사한다.
3. fixture는 Git 버전으로 복구한다.
4. 로컬 계획을 완전히 초기화하려면 서버 중지 후 `.data/`를 별도 백업하고 삭제한 뒤 다시 실행한다.

실제 운영 데이터가 생긴 뒤에는 자동 삭제 스크립트를 사용하지 않고 백업 존재와 보존기간을 먼저 확인한다.

## 장애별 대응

| 증상               | 확인                           | 대응                                         |
| ------------------ | ------------------------------ | -------------------------------------------- |
| 지도 공백          | 공개 JavaScript 키·등록 도메인 | fixture 지도 목록으로 계속 사용              |
| 장소·경로 401/403  | 서버 키·앱 권한                | 키를 클라이언트로 옮기지 말고 fixture로 롤백 |
| 쿼터 초과          | 공급자 대시보드·비용 상한      | 라이브 중지, 호환 캐시 또는 fixture 표시     |
| 경로 일부 누락     | `UNRESOLVED_ROUTE`             | 승인 차단, 수동 확인 또는 재조회             |
| 휴관·접근성 미확인 | 차단 finding                   | 공식 문의 근거를 기록한 뒤 재검증            |
| DB 손상            | 서버 중지·백업 확인            | 최근 일관 백업 복원, fixture 스모크 재실행   |

## fixture 롤백

macOS/Linux:

```bash
SUEOPRO_DATA_MODE=fixture pnpm dev
```

Windows PowerShell:

```powershell
$env:SUEOPRO_DATA_MODE="fixture"
pnpm dev
```

롤백 후 화면 상단 `FIXTURE v1`과 각 출처의 `fixture` 표시를 확인한다. fixture 결과를 실제 최신 정보로 소개하면 안 된다.

## 배포와 되돌리기

현재 단계에서는 배포를 실행하지 않는다. 게시 승인을 받은 뒤에도 먼저 태그된 로컬 커밋에서 빌드하고, 오류 시 직전 검증 커밋으로 애플리케이션을 되돌린 뒤 데이터베이스는 별도 마이그레이션·백업 절차로 처리한다.
