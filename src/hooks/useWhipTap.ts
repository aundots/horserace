import { useCallback, useEffect, useRef, useState } from "react";
import {
  isWhipWindowOpen,
  judgeTap,
  type WhipJudgment,
  type WhipTapEvent,
} from "../lib/whipTap";

const EFFECT_DURATION_MS = 380;

export function useWhipTap(raceProgress: number, started: boolean, finished: boolean) {
  const active = isWhipWindowOpen(raceProgress, started, finished);
  const [combo, setCombo] = useState(0);
  const [effect, setEffect] = useState<WhipJudgment | null>(null);
  const lastTapMsRef = useRef<number | null>(null);
  const eventsRef = useRef<WhipTapEvent[]>([]);
  const effectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (started && !finished) return;
    setCombo(0);
    setEffect(null);
    lastTapMsRef.current = null;
    eventsRef.current = [];
  }, [started, finished]);

  useEffect(
    () => () => {
      if (effectTimerRef.current != null) window.clearTimeout(effectTimerRef.current);
    },
    [],
  );

  const tap = useCallback(() => {
    if (!active) return;
    const now = performance.now();
    const judgment = judgeTap(lastTapMsRef.current, now);
    lastTapMsRef.current = now;
    eventsRef.current.push({ atProgress: raceProgress, atMs: now, judgment });

    setCombo((c) => (judgment === "great" ? c + 1 : 0));
    setEffect(judgment);
    if (effectTimerRef.current != null) window.clearTimeout(effectTimerRef.current);
    effectTimerRef.current = window.setTimeout(() => setEffect(null), EFFECT_DURATION_MS);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(judgment === "great" ? 18 : [10, 30, 10]);
    }
  }, [active, raceProgress]);

  return { active, combo, effect, tap, events: eventsRef };
}
