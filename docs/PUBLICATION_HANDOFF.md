# GitHub 게시 인수인계 — Sup-Ro

## 권장 저장소 설정

| 항목        | 값                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------- |
| 저장소      | [`sumilee-pcu/Sup-Ro`](https://github.com/sumilee-pcu/Sup-Ro)                                      |
| 기본 브랜치 | `main` — 첫 push 시 생성                                                                           |
| 설명        | 교육과정·대한민국 지도·안전 근거를 연결하는 fixture-first AI 체험학습 코디네이터                   |
| 토픽        | `education`, `field-trip`, `geospatial`, `ai-agent`, `nextjs`, `korea`, `curriculum`, `typescript` |
| 공개 범위   | Public — 2026-07-14 소유자 생성 확인                                                               |

## 게시 전 남은 소유자 결정

1. `수업로 AI(Sup-Ro AI)` 상표·도메인·앱스토어 이름 최종 확인
2. 현재 모든 권리 유보를 유지할지, 별도 오픈소스 라이선스를 적용할지 결정
3. 민감한 기관명·학교 양식·실제 API 키를 넣지 않았는지 마지막 확인
4. Windows 11 실기기 검증을 게시 전 또는 게시 직후 게이트로 둘지 결정

## 연결 상태와 게시 명령

로컬 `origin`은 소유자가 지정한 빈 저장소에만 연결한다.

```bash
git remote add origin https://github.com/sumilee-pcu/Sup-Ro.git
```

실제 업로드는 별도 승인 후 다음 명령으로 실행한다.

```bash
git push -u origin main
```

현재 로컬 준비 단계에서는 `origin` 연결까지만 수행하고 `git push`는 실행하지 않는다.

## 로컬 전달 상태

- 기준 구현 커밋: `2e5ba4f`
- 브랜치: `main`
- staged-tree 사전검사: PASS
- remote: `origin` → `https://github.com/sumilee-pcu/Sup-Ro.git`
- 원격 상태: Public 빈 저장소, push 미실행
- 전체 자동 품질 게이트: PASS
- GitHub 계정 귀속 전용 noreply 주소는 소유자가 확인 후 필요할 때 재작성

## 게시 직후

1. GitHub Actions `ci` 전체 통과 확인
2. 저장소 설명·토픽·기본 브랜치 확인
3. 비밀 스캔과 Dependabot 정책 결정
4. Kakao 키를 추가한다면 저장소 변수가 아니라 배포 환경의 secret에 저장
5. 라이브 모드 활성화 전 `docs/PROVIDER_POLICY.md` 체크리스트 완료
