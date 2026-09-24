export type Lang = "ko" | "en";

/** 영어 서수 접미사 — 1st/2nd/3rd, 11~13은 예외적으로 th. */
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = n % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

/**
 * UI 문자열 카탈로그.
 *
 * 값이 함수인 항목은 숫자·이름 등을 끼워 넣는 문장이다 — 언어마다 어순이
 * 달라서 문장을 조각내 이어붙이면 어색해지므로, 조각이 아니라 완성된 문장을
 * 언어별로 각각 쓴다.
 */
export const STRINGS = {
  ko: {
    // 공통
    back: "돌아가기",
    retry: "다시 시도",
    loading: "불러오는 중...",
    close: "확인",
    home: "홈으로",

    // 홈
    appTitle: "말달리자",
    homeSubtitle: "친구와 맞추기를 메인으로 즐겨보세요",
    partyCardTitle: "친구와 맞추기 · 메인 모드",
    partyCardDesc: "방 만들기 · 코드 입장 · 말 중복 선택 불가",
    partyStart: "친구와 맞추기 시작",
    statTipPoints: "찌라시 P",
    statTickets: "경주 티켓",
    soloStart: "솔로 경주 시작",
    dailyChallenge: (done: number, goal: number, gold: number, claimed: boolean) =>
      `오늘의 챌린지 · ${done}/${goal}경주${claimed ? " ✓ 완료" : ` · +${gold}G`}`,
    ticketAdGet: (remaining: number) => `광고 보고 경주 티켓 +1 (오늘 ${remaining}회)`,
    ticketAdPre: (remaining: number) => `광고로 티켓 미리 받기 +1 (오늘 ${remaining}회)`,
    ticketAdWait: "잠시 후 다시 받을 수 있어요",
    pointsAd: (remaining: number) => `광고 보고 찌라시 P +4 (오늘 ${remaining}회)`,
    pointsAdLabel: "찌라시 P 광고",
    menuParty: "친구와 맞추기",
    menuPartyDesc: "말 이름 응원 · 찌라시 3장 · 누적 점수",
    menuAttendance: "출석 보상",
    menuAttendanceDesc: (streak: number) => `스트릭 ${streak}일 · 매일 찌라시 P 받기`,
    menuHelp: "도움말",
    menuSettings: "설정",
    menuLogout: "로그아웃",
    adTest: "광고 테스트",
    loadFailed: "게임 정보를 불러오지 못했어요.",
    reload: "다시 불러오기",
    loginToss: "토스로 시작하기",

    // 설정
    settings: "설정",
    sound: "사운드",
    on: "켜짐",
    off: "꺼짐",
    language: "언어 (Language)",

    // 출석
    attendanceTitle: "출석 보상",
    attendanceSubtitle: (streak: number, points: number) =>
      `스트릭 ${streak}일 · 찌라시 ${points}P`,
    attendanceDesc:
      "매일 출석하면 찌라시 P와 골드를 받아요. 찌라시 P로 출전마의 정보를 열어볼 수 있어요.",
    attendanceClaim: "오늘 출석하기",
    attendanceDone: (index: number) => `오늘 출석 완료 (${index}/28)`,

    // 예상
    predictTitle: "찌라시 · 예상",
    predictFree: (n: number) => ` · 무료 ${n}`,
    entrantsTitle: "출전마 · 찌라시",
    tipCostHint: (total: number, opened: number, all: number) =>
      `말마다 1~3P 랜덤 · 전체 오픈 ${total}P · 열림 ${opened}/${all}`,
    adChecking: "광고 확인 중...",
    adMorePoints: "광고 보고 찌라시 P +4 · 정보 더 열기",
    pointsGained: "찌라시 P +4",
    startWithPick: (n: number) => `${n}번 예상 · 경주 시작`,
    pickFirst: "예상 1착 선택",
    cancel: "취소",
    trackDry: "마른 주로",
    trackWet: "습윤 주로",
    trackHeavy: "무거운 주로",
    weatherSunny: "맑음",
    weatherCloudy: "흐림",
    weatherRain: "비",
    gradeSure: "확실",
    gradeLikely: "유력",
    gradeRumor: "소문",
    gradeTrap: "함정",
    myHorse: "내 말",
    taken: "선택됨",
    ghost: "고스트",
    statSpeed: "스피드",
    statStamina: "스태",
    statAccel: "가속",
    tipOpening: "여는 중...",
    tipOpen: (cost: number) => `🔒 찌라시 열기 (${cost}P)`,
    tipOpenFree: (bonus: number) => `🎁 찌라시 무료 열기 (보너스 ${bonus}장)`,
    tipOpenParty: (left: number, total: number) => `🔍 찌라시 열기 (남은 ${left}/${total}장)`,
    tipAllUsed: (total: number) => `찌라시 ${total}장 모두 사용`,
    tipNoPoints: (cost: number) => `예상 포인트 부족 (${cost}P 필요)`,
    anonymousHint: "스탯·기수 비공개 · 이름으로 응원 · 찌라시로 힌트",
    paceFront: "도주",
    paceStalker: "선행",
    paceMid: "선입",
    paceCloser: "추입",
    aptDry: "마른 주로",
    aptWet: "습윤 주로",
    aptHeavy: "무거운 주로",
    distSprint: "단거",
    distMiddle: "중거",
    distLong: "장거",
    condGreat: "최상",
    condGood: "양호",
    condPoor: "부진",

    // 경주
    raceReady: "출발 준비",
    raceWaiting: "출발 대기",
    raceLive: "LIVE",
    raceOvertake: "역전!",
    raceFinished: "완주",
    raceInProgress: "경주 진행 중",
    raceStart: "경주 시작",
    raceWaitingDesc: "8두가 결승선 앞에 대기 중입니다",
    overtakeCount: (n: number) => `역전 ${n}회`,
    whipTap: "채찍질!",
    whipGreat: "GREAT!",
    whipMiss: "너무 빨라요!",
    whipCombo: (n: number) => `${n} 콤보`,
    nextRace: "바로 다음 경주",
    nextRacePreparing: "다음 경주 준비 중...",
    noTicket: "티켓 없음 · 광고 시청 필요",
    backToRoom: "방으로 돌아가기",
    homeEndStreak: "홈으로 (연속 출전 종료)",
    modeParty: "친구 내기",
    modePartyRace: (n: number) => `친구 내기 · ${n}경기`,
    modePractice: "연습주행",
    modeRanked: "랭킹 경주",
    dnfInterference: (n: number) => `예상 ${n}번 · 간섭 사고 기권`,
    dnfInterferencePlain: "간섭 사고 기권",
    dnfFall: (n: number) => `예상 ${n}번 낙마`,
    dnfFallPlain: "낙마 처리",
    partyFinish: (n: number, place: number, score: number) =>
      `내 ${n}번 · ${place}착 · +${score}점`,
    soloFinish: (name: string, place: number) => `예상 ${name} · ${place}위`,
    plainFinish: (place: number) => `${place}위 완주`,
    tagInterference: "간섭 사고",
    tagFall: "낙마",
    horseNo: (n: number) => `${n}번`,
    horseEntry: (n: number, name: string) => `${n}번 ${name}`,
    jockeyShort: (name: string) => `기수 ${name}`,
    officialRanks: "공식 순위",
    opponentPicks: "상대 선택",
    bannerAd: "광고",
    sponsorBanner: "스폰서 배너",
    sponsorBannerDesc: "보상형 · 전면형 광고 영역과 함께 운영됩니다",
    bannerMore: "자세히",
    bottomBanner: "배너 광고",
    bottomBannerDesc: "이 영역은 실제 광고 SDK 슬롯으로 교체할 수 있어요",
    bannerInfo: "광고 안내",
    trackHome: "HOME · 오르막",
    trackBack: "BACK · 내리막",
    partyResultHeader: (race: number | undefined) =>
      `${race ? `${race}경기 · ` : ""}친구 점수`,
    memberResult: (pick: number, place: number, pts: number) =>
      `${pick}번 · ${place}착 +${pts}`,
    memberTotal: (total: number) => ` · 누적 ${total}점`,
    scoreTable: "1착 10 · 2착 8 · 3착 5 · 4착 3 · 5착 2 · 6착 1 · 7·8착 0",
    ticketAdNext: (remaining: number) =>
      `광고 보고 티켓 +1 · 바로 다음 경주 (오늘 ${remaining}회)`,
    pointsAdNext: (remaining: number) =>
      `광고 보고 찌라시 P+4 · 다음 경주 (오늘 ${remaining}회)`,

    // 파티
    partyTitle: "친구와 맞추기",
    partyRoom: (code: string) => `방 ${code}`,
    partySubtitleWaiting: "친구 초대 · 같은 말 중복 불가",
    partySubtitlePicking: (race: number, tips: number) =>
      `${race}경기 · 말 선택 · 찌라시 ${tips}장 남음`,
    partySubtitleRacing: "경주 진행 중...",
    partySubtitleDone: (race: number) => `${race}경기 결과`,
    partyIntro: "내기용 · 스탯 숨김 · 찌라시 3장 · 누적 점수",
    partyIntroLong:
      "스탯·기수는 숨기고 말 이름은 공개! 경기마다 찌라시 3장 · 같은 말 중복 불가 · 1착 10 · 2착 8 · 3착 5 · 4착 3 · 5착 2 · 6착 1 · 7·8착 0",
    nickname: "닉네임 (입장 시 필수)",
    nicknamePlaceholder: "닉네임 입력 · 코드로 입장하려면 필요해요",
    createRoom: "방 만들기",
    roomCode: "방 코드",
    roomCodePlaceholder: "6자리 코드",
    joinByCode: "코드로 입장",
    nicknameRequired: "입장하려면 닉네임을 입력해 주세요",
    copyInvite: "초대 링크 복사 · 친구에게 공유",
    inviteCopied: "초대 링크를 복사했어요",
    hostPrepare: "1경기 시작 · 말 선택",
    hostPrepareNext: "다음 경기 준비",
    waitForHost: "방장이 경주를 준비할 때까지 기다려 주세요",
    waitForHostNext: "방장이 다음 경기를 준비할 때까지 기다려 주세요",
    host: "방장",
    you: "나",
    pickWaiting: "말 선택 대기",
    pickDone: "선택 완료 ✓",
    picking: "선택 중...",
    myPick: (n: number) => `내 말 ${n}번`,
    confirmPick: (n: number) => `${n}번 선택 확정`,
    pickConfirmed: (n: number) => `내 말 ${n}번 확정 · 바꾸려면 다시 선택`,
    selectHorse: "이번 경기 말을 선택하세요",
    allPicked: "모두 선택 완료 · 경주 시작",
    notAllPicked: "아직 선택 안 한 친구가 있어요",
    leaveRoom: "방 나가기",
    scoreTitle: (race: number) => `누적 점수 · ${race > 0 ? `${race}경기` : "대기"}`,
    scoreHint: "누적 낮을수록 내기 불리",
    lastPlace: "꼴찌",
    points: (n: number) => `${n}점`,
    replayRace: "경주 다시 보기",
    nextGame: (n: number) => `다음 경기 · ${n}경기`,
    raceResult: (n: number) => `${n}경기 결과`,
    friendScores: "친구 점수",
    everyRacePick: (tips: number) =>
      `매 경기 말 새로 선택 · 이름 공개 · 찌라시 ${tips}장`,
    roomCreated: "방이 만들어졌어요",
    joined: "입장했어요",
    codeIs: (code: string) => `코드: ${code}`,
    rankLine: (rank: number, name: string, isYou: boolean) =>
      `${rank}위 ${name}${isYou ? " (나)" : ""}`,
    scoreWithLast: (score: number, isLast: boolean) =>
      `${score}점${isLast ? " · 꼴찌" : ""}`,
    partyRaceInfo: (race: number, distance: number, track: string) =>
      `${race}경기 · ${distance}m · ${track}`,
    pickedRaceStart: (n: number) => `${n}번 선택 완료`,
    raceStarted: "경주 시작!",
    prepareDone: "1경기 준비 완료",
    nextRacePrep: (n: number) => `${n}경기 준비`,
    memberPickInfo: (pick: number, place: number, pts: number, total: number) =>
      `${pick}번 · ${place}착 +${pts}점 (누적 ${total})`,
    memberResultRow: (pick: number, place: number) => `${pick}번 · ${place}착`,
    memberPointsRow: (pts: number, total: number) => `+${pts}점 · 누적 ${total}점`,

    // 결과
    goldEarned: (n: number) => `+${n} 골드`,
    predictWin: "예상 1착 적중!",
    predictPlace: "예상 2착 (1착 미적중)",
    predictMiss: "예상 미적중",
    dailyDoneShort: (goal: number, gold: number) => `오늘 ${goal}경주 달성! +${gold}G`,
    photoFinish: "포토 피니시",
    streakBonus: (n: number) => `연속 ${n}경주! 찌라시 무료 +1`,
    dailyDone: (goal: number, gold: number) => `오늘 ${goal}경주 달성! +${gold}G`,
    loopStatus: (streak: number, today: number, goal: number) =>
      `연속 출전 ${streak} · 오늘 ${today}/${goal}경주`,

    // 도움말
    help: "도움말",
    helpHowToTitle: "플레이 방법",
    helpHowTo:
      "경주 티켓으로 출전 → 찌라시 P로 8두 정보 열람 → 1착 예상 → 경주 관람. 예상 적중 여부는 기록되지만, 적중해도 찌라시 P는 추가 지급되지 않습니다.",
    helpTicketTitle: "경주 티켓 · 광고",
    helpTicket:
      "하루 5회 무료 경주 후, 추가 경주는 광고 시청으로 티켓을 받아야 합니다(하루 최대 20회). 티켓이 없으면 완주 화면에서 「광고 보고 티켓 · 다음 경주」를 이용하세요.",
    helpPointsTitle: "찌라시 P",
    helpPoints:
      "말마다 1~3P로 찌라시를 엽니다. P가 부족하면 광고로 P+4를 받을 수 있어요(하루 최대 15회). 티켓이 남아 있을 때 경주 사이 광고는 P 보충용입니다.",
    helpPartyTitle: "친구와 맞추기 (내기)",
    helpParty:
      "홈에서 친구와 맞추기로 방을 만들고 코드를 공유하세요. 1~8번·말 이름은 공개(응원용). 스탯·기수는 숨김. 경기마다 찌라시 3장, 같은 말은 한 명만 선택.",
    helpScoring:
      "1경기부터 N경기까지 연속 가능. 착순 점수: 1착 10 · 2착 8 · 3착 5 · 4착 3 · 5착 2 · 6착 1 · 7·8착 0. 여러 경기 점수를 누적하고, 합계가 가장 낮은 사람이 내기에서 지는 쪽으로 정하면 됩니다.",
    helpLoopTitle: "연속 플레이",
    helpLoop1: "완주 후 바로 다음 경주로 이어서 플레이할 수 있어요.",
    helpLoop2: "3경주 연속 완주 시 찌라시 무료 1장이 지급됩니다.",
    helpLoop3: "하루 5경주 완주 시 골드 보너스 +80G가 지급됩니다.",
    helpLoop4: "홈으로 가면 연속 출전 스트릭이 초기화됩니다.",
    helpGoldTitle: "골드",
    helpGold: "경주 완주·출석·일일 챌린지 보상입니다.",
    helpAccidentTitle: "낙마·사고",
    helpAccident1:
      "단독 낙마 — 구간당 기본 확률은 낮게 설정되어 있고, 코너·피로·컨디션에 따라 달라집니다.",
    helpAccident2:
      "간섭 사고 — 말들이 좁은 주로에서 엉켜 달릴 때 추가로 발생합니다. 코너·습윤·무거운 주로에서, 3두 이상 밀집 시 특히 높아집니다. 앞 다툼에 휘말리면 기권(DNF) 처리됩니다.",
    helpPolicyTitle: "정책",
    helpPolicy: "베팅·마권·배당 없음. 예상은 게임 내 기록·보상만. 골드→현금 환전 불가.",
    helpSupportTitle: "고객센터",
    helpSupport: "문의: ssampoto@gmail.com",
  },

  en: {
    // Common
    back: "Back",
    retry: "Try again",
    loading: "Loading...",
    close: "OK",
    home: "Home",

    // Home
    appTitle: "Horse Run",
    homeSubtitle: "Play with friends — guess the winner together",
    partyCardTitle: "Guess with Friends · Main Mode",
    partyCardDesc: "Create a room · Join by code · No duplicate picks",
    partyStart: "Start Guess with Friends",
    statTipPoints: "Tip Points",
    statTickets: "Race Tickets",
    soloStart: "Start Solo Race",
    dailyChallenge: (done: number, goal: number, gold: number, claimed: boolean) =>
      `Daily challenge · ${done}/${goal} races${claimed ? " ✓ Done" : ` · +${gold}G`}`,
    ticketAdGet: (remaining: number) => `Watch ad for +1 ticket (${remaining} left today)`,
    ticketAdPre: (remaining: number) => `Get a ticket early +1 (${remaining} left today)`,
    ticketAdWait: "Available again shortly",
    pointsAd: (remaining: number) => `Watch ad for +4 tip points (${remaining} left today)`,
    pointsAdLabel: "Tip point ad",
    menuParty: "Guess with Friends",
    menuPartyDesc: "Cheer by name · 3 tips · Cumulative score",
    menuAttendance: "Daily Reward",
    menuAttendanceDesc: (streak: number) => `${streak}-day streak · Tip points daily`,
    menuHelp: "Help",
    menuSettings: "Settings",
    menuLogout: "Log out",
    adTest: "Ad test",
    loadFailed: "Couldn't load game data.",
    reload: "Reload",
    loginToss: "Start with Toss",

    // Settings
    settings: "Settings",
    sound: "Sound",
    on: "On",
    off: "Off",
    language: "Language (언어)",

    // Attendance
    attendanceTitle: "Daily Reward",
    attendanceSubtitle: (streak: number, points: number) =>
      `${streak}-day streak · ${points} tip points`,
    attendanceDesc:
      "Check in daily for tip points and gold. Spend tip points to reveal info about the horses in a race.",
    attendanceClaim: "Check in today",
    attendanceDone: (index: number) => `Checked in today (${index}/28)`,

    // Predict
    predictTitle: "Tips & Pick",
    predictFree: (n: number) => ` · ${n} free`,
    entrantsTitle: "Runners & tips",
    tipCostHint: (total: number, opened: number, all: number) =>
      `1–3P each · ${total}P for all · ${opened}/${all} revealed`,
    adChecking: "Checking ad...",
    adMorePoints: "Watch ad for +4P · Reveal more",
    pointsGained: "+4 tip points",
    startWithPick: (n: number) => `Pick #${n} · Start race`,
    pickFirst: "Choose your winner",
    cancel: "Cancel",
    trackDry: "Firm track",
    trackWet: "Wet track",
    trackHeavy: "Heavy track",
    weatherSunny: "Clear",
    weatherCloudy: "Cloudy",
    weatherRain: "Rain",
    gradeSure: "Certain",
    gradeLikely: "Likely",
    gradeRumor: "Rumor",
    gradeTrap: "Trap",
    myHorse: "My pick",
    taken: "Taken",
    ghost: "Ghost",
    statSpeed: "Speed",
    statStamina: "Stam",
    statAccel: "Accel",
    tipOpening: "Opening...",
    tipOpen: (cost: number) => `🔒 Reveal tip (${cost}P)`,
    tipOpenFree: (bonus: number) => `🎁 Free tip reveal (${bonus} bonus)`,
    tipOpenParty: (left: number, total: number) => `🔍 Reveal tip (${left}/${total} left)`,
    tipAllUsed: (total: number) => `All ${total} tips used`,
    tipNoPoints: (cost: number) => `Not enough points (${cost}P needed)`,
    anonymousHint: "Stats & jockey hidden · Cheer by name · Tips give hints",
    paceFront: "Front runner",
    paceStalker: "Stalker",
    paceMid: "Mid-pack",
    paceCloser: "Closer",
    aptDry: "Firm track",
    aptWet: "Wet track",
    aptHeavy: "Heavy track",
    distSprint: "Sprint",
    distMiddle: "Middle",
    distLong: "Long",
    condGreat: "Peak",
    condGood: "Good",
    condPoor: "Poor",

    // Race
    raceReady: "Ready to start",
    raceWaiting: "At the gate",
    raceLive: "LIVE",
    raceOvertake: "Overtake!",
    raceFinished: "Finished",
    raceInProgress: "Race in progress",
    raceStart: "Start race",
    raceWaitingDesc: "8 horses are lined up at the gate",
    overtakeCount: (n: number) => `${n} overtakes`,
    whipTap: "Whip!",
    whipGreat: "GREAT!",
    whipMiss: "Too fast!",
    whipCombo: (n: number) => `${n} combo`,
    nextRace: "Next race",
    nextRacePreparing: "Preparing next race...",
    noTicket: "No tickets · Watch an ad",
    backToRoom: "Back to room",
    homeEndStreak: "Home (ends streak)",
    modeParty: "Friends bet",
    modePartyRace: (n: number) => `Friends bet · Race ${n}`,
    modePractice: "Practice run",
    modeRanked: "Ranked race",
    dnfInterference: (n: number) => `Pick #${n} · DNF from interference`,
    dnfInterferencePlain: "DNF from interference",
    dnfFall: (n: number) => `Pick #${n} fell`,
    dnfFallPlain: "Did not finish",
    partyFinish: (n: number, place: number, score: number) =>
      `My #${n} · ${place}${ordinal(place)} · +${score} pts`,
    soloFinish: (name: string, place: number) =>
      `Picked ${name} · ${place}${ordinal(place)}`,
    plainFinish: (place: number) => `Finished ${place}${ordinal(place)}`,
    tagInterference: "Interference",
    tagFall: "Fall",
    horseNo: (n: number) => `#${n}`,
    horseEntry: (n: number, name: string) => `#${n} ${name}`,
    jockeyShort: (name: string) => `J. ${name}`,
    officialRanks: "Live standings",
    opponentPicks: "Their picks",
    bannerAd: "AD",
    sponsorBanner: "Sponsor banner",
    sponsorBannerDesc: "Runs alongside rewarded and interstitial ad slots",
    bannerMore: "Details",
    bottomBanner: "Banner ad",
    bottomBannerDesc: "This area can be swapped for a real ad SDK slot",
    bannerInfo: "About ads",
    trackHome: "HOME · Uphill",
    trackBack: "BACK · Downhill",
    partyResultHeader: (race: number | undefined) =>
      `${race ? `Race ${race} · ` : ""}Friend scores`,
    memberResult: (pick: number, place: number, pts: number) =>
      `#${pick} · ${place}${ordinal(place)} +${pts}`,
    memberTotal: (total: number) => ` · ${total} total`,
    scoreTable: "1st 10 · 2nd 8 · 3rd 5 · 4th 3 · 5th 2 · 6th 1 · 7th–8th 0",
    ticketAdNext: (remaining: number) =>
      `Watch ad for +1 ticket · Next race (${remaining} left today)`,
    pointsAdNext: (remaining: number) =>
      `Watch ad for +4P · Next race (${remaining} left today)`,

    // Party
    partyTitle: "Guess with Friends",
    partyRoom: (code: string) => `Room ${code}`,
    partySubtitleWaiting: "Invite friends · No duplicate picks",
    partySubtitlePicking: (race: number, tips: number) =>
      `Race ${race} · Pick a horse · ${tips} tips left`,
    partySubtitleRacing: "Race in progress...",
    partySubtitleDone: (race: number) => `Race ${race} results`,
    partyIntro: "For bets · Stats hidden · 3 tips · Cumulative score",
    partyIntroLong:
      "Stats and jockeys stay hidden, but horse names are public so you can cheer! 3 tips per race · no duplicate picks · 1st 10 · 2nd 8 · 3rd 5 · 4th 3 · 5th 2 · 6th 1 · 7th–8th 0",
    nickname: "Nickname (required to join)",
    nicknamePlaceholder: "Enter a nickname to join by code",
    createRoom: "Create room",
    roomCode: "Room code",
    roomCodePlaceholder: "6-character code",
    joinByCode: "Join by code",
    nicknameRequired: "Enter a nickname to join",
    copyInvite: "Copy invite link · Share with friends",
    inviteCopied: "Invite link copied",
    hostPrepare: "Start race 1 · Pick horses",
    hostPrepareNext: "Prepare next race",
    waitForHost: "Waiting for the host to set up the race",
    waitForHostNext: "Waiting for the host to set up the next race",
    host: "Host",
    you: "you",
    pickWaiting: "Waiting to pick",
    pickDone: "Picked ✓",
    picking: "Picking...",
    myPick: (n: number) => `My pick: #${n}`,
    confirmPick: (n: number) => `Confirm #${n}`,
    pickConfirmed: (n: number) => `#${n} confirmed · Tap another to change`,
    selectHorse: "Pick a horse for this race",
    allPicked: "Everyone picked · Start race",
    notAllPicked: "Some friends haven't picked yet",
    leaveRoom: "Leave room",
    scoreTitle: (race: number) => `Total score · ${race > 0 ? `Race ${race}` : "Waiting"}`,
    scoreHint: "Lowest total loses the bet",
    lastPlace: "last",
    points: (n: number) => `${n} pts`,
    replayRace: "Watch race again",
    nextGame: (n: number) => `Next race · ${n}`,
    raceResult: (n: number) => `Race ${n} results`,
    friendScores: "Friend scores",
    everyRacePick: (tips: number) =>
      `New pick each race · Names shown · ${tips} tips`,
    roomCreated: "Room created",
    joined: "Joined",
    codeIs: (code: string) => `Code: ${code}`,
    rankLine: (rank: number, name: string, isYou: boolean) =>
      `${rank}${ordinal(rank)} ${name}${isYou ? " (you)" : ""}`,
    scoreWithLast: (score: number, isLast: boolean) =>
      `${score} pts${isLast ? " · last" : ""}`,
    partyRaceInfo: (race: number, distance: number, track: string) =>
      `Race ${race} · ${distance}m · ${track}`,
    pickedRaceStart: (n: number) => `Picked #${n}`,
    raceStarted: "Race started!",
    prepareDone: "Race 1 ready",
    nextRacePrep: (n: number) => `Race ${n} ready`,
    memberPickInfo: (pick: number, place: number, pts: number, total: number) =>
      `#${pick} · ${place}${ordinal(place)} +${pts} (${total} total)`,
    memberResultRow: (pick: number, place: number) =>
      `#${pick} · ${place}${ordinal(place)}`,
    memberPointsRow: (pts: number, total: number) => `+${pts} · ${total} total`,

    // Results
    goldEarned: (n: number) => `+${n} gold`,
    predictWin: "Called the winner!",
    predictPlace: "2nd place (winner missed)",
    predictMiss: "Missed",
    dailyDoneShort: (goal: number, gold: number) => `${goal} races today! +${gold}G`,
    photoFinish: "Photo finish",
    streakBonus: (n: number) => `${n} races in a row! +1 free tip`,
    dailyDone: (goal: number, gold: number) => `${goal} races today! +${gold}G`,
    loopStatus: (streak: number, today: number, goal: number) =>
      `Streak ${streak} · ${today}/${goal} races today`,

    // Help
    help: "Help",
    helpHowToTitle: "How to play",
    helpHowTo:
      "Spend a ticket to enter → use tip points to reveal info on the 8 horses → pick the winner → watch the race. Your hit rate is recorded, but correct picks don't grant extra tip points.",
    helpTicketTitle: "Race tickets & ads",
    helpTicket:
      "After 5 free races a day, extra races need a ticket from watching an ad (up to 20 a day). Out of tickets? Use “Watch ad for ticket · Next race” on the finish screen.",
    helpPointsTitle: "Tip points",
    helpPoints:
      "Revealing a tip costs 1–3P per horse. Low on points? Watch an ad for +4P (up to 15 a day). While you still have tickets, ads between races are for topping up points.",
    helpPartyTitle: "Guess with Friends (bets)",
    helpParty:
      "From home, create a room and share the code. Horse numbers and names are public so you can cheer; stats and jockeys stay hidden. 3 tips per race, and each horse can only be picked by one person.",
    helpScoring:
      "Play as many races as you like. Finish points: 1st 10 · 2nd 8 · 3rd 5 · 4th 3 · 5th 2 · 6th 1 · 7th–8th 0. Scores accumulate across races, and whoever ends with the lowest total loses the bet.",
    helpLoopTitle: "Race streaks",
    helpLoop1: "You can jump straight into the next race after finishing.",
    helpLoop2: "Finish 3 races in a row for 1 free tip reveal.",
    helpLoop3: "Finish 5 races in a day for a +80G gold bonus.",
    helpLoop4: "Returning home resets your race streak.",
    helpGoldTitle: "Gold",
    helpGold: "Earned from finishing races, daily check-ins, and daily challenges.",
    helpAccidentTitle: "Falls & incidents",
    helpAccident1:
      "Solo fall — the base chance per segment is low, and varies with corners, fatigue, and condition.",
    helpAccident2:
      "Interference — happens when horses bunch up in tight running. More likely on corners, wet or heavy tracks, and when 3 or more horses are packed together. Getting caught in a scramble means a DNF.",
    helpPolicyTitle: "Policy",
    helpPolicy:
      "No betting, no tickets, no odds. Picks only affect in-game records and rewards. Gold cannot be exchanged for money.",
    helpSupportTitle: "Support",
    helpSupport: "Contact: ssampoto@gmail.com",
  },
} as const;

export type StringKey = keyof typeof STRINGS.ko;
