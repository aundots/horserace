export type TipGrade = "SURE" | "LIKELY" | "RUMOR" | "TRAP";

export type TipGradeMeta = {
  label: string;
  hint: string;
  arrows: string;
  tone: "good" | "caution" | "bad";
  bg: string;
  color: string;
  border: string;
};

export const TIP_GRADE_META: Record<TipGrade, TipGradeMeta> = {
  SURE: {
    label: "확실",
    hint: "신뢰도 높음 · 호재",
    arrows: "▲▲",
    tone: "good",
    bg: "#E8F5E9",
    color: "#1B7D3A",
    border: "#81C784",
  },
  LIKELY: {
    label: "유력",
    hint: "긍정 · 참고 가치 있음",
    arrows: "▲",
    tone: "good",
    bg: "#E8F3FF",
    color: "#1565C0",
    border: "#90CAF9",
  },
  RUMOR: {
    label: "소문",
    hint: "미확인 · 판단 보류",
    arrows: "−",
    tone: "caution",
    bg: "#F5F5F5",
    color: "#616161",
    border: "#BDBDBD",
  },
  TRAP: {
    label: "함정",
    hint: "악재 가능 · 주의",
    arrows: "▼",
    tone: "bad",
    bg: "#FFEBEE",
    color: "#C62828",
    border: "#EF9A9A",
  },
};

export const TIP_GRADE_LEGEND: TipGrade[] = ["SURE", "LIKELY", "RUMOR", "TRAP"];

export function resolveTipGrade(grade: string): TipGrade {
  if (grade in TIP_GRADE_META) return grade as TipGrade;
  return "RUMOR";
}

export function getTipGradeMeta(grade: string): TipGradeMeta {
  return TIP_GRADE_META[resolveTipGrade(grade)];
}
