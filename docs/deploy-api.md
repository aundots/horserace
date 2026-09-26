# 운영 API 배포 — 말달리자

프론트(`.ait`)는 토스가 호스팅합니다. **직접 배포하는 것은 API 서버 하나**입니다.

## API가 하는 일

| 기능 | 저장 데이터 |
|------|-------------|
| 토스 로그인 (mTLS) | 세션 |
| 경주 준비·시뮬·결과 | 당일 티켓, 찌라시 P, 연속 출전 |
| 광고 보상 | 일일/세션 시청 횟수 |
| 친구 방 | 방 코드, 멤버 예측 (플레이 중) |
| 주말 랭킹 | 주간 점수, 디비전 |

육성(말 키우기) 화면이 없어도 위 데이터는 **서버 재시작 시 초기화**됩니다.

---

## DB가 꼭 필요한가?

**장기 육성 때문이 아니라**, 아래 때문에 필요합니다.

- 로그인 세션 유지
- 하루 1회 무료 티켓·광고 한도 (악용 방지)
- 주말 랭킹 점수
- 출석·스트릭·골드

**GRAC 심사·혼자 QR 테스트만** 할 때는 메모리 서버 1대를 **재시작 안 하면** 잠깐은 됩니다.  
**실사용자 오픈** 전에는 SQLite/Postgres 중 하나는 연결하는 것을 권장합니다.

---

## 최소 운영 env (`server/.env`)

```env
PORT=4000
APP_NAME=horserace
SESSION_SECRET=64자_이상_랜덤
DEV_LOGIN=false

MTLS_CERT_PATH=cert/client-cert.pem
MTLS_KEY_PATH=cert/client-key.pem
```

클라이언트 빌드 시 (루트 `.env`):

```env
VITE_API_BASE_URL=https://YOUR-API.example.com
VITE_AD_GROUP_ID=콘솔에서_발급한_광고그룹_ID
```

---

## Render 예시 (무료~저가)

1. GitHub에 `server/` 포함 repo 연결
2. **Web Service** → Root Directory: `server`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Health check: `/health`
6. mTLS cert/key → Render **Secret Files** 또는 환경변수 base64

배포 URL 예: `https://horserace-api.onrender.com` → `VITE_API_BASE_URL`에 설정 후 **다시 `npm run build`**

---

## Docker (선택)

```bash
cd server
docker build -t horserace-api .
docker run -p 4000:4000 --env-file .env -v ./cert:/app/cert horserace-api
```

---

## 엔드포인트 (헬스체크)

- `GET /health` → `{ ok: true, app: "horserace" }`
- `POST /auth/login` (토스)
- `/player`, `/race`, `/ads`, `/party`, …

CORS는 `horserace.private-apps.tossmini.com`, `horserace.apps.tossmini.com` 이미 허용됨.
