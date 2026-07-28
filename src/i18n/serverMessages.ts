import type { Lang } from "./strings";

/**
 * 서버가 내려주는 한글 메시지를 영어로 옮긴다.
 *
 * 서버를 코드 기반으로 바꾸려면 라우트·스토어 60곳 이상을 건드려야 하고,
 * 이미 배포된 클라이언트와의 호환도 깨진다. 메시지는 사용자에게 그대로
 * 보여주는 용도뿐이라 표시 직전에 한 번만 옮기는 편이 안전하다.
 *
 * 서버 문구가 바뀌면 여기서 매칭이 실패하는데, 그때는 한글 원문이 그대로
 * 노출될 뿐 기능은 멀쩡하다(조용히 깨지지 않는다).
 */
const EXACT: Record<string, string> = {
  // 세션 · 인증
  "세션이 없습니다.": "You're not signed in.",
  "세션이 만료되었습니다.": "Your session expired.",
  "authorizationCode와 referrer가 필요합니다.":
    "authorizationCode and referrer are required.",
  "토스 앱에서만 로그인할 수 있어요.": "Sign-in is only available in the Toss app.",

  // 광고
  "광고 시청을 아직 확인하지 못했어요. 잠시 후 다시 시도해주세요.":
    "We couldn't confirm the ad view yet. Please try again shortly.",
  "유효하지 않은 광고 토큰이에요.": "Invalid ad token.",
  "알 수 없는 광고 placement예요.": "Unknown ad placement.",
  "placement과 adToken이 필요해요.": "placement and adToken are required.",
  "광고 보상을 받을 수 없어요.": "Can't grant the ad reward right now.",
  "쿨다운 중이에요.": "Cooling down.",
  "오늘 시청 한도에 도달했어요.": "You've hit today's viewing limit.",
  "광고가 아직 준비되지 않았어요.": "The ad isn't ready yet.",
  "광고가 닫혔어요.": "The ad was closed.",
  "광고 표시에 실패했어요.": "The ad failed to display.",
  "광고가 취소됐어요.": "The ad was cancelled.",
  "이미 광고를 표시 중이에요.": "An ad is already showing.",
  "아직 광고가 로드되지 않았습니다.": "The ad hasn't loaded yet.",
  "현재 환경에서는 인앱 광고가 지원되지 않습니다.":
    "In-app ads aren't supported in this environment.",
  "현재 환경에서는 광고를 표시할 수 없어요.":
    "Ads can't be shown in this environment.",
  "광고를 시청할 수 없는 환경이에요.":
    "Ads can't be watched in this environment.",
  "광고 로드에 실패했어요.": "The ad failed to load.",

  // 경주
  "경주 준비가 만료됐어요.": "Your race setup expired.",
  "경주 준비가 만료됐어요. 다시 준비해 주세요.":
    "Your race setup expired. Please set it up again.",
  "경주력이 부족해요. 잠시 후 회복돼요.":
    "Not enough race energy. It recovers shortly.",
  "예상 말을 먼저 선택해 주세요.": "Pick a horse first.",
  "raceId와 horseNumber가 필요해요.": "raceId and horseNumber are required.",
  "예상은 1회만 변경할 수 있어요.": "You can only change your pick once.",
  "경주를 준비할 수 없어요.": "Couldn't set up the race.",
  "경주를 시작할 수 없어요.": "Couldn't start the race.",
  "유효하지 않은 말 번호예요.": "Invalid horse number.",
  "경주가 준비되지 않았어요.": "The race isn't set up yet.",
  "지금은 새 경주를 준비할 수 없어요.": "You can't set up a new race right now.",
  "경주 티켓이 없어요. 광고를 보면 티켓을 받고 바로 이어서 달릴 수 있어요.":
    "You're out of race tickets. Watch an ad to get one and keep racing.",
  "티켓은 광고 시청으로 받을 수 있어요.": "Tickets come from watching ads.",
  "오늘 골드 구매 한도에 도달했어요.": "You've hit today's gold purchase limit.",

  // 파티
  "방 코드가 필요해요.": "A room code is required.",
  "방을 찾을 수 없어요.": "Room not found.",
  "방 코드를 찾을 수 없어요.": "Room code not found.",
  "방이 가득 찼어요.": "The room is full.",
  "방 멤버가 아니에요.": "You're not a member of this room.",
  "참여 중인 방이 없어요.": "You're not in a room.",
  "방장만 경주를 시작할 수 있어요.": "Only the host can start the race.",
  "방장만 경주를 준비할 수 있어요.": "Only the host can set up the race.",
  "아직 선택 단계가 아니에요.": "It's not the picking phase yet.",
  "지금은 선택할 수 없어요.": "You can't pick right now.",
  "지금은 찌라시를 볼 수 없어요.": "Tips aren't available right now.",
  "경주 진행 중이에요. 잠시 후 다시 시도해 주세요.":
    "A race is in progress. Please try again shortly.",
  "같은 말을 고른 친구가 있어요. 번호를 바꿔 주세요.":
    "A friend picked the same horse. Choose a different number.",
  "horseNumber가 필요해요.": "horseNumber is required.",
  "입장 실패": "Couldn't join",
  "준비 실패": "Setup failed",
  "선택 실패": "Pick failed",
  "찌라시 열기 실패": "Couldn't reveal the tip",
  "찌라시를 열지 못했어요.": "Couldn't reveal the tip.",
  "찌라시를 열 수 없어요.": "Can't reveal the tip.",
  "광고 보상 실패": "Ad reward failed",
  "경주 시작 실패": "Couldn't start the race",

  // 출석 · 보상
  "오늘은 이미 출석했어요.": "You've already checked in today.",
  "출석 실패": "Check-in failed",
  "이미 받았어요.": "Already claimed.",
  "아직 조건을 달성하지 못했어요.": "You haven't met the requirement yet.",
  "잘못된 단계예요.": "Invalid step.",
  "받을 정산 보상이 없어요.": "No settlement rewards to claim.",
  "오늘 적중 상자 한도에 도달했어요.": "You've hit today's prize box limit.",

  // 상점 · 시장
  "골드가 부족해요.": "Not enough gold.",
  "상품을 찾을 수 없어요.": "Item not found.",
  "구매 실패": "Purchase failed",
  "거래할 수 없는 아이템이에요.": "This item can't be traded.",
  "판매할 아이템이 없어요.": "You have no items to sell.",
  "아이템이 부족해요.": "Not enough items.",
  "매물을 찾을 수 없어요.": "Listing not found.",
  "본인 매물은 구매할 수 없어요.": "You can't buy your own listing.",
  "적중률 60% 이상만 판매할 수 있어요.":
    "Only tips with a 60%+ hit rate can be sold.",
  "가격은 10~200 골드예요.": "Price must be between 10 and 200 gold.",
  "가격은 10~5000 골드예요.": "Price must be between 10 and 5000 gold.",

  // 말 관리
  "오늘 훈련 횟수를 모두 사용했어요.": "You've used all of today's training.",
  "오늘 먹이는 이미 줬어요.": "You already fed your horse today.",
  "오늘 휴식은 이미 했어요.": "Your horse already rested today.",
  "유효하지 않은 털색입니다.": "Invalid coat color.",
  "말 이름은 1~12자여야 해요.": "Horse name must be 1–12 characters.",
  "털색을 선택해 주세요.": "Please choose a coat color.",
  "페이스를 선택해 주세요.": "Please choose a running style.",
  "주로 적성을 선택해 주세요.": "Please choose a track preference.",
  "거리 적성을 선택해 주세요.": "Please choose a distance preference.",

  // 일반
  "로그인이 필요합니다.": "You need to sign in.",
  "플레이어 정보를 불러올 수 없어요.": "Couldn't load player data.",
  "로그인에 실패했어요.": "Sign-in failed.",
  "실패": "Failed",
  "요청에 실패했어요.": "The request failed.",
};

