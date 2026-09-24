# 직접 해야 하는 것만 (말달리자 출시)

나머지(에셋 PNG, 키워드, 배포 템플릿, env 예시, 코드)는 repo에 준비되어 있습니다.

---

## 1. 앱인토스 콘솔 (로그인 필요 — AI 불가)

- [ ] 워크스페이스·앱 `horserace` 등록
- [ ] **노출 정보** 업로드: `assets/apps-in-toss/export/` PNG + `search-keywords.txt`
- [ ] **mTLS** 발급 → `server/cert/client-cert.pem`, `client-key.pem` 저장
- [ ] **리워드 광고 그룹** 생성 → ID를 `.env`의 `VITE_AD_GROUP_ID`에 입력
- [ ] `npm run build` → `.ait` 업로드 → **QR 테스트**
- [ ] GRAC 완료 후 콘솔 **게임 등급분류** 입력 → **검수 요청** → **출시하기**

---

## 2. GRAC 등급분류 (로그인·수수료 — AI 불가)

- [ ] [GRAC](https://www.grac.or.kr) 업체 회원 → 등급분류신청 → **기타-앱인토스**
- [ ] 출시 URL: `https://horserace.private-apps.tossmini.com` (콘솔 QR 테스트 후)
- [ ] 플레이 영상 + 실행 가능한 게임물 + 내용설명서 제출
- [ ] 등급분류증명서 PDF 수령 → 앱인토스 콘솔 첨부

자세한 값: `docs/grac-setup.md`

---

## 3. API 서버 배포 (호스팅 계정 — AI 불가)

- [ ] Render / Railway / Fly 등 **본인 계정**으로 `server/` 배포
- [ ] `server/.env.production.example` 참고해 env 설정 + mTLS cert 마운트
- [ ] 배포 URL 확인 → `VITE_API_BASE_URL` 설정 → **클라이언트 다시 `npm run build`**

가이드: `docs/deploy-api.md`

---

## 4. 본인만 할 수 있는 확인

- [ ] 토스앱 QR로 로그인·경주·광고·친구방 실기 테스트
- [ ] GRAC/검수용 **플레이 녹화** (본인 목소리·화면)

---

## AI가 이미 해둔 것

| 항목 | 위치 |
|------|------|
| 콘솔용 PNG·키워드 | `assets/apps-in-toss/export/` |
| 광고 연동 코드 | `useMonetization`, `useInAppAds` |
| dev 로그인 숨김 | `src/lib/devAccess.ts` |
| CORS·appName | `server/src/config.ts`, `granite.config.ts` |
| 배포 Dockerfile | `server/Dockerfile` |
| 운영 env 예시 | `.env.production.example`, `server/.env.production.example` |

**광고 그룹 ID·mTLS·콘솔 업로드·GRAC·호스팅 결제**만 직접 하시면 됩니다.
