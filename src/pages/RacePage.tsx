import { Button } from "@toss/tds-mobile";
import { useEffect, useMemo, useRef, useState } from "react";
import { FinishLineTop3 } from "../components/FinishLineTop3";
import { RaceLiveScoreboard } from "../components/RaceLiveScoreboard";
import { RacePartyPicks } from "../components/RacePartyPicks";
import { RaceCommentaryBar } from "../components/RaceCommentaryBar";
import { RaceHorseIcon } from "../components/RaceHorseIcon";
import { RaceTrackScene } from "../components/RaceTrackScene";
import { WhipTapButton } from "../components/WhipTapButton";
import { useLang } from "../i18n/LangContext";
import { trackLabel, weatherLabel } from "../i18n/labels";
import { useRaceCommentary } from "../hooks/useRaceCommentary";
import { useRacePlayback } from "../hooks/useRacePlayback";
import { useWhipTap } from "../hooks/useWhipTap";
import {
  buildInterpolatedHorses,
  getRaceKeyframe,
  isOvertakeFrame,
  pickLeader,
} from "../lib/raceAnimation";
import {
  getCameraTransform,
  getHorsePositionAtMetersRemaining,
  getOvalLayout,
  getVisibleRect,
  raceHorseIconSize,
  viewportDimensions,
} from "../lib/ovalTrack";
import {
  prepareRaceAudio,
  stopFinishCheer,
  updateFinishCheer,
} from "../lib/raceSound";
import type { AdPlacement, PartyMemberResult, RaceResult } from "../types/game";

interface RacePageProps {
  result: RaceResult;
  rankedAvailable: boolean;
  continueAd: AdPlacement | null;
  ticketAd: AdPlacement | null;
  onNextRace: () => Promise<void>;
  onNextRaceWithAd: () => Promise<void>;
  onNextRaceWithTicketAd: () => Promise<void>;
  onDone: () => void | Promise<void>;
  partyResults?: PartyMemberResult[] | null;
}

