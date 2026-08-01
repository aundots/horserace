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
import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/LangContext";
import { translateServerMessage } from "../i18n/serverMessages";
import { showDevAdsLink } from "../lib/devAccess";
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
  const { lang, t } = useLang();
  const { isLoggedIn, loading, login, demoLogin, isPlayStore, logout } =
    auth;
  const {
    snapshot,
    loading: playerLoading,
    loadError,
    refresh,
    prepareRanked,
    getAdEligibility,
  } = player;

  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);
  const autoDemoTried = useRef(false);

  // Play Store 빌드는 시작 화면 없이 바로 메인으로 진입한다.
  useEffect(() => {
    if (!isPlayStore || loading || isLoggedIn || autoDemoTried.current) return;
    autoDemoTried.current = true;
    demoLogin();
  }, [isPlayStore, loading, isLoggedIn, demoLogin]);

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
      toast.openToast(errorText(error, "경주를 준비할 수 없어요."), {
        type: "bottom",
      });
    }
  }

  /** 서버 메시지는 한글로 오므로 표시 직전에 현재 언어로 옮긴다. */
  function errorText(error: unknown, fallback: string) {
    const raw = error instanceof Error ? error.message : fallback;
    return translateServerMessage(raw, lang);
  }

  async function watchAd(placement: string, label: string) {
    try {
      const res = await showRewardedAd(placement);
      toast.openToast(translateServerMessage(res.message || label, lang), {
        type: "top",
      });
      const next = await getAdEligibility();
      setAdPlacements(next);
    } catch (error) {
      toast.openToast(errorText(error, "광고 보상을 받을 수 없어요."), {
        type: "bottom",
      });
    }
  }

  function placementOf(id: string) {
    return adPlacements.find((p) => p.id === id);
  }

  if (loading || (isLoggedIn && playerLoading && !snapshot)) {
    return (
      <Top
        title={<Top.TitleParagraph size={22}>{t.appTitle}</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>{t.loading}</Top.SubtitleParagraph>
        }
      />
    );
  }

  if (isLoggedIn && !snapshot && !playerLoading) {
    return (
      <>
        <Top
          title={<Top.TitleParagraph size={22}>{t.appTitle}</Top.TitleParagraph>}
          subtitleBottom={
            <Top.SubtitleParagraph size={15}>
              {loadError ? translateServerMessage(loadError, lang) : t.loadFailed}
            </Top.SubtitleParagraph>
          }
        />
        <div style={{ padding: "0 20px", display: "grid", gap: 10 }}>
          <Button display="block" size="xlarge" onClick={refresh}>
            {t.retry}
          </Button>
          {isPlayStore ? (
            <Button
              display="block"
              size="large"
              color="dark"
              variant="weak"
              onClick={() => {
                logout();
                demoLogin();
              }}
            >
              {t.reload}
            </Button>
          ) : (
            <Button
              display="block"
              size="large"
              color="dark"
              variant="weak"
              onClick={logout}
            >
              {t.menuLogout}
            </Button>
          )}
        </div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Top
          title={<Top.TitleParagraph size={22}>{t.appTitle}</Top.TitleParagraph>}
          subtitleBottom={
            <Top.SubtitleParagraph size={15}>{t.homeSubtitle}</Top.SubtitleParagraph>
          }
        />
        <div style={{ padding: "0 20px", display: "grid", gap: 10 }}>
          {isPlayStore ? (
            // 자동 진입 중 — 실패했을 때만 수동 재시도 버튼이 의미를 갖는다.
            <Button display="block" size="xlarge" onClick={demoLogin}>
              {autoDemoTried.current ? t.retry : t.loading}
            </Button>
          ) : (
            <Button display="block" size="xlarge" onClick={login}>
              {t.loginToss}
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
        title={<Top.TitleParagraph size={22}>{t.appTitle}</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>{t.homeSubtitle}</Top.SubtitleParagraph>
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
            <div style={{ fontSize: 18, fontWeight: 800 }}>{t.partyCardTitle}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              {t.partyCardDesc}
            </div>
          </div>

          <Button
            display="block"
            size="xlarge"
            onClick={onOpenParty}
            style={{ marginBottom: 8 }}
          >
            {t.partyStart}
          </Button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <StatPill label={t.statTipPoints} value={`${s.predictionPoints}`} />
            <StatPill
              label={t.statTickets}
              value={`${s.rankedTicketsLeft}`}
            />
          </div>

          <div className="race-daily-progress">
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {t.dailyChallenge(
                s.rankedRacesToday ?? 0,
                s.dailyRaceGoal ?? 5,
                s.dailyChallengeGold ?? 80,
                s.dailyChallengeClaimed,
              )}
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
                ? t.ticketAdGet(ticketAd.remaining.daily)
                : ticketAd?.reason
                  ? translateServerMessage(ticketAd.reason, lang)
                  : t.ticketAdWait}
            </Button>
          ) : (
            <Button
              display="block"
              size="xlarge"
              onClick={handleRace}
              style={{ marginBottom: 8 }}
            >
              {t.soloStart}
            </Button>
          )}

          {!canRace && s.rankedMessage && (
            <p style={{ fontSize: 12, textAlign: "center", opacity: 0.8, margin: "0 0 8px" }}>
              {translateServerMessage(s.rankedMessage, lang)}
            </p>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            {canRace && ticketAd && ticketAd.remaining.daily > 0 && (
              // 쿨다운 등으로 잠시 못 받을 때도 버튼을 숨기지 말고 비활성으로 남긴다
              // — 갑자기 사라지면 "받기가 없어졌다"고 오해하기 쉽다.
              <Button
                display="block"
                size="large"
                color="dark"
                variant="weak"
                disabled={!ticketAd.eligible}
                onClick={() => watchAd("AD_RANK_TICKET", "경주 티켓 획득")}
              >
                {ticketAd.eligible
                  ? t.ticketAdPre(ticketAd.remaining.daily)
                  : ticketAd.reason
                    ? translateServerMessage(ticketAd.reason, lang)
                    : t.ticketAdWait}
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
                  ? t.pointsAd(ptsAd.remaining.daily)
                  : ptsAd?.reason
                    ? translateServerMessage(ptsAd.reason, lang)
                    : t.pointsAdLabel}
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
              top={t.menuParty}
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom={t.menuPartyDesc}
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
              top={t.menuAttendance}
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom={t.menuAttendanceDesc(s.streak)}
              bottomProps={{ color: colors.grey600 }}
            />
          }
          withArrow
        />
      </List>

      <div style={{ padding: "8px 20px", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {showDevAdsLink() && (
          <TextButton size="medium" color={colors.grey600} onClick={onOpenAds}>
            {t.adTest}
          </TextButton>
        )}
        <TextButton size="medium" color={colors.grey600} onClick={onOpenHelp}>
          {t.menuHelp}
        </TextButton>
        <TextButton size="medium" color={colors.grey500} onClick={onOpenSettings}>
          {t.menuSettings}
        </TextButton>
        <TextButton size="medium" color={colors.grey500} onClick={logout}>
          {t.menuLogout}
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
