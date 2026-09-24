# 말달리자 실서비스 배포 전 코드 검수 리포트

검수 범위: React/TS 클라이언트, Express/TS 서버, Android WebView 래퍼(설정만 참고).
적용 방식: 파일 수정 권한이 있는 클라이언트/서버 코드는 직접 리팩토링하여 반영했고,
게임 밸런스나 대규모 아키텍처 전환처럼 별도 의사결정이 필요한 항목은 [권장]으로 남겨뒀습니다.
모든 수정 후 `tsc --noEmit`(client/server), `eslint .`, `vite build --mode play`, `tsc -p server` 4개 전부 통과 확인했습니다.

---

## [치명적] — 즉시 조치, 실서비스 악용/중단 가능

### 1. 광고 보상 인증 전면 우회 — `server/src/routes/ads.ts`
`POST /ads/claim`에서 `adToken`이 `dev-`/`ssv:` 접두사가 아닌 경우, 검증 수단이 전혀 없는데도
그대로 통과시키는 `else` 분기가 있었습니다. 세션만 있으면(데모 로그인 상시 개방) 임의 문자열을
토큰으로 보내 광고를 보지 않고도 매일 한도까지 보상을 받을 수 있었습니다 — AdMob SSV로 어렵게
만든 부정 방지 체계 전체가 이 한 분기로 무력화되는 구조였습니다.

**조치**: 검증 불가능한 토큰은 403으로 거부하도록 수정. Toss 인앱광고용 서버측 검증이 붙기 전까지는
`dev-`(로컬)와 `ssv:`(AdMob SSV 검증 통과)만 허용합니다.

### 2. 파티 라우터 다수 핸들러에 에러 처리 없음 — `server/src/routes/party.ts`
`GET /mine`, `POST /mine`, `GET /:code`, `POST /create`, `POST /leave` 5개 핸들러가 try/catch 없이
async 함수로 등록되어 있었습니다. Express 4는 async 핸들러의 reject를 자동으로 잡지 않아서,
Redis 순간 장애 등으로 실패하면 요청이 응답 없이 그대로 멈춰버립니다(클라이언트는 무한 로딩).

**조치**: 신설한 `server/src/lib/asyncHandler.ts`로 전부 래핑, `server/src/app.ts`에 전역 에러
핸들러(+ JSON 404)를 추가해 실패 시 항상 `{ ok: false, message }` 형태로 응답하도록 통일.

### 3. 남의 파티방 무단 조회 — `server/src/routes/party.ts` `GET /:code`
세션만 있으면 멤버가 아닌 사람도 코드를 알면 남의 파티방 정보를 볼 수 있었습니다. 현재 클라이언트는
이 경로를 쓰지 않지만(`/mine`으로만 조회), 살아있는 공개 엔드포인트인 이상 방치할 수 없는 구멍입니다.

**조치**: 멤버 여부(`room.members.some(...)`)를 확인해 비멤버는 403 처리.

---

## [경고] — 방치 시 특정 조건에서 실패/보안 약화

### 4. `SESSION_SECRET` 미설정 시 조용한 폴백 — `server/src/config.ts`
서명 키가 없으면 `"dev-change-me"`라는 뻔한 문자열로 조용히 넘어가는 구조였습니다. 이 값이 새어나가거나
예측되면 임의 `userKey`로 세션 위조가 가능합니다. `vercel env ls production`으로 현재 프로덕션에
`SESSION_SECRET`이 실제로 설정되어 있음을 확인했으므로 **당장 뚫려있는 것은 아니지만**, 향후 환경
재구성/신규 배포 시 이 폴백이 조용히 프로덕션에 들어갈 수 있는 지뢰였습니다.

**조치**: 프로덕션(`NODE_ENV`/`VERCEL_ENV`가 `production`)에서는 미설정 시 즉시 fail-fast, 개발 환경에서만
경고와 함께 폴백 허용.

### 5. ESLint 설정이 서버 코드까지 React 규칙을 적용 — `eslint.config.js`
`react-hooks`/`react-refresh` 규칙과 `globals.browser`가 `server/`까지 걸려서, `useStatelessSessions`처럼
"use"로 시작하는 일반 함수(서버 로직, React 훅 아님)를 훅으로 오인해 `rules-of-hooks` 오탐을 냈습니다.
또한 `_` 접두사로 의도적 미사용을 표시하는 이 프로젝트 자체 컨벤션이 lint 규칙에는 반영되어 있지 않아
실제 사용되지 않는 변수 문제가 노이즈에 묻혀 있었습니다.

**조치**: client(`src/**`)와 server(`server/src/**`) 설정을 분리하고, `argsIgnorePattern`/`varsIgnorePattern`을
`^_`로 지정. 결과: 16 errors + 13 warnings → **0 errors**(정리 후 실제 미사용 변수/함수 5건 발견·삭제).