export function RacePage({
  result,
  rankedAvailable,
  continueAd,
  ticketAd,
  onNextRace,
  onNextRaceWithAd,
  onNextRaceWithTicketAd,
  onDone,
  partyResults = null,
}: RacePageProps) {
  const { lang, t } = useLang();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [dims, setDims] = useState(viewportDimensions);
  const lateralRef = useRef(new Map<number, number>());
  const positionRef = useRef(new Map<number, import("../lib/ovalTrack").HorsePoint>());
  const metersRef = useRef(new Map<number, number>());
  const raceProgress = useRacePlayback(
    started,
    finished,
    result.mode === "party" ? result.raceStartedAt : undefined,
  );
  const horseSize = raceHorseIconSize(dims.height);
  const whip = useWhipTap(raceProgress, started, finished);

  const layout = useMemo(
    () => getOvalLayout(undefined, undefined, result.condition.distance),
    [result.condition.distance],
  );
  const entrantSource =
    result.mode === "party" && finished && result.fullEntrants
      ? result.fullEntrants
      : result.entrants;
  const entrantMap = useMemo(
    () => new Map(entrantSource.map((e) => [e.number, e])),
    [entrantSource],
  );

  const horseNumbers = useMemo(
    () => [...entrantSource].sort((a, b) => a.number - b.number).map((e) => e.number),
    [entrantSource],
  );

  useEffect(() => {
    const onResize = () => setDims(viewportDimensions());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 파티 모드는 방장이 이미 "경주 시작"을 눌러서 결과가 확정된 뒤에 화면에
  // 들어온다 — 여기서 또 한 번 각자 누르게 하면 그 텀만큼 참가자마다 재생
  // 시작 시각이 달라진다. 진입과 동시에 자동 재생하고, raceStartedAt 기반
  // 따라잡기(useRacePlayback)로 실제 화면 동기화를 맞춘다.
  useEffect(() => {
    if (result.mode !== "party") return;
    prepareRaceAudio();
    setStarted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started || finished) return;
    if (raceProgress < 1) return;
    const timer = setTimeout(() => setFinished(true), 900);
    return () => clearTimeout(timer);
  }, [raceProgress, started, finished]);

  useEffect(() => {
    if (!started) {
      stopFinishCheer();
      return;
    }
    if (finished) {
      stopFinishCheer();
      return;
    }
    updateFinishCheer(raceProgress, true);
  }, [started, finished, raceProgress]);

  useEffect(() => () => stopFinishCheer(), []);

  useEffect(() => {
    if (!started) {
      lateralRef.current.clear();
      positionRef.current.clear();
      metersRef.current.clear();
    }
  }, [started]);

  const keyframe = getRaceKeyframe(result.timeline, started ? raceProgress : 0);
  const showOvertake = started && isOvertakeFrame(keyframe);

  const horseStates = buildInterpolatedHorses(
    result.timeline,
    layout,
    horseNumbers,
    raceProgress,
    started,
    result.condition.distance,
    lateralRef.current,
    positionRef.current,
    metersRef.current,
  );

  const leader = pickLeader(horseStates);
  const leaderPos =
    leader?.pos ??
    getHorsePositionAtMetersRemaining(layout, result.condition.distance, 0.5);
  const camera = getCameraTransform(leaderPos, dims.width, dims.height);
  const visibleRect = getVisibleRect(camera, dims.width, dims.height);

  const pickedNumber = result.pickedNumber ?? null;

  const liveTop3 = useMemo(() => {
    if (!started || finished) return [];
    return [...horseStates]
      .sort((a, b) => a.rankIdx - b.rankIdx)
      .slice(0, 3)
      .map((h, i) => {
        const ent = entrantMap.get(h.number);
        return {
          rank: i + 1,
          number: h.number,
          name: ent?.name ?? t.horseNo(h.number),
          silkHue: ent?.silkHue,
          isPlayer: h.number === pickedNumber,
        };
      });
  }, [horseStates, started, finished, entrantMap, pickedNumber, t]);

  const minimapHorses = horseStates.map(({ number, pos }) => {
    const entrant = entrantMap.get(number);
    return {
      number,
      x: pos.x,
      y: pos.y,
      isPlayer: number === pickedNumber,
      coat: entrant?.coat,
      silkHue: entrant?.silkHue,
    };
  });

  const top3Numbers = finished ? result.finishOrder.slice(0, 3) : [];
  const pickedEntrant = pickedNumber
    ? entrantSource.find((e) => e.number === pickedNumber)
    : null;

  const liveRanks = useMemo(
    () =>
      started && !finished
        ? [...horseStates]
            .sort((a, b) => a.rankIdx - b.rankIdx)
            .map((h) => h.number)
        : undefined,
    [horseStates, started, finished],
  );

  const opponentPicks = useMemo(() => {
    if (result.mode !== "party" || !partyResults) return [];
    return partyResults
      .filter((m) => m.pick != null && m.pick !== pickedNumber)
      .map((m) => {
        const ent = entrantMap.get(m.pick!);
        return {
          userKey: m.userKey,
          name: m.displayName,
          number: m.pick!,
          silkHue: ent?.silkHue,
        };
      });
  }, [result.mode, partyResults, pickedNumber, entrantMap]);

  const commentary = useRaceCommentary({
    lang,
    raceProgress,
    started,
    finished,
    keyframe,
    liveRanks,
    entrantMap,
    pickedNumber,
    distance: result.condition.distance,
    track: result.condition.track,
    overtakes: result.overtakes,
    photoFinish: result.photoFinish,
    myPlace: result.myPlace,
    dnf: result.dnf,
    dnfReason: result.dnfReason,
    raceEvents: result.raceEvents,
  });

  const statusLabel = !started
    ? t.raceWaiting
    : showOvertake
      ? t.raceOvertake
      : finished
        ? t.raceFinished
        : t.raceLive;

  const headline = !started
    ? t.raceReady
    : finished
      ? result.dnf
        ? result.dnfReason === "interference"
          ? pickedEntrant
            ? t.dnfInterference(pickedEntrant.number)
            : t.dnfInterferencePlain
          : pickedEntrant
            ? t.dnfFall(pickedEntrant.number)
            : t.dnfFallPlain
        : pickedEntrant
          ? result.mode === "party"
            ? t.partyFinish(
                pickedEntrant.number,
                result.myPlace,
                result.raceScore ?? 0,
              )
            : t.soloFinish(pickedEntrant.name, result.myPlace)
          : t.plainFinish(result.myPlace)
      : t.raceInProgress;

  const subline = !started
    ? t.raceWaitingDesc
    : finished
      ? commentary.text || result.feedback
      : commentary.text;

  return (
    <div className="race-page">
      <header className="race-page__header">
        <div>
          <div className="race-page__title">
            {result.mode === "party"
              ? result.partyRaceNumber
                ? t.modePartyRace(result.partyRaceNumber)
                : t.modeParty
              : result.mode === "practice"
                ? t.modePractice
                : t.modeRanked}
          </div>
          <div className="race-page__meta">
            {result.condition.distance}m · {trackLabel(t, result.condition.track)} ·{" "}
            {weatherLabel(t, result.condition.weather)}
          </div>
        </div>
        {pickedEntrant && (
          <div className="race-page__pick">
            <span className="race-page__pick-label">{t.myHorse}</span>
            <span className="race-page__pick-num">{pickedEntrant.number}</span>
            <span className="race-page__pick-name">{pickedEntrant.name}</span>
          </div>
        )}
      </header>

      <RaceTrackScene
        track={result.condition.track}
        layout={layout}
        viewportW={dims.width}
        viewportH={dims.height}
        camera={camera}
        visibleRect={visibleRect}
        minimapHorses={minimapHorses}
        raceDistance={result.condition.distance}
        style={{ margin: "0 auto 14px" }}
        hud={
          <div className="race-hud">
            <div className="race-hud__row">
              <span
                className={
                  showOvertake
                    ? "race-hud__badge race-hud__badge--overtake"
                    : started
                      ? "race-hud__badge race-hud__badge--live"
                      : "race-hud__badge"
                }
              >
                {statusLabel}
              </span>
              {started && (
                <span className="race-hud__stat">{t.overtakeCount(result.overtakes)}</span>
              )}
            </div>
            <div className="race-hud__board-row">
              <RaceLiveScoreboard leaders={liveTop3} visible={started && !finished} />
              <RacePartyPicks picks={opponentPicks} visible={started && !finished} />
            </div>
          </div>
        }
        finishOverlay={
          <FinishLineTop3
            layout={layout}
            camera={camera}
            top3={top3Numbers}
            entrantMap={entrantMap}
            visible={finished}
          />
        }
        footer={
          started && !finished ? (
            <>
              <WhipTapButton
                visible={whip.active}
                combo={whip.combo}
                effect={whip.effect}
                onTap={whip.tap}
              />
              <RaceCommentaryBar line={commentary} visible overlay />
            </>
          ) : null
        }
      >
        {horseStates.map(({ number, pos }) => {
          const entrant = entrantMap.get(number);
          const isMine = number === pickedNumber;
          const whipClass =
            isMine && whip.effect === "great"
              ? " horse-boost"
              : isMine && whip.effect === "miss"
                ? " horse-stumble"
                : "";
          return (
            <div
              key={number}
              className={whipClass || undefined}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -88%)",
                zIndex: isMine ? 3 : 2,
              }}
            >
              <RaceHorseIcon
                number={number}
                name={entrant?.name}
                jockeyName={entrant?.jockeyName}
                silkHue={entrant?.silkHue}
                coat={entrant?.coat}
                isPlayer={number === pickedNumber}
                isGhost={entrant?.isGhost}
                size={horseSize}
                flipX={pos.flipX}
                tiltDeg={pos.tiltDeg}
                animating={started}
                compact
                showCheerName={
                  pickedNumber != null && number === pickedNumber
                }
              />
            </div>
          );
        })}
      </RaceTrackScene>

      <div className="race-panel">
        <div className="race-panel__headline">{headline}</div>
        <p className="race-panel__subline">{subline}</p>

        {finished && partyResults && partyResults.length > 0 && (
          <div className="race-panel__party">
            <div className="race-panel__headline" style={{ marginBottom: 8 }}>
              {t.partyResultHeader(result.partyRaceNumber)}
            </div>
            {[...partyResults]
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((m) => (
              <div key={m.userKey} className="race-panel__party-row">
                <span>{m.displayName}</span>
                <span>
                  {m.pick != null
                    ? t.memberResult(m.pick, m.place, m.racePoints)
                    : "—"}
                  {t.memberTotal(m.totalScore)}
                </span>
              </div>
            ))}
            <p className="race-panel__muted" style={{ marginTop: 8 }}>
              {t.scoreTable}
            </p>
          </div>
        )}

        {finished && result.mode !== "party" && (
          <div className="race-panel__results">
            <div className="race-panel__reward">{t.goldEarned(result.goldEarned)}</div>
            {result.prediction && (
              <div
                className={
                  result.prediction.hit === "win"
                    ? "race-panel__tag race-panel__tag--accent"
                    : "race-panel__tag"
                }
              >
                {result.prediction.hit === "win"
                  ? t.predictWin
                  : result.prediction.hit === "place"
                    ? t.predictPlace
                    : t.predictMiss}
              </div>
            )}
            {result.photoFinish && (
              <div className="race-panel__tag race-panel__tag--accent">
                {t.photoFinish}
              </div>
            )}
            {result.fairnessTag && (
              <div className="race-panel__muted">
                {result.fairnessTag === "간섭 사고"
                  ? t.tagInterference
                  : result.fairnessTag === "낙마"
                    ? t.tagFall
                    : result.fairnessTag}
              </div>
            )}
            {result.loopBonus && (
              <div className="race-panel__loop">
                {result.loopBonus.streakBonus && (
                  <div className="race-panel__tag race-panel__tag--accent">
                    {t.streakBonus(result.loopBonus.sessionRaceStreak)}
                  </div>
                )}
                {result.loopBonus.dailyChallengeComplete && (
                  <div className="race-panel__tag race-panel__tag--accent">
                    {t.dailyDoneShort(
                      result.loopBonus.dailyRaceGoal,
                      result.loopBonus.dailyChallengeGold,
                    )}
                  </div>
                )}
                <div className="race-panel__muted">
                  {t.loopStatus(
                    result.loopBonus.sessionRaceStreak,
                    result.loopBonus.rankedRacesToday,
                    result.loopBonus.dailyRaceGoal,
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!started && (
        <Button
          display="block"
          size="xlarge"
          onClick={() => {
            prepareRaceAudio();
            setStarted(true);
          }}
          style={{ marginBottom: 12 }}
        >
          {t.raceStart}
        </Button>
      )}

      {finished && result.mode !== "party" && (
        <div className="race-continue-actions">
          {!rankedAvailable && ticketAd?.eligible ? (
            <Button
              display="block"
              size="xlarge"
              disabled={continuing}
              onClick={async () => {
                setContinuing(true);
                try {
                  await onNextRaceWithTicketAd();
                } finally {
                  setContinuing(false);
                }
              }}
            >
              {continuing
                ? t.nextRacePreparing
                : t.ticketAdNext(ticketAd.remaining.daily)}
            </Button>
          ) : (
            <Button
              display="block"
              size="xlarge"
              disabled={!rankedAvailable || continuing}
              onClick={async () => {
                setContinuing(true);
                try {
                  await onNextRace();
                } finally {
                  setContinuing(false);
                }
              }}
            >
              {rankedAvailable
                ? continuing
                  ? t.nextRacePreparing
                  : t.nextRace
                : t.noTicket}
            </Button>
          )}
          {rankedAvailable && continueAd?.eligible && (
            <Button
              display="block"
              size="large"
              color="dark"
              variant="weak"
              disabled={continuing}
              onClick={async () => {
                setContinuing(true);
                try {
                  await onNextRaceWithAd();
                } finally {
                  setContinuing(false);
                }
              }}
            >
              {t.pointsAdNext(continueAd.remaining.daily)}
            </Button>
          )}
          {!rankedAvailable && !ticketAd?.eligible && ticketAd?.reason && (
            <p className="race-panel__muted" style={{ textAlign: "center", margin: 0 }}>
              {ticketAd.reason}
            </p>
          )}
          <Button
            display="block"
            size="medium"
            color="dark"
            variant="weak"
            disabled={continuing}
            onClick={() => onDone()}
          >
            {t.homeEndStreak}
          </Button>
        </div>
      )}

      {finished && result.mode === "party" && (
        <Button display="block" size="xlarge" onClick={() => onDone()}>
          {t.backToRoom}
        </Button>
      )}
    </div>
  );
}
