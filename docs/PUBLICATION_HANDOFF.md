# GitHub 게시·Windows 인수인계 — Sup-Ro

## 권장 저장소 설정

| 항목        | 값                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------- |
| 저장소      | [`sumilee-pcu/Sup-Ro`](https://github.com/sumilee-pcu/Sup-Ro)                                      |
| 기본 브랜치 | `main` — 첫 push 시 생성                                                                           |
| 설명        | 교육과정·대한민국 지도·안전 근거를 연결하는 fixture-first AI 체험학습 코디네이터                   |
| 토픽        | `education`, `field-trip`, `geospatial`, `ai-agent`, `nextjs`, `korea`, `curriculum`, `typescript` |
| 공개 범위   | Public — 2026-07-14 소유자 생성 확인                                                               |

## 소유자가 나중에 할 최소 작업

1. `수업로 AI(Sup-Ro AI)` 상표·도메인·앱스토어 이름 최종 확인
2. 현재 모든 권리 유보를 유지할지, 별도 오픈소스 라이선스를 적용할지 결정
3. Windows 11 실기기에서 fixture 데모를 한 번 실행해 결과를 전달

Kakao 앱 생성, localhost 도메인, 지도 활성화, 로컬 키 저장, SDK·Local 실호출 검증은 완료했다. 공개 URL이 생긴 뒤 Kakao 콘솔에 HTTPS 도메인을 추가하는 작업은 배포 단계에서 처리한다. 2026-07-21 경로 API 최종 명세 확인과 코드 반영도 유료 기능을 켜지 않는 범위에서는 에이전트가 계속 진행할 수 있다.

## 연결 상태와 게시 명령

로컬 `origin`은 소유자가 지정한 빈 저장소에만 연결한다.

```bash
git remote add origin https://github.com/sumilee-pcu/Sup-Ro.git
```

초기 공개 업로드는 2026-07-14 소유자 승인을 받았으며 다음 명령을 사용한다.

```bash
git push -u origin main
```

실제 키와 `.env.local`은 업로드하지 않는다. push 후 원격 `main`의 커밋과 GitHub Actions의 Ubuntu·Windows 결과를 다시 확인한다.

## 로컬 전달 상태

- 기준 구현 커밋: `2e5ba4f`
- 브랜치: `main`
- staged-tree 사전검사: PASS
- remote: `origin` → `https://github.com/sumilee-pcu/Sup-Ro.git`
- 원격 상태: Public, 초기 `main` 게시 승인 완료
- 전체 자동 품질 게이트: PASS
- Kakao Maps SDK·Local API 실호출: PASS, 키는 ignored `.env.local`에만 보관
- GitHub 계정 귀속 전용 noreply 주소는 소유자가 확인 후 필요할 때 재작성

## 게시 검증

1. GitHub Actions `ci` 전체 통과 확인
2. 저장소 설명·토픽·기본 브랜치 확인
3. 비밀 스캔과 Dependabot 정책 결정
4. Windows에서 `powershell -ExecutionPolicy Bypass -File .\scripts\windows-verify.ps1` 실행
5. Kakao 키를 추가한다면 저장소 변수가 아니라 배포 환경의 secret에 저장
6. 라이브 모드 활성화 전 `docs/PROVIDER_POLICY.md` 체크리스트 완료