### 6. Toss Mini App 빌드(`npm run build`)가 실제로는 타입 에러로 깨져 있었음
`toast.openToast(msg, { type: "success" })` 패턴이 9곳에 있었는데, 실제 `@toss/tds-mobile` 패키지의
`type` 필드는 **위치**(`'top' | 'bottom'`)를 의미하지, 시맨틱 색상("success")을 의미하지 않습니다.
`build:play`(GitHub Pages용)는 로컬 shim(`src/play/shim/tds-mobile.tsx`)이 느슨한 타입이라 통과했지만,
Vite 별칭이 적용되지 않는 `tsc --noEmit`/`ait build`(Toss 플랫폼 빌드 타깃) 기준으로는 9곳 전부 컴파일
에러였습니다. "겉으론 동작하지만" 다른 빌드 타깃에서는 실제로 깨져 있던 전형적인 사례입니다.

**조치**: 같은 파일 내 에러 토스트가 이미 `type: "bottom"`을 쓰고 있는 패턴에 맞춰, 성공 토스트는
`type: "top"`으로 통일(위치로 성공/실패를 구분하려던 원래 의도를 그대로 살리면서 타입 정합).
대상: `useAuth.ts`, `HomePage.tsx`, `HorseCarePage.tsx`(×3), `PartyPage.tsx`(×2), `PredictPage.tsx`.

추가로 같은 빌드에서 발견된 진짜 타입 버그 2건도 함께 수정:
- `src/lib/raceSound.ts`: `ReturnType<typeof window.setInterval>`가 Node 타입과 충돌해 `number`를
  `Timeout`에 대입 불가 — 브라우저 API이므로 `number`로 명시.
- `src/pages/HorseCarePage.tsx`: 로컬 `SectionTitle` 컴포넌트가 `children: string`으로 좁게 선언되어
  있었는데, 실제로는 문자열+조건부 문자열을 함께 렌더링하는 곳이 있어 타입 불일치 — `ReactNode`로 확장.
- 부수적으로 `server/src/lib/asyncHandler.ts`를 Express의 `RequestHandler` 제네릭과 동일하게
  맞춰, `/:code`처럼 경로 파라미터가 있는 라우트에서도 `req.params.code` 타입이 `string`으로 정확히
  추론되도록 함(래퍼 도입으로 라우트별 타입 추론이 깨졌던 부분).

### 7. `RacePage.tsx` `liveTop3` useMemo가 언어 전환을 반영하지 않음
`t.horseNo(h.number)`로 말 이름 폴백 텍스트를 만드는데, `useMemo` deps에 `t`가 빠져 있었습니다. `t`는
언어 전환 시 실제로 참조가 바뀌는 객체(`i18n/LangContext.tsx`)라서, 경주 도중 언어를 바꾸면 이 목록의
텍스트가 다음 리렌더 트리거(순위 변화 등)가 있을 때까지 이전 언어로 남아 있는 실제 버그였습니다.

**조치**: deps에 `t` 추가.

---

## [권장] — 지금 당장 문제는 아니지만 개선 가치 있음

### 8. 나머지 `react-hooks/exhaustive-deps` 경고(12건 중 8건)는 의도된 패턴 — 수정하지 않음
`App.tsx`(3), `PartyPage.tsx`(2), `useRaceCommentary.ts`(3)에서 "missing dependency: player/party/ctx"
경고가 남아있습니다. 확인 결과 `usePlayer()`가 반환하는 개별 함수(`fetchParty`, `claimAdReward`,
`getAdEligibility` 등)는 내부적으로 `useCallback`으로 감싸여 있어 **참조가 안정적**이지만, `usePlayer()`가
반환하는 객체 자체는 매 렌더마다 새로 생성됩니다. `useRaceCommentary`의 `ctx`도 매 애니메이션 프레임마다
새로 만들어지는 객체입니다. ESLint 권고대로 전체 객체를 deps에 넣으면 오히려 매 렌더/매 프레임마다
effect가 재실행되는 회귀 버그가 생깁니다 — 지금처럼 안정적인 필드/함수만 좁게 골라 deps에 넣는 것이
정답입니다. 클린업 대신 **의도적 설계로 리포트에 명시**하는 쪽을 선택했습니다.

### 9. `react-refresh/only-export-components` 경고 4건 — 낮은 우선순위
`AuthContext.tsx`, `LangContext.tsx`(×2), `tds-mobile.tsx`에서 컴포넌트 파일이 상수/훅도 함께
export해서 Fast Refresh 효율이 떨어진다는 경고입니다. 개발 경험(HMR) 문제일 뿐 런타임 동작에는
영향이 없어 우선순위 낮음. 필요 시 `useAuthContext`/`useLang`/`useToast` 같은 훅들을 별도
`*.hooks.ts` 파일로 분리하면 해소됩니다.

### 10. 죽은 코드 정리 (5건 삭제)
- `server/src/db/playerStore.ts`: `@deprecated` 표시된 채 호출부 0인 `recordWeeklyScore` 삭제.
- `server/src/lib/tips.ts`: 호출부 0인 `paceLabel` 삭제.
- `server/src/lib/jockey.ts`: `rollJockey(horse)`가 `horse` 파라미터를 쓰지 않아 `rollJockey()`로 정리.
  (부수 발견: 기수 능력치가 배정된 말과 아무 상관관계가 없는 구조 — 의도된 게임 디자인인지 재확인 권장.)
