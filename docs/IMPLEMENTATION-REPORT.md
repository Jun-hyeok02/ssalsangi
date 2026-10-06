# 쌀산기 NEXON 연동 구현 보고

2026-10-06. **코드 구현 및 모의/회귀 검증 완료. 실제 API 키 연결·Netlify Functions 배포·실서비스 호출 검증은 아직 미완료입니다.** 모의 데이터를 사용자 사이트에 저장하거나 실제 데이터라고 표시하지 않았습니다.

## 1. 발견한 기존 구조

HTML/CSS/일반 JavaScript, IIFE 계산 엔진과 대시보드 뷰. React/Vite/Next/TypeScript/Supabase/로그인/기존 서버 함수는 없습니다. `package.json`의 build는 `scripts/build.cjs`입니다. hash 라우팅 홈/통계/설정, 캐릭터 정산은 오른쪽 dialog입니다. 데이터는 `maple-ledger-v1` localStorage 한 곳에 저장하며 보스 주간/검마 월간 완료 맵을 별도로 관리합니다.

## 2. 변경한 파일

| 파일 | 변경 |
|---|---|
| `index.html` | 닉네임 불러오기 버튼·상태, API 어댑터/화면 스크립트 연결 |
| `src/app.js` | 추가 필드 호환 로드/복원, 기존 캐릭터 API 연결, 수동 완료 출처, 현재 기간 프리셋 재사용, 저장 실패 보호, export URL 수명 보완 |
| `src/dashboard.js` | 기존 일러스트 위 실제 캐릭터 외형/월드, 전체 갱신, 완료 결정/모두 완료 시 예상, 상세 팝업 연결 |
| `src/dashboard.css` | 외형 배치와 API 상세/남은 보스/장비 정보의 컴팩트·모바일 스타일 |
| `scripts/build.cjs` | 추가 브라우저 JS 및 서버 함수 구문 검증 |
| `README.md` | 실제 현재 화면/계산 정책·API 배포 안내로 정정 |

## 3. 새로 만든 파일

- `src/nexon-bridge.js`: 공식 응답 → 앱 프로필, 메타데이터 정규화, 완료 출처/우선권, 스케줄러 매핑, 요청 중복 제거.
- `src/nexon-ui.js`: 닉네임 조회, 기존 캐릭터 연결/갱신, API 상세 패널, 지연 조회와 상태/fallback.
- `netlify/functions/nexon.cjs`: 서버 전용 키, endpoint allowlist, 식별자 검증, 소유 계정 OCID 제한, 캐시/오류 처리.
- `netlify.toml`, `.env.example`, `.gitignore`: 빌드/함수/서버 변수 및 secret 제외 설정.
- `docs/NEXON-SETUP.md`, 본 보고, 공식 YAML 명세 3개.
- 상위 `work/nexon-tests.cjs`, `nexon-edge-tests.cjs`, `nexon-regression.cjs` 및 결과/스크린샷. 배포 폴더에 테스트와 백업을 복사하지 않습니다.

## 4. 삭제한 파일

없습니다. `jobs.js`, `job-picker.js`, 일러스트/아이콘 파일을 변경하지 않았습니다.

## 5. DB 변경

없습니다. 서버 DB를 새로 도입하지 않았습니다.

## 6. Migration SQL / 데이터 호환

SQL 불필요. 기존 키/캐릭터 id/정산/가격/완료 필드를 유지하고 캐릭터의 `nexon` 및 `completionSources`를 추가합니다. 기존 명시적 체크/해제와 전체 완료는 수동 우선권으로 호환합니다. 새 캐릭터에는 빈 출처 맵을 사용합니다. 가능한 경우 최초 원본 JSON을 `maple-ledger-before-nexon-v1`에 별도 보존합니다. 읽기/정규화 실패 시 기존 저장 값을 덮어쓰지 않습니다. 백업 JSON 복원은 같은 정규화 계층을 사용합니다.

## 7. 환경변수

- `NEXON_API_KEY`: Netlify Functions 전용. client/env-public에 없음.
- `NEXON_SCHEDULER_OCIDS`: 키 소유 계정에서 자동 완료를 허용할 OCID 목록, 쉼표 구분. 비우면 스케줄러를 차단합니다.

`.env.example`은 빈 템플릿이며 실제 키를 작성하지 않았습니다.

## 8–9. 공식 endpoint와 용도

서버 기준 URL `https://open.api.nexon.com/maplestory/v1/`.

| 경로 | 용도 |
|---|---|
| `id` | 닉네임 → OCID |
| `character/basic` | 이름/직업/레벨/월드/경험치 비율/길드/외형 |
| `scheduler/character-state` | 키 소유 계정의 실시간 완료 정보 |
| `character/stat`, `character/ability`, `character/hyper-stat` | 전투 스탯·어빌리티·하이퍼스탯 |
| `character/item-equipment`, `character/symbol-equipment` | 장착 장비/잠재·총 옵션·심볼 |
| `character/vmatrix`, `character/hexamatrix`, `character/hexamatrix-stat` | V/HEXA/HEXA 스탯 |
| `user/union`, `user/union-artifact`, `user/union-champion` | 유니온·아티팩트·챔피언 |

