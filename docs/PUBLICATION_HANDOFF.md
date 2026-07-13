# GitHub 게시 인수인계

## 권장 저장소 설정

| 항목        | 값                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------- |
| 저장소 이름 | `sueop-ro`                                                                                         |
| 기본 브랜치 | `main`                                                                                             |
| 설명        | 교육과정·대한민국 지도·안전 근거를 연결하는 fixture-first AI 체험학습 코디네이터                   |
| 토픽        | `education`, `field-trip`, `geospatial`, `ai-agent`, `nextjs`, `korea`, `curriculum`, `typescript` |
| 공개 범위   | 라이선스와 브랜드 확인 전에는 private 권장                                                         |

## 게시 전 소유자 결정

1. `수업로 AI` 상표·도메인·앱스토어·GitHub 이름 최종 확인
2. private 또는 public 선택
3. 현재 모든 권리 유보를 유지할지, 별도 오픈소스 라이선스를 적용할지 결정
4. 민감한 기관명·학교 양식·실제 API 키를 넣지 않았는지 마지막 확인
5. Windows 11 실기기 검증을 게시 전 또는 게시 직후 게이트로 둘지 결정

## 게시 명령 — 승인 후에만 실행

GitHub CLI로 새 private 저장소를 만드는 예:

```bash
gh repo create sueop-ro --private --source=. --remote=origin --push
```

기존 빈 저장소를 연결하는 예:

```bash
git remote add origin git@github.com:OWNER/sueop-ro.git
git push -u origin main
```

현재 로컬 준비 단계에서는 위 명령을 실행하지 않는다. `git remote -v`가 비어 있어야 한다.

## 게시 직후

1. GitHub Actions `ci` 전체 통과 확인
2. 저장소 설명·토픽·기본 브랜치 확인
3. 비밀 스캔과 Dependabot 정책 결정
4. Kakao 키를 추가한다면 저장소 변수가 아니라 배포 환경의 secret에 저장
5. 라이브 모드 활성화 전 `docs/PROVIDER_POLICY.md` 체크리스트 완료