- `src/lib/ovalTrack.ts`: 호출부 0인 `laneRadius`, `segmentMeters`, `joinToFinishVirtual`,
  `chuteCrossLine`(내부 헬퍼 `chuteCrossLineAtOnChute`는 3곳에서 여전히 사용 중이라 유지) 삭제.
- `src/lib/raceAnimation.ts`: 상수 0을 반환하는 `horseAlongJitter` 스텁과 그 호출부(`jitterM`,
  `jitterFade`) 삭제. 렌더 경로에 배선되어 있었지만 실제로는 아무 효과도 없던 미완성 기능이었습니다 —
  추후 "질주 중 미세한 흔들림" 연출을 실제로 넣고 싶다면 새로 설계해서 추가하는 걸 권장합니다.
- 미사용 import 4건 정리: `resetSessionRaceStreak`(playerStore.ts), `kstWeekId`(retention.ts),
  `pickGhosts`(race.ts), `chuteLength` 구조분해(ovalTrack.ts).
- `server/src/lib/division.ts`: `let pool` → `const pool` (재할당 없음).

### 11. 성능 — 경주 애니메이션 프레임마다 말 아이콘 전체 리렌더 가능성
`RacePage.tsx`의 `raceProgress`는 `requestAnimationFrame` 루프로 매 프레임(~60fps) 갱신되는 React
state입니다. `horseStates.map(...)`으로 렌더되는 `RaceHorseIcon`(보통 8~14마리)은 `React.memo`로
감싸여 있지 않아, 이론적으로는 프레임마다 전체 목록이 리렌더됩니다. 실기기에서 체감 프레임 드랍이
보고된 적은 없어 [치명적/경고]로는 올리지 않았지만, 저사양 기기 대응이 필요해지면
`React.memo(RaceHorseIcon, ...)` + position을 props 대신 ref/style 직접 갱신으로 빼는 최적화를
검토할 가치가 있습니다. 애니메이션 타이밍에 민감한 코드라 이번 감사에서는 직접 손대지 않았습니다.

### 12. 아키텍처 — 클라이언트/서버 타입 공유 부재
`src/types/game.ts`(client)와 서버 응답 타입이 별도로 손으로 유지되고 있어, 서버가 필드명을 바꿔도
클라이언트는 컴파일 타임에 아무 에러 없이 조용히 깨질 수 있습니다. 지금 규모(1인 프로젝트, 파일 수
적음)에서는 즉시 필요하진 않지만, API 표면이 더 커지면 `shared/` 워크스페이스 패키지로 타입을
분리해 양쪽에서 import하는 구조를 권장합니다.

### 13. 폴더 구조 — 현재 구조는 이 프로젝트 규모에 적절, 큰 개편 불필요
```
src/  api/ components/ context/ hooks/ i18n/ lib/ pages/ play/shim/ types/
server/src/  db/ jobs/ lib/ middleware/ routes/
```
관심사 분리가 이미 잘 되어 있어(라우트/데이터 접근/순수 로직 분리) 전면 개편은 권하지 않습니다.
다만 다음은 파일이 더 늘어나기 전에 챙기면 좋은 정리입니다:
- `src/pages/RacePage.tsx`(591줄), `PartyPage.tsx`(464줄)처럼 커지는 페이지는 `pages/RacePage/`
  디렉터리로 승격해 하위 컴포넌트/훅을 분리.
- `src/lib/`가 순수 게임 로직(`ovalTrack`, `raceAnimation`)과 클라이언트 전용 유틸(`raceSound`)을
  섞어 담고 있음 — `lib/race/`, `lib/audio/` 등으로 세분화하면 서버로 로직을 옮길 때(예: 서버사이드
  검증 강화) 경계가 더 명확해집니다.

### 14. 반응형/CSS — 별다른 결함 없음
`viewport-fit=cover` + `env(safe-area-inset-*)` + `100vh`→`100dvh` 폴백 패턴이 이미 3개 CSS 파일
모두에 일관되게 적용되어 있고, `touch-action: manipulation` / `user-select: none` / 480px 캡 등
모바일 WebView 앱에 맞는 처리가 되어 있습니다. 이 앱은 데스크톱 브라우저 대상이 아니라 Android
WebView 전용이라 "크로스 브라우징"의 실질 범위는 Android WebView 버전 편차인데, 그 범위에서
문제될 소지가 있는 패턴(고정 px 폭 오버플로, prefix 누락 등)은 발견되지 않았습니다.

---

## 요약

| 구분 | 건수 | 처리 |
|---|---|---|
| 치명적 | 3 | 전부 수정 완료 |
| 경고 | 4 | 전부 수정 완료 |
| 권장 | 7 | 5건 즉시 반영(죽은 코드/타입), 2건은 근거와 함께 비수정 결정(의도된 패턴), 나머지는 후속 과제로 명시 |

**검증**: `npx tsc --noEmit`(client) 0 errors · `npx tsc --noEmit`(server) 0 errors ·
`npx eslint .` 0 errors / 12 warnings(전부 의도 확인) · `npm run build:play` 성공 ·
`npm run build`(server) 성공.
