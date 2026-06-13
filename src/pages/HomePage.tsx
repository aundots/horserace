import { colors } from "@toss/tds-colors";
import {
  Badge,
  Button,
  List,
  ListRow,
  TextButton,
  Top,
  useToast,
} from "@toss/tds-mobile";
import { useEffect, useState } from "react";
import { showDevAdsLink, showDevLogin } from "../lib/devAccess";
import type { useAuth } from "../hooks/useAuth";
import type { usePlayer } from "../hooks/usePlayer";
import type { AdPlacement, RankedPrepare } from "../types/game";

type Auth = ReturnType<typeof useAuth>;
type Player = ReturnType<typeof usePlayer>;

interface HomePageProps {
  auth: Auth;
  player: Player;
  showRewardedAd: (placement: string) => Promise<{ message: string }>;
  onOpenAds: () => void;
  onOpenParty: () => void;
  onOpenMissions: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onStartPredict: (prepare: RankedPrepare) => void;
}

export function HomePage({
  auth,
  player,
  showRewardedAd,
  onOpenAds,
  onOpenParty,
  onOpenMissions,
  onOpenHelp,
  onOpenSettings,
  onStartPredict,
}: HomePageProps) {
  const toast = useToast();
  const { isLoggedIn, loading, login, devLogin, demoLogin, isPlayStore, logout } =
    auth;
  const {
    snapshot,
    loading: playerLoading,
    prepareRanked,
    getAdEligibility,
  } = player;

  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getAdEligibility().then(setAdPlacements).catch(() => setAdPlacements([]));
  }, [isLoggedIn, getAdEligibility, snapshot?.predictionPoints]);

  async function handleRace() {
    try {
      const prepare = await prepareRanked();
      onStartPredict({
        raceId: prepare.raceId,
        condition: prepare.condition,
        entrants: prepare.entrants,
        tipCosts: prepare.tipCosts,
        revealedTips: prepare.revealedTips,
        revealedTipCards: prepare.revealedTipCards,
        predictionPoints: prepare.predictionPoints,
      });
    } catch (error) {
      toast.openToast(
        error instanceof Error ? error.message : "경주를 준비할 수 없어요.",
        { type: "bottom" },
      );
    }
  }

  async function watchAd(placement: string, label: string) {
    try {
      const res = await showRewardedAd(placement);
      toast.openToast(res.message || label, { type: "success" });
      const next = await getAdEligibility();
      setAdPlacements(next);
    } catch (error) {
      toast.openToast(
        error instanceof Error ? error.message : "광고 보상을 받을 수 없어요.",
        { type: "bottom" },
      );
    }
  }

  function placementOf(id: string) {
    return adPlacements.find((p) => p.id === id);
  }

  if (loading || (isLoggedIn && !snapshot)) {
    return (
      <Top
        title={<Top.TitleParagraph size={22}>말레이스</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>불러오는 중...</Top.SubtitleParagraph>
        }
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Top
          title={<Top.TitleParagraph size={22}>말레이스</Top.TitleParagraph>}
          subtitleBottom={
            <Top.SubtitleParagraph size={15}>
              매일 경주 · 찌라시 · 예상
            </Top.SubtitleParagraph>
          }
        />
        <div style={{ padding: "0 20px", display: "grid", gap: 10 }}>
          {isPlayStore ? (
            <Button display="block" size="xlarge" onClick={demoLogin}>
              게임 체험하기
            </Button>
          ) : (
            <Button display="block" size="xlarge" onClick={login}>
              토스로 시작하기
            </Button>
          )}
          {showDevLogin() && (
            <Button
              display="block"
              size="large"
              color="dark"
              variant="weak"
              onClick={devLogin}
            >
              개발용 로그인
            </Button>
          )}
        </div>
      </>
    );
  }

  const s = snapshot!;
  const ptsAd = placementOf("AD_PREDICTION_POINTS");
  const ticketAd = placementOf("AD_RANK_TICKET");
  const canRace = s.rankedAvailable;
  const lowPoints = s.predictionPoints < 4;

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>말레이스</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>찌라시 열고 1착을 맞혀보세요</Top.SubtitleParagraph>
        }
        right={
          <Badge size="small" color="blue" variant="weak">
            {s.predictionPoints}P
          </Badge>
        }
      />

      <div style={{ padding: "0 16px 12px" }}>
        <div
          style={{
            background: "linear-gradient(145deg, #1a3a5c 0%, #0d2137 55%, #162447 100%)",
            borderRadius: 20,
            padding: "18px 16px 16px",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(13,33,55,0.35)",
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>오늘의 경주</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              하루 1회 무료 · 이후 경주는 광고로 티켓 획득
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <StatPill label="찌라시 P" value={`${s.predictionPoints}`} />
            <StatPill
              label="경주 티켓"
              value={`${s.rankedTicketsLeft}/${s.rankedTicketsMax}`}
            />
            <StatPill
              label="연속 출전"
              value={`${s.sessionRaceStreak ?? 0}판`}
            />
          </div>

          <div className="race-daily-progress">
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              오늘의 챌린지 · {s.rankedRacesToday ?? 0}/{s.dailyRaceGoal ?? 5}경주
              {s.dailyChallengeClaimed ? " ✓ 완료" : ` · +${s.dailyChallengeGold ?? 80}G`}
            </div>
            <div className="race-daily-progress__bar">
              <div
                className="race-daily-progress__fill"
                style={{
                  width: `${Math.min(100, ((s.rankedRacesToday ?? 0) / (s.dailyRaceGoal ?? 5)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {!canRace ? (
            <Button
              display="block"
              size="xlarge"
              disabled={!ticketAd?.eligible}
              onClick={() => watchAd("AD_RANK_TICKET", "경주 티켓 획득")}
              style={{ marginBottom: 8 }}
            >
              {ticketAd?.eligible
                ? `광고 보고 경주 티켓 +1 (오늘 ${ticketAd.remaining.daily}회)`
                : ticketAd?.reason ?? "티켓 광고 대기 중"}
            </Button>
          ) : (
            <Button
              display="block"
              size="xlarge"
              onClick={handleRace}
              style={{ marginBottom: 8 }}
            >
              경주 시작
            </Button>
          )}

          {!canRace && s.rankedMessage && (
            <p style={{ fontSize: 12, textAlign: "center", opacity: 0.8, margin: "0 0 8px" }}>
              {s.rankedMessage}
            </p>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            {canRace && ticketAd?.eligible && (
              <Button
                display="block"
                size="large"
                color="dark"
                variant="weak"
                onClick={() => watchAd("AD_RANK_TICKET", "경주 티켓 획득")}
              >
                광고로 티켓 미리 받기 +1 (오늘 {ticketAd.remaining.daily}회)
              </Button>
            )}
            {(lowPoints || !canRace) && (
              <Button
                display="block"
                size="large"
                color="dark"
                variant="weak"
                disabled={!ptsAd?.eligible}
                onClick={() => watchAd("AD_PREDICTION_POINTS", "찌라시 P 획득")}
              >
                {ptsAd?.eligible
                  ? `광고 보고 찌라시 P +4 (오늘 ${ptsAd.remaining.daily}회)`
                  : ptsAd?.reason ?? "찌라시 P 광고"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <List>
        <ListRow
          verticalPadding="large"
          onClick={onOpenParty}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="친구와 맞추기"
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom="말 이름 응원 · 찌라시 3장 · 누적 점수"
              bottomProps={{ color: colors.blue500 }}
            />
          }
          withArrow
        />
        <ListRow
          verticalPadding="large"
          onClick={onOpenMissions}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="출석 보상"
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom={`스트릭 ${s.streak}일 · 골드 ${s.gold}G`}
              bottomProps={{ color: colors.grey600 }}
            />
          }
          withArrow
        />
      </List>

      <div style={{ padding: "8px 20px", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {showDevAdsLink() && (
          <TextButton size="medium" color={colors.grey600} onClick={onOpenAds}>
            광고 테스트
          </TextButton>
        )}
        <TextButton size="medium" color={colors.grey600} onClick={onOpenHelp}>
          도움말
        </TextButton>
        <TextButton size="medium" color={colors.grey500} onClick={onOpenSettings}>
          설정
        </TextButton>
        <TextButton size="medium" color={colors.grey500} onClick={logout}>
          로그아웃
        </TextButton>
      </div>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "8px 6px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{value}</div>
    </div>
  );
}
