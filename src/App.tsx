import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { useAuthContext } from "./context/AuthContext";
import { useMonetization } from "./hooks/useMonetization";
import { usePlayer } from "./hooks/usePlayer";
import { partyToRaceResult } from "./lib/partyRace";
import { AppBannerAd } from "./components/AppBannerAd";
import { HelpPage } from "./pages/HelpPage";
import { HomePage } from "./pages/HomePage";
import { InAppAdsPage } from "./pages/InAppAdsPage";
import { MissionsPage } from "./pages/MissionsPage";
import { PartyPage } from "./pages/PartyPage";
import { PredictPage } from "./pages/PredictPage";
import { RacePage } from "./pages/RacePage";
import { SettingsPage } from "./pages/SettingsPage";
import type { AdPlacement, PartySnapshot, RaceResult, RankedPrepare } from "./types/game";
import type { ReactNode } from "react";

type Page =
  | "home"
  | "race"
  | "predict"
  | "party"
  | "missions"
  | "help"
  | "settings"
  | "iaa";

function readPartyDeepLink(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const code = new URLSearchParams(window.location.search).get("party");
    return code ? code.toUpperCase() : undefined;
  } catch {
    return undefined;
  }
}

function App() {
  const [page, setPage] = useState<Page>(() =>
    readPartyDeepLink() ? "party" : "home",
  );
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [partyResults, setPartyResults] = useState<
    import("./types/game").PartyMemberResult[] | null
  >(null);
  const [rankedPrepare, setRankedPrepare] = useState<RankedPrepare | null>(null);
  const [party, setParty] = useState<PartySnapshot | null>(null);
  const [partyJoinCode, setPartyJoinCode] = useState<string | undefined>(
    readPartyDeepLink,
  );
  const [continueAd, setContinueAd] = useState<AdPlacement | null>(null);
  const [ticketAd, setTicketAd] = useState<AdPlacement | null>(null);
  const auth = useAuthContext();
  const { sessionId, userKey } = auth;
  const player = usePlayer(sessionId);
  const claimAdReward = useCallback(
    (placement: string, adToken: string) => player.claimAdReward(placement, adToken),
    [player.claimAdReward],
  );
  const { showRewardedAd } = useMonetization(claimAdReward);

  function renderWithBanners(content: ReactNode) {
    const showBottomBanner = page !== "race";

    return (
      <div className="app-shell">
        <AppBannerAd position="top" onClick={() => setPage("iaa")} />
        <div className="app-shell__content">{content}</div>
        {showBottomBanner && <AppBannerAd position="bottom" onClick={() => setPage("iaa")} />}
      </div>
    );
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    player.fetchParty().then(setParty).catch(() => setParty(null));
  }, [sessionId, player.fetchParty]);

  useEffect(() => {
    if (page !== "race" || !raceResult || raceResult.mode === "party") {
      setContinueAd(null);
      setTicketAd(null);
      return;
    }
    player.getAdEligibility().then((placements) => {
      setContinueAd(placements.find((p) => p.id === "AD_RACE_CONTINUE") ?? null);
      setTicketAd(placements.find((p) => p.id === "AD_RANK_TICKET") ?? null);
    });
  }, [
    page,
    raceResult,
    player.getAdEligibility,
    player.snapshot?.predictionPoints,
    player.snapshot?.rankedAvailable,
  ]);

  async function goToNextRace(watchAdFirst = false, ticketAdFirst = false) {
    if (ticketAdFirst) {
      await showRewardedAd("AD_RANK_TICKET");
    } else if (watchAdFirst) {
      await showRewardedAd("AD_RACE_CONTINUE");
    }
    const prepare = await player.prepareRanked();
    setRaceResult(null);
    setPartyResults(null);
    setRankedPrepare({
      raceId: prepare.raceId,
      condition: prepare.condition,
      entrants: prepare.entrants,
      tipCosts: prepare.tipCosts,
      revealedTips: prepare.revealedTips,
      revealedTipCards: prepare.revealedTipCards,
      predictionPoints: prepare.predictionPoints,
    });
    setPage("predict");
  }

  function startPartyRace(p: PartySnapshot) {
    if (!userKey) return;
    const result = partyToRaceResult(p, userKey);
    if (!result) return;
    setParty(p);
    setPartyResults(p.clientResult?.memberResults ?? null);
    setRaceResult(result);
    setPage("race");
  }

  if (page === "iaa") {
    return renderWithBanners(<InAppAdsPage onBack={() => setPage("home")} />);
  }

  if (page === "race" && raceResult) {
    return renderWithBanners(
      <RacePage
        result={raceResult}
        rankedAvailable={player.snapshot?.rankedAvailable ?? false}
        continueAd={continueAd}
        ticketAd={ticketAd}
        partyResults={partyResults}
        onNextRace={() => goToNextRace(false)}
        onNextRaceWithAd={() => goToNextRace(true)}
        onNextRaceWithTicketAd={() => goToNextRace(false, true)}
        onDone={async () => {
          if (raceResult.mode === "party") {
            setRaceResult(null);
            setPartyResults(null);
            const next = await player.fetchParty();
            setParty(next);
            setPage("party");
            return;
          }
          await player.endSession();
          setRaceResult(null);
          setPartyResults(null);
          setPage("home");
        }}
      />,
    );
  }

  if (page === "party" && userKey) {
    return renderWithBanners(
      <PartyPage
        party={party}
        initialJoinCode={partyJoinCode}
        onRefresh={player.fetchParty}
        onCreate={async (name) => {
          const p = await player.createParty(name);
          setParty(p);
          return p;
        }}
        onJoin={async (code, name) => {
          const p = await player.joinParty(code, name);
          setParty(p);
          setPartyJoinCode(undefined);
          return p;
        }}
        onLeave={async () => {
          await player.leaveParty();
          setParty(null);
        }}
        onPrepare={player.prepareParty}
        onPredict={player.predictParty}
        onRevealTip={async (n) => {
          const data = await player.revealPartyTip(n);
          return data.party;
        }}
        onRun={player.runParty}
        onRaceReady={startPartyRace}
        onBack={() => {
          setPage("home");
        }}
      />,
    );
  }

  if (page === "predict" && rankedPrepare) {
    return renderWithBanners(
      <PredictPage
        prepare={rankedPrepare}
        freeTipReveals={player.snapshot?.freeTipReveals ?? 0}
        onWatchAdForPoints={async () => {
          const res = await showRewardedAd("AD_PREDICTION_POINTS");
          return res.snapshot.predictionPoints;
        }}
        onPredict={(n) => player.predictRanked(rankedPrepare.raceId, n)}
        onRevealTip={async (n) => {
          const data = await player.revealRankedTip(rankedPrepare.raceId, n);
          return {
            revealedTipCards: data.revealedTipCards,
            predictionPoints: data.predictionPoints,
            freeTipReveals: data.snapshot.freeTipReveals,
          };
        }}
        onStart={async () => {
          const result = await player.runRanked(rankedPrepare.raceId);
          setRankedPrepare(null);
          setRaceResult(result);
          setPage("race");
        }}
        onBack={async () => {
          await player.endSession();
          setRankedPrepare(null);
          setPage("home");
        }}
      />,
    );
  }

  if (page === "missions" && player.snapshot) {
    return renderWithBanners(
      <MissionsPage
        snapshot={player.snapshot}
        claimAttendance={player.claimAttendance}
        onBack={() => setPage("home")}
      />,
    );
  }

  if (page === "help") {
    return renderWithBanners(<HelpPage onBack={() => setPage("home")} />);
  }

  if (page === "settings") {
    return renderWithBanners(<SettingsPage onBack={() => setPage("home")} />);
  }

  return renderWithBanners(
    <HomePage
      auth={auth}
      player={player}
      showRewardedAd={showRewardedAd}
      onOpenAds={() => setPage("iaa")}
      onOpenParty={() => {
        setPage("party");
        player.fetchParty().then(setParty).catch(() => setParty(null));
      }}
      onOpenMissions={() => setPage("missions")}
      onOpenHelp={() => setPage("help")}
      onOpenSettings={() => setPage("settings")}
      onStartPredict={(prepare) => {
        setRankedPrepare(prepare);
        setPage("predict");
      }}
    />,
  );
}

export default App;
