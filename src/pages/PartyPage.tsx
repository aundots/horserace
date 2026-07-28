import { colors } from "@toss/tds-colors";
import { Button, List, ListRow, TextField, Top, useToast } from "@toss/tds-mobile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EntrantPickCard } from "../components/EntrantPickCard";
import { useLang } from "../i18n/LangContext";
import { trackLabel } from "../i18n/labels";
import { translateServerMessage } from "../i18n/serverMessages";
import { formatScoreRules } from "../lib/partyScoring";
import type { PartySnapshot } from "../types/game";

interface PartyPageProps {
  party: PartySnapshot | null;
  initialJoinCode?: string;
  onRefresh: () => Promise<PartySnapshot | null>;
  onCreate: (displayName?: string) => Promise<PartySnapshot>;
  onJoin: (code: string, displayName?: string) => Promise<PartySnapshot>;
  onLeave: () => Promise<void>;
  onPrepare: () => Promise<PartySnapshot>;
  onPredict: (horseNumber: number) => Promise<PartySnapshot>;
  onRevealTip: (horseNumber: number) => Promise<PartySnapshot>;
  onRun: () => Promise<PartySnapshot>;
  onRaceReady: (party: PartySnapshot) => void;
  onBack: () => void;
}

function Scoreboard({ party, t }: { party: PartySnapshot; t: ReturnType<typeof useLang>["t"] }) {
  const ranked = useMemo(
    () => [...party.members].sort((a, b) => b.totalScore - a.totalScore),
    [party.members],
  );
  const minScore = ranked.length > 0 ? ranked[ranked.length - 1]!.totalScore : 0;
  const show = party.raceNumber > 0 || ranked.some((m) => m.totalScore > 0);
  if (!show) return null;

  return (
    <div className="party-scoreboard">
      <div className="party-scoreboard__title">
        {t.scoreTitle(party.raceNumber)}
      </div>
      <p className="party-scoreboard__hint">{t.scoreTable} · {t.scoreHint}</p>
      {ranked.map((m, i) => (
        <div key={m.userKey} className="party-scoreboard__row">
          <span>
            {t.rankLine(i + 1, m.displayName, m.isYou)}
          </span>
          <span
            style={{
              fontWeight: 800,
              color:
                m.totalScore === minScore && ranked.length > 1
                  ? colors.red500
                  : colors.grey900,
            }}
          >
            {t.scoreWithLast(m.totalScore, m.totalScore === minScore && ranked.length > 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PartyPage({
  party: initialParty,
  initialJoinCode,
  onRefresh,
  onCreate,
  onJoin,
  onLeave,
  onPrepare,
  onPredict,
  onRevealTip,
  onRun,
  onRaceReady,
  onBack,
}: PartyPageProps) {
  const toast = useToast();
  const { lang, t } = useLang();
  const [party, setParty] = useState<PartySnapshot | null>(initialParty);
  const [joinCode, setJoinCode] = useState(initialJoinCode ?? "");
  const [nick, setNick] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealing, setRevealing] = useState<number | null>(null);
  const raceNavKey = useRef<string | null>(null);
  const lastPickRound = useRef(0);
  const prevStatusRef = useRef<PartySnapshot["status"] | null>(null);

  const refresh = useCallback(async () => {
    const next = await onRefresh();
    if (next) setParty(next);
    return next;
  }, [onRefresh]);

  useEffect(() => {
    if (!party?.clientResult || party.status !== "done") {
      if (party) prevStatusRef.current = party.status;
      return;
    }

    const prev = prevStatusRef.current;
    prevStatusRef.current = party.status;

    // picking/racing → done 전환 시에만 자동 재생 (방으로 돌아가기 후 재진입 제외)
    if (prev !== "picking" && prev !== "racing") return;

    const key = `${party.code}:${party.clientResult.raceNumber}:${party.clientResult.finishOrder.join("-")}`;
    if (raceNavKey.current === key) return;
    raceNavKey.current = key;
    onRaceReady(party);
  }, [party, onRaceReady]);

  useEffect(() => {
    if (!party) return;
    // done 상태에서도 폴링 유지 — 방장이 다음 경기를 준비(picking)하면 비방장도 감지해야 함.
    // picking 중엔 방장이 "경주 시작"을 언제 누를지 몰라서 더 촘촘히 본다 — 발견이
    // 빠를수록 useRacePlayback 의 따라잡기 폭도 작아져서 체감 동기화가 좋아진다.
    const interval = party.status === "picking" ? 900 : 2000;
    const timer = setInterval(() => {
      refresh().catch(() => undefined);
    }, interval);
    return () => clearInterval(timer);
  }, [party?.code, party?.status, refresh]);

  useEffect(() => {
    setParty(initialParty);
  }, [initialParty]);

  useEffect(() => {
    if (!party || party.status !== "picking") return;
    if (party.raceNumber === lastPickRound.current) return;
    lastPickRound.current = party.raceNumber;
    setPick(null);
    setRevealing(null);
  }, [party?.raceNumber, party?.status]);

  async function act(fn: () => Promise<PartySnapshot>, okMsg?: string) {
    setBusy(true);
    try {
      const next = await fn();
      setParty(next);
      if (okMsg) toast.openToast(okMsg, { type: "success" });
    } catch (error) {
      toast.openToast(
        translateServerMessage(error instanceof Error ? error.message : "실패", lang),
        { type: "bottom" },
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialJoinCode) setJoinCode(initialJoinCode.toUpperCase());
  }, [initialJoinCode]);

  async function copyCode() {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, "");
    const inviteUrl = `${base}/?party=${party!.code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.openToast(t.inviteCopied, { type: "success" });
    } catch {
      try {
        await navigator.clipboard.writeText(party!.code);
        toast.openToast(t.codeIs(party!.code), { type: "bottom" });
      } catch {
        toast.openToast(t.codeIs(party!.code), { type: "bottom" });
      }
    }
  }

  if (!party) {
    const trimmedNick = nick.trim();
    const canJoin = trimmedNick.length > 0 && joinCode.length >= 4;
    return (
      <>
        <Top
          title={<Top.TitleParagraph size={22}>{t.partyTitle}</Top.TitleParagraph>}
          subtitleBottom={
            <Top.SubtitleParagraph size={15}>
              {t.partyIntro}
            </Top.SubtitleParagraph>
          }
        />
        <div style={{ padding: "0 20px", display: "grid", gap: 12 }}>
          <TextField
            variant="box"
            label={t.nickname}
            placeholder={t.nicknamePlaceholder}
            value={nick}
            onChange={(e) => setNick(e.target.value)}
          />
          <Button
            display="block"
            size="xlarge"
            disabled={busy}
            onClick={() => act(() => onCreate(nick || undefined), t.roomCreated)}
          >
            {t.createRoom}
          </Button>
          <TextField
            variant="box"
            label={t.roomCode}
            placeholder={t.roomCodePlaceholder}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <Button
            display="block"
            size="large"
            color="dark"
            variant="weak"
            disabled={busy || !canJoin}
            onClick={() => act(() => onJoin(joinCode, trimmedNick), t.joined)}
          >
            {t.joinByCode}
          </Button>
          {joinCode.length >= 4 && trimmedNick.length === 0 && (
            <p style={{ fontSize: 13, color: colors.grey600, margin: 0, textAlign: "center" }}>
              {t.nicknameRequired}
            </p>
          )}
          <Button display="block" size="medium" color="dark" variant="weak" onClick={onBack}>
            {t.back}
          </Button>
        </div>
      </>
    );
  }

  const myMember = party.members.find((m) => m.isYou);
  const confirmedPick = myMember?.prediction ?? null;
  const selectingPick = confirmedPick ?? pick;
  const allPicked = party.members.every((m) =>
    m.isYou ? m.prediction != null : Boolean(m.pickConfirmed),
  );
  const sortedEntrants = [...(party.entrants ?? [])].sort((a, b) => a.number - b.number);
  const tipMap = new Map(party.revealedTipCards.map((t) => [t.horseNumber, t]));

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>{t.partyRoom(party.code)}</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            {party.status === "waiting" && t.partySubtitleWaiting}
            {party.status === "picking" &&
              t.partySubtitlePicking(party.raceNumber, party.tipsRemaining)}
            {party.status === "racing" && t.partySubtitleRacing}
            {party.status === "done" && t.partySubtitleDone(party.raceNumber)}
          </Top.SubtitleParagraph>
        }
      />

      <Scoreboard party={party} t={t} />

      <List>
        {party.members.map((m) => (
          <ListRow
            key={m.userKey}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={`${m.displayName}${m.isYou ? ` (${t.you})` : ""}${party.hostUserKey === m.userKey ? ` · ${t.host}` : ""}`}
                topProps={{ fontWeight: "bold", color: colors.grey900 }}
                bottom={
                  party.status === "picking"
                    ? m.isYou
                      ? m.prediction != null
                        ? t.myPick(m.prediction)
                        : t.pickWaiting
                      : m.pickConfirmed
                        ? t.pickDone
                        : t.picking
                    : party.status === "done" && party.clientResult
                      ? (() => {
                          const r = party.clientResult!.memberResults.find(
                            (x) => x.userKey === m.userKey,
                          );
                          return r?.pick != null
                            ? t.memberPickInfo(r.pick, r.place, r.racePoints, r.totalScore)
                            : t.points(m.totalScore);
                        })()
                      : t.points(m.totalScore)
                }
                bottomProps={{
                  color:
                    m.isYou && m.prediction != null ? colors.blue500 : colors.grey600,
                }}
              />
            }
          />
        ))}
      </List>

      {party.status === "waiting" && (
        <div style={{ padding: "12px 20px", display: "grid", gap: 10 }}>
          <p style={{ fontSize: 13, color: colors.grey600, margin: 0, lineHeight: 1.5 }}>
            {t.partyIntroLong}
          </p>
          <Button display="block" size="large" color="dark" variant="weak" onClick={copyCode}>
            {t.copyInvite}
          </Button>
          {party.isHost && (
            <Button
              display="block"
              size="xlarge"
              disabled={busy || party.members.length < 1}
              onClick={() => act(onPrepare, t.prepareDone)}
            >
              {party.raceNumber > 0 ? t.hostPrepareNext : t.hostPrepare}
            </Button>
          )}
          {!party.isHost && (
            <p style={{ textAlign: "center", color: colors.grey500, fontSize: 13 }}>
              {t.waitForHost}
            </p>
          )}
        </div>
      )}

      {party.status === "picking" && party.entrants && (
        <>
          <div style={{ padding: "4px 16px 0" }}>
            <p style={{ fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>
              {t.partyRaceInfo(
                party.raceNumber,
                party.condition?.distance ?? 0,
                trackLabel(t, party.condition?.track ?? ""),
              )}
            </p>
            <p style={{ fontSize: 12, color: colors.grey600, margin: "0 0 10px" }}>
              {t.everyRacePick(party.tipsRemaining)}
            </p>
            {sortedEntrants.map((e) => (
              <EntrantPickCard
                key={e.number}
                entrant={e}
                selected={selectingPick === e.number}
                raceTrack={party.condition!.track}
                raceDistance={party.condition!.distance}
                revealedTip={tipMap.get(e.number) ?? null}
                openCost={0}
                predictionPoints={0}
                revealing={revealing === e.number}
                anonymous
                takenByOther={party.takenNumbers.includes(e.number)}
                partyTips
                tipsRemaining={party.tipsRemaining}
                onSelect={() => setPick(e.number)}
                onRevealTip={async () => {
                  setRevealing(e.number);
                  try {
                    const next = await onRevealTip(e.number);
                    setParty(next);
                  } catch (error) {
                    toast.openToast(
                      translateServerMessage(
                        error instanceof Error ? error.message : "찌라시 열기 실패",
                        lang,
                      ),
                      { type: "bottom" },
                    );
                  } finally {
                    setRevealing(null);
                  }
                }}
              />
            ))}
          </div>
          <div style={{ padding: "12px 20px", display: "grid", gap: 10 }}>
            <Button
              display="block"
              size="xlarge"
              disabled={busy || selectingPick == null}
              onClick={() =>
                selectingPick != null &&
                act(() => onPredict(selectingPick), t.pickedRaceStart(selectingPick))
              }
            >
              {confirmedPick != null
                ? t.pickConfirmed(confirmedPick)
                : selectingPick != null
                  ? t.confirmPick(selectingPick)
                  : t.selectHorse}
            </Button>
            {party.isHost && (
              <Button
                display="block"
                size="large"
                disabled={busy || !allPicked}
                onClick={() => act(onRun, t.raceStarted)}
              >
                {allPicked ? t.allPicked : t.notAllPicked}
              </Button>
            )}
          </div>
        </>
      )}

      {party.status === "done" && party.clientResult && (
        <div style={{ padding: "12px 20px", display: "grid", gap: 10 }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>
            {t.raceResult(party.clientResult.raceNumber)}
          </p>
          {party.clientResult.memberResults.map((m) => (
            <div key={m.userKey} className="party-scoreboard__row">
              <span>{m.displayName}</span>
              <span style={{ fontWeight: 700, textAlign: "right" }}>
                {m.pick != null ? t.memberResultRow(m.pick, m.place) : "—"}
                <br />
                <span style={{ fontSize: 12, color: colors.blue500 }}>
                  {t.memberPointsRow(m.racePoints, m.totalScore)}
                </span>
              </span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: colors.grey600, margin: 0 }}>
            {formatScoreRules()}
          </p>
          <Button display="block" size="xlarge" onClick={() => onRaceReady(party)}>
            {t.replayRace}
          </Button>
          {party.isHost && (
            <Button
              display="block"
              size="large"
              disabled={busy}
              onClick={() => {
                setPick(null);
                act(onPrepare, t.nextRacePrep(party.raceNumber + 1));
              }}
            >
              {t.nextGame(party.raceNumber + 1)}
            </Button>
          )}
          {!party.isHost && (
            <p style={{ textAlign: "center", color: colors.grey500, fontSize: 13, margin: 0 }}>
              {t.waitForHostNext}
            </p>
          )}
        </div>
      )}

      <div style={{ padding: "0 20px 24px", display: "grid", gap: 8 }}>
        <Button
          display="block"
          size="medium"
          color="dark"
          variant="weak"
          disabled={busy}
          onClick={async () => {
            await onLeave();
            setParty(null);
            onBack();
          }}
        >
          {t.leaveRoom}
        </Button>
      </div>
    </>
  );
}
