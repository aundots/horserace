import { colors } from "@toss/tds-colors";
import { Button, List, ListRow, TextField, Top, useToast } from "@toss/tds-mobile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EntrantPickCard } from "../components/EntrantPickCard";
import { formatScoreRules } from "../lib/partyScoring";
import type { PartySnapshot } from "../types/game";

const TRACK_LABEL: Record<string, string> = {
  DRY: "마른 주로",
  WET: "습윤 주로",
  HEAVY: "무거운 주로",
};

interface PartyPageProps {
  party: PartySnapshot | null;
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

function Scoreboard({ party }: { party: PartySnapshot }) {
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
        누적 점수 · {party.raceNumber > 0 ? `${party.raceNumber}경기` : "대기"}
      </div>
      <p className="party-scoreboard__hint">{formatScoreRules()} · 누적 낮을수록 내기 불리</p>
      {ranked.map((m, i) => (
        <div key={m.userKey} className="party-scoreboard__row">
          <span>
            {i + 1}위 {m.displayName}
            {m.isYou ? " (나)" : ""}
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
            {m.totalScore}점
            {m.totalScore === minScore && ranked.length > 1 ? " · 꼴찌" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PartyPage({
  party: initialParty,
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
  const [party, setParty] = useState<PartySnapshot | null>(initialParty);
  const [joinCode, setJoinCode] = useState("");
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
    if (party.status === "done") return;
    const timer = setInterval(() => {
      refresh().catch(() => undefined);
    }, 2000);
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
      toast.openToast(error instanceof Error ? error.message : "실패", { type: "bottom" });
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(party!.code);
      toast.openToast("방 코드를 복사했어요", { type: "success" });
    } catch {
      toast.openToast(`코드: ${party!.code}`, { type: "bottom" });
    }
  }

  if (!party) {
    return (
      <>
        <Top
          title={<Top.TitleParagraph size={22}>친구와 맞추기</Top.TitleParagraph>}
          subtitleBottom={
            <Top.SubtitleParagraph size={15}>
              내기용 · 스탯 숨김 · 찌라시 3장 · 누적 점수
            </Top.SubtitleParagraph>
          }
        />
        <div style={{ padding: "0 20px", display: "grid", gap: 12 }}>
          <TextField
            variant="box"
            label="닉네임 (선택)"
            placeholder="술자리에서 보일 이름"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
          />
          <Button
            display="block"
            size="xlarge"
            disabled={busy}
            onClick={() => act(() => onCreate(nick || undefined), "방이 만들어졌어요")}
          >
            방 만들기
          </Button>
          <TextField
            variant="box"
            label="방 코드"
            placeholder="6자리 코드"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <Button
            display="block"
            size="large"
            color="dark"
            variant="weak"
            disabled={busy || joinCode.length < 4}
            onClick={() => act(() => onJoin(joinCode, nick || undefined), "입장했어요")}
          >
            코드로 입장
          </Button>
          <Button display="block" size="medium" color="dark" variant="weak" onClick={onBack}>
            돌아가기
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
        title={<Top.TitleParagraph size={22}>방 {party.code}</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            {party.status === "waiting" && "친구 초대 · 같은 말 중복 불가"}
            {party.status === "picking" &&
              `${party.raceNumber}경기 · 말 선택 · 찌라시 ${party.tipsRemaining}장 남음`}
            {party.status === "racing" && "경주 진행 중..."}
            {party.status === "done" && `${party.raceNumber}경기 결과`}
          </Top.SubtitleParagraph>
        }
      />

      <Scoreboard party={party} />

      <List>
        {party.members.map((m) => (
          <ListRow
            key={m.userKey}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={`${m.displayName}${m.isYou ? " (나)" : ""}${party.hostUserKey === m.userKey ? " · 방장" : ""}`}
                topProps={{ fontWeight: "bold", color: colors.grey900 }}
                bottom={
                  party.status === "picking"
                    ? m.isYou
                      ? m.prediction != null
                        ? `내 말 ${m.prediction}번`
                        : "말 선택 대기"
                      : m.pickConfirmed
                        ? "선택 완료 ✓"
                        : "선택 중..."
                    : party.status === "done" && party.clientResult
                      ? (() => {
                          const r = party.clientResult!.memberResults.find(
                            (x) => x.userKey === m.userKey,
                          );
                          return r?.pick != null
                            ? `${r.pick}번 · ${r.place}착 +${r.racePoints}점 (누적 ${r.totalScore})`
                            : `${m.totalScore}점`;
                        })()
                      : `${m.totalScore}점`
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
            스탯·기수는 숨기고 <strong>말 이름</strong>은 공개! 경기마다 찌라시{" "}
            <strong>3장</strong> · 같은 말 중복 불가 · {formatScoreRules()}
          </p>
          <Button display="block" size="large" color="dark" variant="weak" onClick={copyCode}>
            방 코드 복사 · 친구에게 공유
          </Button>
          {party.isHost && (
            <Button
              display="block"
              size="xlarge"
              disabled={busy || party.members.length < 1}
              onClick={() => act(onPrepare, "1경기 준비 완료")}
            >
              {party.raceNumber > 0 ? "다음 경기 준비" : "1경기 시작 · 말 선택"}
            </Button>
          )}
          {!party.isHost && (
            <p style={{ textAlign: "center", color: colors.grey500, fontSize: 13 }}>
              방장이 경주를 준비할 때까지 기다려 주세요
            </p>
          )}
        </div>
      )}

      {party.status === "picking" && party.entrants && (
        <>
          <div style={{ padding: "4px 16px 0" }}>
            <p style={{ fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>
              {party.raceNumber}경기 · {party.condition?.distance}m ·{" "}
              {TRACK_LABEL[party.condition?.track ?? ""] ?? party.condition?.track}
            </p>
            <p style={{ fontSize: 12, color: colors.grey600, margin: "0 0 10px" }}>
              매 경기 <strong>말 새로 선택</strong> · 이름 공개 · 찌라시 {party.tipsRemaining}장
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
                      error instanceof Error ? error.message : "찌라시 열기 실패",
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
                act(() => onPredict(selectingPick), `${selectingPick}번 선택 완료`)
              }
            >
              {confirmedPick != null
                ? `내 말 ${confirmedPick}번 확정 · 바꾸려면 다시 선택`
                : selectingPick != null
                  ? `${selectingPick}번 선택 확정`
                  : "이번 경기 말을 선택하세요"}
            </Button>
            {party.isHost && (
              <Button
                display="block"
                size="large"
                disabled={busy || !allPicked}
                onClick={() => act(onRun, "경주 시작!")}
              >
                {allPicked ? "모두 선택 완료 · 경주 시작" : "아직 선택 안 한 친구가 있어요"}
              </Button>
            )}
          </div>
        </>
      )}

      {party.status === "done" && party.clientResult && (
        <div style={{ padding: "12px 20px", display: "grid", gap: 10 }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>
            {party.clientResult.raceNumber}경기 결과
          </p>
          {party.clientResult.memberResults.map((m) => (
            <div key={m.userKey} className="party-scoreboard__row">
              <span>{m.displayName}</span>
              <span style={{ fontWeight: 700, textAlign: "right" }}>
                {m.pick != null ? `${m.pick}번 · ${m.place}착` : "—"}
                <br />
                <span style={{ fontSize: 12, color: colors.blue500 }}>
                  +{m.racePoints}점 · 누적 {m.totalScore}점
                </span>
              </span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: colors.grey600, margin: 0 }}>
            {formatScoreRules()}
          </p>
          <Button display="block" size="xlarge" onClick={() => onRaceReady(party)}>
            경주 다시 보기
          </Button>
          {party.isHost && (
            <Button
              display="block"
              size="large"
              disabled={busy}
              onClick={() => {
                setPick(null);
                act(onPrepare, `${party.raceNumber + 1}경기 준비`);
              }}
            >
              다음 경기 · {party.raceNumber + 1}경기
            </Button>
          )}
          {!party.isHost && (
            <p style={{ textAlign: "center", color: colors.grey500, fontSize: 13, margin: 0 }}>
              방장이 다음 경기를 준비할 때까지 기다려 주세요
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
          방 나가기
        </Button>
      </div>
    </>
  );
}
