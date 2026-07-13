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

현재 단계에서는 배포를 실행하지 않는다. 게시 승인을 받은 뒤에도 먼저 태그된 로컬 커밋에서 빌드하고, 오류 시 직전 검증 커밋으로 애플리케이션을 되돌린 뒤 데이터베이스는 별도 마이그레이션·백업 절차로 처리한다.

공개 배포 URL이 정해지면 Kakao JavaScript 키에 해당 HTTPS 도메인만 추가한다. 서버가 고정 송신 IP를 제공하면 REST 키의 허용 IP를 그 주소로 제한한다. 배포 환경에는 `.env.local`을 업로드하지 않고 호스팅 서비스의 secret 저장소를 사용한다.