/** 숫자 등이 끼어 있어 정확히 일치하지 않는 문장들. */
const PATTERNS: { re: RegExp; en: (m: RegExpMatchArray) => string }[] = [
  {
    re: /^(\d+)번은 이미 다른 친구가 선택했어요\.$/,
    en: (m) => `#${m[1]} is already taken by another player.`,
  },
  {
    re: /^골드가 부족해요\. \((\d+)G 필요\)$/,
    en: (m) => `Not enough gold. (${m[1]}G needed)`,
  },
  {
    re: /^예상 포인트가 부족해요\. \((\d+)P 필요\)$/,
    en: (m) => `Not enough tip points. (${m[1]}P needed)`,
  },
  {
    re: /^찌라시는 경기당 (\d+)장까지만 볼 수 있어요\.$/,
    en: (m) => `You can only reveal ${m[1]} tips per race.`,
  },
  {
    re: /^(.+)님 선택 대기 중$/,
    en: (m) => `Waiting on ${m[1]}`,
  },
];

/** 서버 메시지를 현재 언어로 옮긴다. 매칭 실패 시 원문을 그대로 돌려준다. */
export function translateServerMessage(message: string, lang: Lang): string {
  if (lang === "ko") return message;

  const trimmed = message.trim();
  const exact = EXACT[trimmed];
  if (exact) return exact;

  for (const { re, en } of PATTERNS) {
    const match = trimmed.match(re);
    if (match) return en(match);
  }

  return message;
}
