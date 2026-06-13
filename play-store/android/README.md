# 말레이스 — Play Store Android (WebView 래퍼)

GitHub Pages에 호스팅된 Play 웹 빌드를 WebView로 여는 Android 앱입니다.

- **패키지:** `com.aundots.horserace`
- **로드 URL:** `https://aundots.github.io/horserace/play/`

## 사전 요구

| 항목 | 버전 |
|------|------|
| JDK | 17+ |
| Android SDK | API 35 (`compileSdk`) |
| Android Build-Tools | 35.x |

`local.properties` (gitignore됨 — 로컬에서만 생성):

```properties
sdk.dir=C\:\\Users\\User\\AppData\\Local\\Android\\Sdk
```

Windows에서 SDK 경로 확인: `%LOCALAPPDATA%\Android\Sdk` 또는 `ANDROID_HOME`.

## 아이콘 재생성

`assets/apps-in-toss/export/app-logo-600x600.png`에서 mipmap 생성:

```bash
node scripts/generate-icons.mjs
```

## 릴리스 keystore (1회)

```bash
keytool -genkeypair -v \
  -keystore horserace-release.jks \
  -alias horserace \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=말레이스, OU=Apps, O=Aundots, L=Seoul, ST=Seoul, C=KR"
```

**SHA256 지문** (TWA `assetlinks.json`용):

```bash
keytool -list -v -keystore horserace-release.jks -alias horserace
```

`docs/.well-known/assetlinks.json`의 `REPLACE_WITH_SHA256_FINGERPRINT`를 콜론 포함 SHA256 값으로 교체 후 GitHub Pages에 푸시.

## 서명 환경 변수

빌드 시 다음 중 하나:

| 변수 | 설명 |
|------|------|
| `PLAY_KEYSTORE` | `.jks` 절대/상대 경로 (기본: `../horserace-release.jks`) |
| `PLAY_KEYSTORE_PASSWORD` | keystore 비밀번호 |
| `PLAY_KEY_ALIAS` | alias (기본: `horserace`) |
| `PLAY_KEY_PASSWORD` | key 비밀번호 |

keystore가 없으면 **서명 없는** release AAB가 생성됩니다 (로컬 테스트용). Play Console 업로드에는 서명된 AAB가 필요합니다.

PowerShell 예:

```powershell
$env:PLAY_KEYSTORE = "C:\path\horserace-release.jks"
$env:PLAY_KEYSTORE_PASSWORD = "your-store-pass"
$env:PLAY_KEY_ALIAS = "horserace"
$env:PLAY_KEY_PASSWORD = "your-key-pass"
```

## AAB 빌드

```bash
# Windows
.\gradlew.bat bundleRelease

# macOS / Linux
./gradlew bundleRelease
```

출력: `app/build/outputs/bundle/release/app-release.aab`

## Gradle wrapper 없을 때

이 프로젝트에 `gradlew` / `gradlew.bat` / `gradle/wrapper/`가 포함되어 있습니다.  
없다면 Android Studio에서 프로젝트를 열거나, Gradle 8.11+ 설치 후:

```bash
gradle wrapper --gradle-version 8.11.1
```

## 웹 빌드 먼저

AAB만으로는 게임이 동작하지 않습니다. 루트에서:

```bash
npm run build:play:pages
git add docs/play && git commit && git push
```

API는 `PLAY_DEMO=true`로 배포해야 「게임 체험하기」가 동작합니다. 자세한 절차는 `docs/play-internal-test.md`.

## TWA (선택)

현재는 WebView 래퍼입니다. Chrome Custom Tabs TWA로 전환하려면 Bubblewrap + `assetlinks.json` SHA256 등록이 필요합니다.
