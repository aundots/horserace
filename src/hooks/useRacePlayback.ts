import { useEffect, useRef, useState } from "react";
import { RACE_DURATION_MS } from "../lib/raceAnimation";

/**
 * @param syncStartAtEpochMs 파티 모드에서 서버가 결과를 계산한 시각(epoch ms).
 *   방장이 시작을 누른 뒤 각자 폴링으로 뒤늦게 이 결과를 발견해도, "발견한 순간부터
 *   0%로 재생"하지 않고 이미 지난 시간만큼 건너뛰어서 시작한다 — 그래야 파티원들이
 *   실제로는 조금씩 다른 순간에 재생을 시작해도 같은 벽시계 기준으로 맞춰진다.
 */
export function useRacePlayback(
  started: boolean,
  finished: boolean,
  syncStartAtEpochMs?: number,
) {
  const [raceProgress, setRaceProgress] = useState(0);
  const startAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!started) {
      startAtRef.current = null;
      setRaceProgress(0);
      return;
    }
    if (finished) return;

    // rAF 타임스탬프는 monotonic clock 이라 epoch(Date.now()) 와 기준이 다르다 —
    // 두 시계의 차이를 한 번 구해서 서버 시각을 rAF 기준으로 환산한다.
    const alreadyElapsedMs = syncStartAtEpochMs
      ? Math.max(0, Date.now() - syncStartAtEpochMs)
      : 0;

    let raf = 0;
    const tick = (now: number) => {
      if (startAtRef.current === null) startAtRef.current = now - alreadyElapsedMs;
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
  }, [started, finished, syncStartAtEpochMs]);

  return raceProgress;
}
