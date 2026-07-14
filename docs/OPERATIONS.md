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
git clone https://github.com/sumilee-pcu/Sup-Ro.git
Set-Location Sup-Ro
powershell -ExecutionPolicy Bypass -File .\scripts\windows-verify.ps1
corepack pnpm dev
```

기본값은 외부 네트워크나 API 키가 필요 없는 `fixture` 모드다. 프로덕션 빌드는 `pnpm build` 후 `pnpm start`로 실행한다.

`windows-verify.ps1`은 기존 `.env.local`을 덮어쓰지 않는다. 파일이 없을 때만 키가 비어 있는 fixture 설정을 복사하고, `pnpm check`와 빌드된 서버의 HTTP 스모크를 실행한다. 완료 후 Chrome 또는 Edge에서 `http://localhost:3000`을 연다.

## 환경 변수

| 변수                            | 공개 여부     | 기본/역할                                        |
| ------------------------------- | ------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 브라우저 공개 | 비어 있으면 접근 가능한 fixture 지도             |
| `SUPRO_KAKAO_SDK_REFERER`       | 공개 설정     | 라이브 스모크용 등록 도메인, 기본 localhost      |
| `KAKAO_REST_API_KEY`            | 서버 전용     | Kakao Local 라이브 검색                          |
| `KAKAO_MOBILITY_REST_API_KEY`   | 서버 전용     | 라이브 경로                                      |
| `OPENAI_API_KEY`                | 서버 전용     | 선택적 모델 공급자, 현재 fixture 데모에는 불필요 |
| `SUPRO_DATA_MODE`               | 서버 설정     | `fixture`, `cache`, `live`                       |
| `SUPRO_DATABASE_PATH`           | 서버 설정     | 기본 `.data/sup-ro.sqlite`                       |

현재 로컬 머신에는 Kakao JavaScript·REST 키가 `.env.local`에만 설정되어 있다. 이 파일은 `.gitignore` 대상이며 키 값을 문서, 이슈, 스크린샷, 클라이언트 오류에 복사하지 않는다. 라이브 연결만 재확인할 때는 개발 서버를 띄우지 않고 다음 명령을 실행한다.

```bash
pnpm smoke:kakao
```

이 명령은 등록된 localhost Referer로 지도 SDK를 한 번, Local 키워드 검색을 한 번 호출하고 상태와 결과 개수만 출력한다. 유료 기능을 활성화하거나 키 값을 출력하지 않는다.

## 백업과 초기화

1. 서버를 중지한다.
2. `.data/sup-ro.sqlite`, `-wal`, `-shm` 파일을 같은 시점에 복사한다.
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
SUPRO_DATA_MODE=fixture pnpm dev
```

Windows PowerShell:

```powershell
$env:SUPRO_DATA_MODE="fixture"
pnpm dev
```

롤백 후 화면 상단 `FIXTURE v1`과 각 출처의 `fixture` 표시를 확인한다. fixture 결과를 실제 최신 정보로 소개하면 안 된다.

## 배포와 되돌리기

공개 fixture 데모는 2026-07-14 Vercel Hobby 프로젝트 `sup-ro`에 배포했다.

- 운영 URL: `https://sup-ro.vercel.app`
- Git 연결: `sumilee-pcu/Sup-Ro`의 `main`
- 환경변수: `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`, `SUPRO_DATA_MODE=fixture`
- 데이터 경계: 서버 영속 저장소 없이 요청·응답 기반 fixture 데모만 제공
- 비활성 범위: REST 키, 라이브 경로·공공데이터, 유료 API, BizWallet

오류 시 Vercel의 직전 성공 배포를 Production으로 승격하거나 검증된 직전 Git 커밋을 재배포한다. 현재 공개 경로에는 영속 데이터베이스가 없으므로 데이터 마이그레이션 롤백은 적용되지 않는다.

Kakao JavaScript 키에는 `https://sup-ro.vercel.app`과 로컬 개발용 `http://localhost:3000`을 등록했다. 서버 REST 키는 배포하지 않았으므로 송신 IP 등록 대상이 아니다. 배포 환경에는 `.env.local` 전체를 업로드하지 않고 필요한 공개 지도 키와 fixture 모드만 Vercel 환경변수로 등록했다.
