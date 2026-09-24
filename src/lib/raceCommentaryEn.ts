/**
 * 영어 실황. 한국어판(raceCommentary.ts)과 판정 로직은 같고 문장만 다르다 —
 * 어순·조사 차이가 커서 조각을 이어붙이면 어색해지므로 문장 단위로 따로 쓴다.
 */

export type EnLineCtx = {
  distance: number;
  trackWord: string;
  leaderName: string;
  secondName: string;
  thirdName: string;
  pickedName: string | null;
  paceWord: string;
  overtakes: number;
  photoFinish?: boolean;
};

export const EN = {
  preStart: (c: EnLineCtx) => [
    "Eight runners are lined up at the gate. The tension is building!",
    `${c.distance}m on a ${c.trackWord} track today. They're about to break!`,
    "The jockeys look focused. We're moments from the off!",
  ],
  dnfInterference: "Caught up in the scramble — interference, and that's a DNF!",
  dnfFall: "Oh no, a fall! A heartbreaking end to the race.",
  win: "Winner! The crowd erupts! What a ride!",
  podium: (place: string) => [
    `${place}! Fought through traffic to make the frame!`,
    `${place}! Drove all the way to the line!`,
  ],
  plainFinish: (place: string) => [
    `${place}. Something to build on next time out.`,
    `Across the line in ${place}. Well run!`,
  ],
  interference: (names: string) => [
    `Trouble in behind! ${names} tangle and go down!`,
    `Chaos! ${names} — interference in the pack!`,
    `${names} clip heels in tight running and fall!`,
  ],
  fall: (name: string) => `${name} is down! That's a DNF.`,
  overtake: (c: EnLineCtx) => [
    `They've been passed! ${c.leaderName} takes it up!`,
    `A change at the front! ${c.leaderName} hits the lead!`,
    `Tight racing! ${c.leaderName} goes by ${c.secondName} for the lead!`,
    `What a duel! ${c.leaderName} snatches the front!`,
  ],
  leaderChanged: (c: EnLineCtx) => [
    `New leader! ${c.leaderName} takes control!`,
    `${c.leaderName} moves up! The order is shaking out!`,
    `This is why we watch! ${c.leaderName} strikes the front!`,
  ],
  pickedLeading: (name: string) => [
    `Your pick ${name} is on top and travelling well!`,
    `${name} leads! Moving nicely out in front!`,
    `${name} hits the front — the crowd is on its feet!`,
  ],
  pickedSecond: (name: string) =>
    `Your pick ${name} sits second, poised to pounce!`,
  gate: [
    "And they're off! The gates fly open!",
    "Away they go! All eight break together!",
    "The race is underway!",
  ],
  start: (c: EnLineCtx) => [
    `They're rolling on the ${c.trackWord} track!`,
    "Settling into stride as they find their positions!",
    "Even early — it's all about the pace here!",
    "All eight are away from the gate!",
  ],
  front: (c: EnLineCtx) => [
    `${c.leaderName} leads early${c.paceWord ? `, setting a ${c.paceWord} tempo` : ""}!`,
    `${c.leaderName} in front, ${c.secondName} tracking closely!`,
    `Into the first turn — ${c.leaderName}, ${c.secondName}, then ${c.thirdName}!`,
    `${c.leaderName} kicks clear of the chasing pair!`,
  ],
  middle: (c: EnLineCtx) => [
    `Down the middle stage — ${c.leaderName} in rhythm, ${c.secondName} still there!`,
    `No change up front as ${c.leaderName} dictates, and it's tight behind!`,
    `${c.distance}m to run and ${c.leaderName} is making the running!`,
    `Round the second turn — ${c.leaderName} hugs the rail, ${c.secondName} presses wide!`,
  ],
  back: (c: EnLineCtx) => [
    `Into the far side — ${c.leaderName} still has plenty in hand!`,
    `Covered by a length back to ${c.thirdName} — this is anyone's race!`,
    `On the ${c.trackWord} going, you can hear them working now!`,
    `${c.overtakes} changes of lead so far, and ${c.leaderName} holds on!`,
  ],
  stretch: (c: EnLineCtx) => [
    `Into the straight — ${c.leaderName} and ${c.secondName} go at it!`,
    `The line is in sight! ${c.leaderName} digging deep!`,
    `This is where it's won! ${c.secondName} launches a challenge!`,
    c.photoFinish
      ? "This will be a photo! They can't be separated!"
      : `Final surge! ${c.leaderName} drives for the line!`,
  ],
  finish: (c: EnLineCtx) => [
    `At the line — ${c.leaderName} charging for glory!`,
    `One last stride! ${c.leaderName} and ${c.secondName} inseparable!`,
    "They're home! The stands are shaking!",
  ],
};

/** 영어 실황용 착순 표기 — 1st/2nd/3rd. */
export function enPlace(place: number): string {
  const mod100 = place % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? "th"
      : place % 10 === 1
        ? "st"
        : place % 10 === 2
          ? "nd"
          : place % 10 === 3
            ? "rd"
            : "th";
  return `${place}${suffix}`;
}

export const EN_TRACK: Record<string, string> = {
  DRY: "firm",
  WET: "soft",
  HEAVY: "heavy",
};

export const EN_PACE: Record<string, string> = {
  FRONT: "front-running",
  STALKER: "stalking",
  MID: "mid-pack",
  CLOSER: "closing",
};

export const EN_FALLBACK_LEADER = "the leader";
export const enHorseNo = (n: number) => `#${n}`;
