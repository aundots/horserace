import type { RaceKeyframe } from "./raceAnimation";

export type CommentaryLine = {
  text: string;
  urgent?: boolean;
};

export type CommentaryContext = {
  raceProgress: number;
  started: boolean;
  finished: boolean;
  keyframe: RaceKeyframe;
  /** 트랙·전광판과 동일한 실시간 순위 (말 번호 배열, 1착→8착) */
  liveRanks?: number[];
  entrantMap: Map<number, { name: string; pace?: string }>;
  pickedNumber: number | null;
  distance: number;
  track: string;
  overtakes: number;
  photoFinish?: boolean;
  myPlace?: number;
  dnf?: boolean;
  dnfReason?: "fall" | "interference";
  raceEvents?: { type: "fall" | "interference"; progress: number; horses: number[] }[];
};

const TRACK_LABEL: Record<string, string> = {
  DRY: "마른",
  WET: "습윤",
  HEAVY: "무거운",
};

const PACE_LABEL: Record<string, string> = {
  FRONT: "도주",
  STALKER: "선행",
  MID: "선입",
  CLOSER: "추입",
};

function nameOf(
  map: CommentaryContext["entrantMap"],
  num: number | undefined,
  fallback = "선두마",
) {
  if (num == null) return fallback;
  return map.get(num)?.name ?? `${num}번`;
}

function pickedRank(ctx: CommentaryContext): number {
  if (!ctx.pickedNumber) return 8;
  const ranks = ctx.liveRanks ?? ctx.keyframe.frame1.ranks;
  return ranks.indexOf(ctx.pickedNumber) + 1 || 8;
}

function leaderNum(ctx: CommentaryContext) {
  if (ctx.liveRanks && ctx.liveRanks.length > 0) return ctx.liveRanks[0];
  return ctx.keyframe.frame1.ranks[0];
}

