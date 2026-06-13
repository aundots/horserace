import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/client";
import type { HorseDraft } from "../lib/horseBuild";
import type {
  AdPlacement,
  PartySnapshot,
  PlayerSnapshot,
  RaceResult,
  RankedPrepare,
  ShopItem,
  TipCard,
  WeeklyPassStep,
} from "../types/game";

type StatusResponse = { ok: boolean } & PlayerSnapshot;
type RaceResponse = { ok: boolean; result: RaceResult; snapshot: PlayerSnapshot };
type PrepareResponse = { ok: boolean } & RankedPrepare & { snapshot: PlayerSnapshot };
type RevealTipResponse = {
  ok: boolean;
  tip: RankedPrepare["revealedTipCards"][number];
  already: boolean;
  usedFreeTip?: boolean;
  revealedTips: number[];
  revealedTipCards: RankedPrepare["revealedTipCards"];
  predictionPoints: number;
  snapshot: PlayerSnapshot;
};

export function usePlayer(sessionId: string | null) {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<StatusResponse>("/player/status", sessionId);
      setSnapshot(data);
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
  }, [sessionId, refresh]);

  const applySnapshot = (s: PlayerSnapshot) => setSnapshot(s);

  const runPractice = useCallback(async () => {
    if (!sessionId) throw new Error("로그인이 필요합니다.");
    const data = await apiPost<RaceResponse>("/race/practice", {}, sessionId);
    setSnapshot(data.snapshot);
    return data.result;
  }, [sessionId]);

  const prepareRanked = useCallback(async () => {
    if (!sessionId) throw new Error("로그인이 필요합니다.");
    const data = await apiPost<PrepareResponse>("/race/ranked/prepare", {}, sessionId);
    setSnapshot(data.snapshot);
    return data;
  }, [sessionId]);

  const predictRanked = useCallback(
    async (raceId: string, horseNumber: number) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      await apiPost("/race/ranked/predict", { raceId, horseNumber }, sessionId);
    },
    [sessionId],
  );

  const revealRankedTip = useCallback(
    async (raceId: string, horseNumber: number) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<RevealTipResponse>(
        "/race/ranked/reveal-tip",
        { raceId, horseNumber },
        sessionId,
      );
      setSnapshot(data.snapshot);
      return data;
    },
    [sessionId],
  );

  const runRanked = useCallback(
    async (raceId: string) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<RaceResponse>(
        "/race/ranked/run",
        { raceId },
        sessionId,
      );
      setSnapshot(data.snapshot);
      return data.result;
    },
    [sessionId],
  );

  const horseAction = useCallback(
    async (action: "train" | "feed" | "rest") => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
        "/horse/action",
        { action },
        sessionId,
      );
      setSnapshot(data.snapshot);
    },
    [sessionId],
  );

  const customizeHorse = useCallback(
    async (draft: HorseDraft) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
        "/horse/customize",
        {
          name: draft.name,
          coat: draft.coat,
          pace: draft.pace,
          trackApt: draft.trackApt,
          distanceApt: draft.distanceApt,
          speed: draft.speed,
          stamina: draft.stamina,
          accel: draft.accel,
        },
        sessionId,
      );
      setSnapshot(data.snapshot);
    },
    [sessionId],
  );

  const applyHorsePreset = useCallback(
    async (presetId: string, coat?: PlayerSnapshot["horse"]["coat"]) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
        "/horse/preset",
        { presetId, coat },
        sessionId,
      );
      setSnapshot(data.snapshot);
    },
    [sessionId],
  );

  const buyTicket = useCallback(async () => {
    if (!sessionId) throw new Error("로그인이 필요합니다.");
    const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
      "/shop/buy-ticket",
      {},
      sessionId,
    );
    setSnapshot(data.snapshot);
  }, [sessionId]);

  const claimAttendance = useCallback(async () => {
    if (!sessionId) throw new Error("로그인이 필요합니다.");
    const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
      "/retention/attendance",
      {},
      sessionId,
    );
    setSnapshot(data.snapshot);
  }, [sessionId]);

  const claimAdReward = useCallback(
    async (placement: string, adToken: string) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{
        ok: boolean;
        message: string;
        snapshot: PlayerSnapshot;
      }>("/ads/claim", { placement, adToken }, sessionId);
      setSnapshot(data.snapshot);
      return { message: data.message, snapshot: data.snapshot };
    },
    [sessionId],
  );

  const getAdEligibility = useCallback(async () => {
    if (!sessionId) return [];
    const data = await apiGet<{ ok: boolean; placements: AdPlacement[] }>(
      "/ads/eligibility",
      sessionId,
    );
    return data.placements;
  }, [sessionId]);

  const getShopCatalog = useCallback(async () => {
    if (!sessionId) return [];
    const data = await apiGet<{ ok: boolean; items: ShopItem[] }>(
      "/shop/catalog",
      sessionId,
    );
    return data.items;
  }, [sessionId]);

  const purchaseItem = useCallback(
    async (itemId: string) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
        "/shop/purchase",
        { itemId },
        sessionId,
      );
      setSnapshot(data.snapshot);
    },
    [sessionId],
  );

  const getWeeklyPass = useCallback(async () => {
    if (!sessionId) return [];
    const data = await apiGet<{ ok: boolean; steps: WeeklyPassStep[] }>(
      "/weekly-pass",
      sessionId,
    );
    return data.steps;
  }, [sessionId]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    const data = await apiPost<{ ok: boolean; snapshot: PlayerSnapshot }>(
      "/player/end-session",
      {},
      sessionId,
    );
    setSnapshot(data.snapshot);
  }, [sessionId]);

  const claimPassStep = useCallback(
    async (step: number) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{
        ok: boolean;
        snapshot: PlayerSnapshot;
        tossPoints?: number;
        note?: string;
      }>("/weekly-pass/claim", { step }, sessionId);
      setSnapshot(data.snapshot);
      return data;
    },
    [sessionId],
  );

  const fetchParty = useCallback(async () => {
    if (!sessionId) return null;
    const data = await apiGet<{ ok: boolean; party: PartySnapshot | null }>(
      "/party/mine",
      sessionId,
    );
    return data.party;
  }, [sessionId]);

  const createParty = useCallback(
    async (displayName?: string) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; party: PartySnapshot }>(
        "/party/create",
        { displayName },
        sessionId,
      );
      return data.party;
    },
    [sessionId],
  );

  const joinParty = useCallback(
    async (code: string, displayName?: string) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; party: PartySnapshot }>(
        "/party/join",
        { code, displayName },
        sessionId,
      );
      return data.party;
    },
    [sessionId],
  );

  const leaveParty = useCallback(async () => {
    if (!sessionId) return;
    await apiPost("/party/leave", {}, sessionId);
  }, [sessionId]);

  const prepareParty = useCallback(async () => {
    if (!sessionId) throw new Error("로그인이 필요합니다.");
    const data = await apiPost<{ ok: boolean; party: PartySnapshot }>(
      "/party/prepare",
      {},
      sessionId,
    );
    return data.party;
  }, [sessionId]);

  const predictParty = useCallback(
    async (horseNumber: number) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{ ok: boolean; party: PartySnapshot }>(
        "/party/predict",
        { horseNumber },
        sessionId,
      );
      return data.party;
    },
    [sessionId],
  );

  const runParty = useCallback(async () => {
    if (!sessionId) throw new Error("로그인이 필요합니다.");
    const data = await apiPost<{ ok: boolean; party: PartySnapshot }>(
      "/party/run",
      {},
      sessionId,
    );
    return data.party;
  }, [sessionId]);

  const revealPartyTip = useCallback(
    async (horseNumber: number) => {
      if (!sessionId) throw new Error("로그인이 필요합니다.");
      const data = await apiPost<{
        ok: boolean;
        party: PartySnapshot;
        tip: TipCard;
        already: boolean;
      }>("/party/reveal-tip", { horseNumber }, sessionId);
      return data;
    },
    [sessionId],
  );

  return {
    snapshot,
    loading,
    refresh,
    applySnapshot,
    runPractice,
    prepareRanked,
    predictRanked,
    revealRankedTip,
    runRanked,
    horseAction,
    customizeHorse,
    applyHorsePreset,
    buyTicket,
    endSession,
    claimAttendance,
    claimAdReward,
    getAdEligibility,
    getShopCatalog,
    purchaseItem,
    getWeeklyPass,
    claimPassStep,
    fetchParty,
    createParty,
    joinParty,
    leaveParty,
    prepareParty,
    predictParty,
    runParty,
    revealPartyTip,
  };
}
