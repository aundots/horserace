import { useEffect, useRef, useState } from "react";
import {
  buildRaceCommentary,
  type CommentaryContext,
  type CommentaryLine,
} from "../lib/raceCommentary";

const MIN_INTERVAL_MS = 2_200;
const EARLY_INTERVAL_MS = 1_100;
const EARLY_PHASE_END = 0.22;

function intervalForProgress(progress: number) {
  return progress < EARLY_PHASE_END ? EARLY_INTERVAL_MS : MIN_INTERVAL_MS;
}

export function useRaceCommentary(ctx: CommentaryContext) {
  const [line, setLine] = useState<CommentaryLine>({ text: "" });
  const lastRef = useRef({
    leader: -1,
    at: 0,
    overtakesFlag: false,
    wasStarted: false,
  });

  useEffect(() => {
    if (!ctx.started && !ctx.finished) {
      setLine(buildRaceCommentary(ctx));
      lastRef.current = { leader: -1, at: 0, overtakesFlag: false, wasStarted: false };
      return;
    }

    if (ctx.finished) {
      setLine(buildRaceCommentary(ctx));
      return;
    }

    const justStarted = ctx.started && !lastRef.current.wasStarted;
    if (justStarted) {
      lastRef.current = {
        leader: ctx.liveRanks?.[0] ?? ctx.keyframe.frame1.ranks[0] ?? -1,
        at: Date.now(),
        overtakesFlag: false,
        wasStarted: true,
      };
      setLine(buildRaceCommentary(ctx));
      return;
    }

    const leader = ctx.liveRanks?.[0] ?? ctx.keyframe.frame1.ranks[0] ?? -1;
    const leaderChanged = lastRef.current.leader !== leader && lastRef.current.leader !== -1;
    const overtake =
      ctx.keyframe.frame1.overtakes === true &&
      ctx.keyframe.t > 0.35 &&
      !lastRef.current.overtakesFlag;
    const raceAccident = ctx.raceEvents?.some(
      (ev) => Math.abs(ctx.raceProgress - ev.progress) < 0.03,
    );
    const now = Date.now();
    const elapsed = now - lastRef.current.at;
    const minInterval = intervalForProgress(ctx.raceProgress);
    const earlyPhase = ctx.raceProgress < EARLY_PHASE_END;

    if (
      raceAccident ||
      leaderChanged ||
      overtake ||
      elapsed >= minInterval ||
      (earlyPhase && elapsed >= 700)
    ) {
      setLine(
        buildRaceCommentary(ctx, {
          leaderChanged,
          overtake,
        }),
      );
      lastRef.current = {
        leader,
        at: now,
        overtakesFlag: overtake || lastRef.current.overtakesFlag,
        wasStarted: true,
      };
    }
  }, [
    ctx.started,
    ctx.finished,
    ctx.raceProgress,
    ctx.keyframe.frame0.t,
    ctx.keyframe.frame1.t,
    ctx.keyframe.frame1.ranks.join(","),
    ctx.liveRanks?.join(","),
    ctx.keyframe.frame1.overtakes,
    ctx.keyframe.t,
    ctx.pickedNumber,
    ctx.dnf,
    ctx.dnfReason,
    ctx.raceEvents,
    ctx.myPlace,
  ]);

  return line;
}
