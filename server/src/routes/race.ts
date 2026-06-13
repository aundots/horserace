import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pickGhosts, saveGhost } from "../db/ghostStore.js";
import {
  consumePreparedRace,
  createPreparedRace,
  getRevealedTipCards,
  getTipOpenCost,
  revealTip,
  setPrediction,
} from "../db/racePrepStore.js";
import {
  addGold,
  canPractice,
  canRanked,
  getOrCreatePlayer,
  getPlayerSnapshot,
  spendPracticeStamina,
  spendPredictionPoints,
  spendRankedTicket,
} from "../db/playerStore.js";
import { computeNeglect } from "../lib/neglect.js";
import { kstWeekId } from "../lib/kst.js";
import { newbieTrapDisabled } from "../lib/retention.js";
import { onRankedRaceComplete, type RaceLoopBonus } from "../lib/raceLoop.js";
import { buildEntrants, buildRaceField } from "../lib/raceField.js";
import { generateTipsForAllHorses, resolvePrediction } from "../lib/tips.js";
import {
  randomRaceCondition,
  simulateRace,
} from "../lib/raceSim.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const raceRouter = Router();

raceRouter.use(requireSession);

function goldForPlace(place: number, mode: "practice" | "ranked" | "party") {
  if (mode === "party") return 0;
  if (mode === "practice") return Math.max(10, 25 - place * 2);
  return [80, 60, 45, 35, 25, 20, 15, 10][place - 1] ?? 10;
}

function buildRaceResult(
  mode: "practice" | "ranked" | "party",
  result: ReturnType<typeof simulateRace>,
  condition: ReturnType<typeof randomRaceCondition>,
  entrants: ReturnType<typeof buildEntrants>,
  extras?: {
    prediction?: { hit: string } | null;
    pickedNumber?: number | null;
    loopBonus?: RaceLoopBonus | null;
  },
) {
  const goldEarned = result.playerDnf ? 5 : goldForPlace(result.playerPlace, mode);
  const pick = extras?.pickedNumber;
  const dnfReason = result.playerDnfReason;
  const dnfMsg =
    dnfReason === "interference"
      ? pick
        ? `예상 ${pick}번, 앞 다툼에 휘말려 기권…`
        : "앞 다툼 간섭 사고 — 기권 처리됐어요."
      : pick
        ? `예상 ${pick}번 낙마 — 아쉽네요.`
        : "낙마 — 기권 처리됐어요.";
  return {
    raceId: randomUUID(),
    mode,
    condition,
    entrants,
    finishOrder: result.finishOrder,
    pickedNumber: pick ?? null,
    myPlace: result.playerPlace,
    dnf: result.playerDnf,
    dnfReason,
    raceEvents: result.raceEvents,
    goldEarned,
    raceScore: null,
    timeline: result.timeline,
    overtakes: result.overtakes,
    photoFinish: result.overtakes >= 4,
    feedback: result.playerDnf
      ? dnfMsg
      : pick
        ? `예상 ${pick}번 ${result.playerPlace}착!`
        : result.playerPlace <= 3
          ? "좋은 경주였어요!"
          : "다음 경주를 노려보세요.",
    fairnessTag: result.playerDnf
      ? dnfReason === "interference"
        ? "간섭 사고"
        : "낙마"
      : result.playerPlace > 5
        ? "컨디션·주로 영향"
        : null,
    prediction: extras?.prediction ?? null,
    hitBox: null,
    loopBonus: extras?.loopBonus ?? null,
  };
}

raceRouter.get("/schedule", (_req, res) => {
  res.json({
    ok: true,
    isWeekend: true,
    mode: "ranked",
    message: "매일 경주 · 찌라시 · 예상",
  });
});

raceRouter.post("/practice", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);

  if (!canPractice(player)) {
    res.status(400).json({ ok: false, message: "경주력이 부족해요. 잠시 후 회복돼요." });
    return;
  }

  const neglect = computeNeglect(player.lastLoginAt, player.createdAt, player.rehabProgress);
  const anchor = player.horse;
  const { horses, jockeys } = buildRaceField({
    speed: anchor.speed,
    stamina: anchor.stamina,
    accel: anchor.accel,
  });
  const condition = randomRaceCondition();
  const result = simulateRace(
    horses,
    condition,
    { finishTimePenaltyPct: neglect.finishTimePenaltyPct, fallChanceBonus: neglect.fallChanceBonus },
    {},
  );

  spendPracticeStamina(player);
  const gold = 15;
  addGold(player, gold);
  player.lastRaceGold = gold;
  player.welcomeBack = false;

  res.json({
    ok: true,
    result: buildRaceResult("practice", result, condition, buildEntrants(horses, jockeys)),
    snapshot: getPlayerSnapshot(player),
  });
});

raceRouter.post("/ranked/prepare", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  const ranked = canRanked(player);
  if (!ranked.ok) {
    res.status(400).json({ ok: false, message: ranked.reason });
    return;
  }

  const anchor = player.horse;
  const { horses, jockeys } = buildRaceField({
    speed: anchor.speed,
    stamina: anchor.stamina,
    accel: anchor.accel,
  });
  const condition = randomRaceCondition();
  const tips = generateTipsForAllHorses(horses, condition, {
    trapEnabled: !newbieTrapDisabled(player.totalRaces, player.createdAt),
    trainedToday: false,
  });

  const prepared = createPreparedRace(userKey, condition, horses, tips, jockeys);

  res.json({
    ok: true,
    raceId: prepared.id,
    condition,
    tipCosts: prepared.tipCosts,
    revealedTips: prepared.revealedTips,
    revealedTipCards: getRevealedTipCards(prepared),
    predictionPoints: player.predictionPoints,
    entrants: buildEntrants(horses, jockeys),
    snapshot: getPlayerSnapshot(player),
  });
});

