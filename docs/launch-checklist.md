# 말달리자 출시 체크리스트

## 게임 등급분류 (GRAC)

- [ ] 자체등급분류 신청 (스토어 미출시 시) — Play IARC 완료 후 GRAC 조회
- [ ] 이용등급·내용정보 확정
- [ ] 게임 주요화면 2종 (`assets/apps-in-toss/grac-screenshots/` — `npm run build` 후 재생성)

## Google Play (동시 출시)

- [x] 앱명 **말달리자**, 패키지 `com.aundots.horserace`
- [x] Play 웹 빌드 `docs/play/` (게스트 체험하기)
- [ ] IARC + 내부 테스트 (`docs/play-internal-test.md`)

## 앱인토스 콘솔

- [ ] `horserace` 앱 등록 (`docs/console-setup.md`)
- [ ] 노출 정보 에셋 업로드
- [ ] mTLS 인증서 발급·서버 배포
- [ ] 광고 그룹 ID 설정
- [ ] 프로모션 코드 (주간 패스, 첫 가입)

## 게임 출시 가이드

- [x] 풀스크린 WebView UI
- [x] `userKey` 세션·서버 저장
- [x] 종료 확인 (beforeunload + 설정)
- [x] 사운드 On/Off 설정
- [x] 확률 정보 도움말 (`HelpPage`)
- [x] 베팅·마권·환전 UI 없음
- [ ] CSR/SSG 빌드 (`npm run build` → `.ait`)
- [ ] QR 테스트 → 토스앱 최종 테스트

## 고객센터

- [x] 문의 이메일: ssampoto@gmail.com (도움말 화면)

## 검수 전 점검

- [ ] 첫 로그인 30초 내 연습주행 가능
- [ ] 주말 랭킹 3회 무료 + 골드/RV 추가
- [ ] 토스 포인트: 주간 패스만 (순위 무관)
- [ ] 광고: load→show→load, 세션 cap 준수

## 배포

```bash
cd server && npm run build && npm start
cd .. && npm run build
# horserace.ait → 콘솔 업로드
```
