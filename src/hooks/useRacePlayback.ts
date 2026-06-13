import { useEffect, useRef, useState } from "react";
import { RACE_DURATION_MS } from "../lib/raceAnimation";

export function useRacePlayback(started: boolean, finished: boolean) {
  const [raceProgress, setRaceProgress] = useState(0);
  const startAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!started) {
      startAtRef.current = null;
      setRaceProgress(0);
      return;
    }
    if (finished) return;

    let raf = 0;
    const tick = (now: number) => {
      if (startAtRef.current === null) startAtRef.current = now;
      const elapsed = now - startAtRef.current;
      const linear = Math.min(1, elapsed / RACE_DURATION_MS);
      // 출발 직후 살짝 이즈인 — 말이 갑자기 튀어 나가는 느낌 완화
      const p =
        linear < 0.08
          ? linear * linear * (1 / 0.08)
          : linear;
      setRaceProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, finished]);

  return raceProgress;
}