raceRouter.post("/ranked/reveal-tip", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { raceId, horseNumber } = req.body ?? {};
  if (!raceId || !horseNumber) {
    res.status(400).json({ ok: false, message: "raceId와 horseNumber가 필요해요." });
    return;
  }

  const player = getOrCreatePlayer(userKey);
  const result = revealTip(raceId, userKey, Number(horseNumber));
  if (!result) {
    res.status(400).json({ ok: false, message: "경주 준비가 만료됐어요." });
    return;
  }

  try {
    const openCost = getTipOpenCost(result.race, Number(horseNumber));
    let usedFreeTip = false;
    if (!result.already) {
      if (player.freeTipReveals > 0) {
        player.freeTipReveals -= 1;
        usedFreeTip = true;
      } else {
        spendPredictionPoints(player, openCost);
      }
    }
    res.json({
      ok: true,
      tip: result.tip,
      already: result.already,
      openCost: usedFreeTip ? 0 : openCost,
      usedFreeTip,
      revealedTips: result.race.revealedTips,
      revealedTipCards: getRevealedTipCards(result.race),
      tipCosts: result.race.tipCosts,
      predictionPoints: player.predictionPoints,
      snapshot: getPlayerSnapshot(player),
    });
  } catch (error) {
    if (!result.already) {
      result.race.revealedTips.pop();
    }
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "찌라시를 열 수 없어요.",
    });
  }
});

raceRouter.post("/ranked/predict", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { raceId, horseNumber } = req.body ?? {};
  if (!raceId || !horseNumber) {
    res.status(400).json({ ok: false, message: "raceId와 horseNumber가 필요해요." });
    return;
  }
  try {
    const race = setPrediction(raceId, userKey, Number(horseNumber));
    if (!race) {
      res.status(400).json({ ok: false, message: "경주 준비가 만료됐어요. 다시 준비해 주세요." });
      return;
    }
    res.json({ ok: true, raceId, prediction: race.prediction });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "예상 등록 실패",
    });
  }
});

raceRouter.post("/ranked/run", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { raceId } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);
  const ranked = canRanked(player);
  if (!ranked.ok) {
    res.status(400).json({ ok: false, message: ranked.reason });
    return;
  }

  const prepared = raceId ? consumePreparedRace(raceId, userKey) : null;
  if (!prepared) {
    res.status(400).json({ ok: false, message: "경주 준비가 만료됐어요. 다시 준비해 주세요." });
    return;
  }

  if (!prepared.prediction) {
    res.status(400).json({ ok: false, message: "예상 말을 먼저 선택해 주세요." });
    return;
  }

  const neglect = computeNeglect(player.lastLoginAt, player.createdAt, player.rehabProgress);
  const rookieShield = player.totalRaces < 3;
  const result = simulateRace(
    prepared.horses,
    prepared.condition,
    { finishTimePenaltyPct: neglect.finishTimePenaltyPct, fallChanceBonus: neglect.fallChanceBonus },
    { rookieShield, focusNumber: prepared.prediction },
  );

  spendRankedTicket(player);
  const gold = result.playerDnf ? 5 : goldForPlace(result.playerPlace, "ranked");
  addGold(player, gold);
  player.lastRaceGold = gold;
  player.pendingRevive = result.playerDnf;

  let predictionResult = null;

  if (prepared.prediction) {
    const pred = resolvePrediction(prepared.prediction, result.finishOrder);
    predictionResult = pred;
    if (pred.hit === "win") player.predictionWins += 1;
  }

  if (!result.playerDnf) {
    const pickedHorse = prepared.horses.find((h) => h.number === prepared.prediction);
    if (pickedHorse && result.playerPlace <= 3) {
      saveGhost({
        userKey,
        horseName: pickedHorse.name,
        speed: pickedHorse.speed,
        stamina: pickedHorse.stamina,
        accel: pickedHorse.accel,
        pace: pickedHorse.pace,
        trackApt: pickedHorse.trackApt,
        distanceApt: pickedHorse.distanceApt,
        finishTime: result.finishTimes[pickedHorse.number] ?? 0,
        recordedAt: new Date(),
      });
    }
  }

  const loopBonus = onRankedRaceComplete(player);
  if (loopBonus.dailyChallengeComplete && loopBonus.dailyChallengeGold > 0) {
    addGold(player, loopBonus.dailyChallengeGold);
  }

  res.json({
    ok: true,
    result: buildRaceResult(
      "ranked",
      result,
      prepared.condition,
      buildEntrants(prepared.horses, prepared.jockeys),
      {
        prediction: predictionResult,
        pickedNumber: prepared.prediction,
        loopBonus,
      },
    ),
    snapshot: getPlayerSnapshot(player),
  });
});

raceRouter.get("/leaderboard", (_req, res) => {
  res.json({ ok: true, weekId: kstWeekId(), room: null });
});
