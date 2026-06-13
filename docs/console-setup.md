# 앱인토스 콘솔 등록 가이드 — horserace (말레이스)

## 1. 앱 기본 정보

| 항목 | 값 |
|------|-----|
| appName | `horserace` |
| 표시 이름 | 말레이스 |
| 부제 | 매일 연습주행, 주말 랭킹 레이스 |
| primaryColor | `#3182F6` |

## 2. 노출 정보 에셋

`assets/apps-in-toss/export/` 폴더에서 업로드:

- `app-logo-600x600.png`
- `app-logo-dark-600x600.png`
- `thumbnail-1932x828.png`
- `screenshot-vertical-01~03.png`
- `screenshot-horizontal-01.png`
- 검색 키워드: `search-keywords.txt`

## 3. 토스 로그인 · mTLS

1. 콘솔 → 개발 → mTLS 인증서 발급
2. `server/cert/client-cert.pem`, `server/cert/client-key.pem` 저장 (git 제외)
3. `server/.env` 설정:

```env
MTLS_CERT_PATH=cert/client-cert.pem
MTLS_KEY_PATH=cert/client-key.pem
APP_NAME=horserace
```

4. CORS Origin (이미 `server/src/config.ts` 반영):
   - `https://horserace.private-apps.tossmini.com` (QR 테스트)
   - `https://horserace.apps.tossmini.com` (운영)

## 4. 광고 그룹

콘솔에서 리워드 광고 그룹 생성 후 `.env`:

```env
# 클라이언트 (루트 .env)
VITE_AD_GROUP_ID=콘솔에서_발급한_광고그룹_ID
```

개발 시 테스트 ID: `ait-ad-test-rewarded-id`

## 5. 프로모션 (토스 포인트)

고정 미션용 프로모션 코드 생성:

| 미션 | 코드 예시 | 지급 |
|------|-----------|------|
| 주간 패스 완료 | `weekly_pass_complete` | 100P/주 |
| 첫 가입 | `first_login_bonus` | 50P (1회) |

> 순위·승패 기반 토스P 지급 금지. 골드→토스P 환전 UI 금지.

## 6. 리더보드

| 항목 | 값 |
|------|-----|
| 한국어 점수 단위 | 점 |
| 영어 점수 단위 | points |
| 정렬 | 높은 점수부터 |

## 7. 게임 등급분류 (GRAC)

콘솔 3단계 — 스토어 미출시 시 **자체등급분류** 선행.
자세한 내용: `docs/launch-checklist.md`

## 8. 배포

```bash
npm run build          # horserace.ait 생성
# 콘솔에 .ait 업로드 → QR 테스트 → 검수 요청
```

## 9. 백엔드 배포

```env
DATABASE_URL=postgresql://...   # 운영 시 PostgreSQL 연결
PORT=4000
SESSION_SECRET=운영용_랜덤_시크릿
DEV_LOGIN=false                 # 운영에서는 반드시 false
```

API 베이스 URL을 클라이언트 `VITE_API_BASE_URL`에 설정.