function phaseOf(p: number) {
  if (p < 0.06) return "gate";
  if (p < 0.18) return "start";
  if (p < 0.38) return "front";
  if (p < 0.58) return "middle";
  if (p < 0.78) return "back";
  if (p < 0.92) return "stretch";
  return "finish";
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function buildRaceCommentary(
  ctx: CommentaryContext,
  opts?: { leaderChanged?: boolean; overtake?: boolean },
): CommentaryLine {
  if (!ctx.started) {
    return {
      text: pick([
        "8두가 결승선 앞에 정렬했습니다. 긴장감이 고조됩니다!",
        `오늘 ${ctx.distance}m, ${TRACK_LABEL[ctx.track] ?? ""} 주로. 곧 출발합니다!`,
        "기수들의 표정이 진지합니다. 스타트가 코앞이에요!",
      ]),
    };
  }

  if (ctx.finished) {
    if (ctx.dnf) {
      if (ctx.dnfReason === "interference") {
        return {
          text: "앞 다툼에 휘말려 기권! 간섭 사고입니다.",
          urgent: true,
        };
      }
      return { text: "아아, 낙마! 안타까운 기권 처리입니다.", urgent: true };
    }
    const place = ctx.myPlace ?? 0;
    if (place === 1) {
      return { text: "우승! 환호가 터집니다! 멋진 질주였습니다!", urgent: true };
    }
    if (place <= 3) {
      return {
        text: pick([
          `${place}착 완주! 복판 승부 끝에 입상했습니다!`,
          `${place}착! 끝까지 박차고 들어왔습니다!`,
        ]),
        urgent: true,
      };
    }
    return {
      text: pick([
        `${place}착 완주. 다음 경주가 기대됩니다.`,
        `결승선 통과, ${place}착. 수고하셨습니다!`,
      ]),
    };
  }

  const leader = leaderNum(ctx);
  const leaderName = nameOf(ctx.entrantMap, leader);
  const second = ctx.keyframe.frame1.ranks[1];
  const third = ctx.keyframe.frame1.ranks[2];
  const pRank = pickedRank(ctx);
  const pickedName = ctx.pickedNumber
    ? nameOf(ctx.entrantMap, ctx.pickedNumber)
    : null;
  const trackLabel = TRACK_LABEL[ctx.track] ?? "주로";
  const phase = phaseOf(ctx.raceProgress);

  if (ctx.raceEvents?.length) {
    for (const ev of ctx.raceEvents) {
      if (Math.abs(ctx.raceProgress - ev.progress) > 0.028) continue;
      if (ev.type === "interference") {
        const names = ev.horses.map((n) => nameOf(ctx.entrantMap, n)).join(", ");
        return {
          text: pick([
            `앞 다툼! ${names}이(가) 맞물리며 추락!`,
            `혼전! ${names} — 간섭 사고 발생!`,
            `좁은 주로에서 ${names}이(가) 엉키며 낙마!`,
          ]),
          urgent: true,
        };
      }
      if (ev.type === "fall" && ev.horses.length === 1) {
        const n = ev.horses[0]!;
        return {
          text: `${nameOf(ctx.entrantMap, n)} 낙마! 기권 처리됩니다!`,
          urgent: true,
        };
      }
    }
  }

  if (opts?.overtake || (ctx.keyframe.frame1.overtakes && ctx.keyframe.t > 0.4)) {
    return {
      text: pick([
        `역전! ${leaderName}이 앞서 나섭니다!`,
        `순위가 바뀝니다! ${leaderName}, 선두 등극!`,
        `치열합니다! ${nameOf(ctx.entrantMap, second)}를 제치고 ${leaderName}이 1위!`,
        `박빙 승부! ${leaderName}의 역전 드라마!`,
      ]),
      urgent: true,
    };
  }

  if (opts?.leaderChanged && phase !== "gate" && phase !== "start") {
    return {
      text: pick([
        `선두 교체! ${leaderName}이 주도권을 잡았습니다!`,
        `${leaderName} 앞으로! 순위표가 요동칩니다!`,
        `이게 경마죠! ${leaderName}이 1위로 치고 나옵니다!`,
      ]),
      urgent: true,
    };
  }

  if (pickedName && pRank <= 3 && ctx.raceProgress > 0.15) {
    if (pRank === 1 && Math.random() < 0.35) {
      return {
        text: pick([
          `예상 ${pickedName}, 선두 질주! 좋은 페이스입니다!`,
          `${pickedName}이 앞섭니다! 힘차게 달립니다!`,
          `예상마 ${pickedName} 1위! 관중들이 일어섭니다!`,
        ]),
        urgent: true,
      };
    }
    if (pRank === 2 && Math.random() < 0.25) {
      return {
        text: `예상 ${pickedName}, 2위 추격! 한 번에 역전할 각입니다!`,
        urgent: false,
      };
    }
  }

  if (phase === "gate" || phase === "start") {
    if (ctx.raceProgress < 0.04) {
      return {
        text: pick([
          "출발! 게이트가 열렸습니다!",
          "스타트! 8두가 일제히 튀어 나갑니다!",
          "레츠고! 경주가 시작됐습니다!",
        ]),
        urgent: true,
      };
    }
    return {
      text: pick([
        `출발 신호! ${trackLabel} 주로를 달리기 시작합니다!`,
        "스타트 직후, 말들이 일렬로 주로에 진입합니다!",
        "초반은 팽팽합니다! 페이스 조절이 관건!",
        "8두가 출발선을 넘었습니다!",
      ]),
      urgent: true,
    };
  }

  if (phase === "front") {
    const pace = PACE_LABEL[ctx.entrantMap.get(leader ?? 0)?.pace ?? ""] ?? "";
    return {
      text: pick([
        `초반은 ${leaderName}이 주도! ${pace ? `${pace} 페이스로 ` : ""}빠릅니다!`,
        `${leaderName} 선두, ${nameOf(ctx.entrantMap, second)}가 바짝 추격합니다!`,
        `첫 코너 접근! ${leaderName}—${nameOf(ctx.entrantMap, second)}—${nameOf(ctx.entrantMap, third)} 순!`,
        `초반 스퍼트! ${leaderName}이 앞선 두 마리와 거리를 벌립니다!`,
      ]),
    };
  }

  if (phase === "middle") {
    return {
      text: pick([
        `중반전! ${leaderName}이 리듬을 탔습니다. ${nameOf(ctx.entrantMap, second)} 추격 지속!`,
        `순위 변동 없이 ${leaderName} 주도, 뒤는 한 치의 양보 없습니다!`,
        `${ctx.distance}m 중거, ${leaderName}이 페이스 메이킹 중!`,
        `2번째 코너! ${leaderName} 안쪽 라인, ${nameOf(ctx.entrantMap, second)} 바깥에서 압박!`,
      ]),
    };
  }

  if (phase === "back") {
    return {
      text: pick([
        `후반 돌입! ${leaderName}, 아직 여유가 있어 보입니다!`,
        `3위 ${nameOf(ctx.entrantMap, third)}까지 박빙! 승부는 이제부터입니다!`,
        `${trackLabel} 주로, 말들의 숨소리가 거칠어집니다!`,
        `역전 ${ctx.overtakes}회! ${leaderName}이 버티고 있습니다!`,
      ]),
    };
  }

  if (phase === "stretch") {
    return {
      text: pick([
        `막판 직선! ${leaderName}—${nameOf(ctx.entrantMap, second)} 맞대결!`,
        `결승선이 보입니다! ${leaderName}, 끝까지 전력 질주!`,
        `여기서 갈립니다! ${nameOf(ctx.entrantMap, second)} 막판 추입 시도!`,
        ctx.photoFinish
          ? "포토 피니시 각! 카메라 앞 승부가 걸렸습니다!"
          : `라스트 스퍼트! ${leaderName}이 결승선을 향해 달립니다!`,
      ]),
      urgent: ctx.raceProgress > 0.85,
    };
  }

  return {
    text: pick([
      `결승선 앞! ${leaderName}, 우승을 향해 질주!`,
      `마지막 한 걸음! ${leaderName}—${nameOf(ctx.entrantMap, second)} 초접전!`,
      "골인 임박! 관중석이 들썩입니다!",
    ]),
    urgent: true,
  };
}
