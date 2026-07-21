import type { PartySnapshot, RaceEntrant, RaceResult } from "../types/game";

/** 스탯·기수만 숨기고 말 이름은 응원용으로 공개 */
function partyRaceEntrants(entrants: RaceEntrant[]) {
  return entrants.map((e) => ({
    ...e,
    speed: 0,
    stamina: 0,
    accel: 0,
    pace: "",
    trackApt: "",
    distanceApt: "",
    condition: "",
    jockeyName: "",
    jockeyWeight: 0,
    jockeyWinRate: 0,
    jockeyTier: "",
  }));
}

export function partyToRaceResult(
  party: PartySnapshot,
  userKey: number,
): RaceResult | null {
  const cr = party.clientResult;
  if (!cr) return null;
  const me = cr.memberResults.find((m) => m.userKey === userKey);
  const myDnf = me?.dnf ?? false;
  const myDnfReason = me?.dnfReason;

  return {
    raceId: `${party.code}-r${cr.raceNumber}`,
    mode: "party",
    condition: cr.condition,
    entrants: partyRaceEntrants(cr.entrants),
    fullEntrants: cr.entrants,
    finishOrder: cr.finishOrder,
    pickedNumber: me?.pick ?? null,
    myPlace: me?.place ?? 0,
    dnf: myDnf,
    dnfReason: myDnfReason,
    raceEvents: cr.raceEvents,
    goldEarned: 0,
    raceScore: me?.racePoints ?? null,
    timeline: cr.timeline,
    overtakes: cr.overtakes,
    photoFinish: cr.overtakes >= 4,
    feedback: myDnf
      ? myDnfReason === "interference"
        ? `${me?.pick}번, 앞 다툼에 휘말려 기권 (+0점)`
        : `${me?.pick}번 낙마 · +0점`
      : me?.pick
        ? `${me.place}착 · +${me.racePoints}점 (누적 ${me.totalScore}점)`
        : "경주 완료",
    fairnessTag: myDnf ? (myDnfReason === "interference" ? "간섭 사고" : "낙마") : null,
    prediction: null,
    hitBox: null,
    loopBonus: null,
    partyRaceNumber: cr.raceNumber,
    raceStartedAt: cr.raceStartedAt,
  };
}
