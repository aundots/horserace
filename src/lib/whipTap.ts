/**
 * 결승선 앞 채찍질 미니게임 — 지금은 연출 전용(실제 순위·점수엔 영향 없음).
 * 나중에 서버에 반영하려면 이 이벤트 로그(atProgress/atMs)를 그대로 /race/* 에 보내면 된다.
 */

export type WhipJudgment = "great" | "miss";

export type WhipTapEvent = {
  /** 탭 시점의 경주 진행률(0~1) — 서버 반영 시 "몇 구간에서 쳤는지" 판정 근거가 된다. */
  atProgress: number;
  /** 탭 시점의 monotonic 시각(performance.now()) — 탭 간격 판정용. */
  atMs: number;
  judgment: WhipJudgment;
};

/** 결승선 앞 구간에서만 열린다 — 너무 일찍/늦게 치는 걸 막아 타이밍 스킬을 남긴다. */
export const WHIP_WINDOW_START = 0.78;
export const WHIP_WINDOW_END = 0.97;

/** 이보다 빠르게 연타하면 스팸으로 간주해 MISS(페널티) 처리한다. */
const MIN_TAP_INTERVAL_MS = 350;

export function isWhipWindowOpen(
  progress: number,
  started: boolean,
  finished: boolean,
): boolean {
  return (
    started &&
    !finished &&
    progress >= WHIP_WINDOW_START &&
    progress <= WHIP_WINDOW_END
  );
}

/** 첫 탭은 항상 성공, 이후엔 직전 탭과의 간격으로 판정한다. */
export function judgeTap(previousTapMs: number | null, nowMs: number): WhipJudgment {
  if (previousTapMs == null) return "great";
  return nowMs - previousTapMs >= MIN_TAP_INTERVAL_MS ? "great" : "miss";
}
