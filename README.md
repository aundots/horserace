# 말레이스 (horserace)

앱인토스 WebView 미니앱 — 매일 연습주행, 주말 랭킹 레이스.

## 로컬 실행

```bash
# 프론트 (루트)
npm install
cp .env.example .env

# API 서버
cd server
cp .env.example .env
npm install
npm run dev
```

다른 터미널에서 `npm run dev`로 미니앱을 띄우고, 샌드박스 앱에서 `appName: horserace`로 연결해 테스트합니다.

mTLS 인증서는 `server/cert/`에 넣은 뒤 토스 로그인이 동작합니다.

## 빌드·배포

```bash
npm run build
npm run deploy
```

배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/)에서 발급합니다.

## 프로젝트 구조

| 경로 | 설명 |
|------|------|
| `src/` | React + TDS WebView 프론트 |
| `granite.config.ts` | appName `horserace`, 브랜드 `말레이스` |
| `assets/apps-in-toss/export/` | 콘솔 노출용 PNG·키워드 |
| `docs/` | 기획·마케팅 문서 |

## 다음 작업

1. 콘솔 `icon` URL을 `granite.config.ts`에 반영
2. mTLS 인증서·복호화 키를 `server/.env`에 설정
3. 연습주행·랭킹 경주 시뮬레이션 API
