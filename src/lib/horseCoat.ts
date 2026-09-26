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

export type CoatPattern = "solid" | "pinto" | "spots" | "dapple" | "stripes";

export type CoatStyle = {
  id: HorseCoatId;
  label: string;
  body: string;
  bodyDark: string;
  bodyLight: string;
  mane: string;
  hoof: string;
  pattern: CoatPattern;
  patch?: string;
  spot?: string;
};

export const COAT_STYLES: Record<HorseCoatId, CoatStyle> = {
  BAY: {
    id: "BAY",
    label: "갈색말",
    body: "#7B4A24",
    bodyDark: "#4E3018",
    bodyLight: "#A66B3A",
    mane: "#2A1810",
    hoof: "#2A1810",
    pattern: "solid",
  },
  CHESTNUT: {
    id: "CHESTNUT",
    label: "적갈색말",
    body: "#A0522D",
    bodyDark: "#6B3410",
    bodyLight: "#C6714A",
    mane: "#5C2E0E",
    hoof: "#3D2010",
    pattern: "solid",
  },
  BLACK: {
    id: "BLACK",
    label: "검은말",
    body: "#2A2420",
    bodyDark: "#141010",
    bodyLight: "#454038",
    mane: "#0A0808",
    hoof: "#0A0808",
    pattern: "solid",
  },
  WHITE: {
    id: "WHITE",
    label: "흰말",
    body: "#F4F0EA",
    bodyDark: "#D8D2C8",
    bodyLight: "#FFFFFF",
    mane: "#E8E4DC",
    hoof: "#3A3028",
    pattern: "solid",
  },
  GREY: {
    id: "GREY",
    label: "회색말",
    body: "#9A9A9E",
    bodyDark: "#6E6E72",
    bodyLight: "#C4C4C8",
    mane: "#505054",
    hoof: "#3A3A3E",
    pattern: "dapple",
    spot: "#B8B8BC",
  },
  PALOMINO: {
    id: "PALOMINO",
    label: "금색말",
    body: "#D4A84B",
    bodyDark: "#A67C2E",
    bodyLight: "#F0C868",
    mane: "#F5F0E0",
    hoof: "#4A3828",
    pattern: "solid",
  },
  PAINT: {
    id: "PAINT",
    label: "점박이말",
    body: "#6B4423",
    bodyDark: "#4A2F18",
    bodyLight: "#8B5A32",
    mane: "#2A1810",
    hoof: "#2A1810",
    pattern: "pinto",
    patch: "#F2EDE4",
  },
  APPALOOSA: {
    id: "APPALOOSA",
    label: "얼룩말",
    body: "#E8E0D4",
    bodyDark: "#B8B0A4",
    bodyLight: "#F8F4EE",
    mane: "#3A3028",
    hoof: "#3A3028",
    pattern: "spots",
    spot: "#6B4423",
  },
  ROAN: {
    id: "ROAN",
    label: "로안말",
    body: "#8B6B5A",
    bodyDark: "#5A4038",
    bodyLight: "#B8927A",
    mane: "#3A2820",
    hoof: "#3A2820",
    pattern: "dapple",
    spot: "#C4A898",
  },
  UNIQUE: {
    id: "UNIQUE",
    label: "특이한말",
    body: "#4A9088",
    bodyDark: "#2E6058",
    bodyLight: "#6AB8AC",
    mane: "#1A4038",
    hoof: "#1A2820",
    pattern: "stripes",
    patch: "#E8D878",
  },
};

export function getCoatStyle(coat?: HorseCoatId): CoatStyle {
  if (coat && coat in COAT_STYLES) return COAT_STYLES[coat];
  return COAT_STYLES.BAY;
}
