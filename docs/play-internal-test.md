# Play Store 내부 테스트 → 앱인토ss 등급 (IARC)

GRAC 직접 심의 대신 **Google Play 내부 테스트 + IARC**로 등급 받고, 앱인토ss 콘솔에 **자체등급분류 게임물 정보**를 입력하는 경로입니다.

참고: [토스 — 자체등급분류 게임물 정보](https://toss.im/apps-in-toss/blog/self-rated_game_distribution)

**패키지명:** `com.aundots.horserace`  
**웹 호스팅:** `https://aundots.github.io/horserace/play/`  
**Android:** `play-store/android/` (WebView 래퍼)

---

## 전체 흐름

```
Play 개발자 등록 ($25)
  → Step 2: Play 웹 빌드 → GitHub Pages
  → Step 3: API 배포 (PLAY_DEMO=true)
  → Step 4: keystore + AAB 빌드
  → Step 5: Play Console 내부 테스트 업로드 + IARC
  → GRAC「자체등급분류 게임물 조회」
  → 앱인토ss 콘솔 게임 등급분류
  → horserace .ait 검수·출시
```

---

## Step 1. Google Play Console (1회)

1. [Google Play Console](https://play.google.com/console) — 개발자 등록 **$25**
2. **앱 만들기** → 게임 → **말레이스** (앱인토ss·GRAC와 **동일한 이름**)
3. **패키지명:** `com.aundots.horserace` (한 번 정하면 변경 어려움)

---

## Step 2. Play 웹 빌드 → GitHub Pages

Play/TWA용 Vite 빌드는 토스 로그인 대신 **「게임 체험하기」** 데모 로그인을 사용합니다.

### 2-1. API URL 설정

`.env.play.example`을 복사해 `.env.play`를 만들고 API URL을 채웁니다:

```env
VITE_BASE_PATH=/horserace/play/
VITE_PLAY_STORE=true
VITE_API_BASE_URL=https://YOUR-API.onrender.com
VITE_AD_DEV_MOCK=true
```

`YOUR-API.onrender.com`을 Step 3에서 배포한 실제 API 호스트로 바꿉니다.

### 2-2. 빌드 & docs/play 복사

```bash
npm run build:play:pages
```

이 명령은 `npm run build:play`(Vite `--mode play`) 후 `dist/` → `docs/play/`로 복사합니다.

### 2-3. GitHub Pages 배포

`docs/play/`와 (선택) `docs/.well-known/assetlinks.json`을 커밋 후 푸시:

```bash
git add docs/play docs/.well-known
git commit -m "Deploy Play web build to GitHub Pages"
git push
```

배포 후 확인: [https://aundots.github.io/horserace/play/](https://aundots.github.io/horserace/play/)  
홈에 **「게임 체험하기」** 버튼이 보여야 합니다 (API 미배포 시 로그인은 실패할 수 있음).

---

## Step 3. API 배포 (`PLAY_DEMO=true`)

Play 빌드는 `POST /auth/demo-login`으로 세션을 만듭니다. **서버에만** 다음 env가 필요합니다:

```env
PLAY_DEMO=true
SESSION_SECRET=64자_이상_랜덤
PORT=4000
```

Render 등에 `server/` 배포 — 자세한 절차는 [deploy-api.md](./deploy-api.md).

배포 후 `.env.play`의 `VITE_API_BASE_URL`을 해당 URL로 맞추고 **Step 2를 다시 실행**해 Pages를 갱신하세요.

| 확인 | 방법 |
|------|------|
| Health | `GET https://YOUR-API/health` |
| Demo login | Play URL → 게임 체험하기 → 경주 화면 진입 |

---

## Step 4. Android keystore & AAB

프로젝트: `play-store/android/` — 자세한 빌드 옵션은 [play-store/android/README.md](../play-store/android/README.md).

### 4-1. SDK

`play-store/android/local.properties` (로컬 전용, gitignore):

```properties
sdk.dir=C\:\\Users\\User\\AppData\\Local\\Android\\Sdk
```

### 4-2. keystore 생성 (1회)

```bash
keytool -genkeypair -v \
  -keystore play-store/horserace-release.jks \
  -alias horserace \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=말레이스, OU=Apps, O=Aundots, L=Seoul, ST=Seoul, C=KR"
```

**SHA256 지문** (TWA용, 선택):

```bash
keytool -list -v -keystore play-store/horserace-release.jks -alias horserace
```

출력의 `SHA256:` 값(콜론 포함)을 `docs/.well-known/assetlinks.json`의 `REPLACE_WITH_SHA256_FINGERPRINT`에 넣고 GitHub Pages에 푸시합니다.

검증 URL: `https://aundots.github.io/horserace/.well-known/assetlinks.json`

### 4-3. AAB 빌드

```powershell
cd play-store/android
$env:PLAY_KEYSTORE = "..\horserace-release.jks"
$env:PLAY_KEYSTORE_PASSWORD = "..."
$env:PLAY_KEY_ALIAS = "horserace"
$env:PLAY_KEY_PASSWORD = "..."
.\gradlew.bat bundleRelease
```

출력: `app/build/outputs/bundle/release/app-release.aab`

---

## Step 5. Play Console 내부 테스트

1. **출시 → 테스트 → 내부 테스트** → AAB 업로드
2. 테스터 Gmail 추가 (본인)
3. **앱 콘텐츠 → 등급 (IARC)** 설문 완료
4. 심사·승인 후 IARC 등급 확정

### IARC 설문 (말레이스)

| 질문 유형 | 답변 방향 |
|-----------|-----------|
| 실제 돈/도박 | **없음** — 베팅·환전·마권 없음 |
| 시뮬레이션 도박 | **없음** — 예상·점수만 |
| 폭력 | **없음~최소** |
| 사용자 간 채팅 | **없음** |
| 유료 랜덤 상자 | **없음** |
| 광고 | **있음** — 선택적 리워드 (Play 빌드는 mock) |

목표: **전체이용가** 또는 **12세**.

### 스토어 등록정보

| 항목 | 값 |
|------|-----|
| 앱 이름 | 말레이스 |
| 짧은 설명 | 매일 경주·찌라시 예상·친구와 맞추기 |
| 그래픽 | `assets/apps-in-toss/export/` |
| 카테고리 | 게임 → 스포츠 또는 레이싱 |
| 연락처 | ssampoto@gmail.com |

**피할 키워드:** 내기, 배당, 마권, 도박, 카지노

---

## Step 6. GRAC 자체등급분류 게임물 조회

1. [GRAC 자체등급분류 게임물 조회](https://www.grac.or.kr)
2. Play **게임물명·개발자명**으로 검색
3. **등급분류번호·등급분류일자·이용등급·내용정보** 메모

반영까지 **며칠~2주** 걸릴 수 있습니다.

---

## Step 7. 앱인토ss 콘솔

**게임 등급분류** 탭:

| 항목 | 값 |
|------|-----|
| 스토어 링크 | Play 앱 페이지 URL |
| 등록자명 | Play **개발자** 이름 |
| 자체등급분류사업자명 | **Google** |
| 등급분류번호·일자·이용등급·내용정보 | GRAC 조회 결과와 **동일** |
| 주요화면 4장 | `assets/apps-in-toss/grac-screenshots/` |

---

## Digital Asset Links (TWA, 선택)

현재 Android 앱은 **WebView**입니다. 나중에 Bubblewrap TWA로 바꿀 때:

1. keystore SHA256 → `docs/.well-known/assetlinks.json`
2. GitHub Pages에 푸시
3. [Statement List Tester](https://developers.google.com/digital-asset-links/tools/generator)로 검증

템플릿 패키지: `com.aundots.horserace`

---

## 체크리스트

- [ ] Play 개발자 계정 ($25)
- [ ] Step 2: `npm run build:play:pages` + GitHub Pages
- [ ] Step 3: API `PLAY_DEMO=true` + `VITE_API_BASE_URL` 재빌드
- [ ] Step 4: keystore + `app-release.aab`
- [ ] Step 5: 내부 테스트 + IARC
- [ ] GRAC 자체등급분류 조회
- [ ] 앱인토ss 등급분류 + grac-screenshots
- [ ] 사업자 등록 (토스 로그인·광고 출시 전)

---

## 코드 위치

| 경로 | 역할 |
|------|------|
| `src/lib/playStore.ts` | Play 빌드 플래그 |
| `src/hooks/useAuth.ts` | demo-login |
| `server/src/lib/playDemo.ts` | `PLAY_DEMO` 게이트 |
| `scripts/deploy-play-pages.mjs` | dist → docs/play |
| `play-store/android/` | WebView AAB |

---

## Local release build (automation)

| Artifact | Path |
|----------|------|
| Release AAB | `play-store/android/app/build/outputs/bundle/release/app-release.aab` (~3.1 MB) |
| Keystore | `play-store/horserace-release.jks` (gitignored) |
| Passwords | `play-store/KEYSTORE.local.md` (gitignored) |
| Asset Links SHA256 | `docs/.well-known/assetlinks.json` (release cert fingerprint) |

### Play Console — upload now

1. [Google Play Console](https://play.google.com/console) → **말레이스** (`com.aundots.horserace`)
2. **Testing** → **Internal testing** → **Create new release**
3. **Upload** → select `app-release.aab` (path above)
4. **Release notes** → save → **Review release** → **Start rollout to Internal testing**
5. Complete **IARC questionnaire** when prompted (store listing must match Toss app name)
6. After API deploy: set `PLAY_DEMO=true` on host, update `.env.play` `VITE_API_BASE_URL`, run `npm run build:play:pages`, push `docs/play/`

### API deploy (Render — manual)

No deploy token in CI. Create **Web Service** (root `server/`, build `npm install && npm run build`, start `npm start`), set `PLAY_DEMO=true` and `SESSION_SECRET`, then use the service URL in `.env.play` and rebuild Pages.
