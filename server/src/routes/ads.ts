import { Router } from "express";
import {
  addGold,
  addPredictionPoints,
  canRanked,
  getOrCreatePlayer,
  getPlayerSnapshot,
  trainHorse,
} from "../db/playerStore.js";
import { consumeVerified, markVerified } from "../lib/adNonceStore.js";
import { parseSsvQuery, verifySsvSignature } from "../lib/adSsv.js";
import { isDevUser } from "../lib/devAccess.js";
import {
  getAdEligibility,
  PLACEMENTS,
  PLACEMENT_REWARDS,
  recordAdWatch,
  type PlacementId,
} from "../lib/monetization.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const adsRouter = Router();

/**
 * AdMob이 직접 호출하는 서버-서버 콜백 — 유저 세션이 없으므로
 * requireSession 앞에 등록한다. Play Console > 앱 > 광고 > 게재위치 설정에서
 * "서버 측 확인 콜백 URL"에 이 경로의 전체 URL을 등록해야 동작한다.
 *
 * placement 는 AdMob 콘솔이 아니라 우리 쪽에서 Android 앱이 setCustomData(nonce)로
 * 실어 보낸 nonce 하나로만 식별한다 — nonce → 검증 기록에 placement 를 함께 저장해두고,
 * /ads/claim 에서 그 기록을 그대로 신뢰의 근거로 쓴다.
 */
adsRouter.get("/ssv", async (req, res) => {
  // req.query 로 재직렬화하면 서명 대상 원문과 달라지므로 반드시 raw query 를 쓴다.
  const rawQuery = req.url.includes("?") ? req.url.slice(req.url.indexOf("?") + 1) : "";
  const parsed = parseSsvQuery(rawQuery);

  if (!parsed) {
    res.status(400).send("bad request");
    return;
  }

  const valid = await verifySsvSignature(parsed);
  if (!valid) {
    res.status(400).send("invalid signature");
    return;
  }

  // customData 에는 클라이언트가 실어 보낸 nonce 원문이 그대로 들어온다.
  const nonce = parsed.customData;
  if (!nonce) {
    res.status(400).send("missing custom_data");
    return;
  }

  // placement 는 SSV 콜백에 실려오지 않는다 — /ads/claim 이 보내는 placement 를
  // 신뢰하되, "진짜 광고를 끝까지 봤다"는 사실 자체는 이 nonce 존재로 보장된다.
  await markVerified(nonce, {
    placement: "",
    adUnit: parsed.adUnit,
    transactionId: parsed.transactionId,
    claimed: false,
  });

  res.status(200).send("ok");
});

adsRouter.use(requireSession);

adsRouter.get("/eligibility", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  const accountDays = Math.floor(
    (Date.now() - player.createdAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  const placements = (Object.keys(PLACEMENTS) as PlacementId[]).map((id) => {
    const result = getAdEligibility(
      player.adUsage,
      id,
      accountDays,
      player.globalAdLastMs,
      userKey,
    );
    return { id, ...result };
  });

  res.json({ ok: true, placements });
});

adsRouter.post("/claim", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { placement, adToken } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);

  if (!placement || !adToken || typeof adToken !== "string") {
    res.status(400).json({ ok: false, message: "placement과 adToken이 필요해요." });
    return;
  }

  if (adToken.startsWith("dev-")) {
    // 로컬 개발용 mock 토큰 — DEV_LOGIN=true 이고 DEV_USER_KEY 가 일치할 때만 통과.
    if (!isDevUser(userKey)) {
      res.status(403).json({ ok: false, message: "유효하지 않은 광고 토큰이에요." });
      return;
    }
  } else if (adToken.startsWith("ssv:")) {
    // Android(AdMob) 경로 — Google 서버가 /ads/ssv 로 보내온, 서명 검증까지 끝난
    // nonce 만 통과한다. 광고를 실제로 끝까지 보지 않으면 여기서 막힌다.
    const watch = await consumeVerified(adToken.slice("ssv:".length));
    if (!watch) {
      res.status(400).json({
        ok: false,
        message: "광고 시청을 아직 확인하지 못했어요. 잠시 후 다시 시도해주세요.",
      });
      return;
    }
  } else {
    // 그 외(토스 인앱광고)는 기존과 동일하게 신뢰한다.
    // TODO: 토스 광고 서버측 검증(SSV 상당 기능)이 열리면 여기도 동일하게 강제할 것.
  }

  if (!PLACEMENTS[placement as PlacementId]) {
    res.status(400).json({ ok: false, message: "알 수 없는 광고 placement예요." });
    return;
  }

  const accountDays = Math.floor(
    (Date.now() - player.createdAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  const check = getAdEligibility(
    player.adUsage,
    placement as PlacementId,
    accountDays,
    player.globalAdLastMs,
    userKey,
  );

  if (!check.eligible) {
    res.status(400).json({ ok: false, message: check.reason ?? "광고 보상을 받을 수 없어요." });
    return;
  }

  recordAdWatch(player.adUsage, placement as PlacementId);
  player.globalAdLastMs = Date.now();

  const reward = PLACEMENT_REWARDS[placement as PlacementId];
  let message = "";

  switch (reward.type) {
    case "gold_multiplier":
      addGold(player, player.lastRaceGold);
      message = `골드 2배 (+${player.lastRaceGold})`;
      break;
    case "stamina":
      player.raceStamina = Math.min(8, player.raceStamina + (reward.amount ?? 3));
      message = `경주력 +${reward.amount}`;
      break;
    case "rank_ticket":
      player.adRankedTickets += 1;
      message = "랭킹 티켓 +1";
      break;
    case "train":
      try {
        trainHorse(player);
      } catch {
        player.gold += 30;
      }
      message = "훈련 +1";
      break;
    case "revive":
      player.pendingRevive = false;
      message = "재도전 기회";
      break;
    case "gold":
      addGold(player, reward.amount ?? 50);
      message = `골드 +${reward.amount}`;
      break;
    case "streak_shield":
      player.streakShieldUsedWeek = player.weekId;
      message = "스트릭 보호";
      break;
    case "weekend_boost":
      player.weekendBoostPct = reward.amount ?? 5;
      message = `이번 경주 버프 +${reward.amount}%`;
      break;
    case "prediction_points": {
      const pts = reward.amount ?? 4;
      addPredictionPoints(player, pts);
      message = `찌라시 P +${pts}`;
      break;
    }
    case "race_continue": {
      const ranked = canRanked(player);
      if (!ranked.ok) {
        player.adRankedTickets += 1;
        message = "경주 티켓 +1 · 다음 경주 가능!";
      } else {
        const pts = reward.amount ?? 4;
        addPredictionPoints(player, pts);
        message = `찌라시 P +${pts} · 다음 경주 준비`;
      }
      break;
    }
  }

  res.json({
    ok: true,
    message,
    reward,
    snapshot: getPlayerSnapshot(player),
  });
});
