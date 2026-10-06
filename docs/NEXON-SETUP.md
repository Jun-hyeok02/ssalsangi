# NEXON / Netlify 설정

## 필요한 설정

1. NEXON Open API에서 메이플스토리 애플리케이션을 등록하고 키를 발급합니다. **키를 채팅, 소스, 클라이언트 환경변수에 넣지 마세요.**
2. Netlify의 기존 사이트를 Git 저장소와 연결해 소스 빌드를 사용합니다. 저장소에 상위 `쌀산기` 폴더 전체를 올리는 경우 Base directory는 `outputs/maple-ledger`; 프로젝트 폴더만 올리면 Base directory는 비웁니다.
3. Build command `npm run build`, Publish directory `dist`, Functions directory `netlify/functions`. 해당 프로젝트의 `netlify.toml`이 함께 포함되어야 합니다.
4. Netlify 서버 Functions 환경변수 `NEXON_API_KEY`에 실제 키를 설정합니다. 키를 bundle/build 코드에 주입하지 않습니다.
5. 자동 완료를 허용할 **키 소유 계정의 캐릭터 OCID**만 `NEXON_SCHEDULER_OCIDS`에 쉼표로 구분해서 넣습니다. 비워두면 자동 완료는 비활성이고 기본 정보 조회는 가능합니다. OCID는 API로 캐릭터 등록 후 백업 JSON의 `nexon.ocid`에서 확인할 수 있습니다.
6. 새 배포를 생성합니다. 배포한 HTTPS 주소에서 닉네임 조회 → 캐릭터 추가 → 보스/파티 설정 → 팝업 정보 갱신을 확인합니다.
7. 수동으로 해제한 보스는 API가 완료라고 응답해도 해제 상태를 유지합니다. 필요한 경우 해당 보스를 직접 다시 체크하세요.

API 코드만 작성한 상태에서는 키 설정과 실제 배포가 완료되지 않습니다. Netlify Drop의 **dist만 업로드하는 방식으로는 Functions가 배포되지 않습니다.** Git 기반 빌드 또는 Functions를 포함하는 Netlify CLI 배포를 사용하세요. 현재 사이트 주소를 유지하면 기존 localStorage도 유지됩니다.

## 공식 제약

- 스케줄러는 **API 키 소유 계정의 캐릭터만** 조회할 수 있습니다. 사이트 방문자의 서로 다른 NEXON 계정 전체를 단일 서버 키로 동기화할 수 없습니다.
- 조회는 실시간 또는 최대 14일 이전. 이번 구현은 날짜를 생략한 실시간 조회만 사용하며 오늘의 응답을 현재 목요일 주/현재 월에 적용합니다. 과거 기록을 추측하여 채우지 않습니다.
- 파티 인원, 개인 물욕 드롭, 사냥 메소/조각은 API로 추정하지 않습니다.
- 수동 체크/해제는 영구적인 기간별 우선 설정입니다. API 실패, 미완료, 누락 응답은 기존 완료를 취소하지 않습니다.
- 브라우저 저장/백업 방식은 그대로이며 로그인이나 클라우드 데이터 저장을 추가하지 않았습니다.

## 캐시 / 제한

닉네임 식별자 24시간, 기본/상세 5분, 스케줄러 15초 TTL. 서버 인스턴스별 메모리 캐시 및 진행 중 요청 중복 제거. 기본 API 요청은 최소 220ms 간격으로 직렬 실행합니다. 상세 조회는 버튼을 누른 섹션만 요청하며 일부 실패해도 성공한 정보는 표시합니다.

갱신 버튼은 보스 상태를 최대 15초 캐시로 확인합니다. 캐릭터 팝업을 새로 열면 마지막 보스 갱신/시도 1분 이후 자동 갱신합니다. 현재 열린 화면이 과거 주/월이어도 실제 오늘의 API 확인은 현재 주/월에만 적용됩니다.

공식 개발 키는 초당 5건/일 1,000건, 서비스 키는 초당 500건/일 20,000,000건입니다. 쿼터는 애플리케이션 전체 합산입니다. 로컬 인스턴스 제한은 분산 인스턴스 전체의 보장이 아니므로 공개 서비스는 서비스 단계 키를 사용하고 NEXON 사용량을 확인하세요. 함수는 인스턴스별 IP당 분당 50 요청 제한도 적용합니다. 429 오류는 기록을 유지하며 재시도를 안내합니다.

## 공식 문서

- 최신 endpoint/응답: https://openapi.nexon.com/game/maplestory/ (2026-10-06 확인)
- 캐릭터: https://openapi.nexon.com/static/api/maplestory/14_ko_script20260917040003.yaml
- 유니온: https://openapi.nexon.com/static/api/maplestory/15_ko_script20260618050040.yaml
- 스케줄러: https://openapi.nexon.com/static/api/maplestory/62_ko_script20260821005015.yaml
- 쿼터: https://openapi.nexon.com/ko/guide/prepare-in-advance/
- Netlify 함수: https://docs.netlify.com/build/functions/configuration/

공식 YAML 스냅샷을 이 폴더에 보관했습니다. API에서 이름/난이도/주기를 명확히 매칭할 수 없는 보스는 자동으로 표시하지 않습니다. `complete_flag`가 명세의 완료 필드이며 비공식으로 추측한 다른 필드는 사용하지 않습니다.

## 실제 배포 후 체크

- 기본 조회 성공 / 존재하지 않는 이름 오류 / 키 미설정 오류
- 소유 캐릭터 오늘의 스케줄러 응답과 인게임 완료 일치
- 타 계정 캐릭터는 수동 완료 안내
- API 갱신 후 수동 해제와 파티 인원 유지
- 새로고침 및 백업 JSON 복원
- 개발자 도구의 브라우저 요청/배포 JS에 API 키 미포함
- 기존 HTTPS 도메인으로 배포, 이전 데이터 백업

실제 키를 설정하기 전까지 실서비스 호출 성공은 검증된 것으로 간주하지 않습니다.
