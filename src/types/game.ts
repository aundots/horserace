export type HorseCoatId =
  | "BAY"
  | "CHESTNUT"
  | "BLACK"
  | "WHITE"
  | "GREY"
  | "PALOMINO"
  | "PAINT"
  | "APPALOOSA"
  | "ROAN"
  | "UNIQUE";

export type HorseProfile = {
  id: string;
  name: string;
  speed: number;
  stamina: number;
  accel: number;
  pace: string;
  trackApt: string;
  distanceApt: string;
  condition: string;
  fatigue: number;
  coat: HorseCoatId;
};

export type DivisionInfo = {
  roomId: string;
  tier: number;
  tierName: string;
  league: string;
  rank: number;
  total: number;
  score: number;
  gapToLeader: number;
  members: { userKey: number; name: string; score: number }[];
} | null;

export type PlayerSnapshot = {
  gold: number;
  raceStamina: number;
  raceStaminaMax: number;
  rankedTicketsLeft: number;
  rankedTicketsMax: number;
  rankedTicketsFree: number;
  rankedTicketBuyPrice: number;
  rankedTicketsBoughtLeft: number;
  practiceCountToday: number;
  weekendBuffPct: number;
  weeklyRankScore: number;
  isWeekend: boolean;
  careEnabled: boolean;
  rankedAvailable: boolean;
  rankedMessage: string | null;
  newbieShield: boolean;
  welcomeBack: boolean;
  neglect: {
    tier: number;
    daysAbsent: number;
    rankedLocked: boolean;
    rehabProgress: number;
    rehabTarget: number;
  };
  statBonusEarned: number;
  trainLeft: number;
  feedLeft: number;
  restLeft: number;
  totalRaces: number;
  horse: HorseProfile;
  streak: number;
  attendanceIndex: number;
  attendanceClaimedToday: boolean;
  pokedexUnlocks: string[];
  predictionPoints: number;
  hitBoxesLeft: number;
  inventory: Record<string, number>;
  division: DivisionInfo;
  sessionRaceStreak: number;
  freeTipReveals: number;
  rankedRacesToday: number;
  dailyRaceGoal: number;
  dailyChallengeClaimed: boolean;
  dailyChallengeGold: number;
  freePath: { practice: number; ranked: number };
};

export type RaceLoopBonus = {
  sessionRaceStreak: number;
  streakBonus: boolean;
  freeTipReveals: number;
  rankedRacesToday: number;
  dailyRaceGoal: number;
  dailyChallengeComplete: boolean;
  dailyChallengeGold: number;
};

export type TipCard = {
  horseNumber: number;
  grade: string;
  text: string;
};

export type RaceEntrant = {
  number: number;
  name: string;
  isGhost: boolean;
  pace: string;
  coat: HorseCoatId;
  silkHue?: number;
  speed: number;
  stamina: number;
  accel: number;
  trackApt: string;
  distanceApt: string;
  condition: string;
  jockeyName: string;
  jockeyWeight: number;
  jockeyWinRate: number;
  jockeyTier: string;
};

export type TimelineFrame = {
  t: number;
  ranks: number[];
  overtakes?: boolean;
};

export type RaceResult = {
  raceId: string;
  mode: "practice" | "ranked" | "party";
  condition: { distance: number; track: string; weather: string };
  entrants: RaceEntrant[];
  /** 내기 모드 — 완주 후 정체 공개용 */
  fullEntrants?: RaceEntrant[];
  finishOrder: number[];
  pickedNumber: number | null;
  myPlace: number;
  dnf: boolean;
  goldEarned: number;
  raceScore: number | null;
  timeline: TimelineFrame[];
  overtakes: number;
  photoFinish?: boolean;
  feedback: string;
  fairnessTag?: string | null;
  dnfReason?: "fall" | "interference";
  raceEvents?: { type: "fall" | "interference"; progress: number; horses: number[] }[];
  prediction?: { hit: string } | null;
  hitBox?: null;
  loopBonus?: RaceLoopBonus | null;
  partyRaceNumber?: number;
};

export type PartyMemberResult = {
  userKey: number;
  displayName: string;
  pick: number | null;
  place: number;
  racePoints: number;
  totalScore: number;
  hit: "win" | "place" | "miss" | "none";
  dnf?: boolean;
  dnfReason?: "fall" | "interference";
};

export type PartySnapshot = {
  code: string;
  hostUserKey: number;
  isHost: boolean;
  status: "waiting" | "picking" | "racing" | "done";
  raceNumber: number;
  members: {
    userKey: number;
    displayName: string;
    prediction: number | null;
    pickConfirmed?: boolean;
    totalScore: number;
    isYou: boolean;
  }[];
  condition: RaceResult["condition"] | null;
  entrants: RaceEntrant[] | null;
  takenNumbers: number[];
  tipsRemaining: number;
  revealedTipCards: TipCard[];
  clientResult: {
    raceNumber: number;
    finishOrder: number[];
    entrants: RaceEntrant[];
    condition: RaceResult["condition"];
    timeline: TimelineFrame[];
    overtakes: number;
    raceEvents?: RaceResult["raceEvents"];
    memberResults: PartyMemberResult[];
  } | null;
};

export type RankedPrepare = {
  raceId: string;
  condition: RaceResult["condition"];
  entrants: RaceEntrant[];
  tipCosts: Record<number, number>;
  revealedTips: number[];
  revealedTipCards: TipCard[];
  predictionPoints: number;
};

export type ShopItem = {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  price: number;
  effect?: string;
};

export type WeeklyPassStep = {
  step: number;
  label: string;
  done: boolean;
  claimed: boolean;
  reward: string;
};

export type AdPlacement = {
  id: string;
  eligible: boolean;
  remaining: { daily: number; session: number };
  reason: string | null;
};
