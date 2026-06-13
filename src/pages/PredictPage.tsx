import { colors } from "@toss/tds-colors";
import { Button, Top, useToast } from "@toss/tds-mobile";
import { useMemo, useState } from "react";
import { EntrantPickCard } from "../components/EntrantPickCard";
import { TipGradeLegend } from "../components/TipGradeBadge";
import type { RankedPrepare, TipCard } from "../types/game";

const TRACK_LABEL: Record<string, string> = {
  DRY: "마른 주로",
  WET: "습윤 주로",
  HEAVY: "무거운 주로",
};

interface PredictPageProps {
  prepare: RankedPrepare;
  freeTipReveals: number;
  onWatchAdForPoints: () => Promise<number>;
  onPredict: (horseNumber: number) => Promise<void>;
  onRevealTip: (horseNumber: number) => Promise<{
    revealedTipCards: TipCard[];
    predictionPoints: number;
    freeTipReveals: number;
  }>;
  onStart: () => Promise<void>;
  onBack: () => void | Promise<void>;
}

export function PredictPage({
  prepare,
  freeTipReveals: initialFreeTips,
  onWatchAdForPoints,
  onPredict,
  onRevealTip,
  onStart,
  onBack,
}: PredictPageProps) {
  const toast = useToast();
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealing, setRevealing] = useState<number | null>(null);
  const [tipCards, setTipCards] = useState<TipCard[]>(prepare.revealedTipCards);
  const [points, setPoints] = useState(prepare.predictionPoints);
  const [freeTips, setFreeTips] = useState(initialFreeTips);
  const [adBusy, setAdBusy] = useState(false);
  const lowPoints = points < 4 && freeTips === 0;

  const sortedEntrants = useMemo(
    () => [...prepare.entrants].sort((a, b) => a.number - b.number),
    [prepare.entrants],
  );

  const tipByNumber = useMemo(
    () => new Map(tipCards.map((t) => [t.horseNumber, t])),
    [tipCards],
  );

  const totalOpenCost = useMemo(
    () =>
      sortedEntrants.reduce((sum, e) => sum + (prepare.tipCosts[e.number] ?? 2), 0),
    [sortedEntrants, prepare.tipCosts],
  );

  async function confirmAndStart() {
    if (!pick) return;
    setBusy(true);
    try {
      await onPredict(pick);
      await onStart();
    } catch (error) {
      toast.openToast(
        error instanceof Error ? error.message : "경주를 시작할 수 없어요.",
        { type: "bottom" },
      );
    } finally {
      setBusy(false);
    }
  }

  async function openTip(horseNumber: number) {
    if (tipByNumber.has(horseNumber) || revealing !== null) return;
    setRevealing(horseNumber);
    try {
      const data = await onRevealTip(horseNumber);
      setTipCards(data.revealedTipCards);
      setPoints(data.predictionPoints);
      setFreeTips(data.freeTipReveals);
      if (!data.revealedTipCards.find((t) => t.horseNumber === horseNumber)) {
        toast.openToast("찌라시를 열지 못했어요.", { type: "bottom" });
      }
    } catch (error) {
      toast.openToast(
        error instanceof Error ? error.message : "찌라시를 열 수 없어요.",
        { type: "bottom" },
      );
    } finally {
      setRevealing(null);
    }
  }

  const openedCount = tipCards.length;

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>찌라시 · 예상</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            {prepare.condition.distance}m ·{" "}
            {TRACK_LABEL[prepare.condition.track] ?? prepare.condition.track}
          </Top.SubtitleParagraph>
        }
        right={
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: colors.blue500,
              padding: "4px 8px",
              background: "#E8F3FF",
              borderRadius: 8,
            }}
          >
            {points}P
            {freeTips > 0 && ` · 무료 ${freeTips}`}
          </span>
        }
      />

      <div style={{ padding: "4px 16px 0" }}>
        <p style={{ fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>
          출전마 · 찌라시
        </p>
        <p style={{ fontSize: 12, color: colors.grey600, margin: "0 0 6px" }}>
          말마다 1~3P 랜덤 · 전체 오픈 {totalOpenCost}P · 열림 {openedCount}/
          {sortedEntrants.length}
        </p>
        <TipGradeLegend />
        {sortedEntrants.map((e) => (
          <EntrantPickCard
            key={e.number}
            entrant={e}
            selected={pick === e.number}
            raceTrack={prepare.condition.track}
            raceDistance={prepare.condition.distance}
            revealedTip={tipByNumber.get(e.number) ?? null}
            openCost={prepare.tipCosts[e.number] ?? 2}
            predictionPoints={points}
            freeTipReveals={freeTips}
            revealing={revealing === e.number}
            onSelect={() => setPick(e.number)}
            onRevealTip={() => openTip(e.number)}
          />
        ))}
      </div>

      {lowPoints && (
        <div style={{ padding: "0 16px 8px" }}>
          <Button
            display="block"
            size="large"
            disabled={adBusy}
            onClick={async () => {
              setAdBusy(true);
              try {
                const nextPts = await onWatchAdForPoints();
                setPoints(nextPts);
                toast.openToast("찌라시 P +4", { type: "success" });
              } catch (error) {
                toast.openToast(
                  error instanceof Error ? error.message : "광고 보상 실패",
                  { type: "bottom" },
                );
              } finally {
                setAdBusy(false);
              }
            }}
          >
            {adBusy ? "광고 확인 중..." : "광고 보고 찌라시 P +4 · 정보 더 열기"}
          </Button>
        </div>
      )}

      <div style={{ padding: "12px 20px", display: "grid", gap: 10 }}>
        <Button
          display="block"
          size="xlarge"
          disabled={!pick || busy}
          onClick={confirmAndStart}
        >
          {pick ? `${pick}번 예상 · 경주 시작` : "예상 1착 선택"}
        </Button>
        <Button display="block" size="medium" color="dark" variant="weak" onClick={onBack}>
          취소
        </Button>
      </div>
    </>
  );
}