2026-10-06 공식 [API 페이지](https://openapi.nexon.com/game/maplestory/)에서 연결된 최신 명세를 내려받아 확인했습니다. 스케줄러의 완료 필드는 `complete_flag`입니다. 명세에서 확인되지 않은 필드를 추측해 사용하지 않습니다.

## 10. 캐시

닉네임 24시간, 기본/상세 5분, 스케줄러 15초, warm 인스턴스 메모리 최대 500개와 요청 dedup. 220ms 간격, IP별 warm 인스턴스 분당 50 요청 제한. 분산 인스턴스 전체 쿼터는 이 메모리로 보장되지 않으며 공식 429를 유지/안내합니다. 개발 키 5건/초·1,000건/일, 서비스 키 500건/초·20,000,000건/일: [공식 제한](https://openapi.nexon.com/ko/guide/prepare-in-advance/).

## 11. 등록

닉네임 불러오기 → OCID → 기본 정보 → 직업/레벨 자동 입력 → 기존 보스/파티 선택 → 등록. 같은 OCID는 기존 캐릭터에 연결하고 중복 생성하지 않습니다. 동일 이름의 수동 캐릭터도 기록을 유지하며 연결합니다. 조회 실패 시 직접 입력 등록은 유지됩니다. 이미 등록된 캐릭터는 상세 패널에서 이름으로 연결하거나 갱신할 수 있습니다.

## 12. 자동 완료

공식 `boss_contents`의 보스 이름·난이도·주기를 기존 BOSS_DATA와 일치시키고 `complete_flag=true`만 반영합니다. 오늘의 응답만 현재 목요일 주/현재 월에 적용합니다. 과거 기간을 보고 있어도 현재 프리셋으로 현재 기록을 준비하는 기존 엔진을 재사용합니다. 선택되지 않은 보스·모르는 이름/난이도/주기는 추가하지 않습니다. 검마는 월간 맵의 기록 id로 처리합니다. 정확한 클리어 날짜는 스케줄러가 제공하지 않으므로 임의로 기록하지 않습니다.

## 13. 충돌 방지

`completionSources['week:YYYY-MM-DD' 또는 'month:YYYY-MM'][bossId]`의 `manual` / `nexon_api`. 직접 체크뿐 아니라 **직접 해제**도 수동 우선권입니다. API 미완료/누락/오류는 완료를 취소하지 않습니다. UI에서 API 자동/수동을 구분합니다. 출처는 저장/복원됩니다.

## 14. 파티 프리셋

기존 `bossPresets[bossId]={difficulty,partySize}`와 기간 복제 그대로 사용. API는 인원을 가져오거나 변경하지 않습니다.

## 15. 남은 예상

미완료 주간 결정의 기존 `amount` 합계. 각 결정은 `floor(priceMeso / partySize) / 100000000`. 랜덤 드롭·미기록 사냥·미획득 재료를 예상하지 않습니다. 캐릭터 모두 완료 시 예상 = 기록된 주간 실제 보스 수익(결정+획득) + 남은 결정. 계정 모두 완료 시 예상 = 현재 선택 주 실제 합계 + 남은 결정. 원화 환산/정밀도를 바꾸지 않았습니다.

## 16. 대시보드

기존 카드/가로 스크롤/사냥 입력/검마 표시 유지, 실제 외형과 월드 추가. 계정 완료 결정·남은 결정·모두 완료 시 예상과 전체 갱신. 팝업에 남은 보스와 캐릭터별 예상. 상세 스펙은 접힌 패널 안에서 필요한 그룹만 조회합니다.

## 17. MapleScouter

닉네임을 URLSearchParams로 생성한 결과 페이지 링크만 사용합니다. 새 탭 `_blank`, `noopener noreferrer`. 데이터 수집/크롤링/합산하지 않습니다.

## 18. 유지한 기존 기능

캐릭터 추가/삭제/수정, 직업 이미지/검색, 보스 선택/개별/전체 완료와 취소, 결정/파티/물욕/칠흑 상자 선택/수량, 검마 월간, 사냥 메소/조각, 가격/연결 재료, 환산, 주간/월간 통계, 저장/백업/복원, 날짜/주/월 이동 모두 유지.

## 19. 보완한 오류/예외

읽기 실패 시 기존 데이터를 빈 값으로 덮어쓸 가능성을 차단했습니다. API 일부 실패/형태 변경·외형 오류로 상세/정산이 멈추지 않게 했습니다. 동일 OCID 중복 등록을 막고 수동 해제 우선권을 저장합니다. 다운로드 Blob URL을 클릭 직후 폐기하지 않고 잠시 유지합니다. 팝업 재오픈 시에도 갱신 간격을 확인합니다.

## 20. 3캐릭터 시나리오

테스트용 독립 브라우저 저장소에서 API 응답을 **MOCK**으로 제공했습니다.

- A: 아델290, 서로 다른 주간 보스12+검마, 1/2/3/4/6인 혼합. 스우/데미안/가엔슬/루시드/윌/더스크/진힐라/듄켈/세렌/칼로스/대적자/카링.
- B: 루미너스280, 스우/루시드/윌, 2/3인.
- C: 나이트로드275, 스우/데미안/더스크, 솔로.

실제 사용자 캐릭터/localStorage를 조작하지 않았습니다.

## 21. 12보스 결과

A의12개 중 API로2개 완료 확인, 수동 해제 후1개로 유지. 남은 결정은 독립 `floor(price/party)` 합계와 일치. 검마는 별도 월간 완료. 모든 보스·난이도×1/3/6인 **141개 결정/물욕 계산 조합**이 수정 전 엔진과 정확히 동일합니다.

## 22. 모바일

API 시나리오320/375/768/1440px, 기존 홈/통계/설정은320/375/768/1440/1920px. 가로 overflow 없음,3카드/12보스/팝업 내부 스크롤 확인. 320px 팝업 스크린샷을 직접 확인했습니다. 모바일 API 세부 목록은 별도 내부 스크롤입니다.

## 23. 회귀

기존20검증 + API모의21검증 + 보호/계산6검증 통과,141계산 조합 동일. 캐릭터/직업/가격 유지, 수동 체크/해제/전체/파티/검마/물욕/사냥/조각/월간 합계/기간 초기화/생성삭제/새로고침/백업 JSON 복원/이미지 fallback 확인. 브라우저 uncaught 오류0.

결과: 상위 `work/nexon-regression-results/report.json`, `work/nexon-tests/report.json`, `work/nexon-tests/edge-report.json`. 테스트 스크립트는 상위 프로젝트 폴더에서 해당 cjs를 Node로 실행합니다.

**다운로드 검증 한계:** 이 환경의 Chrome은 빈 페이지의 단순 Blob 다운로드도 canceled로 종료했습니다. 따라서 실제 파일 내려받기 완료를 주장하지 않습니다. 내보내기 함수가 만든 JSON Blob 내용을 추출하고 그 파일을 실제 import 입력으로 복원해 검증했습니다. 사용자 Chrome에서 백업 다운로드 완료는 별도 확인이 필요합니다.

## 24. 빌드

`pnpm run build` 성공. 실제 build script의 `node scripts/build.cjs`도 성공. 신규 브라우저 코드/서버 함수 구문 검증 포함, dist 로딩 검증 통과. 일반 샌드박스 실행의 node_modules realpath EPERM은 승인된 동일 빌드 재실행에서 해결되었습니다. 새 dependency 없음. Netlify 원격 빌드/함수 배포는 아직 실행하지 않았습니다.

## 25. 아직 미완료

실제 NEXON API 등록/조회 성공, 실제 게임 보스 완료 동기화, Netlify 원격 Functions 배포 검증. 서로 다른 사이트 이용자 계정의 자동 완료 연결, 로그인·기기 간 데이터 저장은 구현 범위에 포함하지 않았습니다.

## 26. 정확한 이유

실제 API 키와 Netlify 서버 설정이 제공되지 않았습니다. 공식 스케줄러는 키 소유 계정만 지원하므로 단일 운영자 키로 모든 사용자 계정을 자동 연동할 수 없습니다. 추측 데이터나 가짜 성공 결과를 만들어 대체하지 않았습니다.

## 27. 직접 필요한 설정

NEXON 앱/키 발급 → 기존 Netlify 사이트의 Functions 환경변수2개 설정 → 소스와 함수를 포함하여 새 배포. Supabase 설정은 없습니다. 자세한 순서는 `NEXON-SETUP.md`에 있습니다. 키를 채팅에 보내지 마세요.

## 28. 배포 전 확인

기존 주소 유지 및 백업, Git 소스 빌드/함수 디렉터리 설정, 서버 env, 실닉네임 조회, 소유 캐릭터 오늘 완료와 인게임 대조, 수동 취소 유지, 타 계정 scope 안내, 백업 다운로드와 복원, browser bundle/network에 secret 없음. dist만 Drop에 올리면 API 함수는 배포되지 않습니다.

## 29. 향후 개선

실배포 응답으로 보스 이름/주기 매핑 추가 확인, 서비스 키 사용량 확인, 필요해질 때 서버 공유 캐시/호출 제한 개선. 기기 간 저장은 별도 승인된 계정·저장 서비스 작업이 필요하며 이번에는 추가하지 않았습니다.
