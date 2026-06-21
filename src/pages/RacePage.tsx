import { Button } from "@toss/tds-mobile";
import { useEffect, useMemo, useRef, useState } from "react";
import { FinishLineTop3 } from "../components/FinishLineTop3";
import { RaceLiveScoreboard } from "../components/RaceLiveScoreboard";
import { RaceCommentaryBar } from "../components/RaceCommentaryBar";
import { RaceHorseIcon } from "../components/RaceHorseIcon";
import { RaceTrackScene } from "../components/RaceTrackScene";
import { useRaceCommentary } from "../hooks/useRaceCommentary";
import { useRacePlayback } from "../hooks/useRacePlayback";
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

const TRACK_LABEL: Record<string, string> = {
  DRY: "마른 주로",
  WET: "습윤 주로",
  HEAVY: "무거운 주로",
};

const WEATHER_LABEL: Record<string, string> = {
  SUNNY: "맑음",
  CLOUDY: "흐림",
  RAIN: "비",
};

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
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [dims, setDims] = useState(viewportDimensions);
  const lateralRef = useRef(new Map<number, number>());
  const positionRef = useRef(new Map<number, import("../lib/ovalTrack").HorsePoint>());
  const metersRef = useRef(new Map<number, number>());
  const raceProgress = useRacePlayback(started, finished);
  const horseSize = raceHorseIconSize(dims.height);

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
          name: ent?.name ?? `${h.number}번`,
          silkHue: ent?.silkHue,
          isPlayer: h.number === pickedNumber,
        };
      });
  }, [horseStates, started, finished, entrantMap, pickedNumber]);

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

  const commentary = useRaceCommentary({
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
    ? "출발 대기"
    : showOvertake
      ? "역전!"
      : finished
        ? "완주"
        : "LIVE";

  const headline = !started
    ? "출발 준비"
    : finished
      ? result.dnf
        ? result.dnfReason === "interference"
          ? pickedEntrant
            ? `예상 ${pickedEntrant.number}번 · 간섭 사고 기권`
            : "간섭 사고 기권"
          : pickedEntrant
            ? `예상 ${pickedEntrant.number}번 낙마`
            : "낙마 처리"
        : pickedEntrant
          ? result.mode === "party"
            ? `내 ${pickedEntrant.number}번 · ${result.myPlace}착 · +${result.raceScore ?? 0}점`
            : `예상 ${pickedEntrant.name} · ${result.myPlace}위`
          : `${result.myPlace}위 완주`
      : "경주 진행 중";

  const subline = !started
    ? "8두가 결승선 앞에 대기 중입니다"
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
                ? `친구 내기 · ${result.partyRaceNumber}경기`
                : "친구 내기"
              : result.mode === "practice"
                ? "연습주행"
                : "랭킹 경주"}
          </div>
          <div className="race-page__meta">
            {result.condition.distance}m ·{" "}
            {TRACK_LABEL[result.condition.track] ?? result.condition.track} ·{" "}
            {WEATHER_LABEL[result.condition.weather] ?? result.condition.weather}
          </div>
        </div>
        {pickedEntrant && (
          <div className="race-page__pick">
            <span className="race-page__pick-label">내 말</span>
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
                <span className="race-hud__stat">역전 {result.overtakes}회</span>
              )}
            </div>
            <RaceLiveScoreboard leaders={liveTop3} visible={started && !finished} />
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
            <RaceCommentaryBar line={commentary} visible overlay />
          ) : null
        }
      >
        {horseStates.map(({ number, pos }) => {
          const entrant = entrantMap.get(number);
          return (
            <div
              key={number}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -88%)",
                zIndex: number === pickedNumber ? 3 : 2,
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
              {result.partyRaceNumber ? `${result.partyRaceNumber}경기 · ` : ""}
              친구 점수
            </div>
            {[...partyResults]
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((m) => (
              <div key={m.userKey} className="race-panel__party-row">
                <span>{m.displayName}</span>
                <span>
                  {m.pick != null ? `${m.pick}번 · ${m.place}착 +${m.racePoints}` : "—"}
                  {" · "}누적 {m.totalScore}점
                </span>
              </div>
            ))}
            <p className="race-panel__muted" style={{ marginTop: 8 }}>
              1착 10 · 2착 8 · 3착 5 · 4착 3 · 5착 2 · 6착 1 · 7·8착 0
            </p>
          </div>
        )}

        {finished && result.mode !== "party" && (
          <div className="race-panel__results">
            <div className="race-panel__reward">+{result.goldEarned} 골드</div>
            {result.prediction && (
              <div
                className={
                  result.prediction.hit === "win"
                    ? "race-panel__tag race-panel__tag--accent"
                    : "race-panel__tag"
                }
              >
                예상{" "}
                {result.prediction.hit === "win"
                  ? "1착 적중!"
                  : result.prediction.hit === "place"
                    ? "2착 (1착 미적중)"
                    : "미적중"}
              </div>
            )}
            {result.photoFinish && (
              <div className="race-panel__tag race-panel__tag--accent">
                포토 피니시
              </div>
            )}
            {result.fairnessTag && (
              <div className="race-panel__muted">{result.fairnessTag}</div>
            )}
            {result.loopBonus && (
              <div className="race-panel__loop">
                {result.loopBonus.streakBonus && (
                  <div className="race-panel__tag race-panel__tag--accent">
                    연속 {result.loopBonus.sessionRaceStreak}경주! 찌라시 무료 +1
                  </div>
                )}
                {result.loopBonus.dailyChallengeComplete && (
                  <div className="race-panel__tag race-panel__tag--accent">
                    오늘 {result.loopBonus.dailyRaceGoal}경주 달성! +
                    {result.loopBonus.dailyChallengeGold}G
                  </div>
                )}
                <div className="race-panel__muted">
                  연속 출전 {result.loopBonus.sessionRaceStreak} · 오늘{" "}
                  {result.loopBonus.rankedRacesToday}/{result.loopBonus.dailyRaceGoal}경주
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
          경주 시작
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
                ? "다음 경주 준비 중..."
                : `광고 보고 티켓 +1 · 바로 다음 경주 (오늘 ${ticketAd.remaining.daily}회)`}
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
                  ? "다음 경주 준비 중..."
                  : "바로 다음 경주"
                : "티켓 없음 · 광고 시청 필요"}
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
              광고 보고 찌라시 P+4 · 다음 경주 (오늘 {continueAd.remaining.daily}회)
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
            홈으로 (연속 출전 종료)
          </Button>
        </div>
      )}

      {finished && result.mode === "party" && (
        <Button display="block" size="xlarge" onClick={() => onDone()}>
          방으로 돌아가기
        </Button>
      )}
    </div>
  );
}
