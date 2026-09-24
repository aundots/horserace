import { kstWeekId } from "./kst.js";

export type WeeklyPassState = {
  weekId: string;
  loginDays: number;
  practiceRuns: number;
  trainCount: number;
  rankedRuns: number;
  claimedSteps: number[];
  finalClaimed: boolean;
};

export function freshPass(weekId = kstWeekId()): WeeklyPassState {
  return {
    weekId,
    loginDays: 0,
    practiceRuns: 0,
    trainCount: 0,
    rankedRuns: 0,
    claimedSteps: [],
    finalClaimed: false,
  };
}

export function syncPassWeek(pass: WeeklyPassState) {
  const weekId = kstWeekId();
  if (pass.weekId !== weekId) {
    Object.assign(pass, freshPass(weekId));
  }
  return pass;
}

function passCoreComplete(p: WeeklyPassState) {
  return (
    p.loginDays >= 3 &&
    p.practiceRuns >= 5 &&
    p.trainCount >= 3 &&
    p.rankedRuns >= 1 &&
    [1, 2, 3, 4].every((s) => p.claimedSteps.includes(s))
  );
}

export const PASS_STEPS = [
  { step: 1, label: "주 3일 접속", check: (p: WeeklyPassState) => p.loginDays >= 3, reward: "gold_50" },
  { step: 2, label: "연습주행 5회", check: (p: WeeklyPassState) => p.practiceRuns >= 5, reward: "gold_80" },
  { step: 3, label: "훈련 3회", check: (p: WeeklyPassState) => p.trainCount >= 3, reward: "item_feed" },
  { step: 4, label: "랭킹 1회 참가", check: (p: WeeklyPassState) => p.rankedRuns >= 1, reward: "gold_100" },
  { step: 5, label: "패스 완료", check: passCoreComplete, reward: "toss_100p" },
] as const;

export function passProgress(pass: WeeklyPassState) {
  return PASS_STEPS.map((s) => ({
    step: s.step,
    label: s.label,
    done: s.check(pass),
    claimed: pass.claimedSteps.includes(s.step) || (s.step === 5 && pass.finalClaimed),
    reward: s.reward,
  }));
}

export function claimStep(pass: WeeklyPassState, step: number) {
  const def = PASS_STEPS.find((s) => s.step === step);
  if (!def) throw new Error("잘못된 단계예요.");
  if (!def.check(pass)) throw new Error("아직 조건을 달성하지 못했어요.");
  if (step === 5) {
    if (pass.finalClaimed) throw new Error("이미 받았어요.");
    pass.finalClaimed = true;
    return def.reward;
  }
  if (pass.claimedSteps.includes(step)) throw new Error("이미 받았어요.");
  pass.claimedSteps.push(step);
  return def.reward;
}
