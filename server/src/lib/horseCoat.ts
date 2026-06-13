export const HORSE_COAT_IDS = [
  "BAY",
  "CHESTNUT",
  "BLACK",
  "WHITE",
  "GREY",
  "PALOMINO",
  "PAINT",
  "APPALOOSA",
  "ROAN",
  "UNIQUE",
] as const;

export type HorseCoatId = (typeof HORSE_COAT_IDS)[number];

export const COAT_LABELS: Record<HorseCoatId, string> = {
  BAY: "갈색말",
  CHESTNUT: "적갈색말",
  BLACK: "검은말",
  WHITE: "흰말",
  GREY: "회색말",
  PALOMINO: "금색말",
  PAINT: "점박이말",
  APPALOOSA: "얼룩말",
  ROAN: "로안말",
  UNIQUE: "특이한말",
};

export function isHorseCoatId(value: unknown): value is HorseCoatId {
  return typeof value === "string" && HORSE_COAT_IDS.includes(value as HorseCoatId);
}

export function randomCoat(): HorseCoatId {
  return HORSE_COAT_IDS[Math.floor(Math.random() * HORSE_COAT_IDS.length)];
}

/** userKey 기반 고정 털색 (신규 유저 기본값) */
export function defaultCoatForUser(userKey: number): HorseCoatId {
  return HORSE_COAT_IDS[userKey % HORSE_COAT_IDS.length];
}

export function ensureHorseCoat(
  coat: HorseCoatId | undefined,
  fallback: HorseCoatId,
): HorseCoatId {
  return coat && isHorseCoatId(coat) ? coat : fallback;
}
