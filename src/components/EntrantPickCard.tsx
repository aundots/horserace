import { colors } from "@toss/tds-colors";
import { entrantAptTags, statBarPct } from "../lib/entrantBrief";
import { formatJockey } from "../lib/jockey";
import { PARTY_TIPS_PER_RACE } from "../lib/partyScoring";
import type { RaceEntrant, TipCard } from "../types/game";
import { RaceHorseIcon } from "./RaceHorseIcon";
import { TipGradeBadge } from "./TipGradeBadge";

type EntrantPickCardProps = {
  entrant: RaceEntrant;
  selected: boolean;
  raceTrack: string;
  raceDistance: number;
  revealedTip: TipCard | null;
  openCost: number;
  predictionPoints: number;
  freeTipReveals?: number;
  revealing: boolean;
  isPick?: boolean;
  hideTips?: boolean;
  /** 내기 모드 — 스탯·기수만 숨김, 말 이름은 공개 */
  anonymous?: boolean;
  takenByOther?: boolean;
  /** 내기 모드 — 경기당 3장 무료 찌라시 */
  partyTips?: boolean;
  tipsRemaining?: number;
  onSelect: () => void;
  onRevealTip: () => void;
};

function StatMini({ label, value }: { label: string; value: number }) {
  const pct = statBarPct(value);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: colors.grey600,
          marginBottom: 3,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: colors.grey800 }}>{value}</span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: colors.grey100,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            background: colors.blue400,
          }}
        />
      </div>
    </div>
  );
}

export function EntrantPickCard({
  entrant,
  selected,
  raceTrack,
  raceDistance,
  revealedTip,
  openCost,
  predictionPoints,
  freeTipReveals = 0,
  revealing,
  isPick = false,
  hideTips = false,
  anonymous = false,
  takenByOther = false,
  partyTips = false,
  tipsRemaining = 0,
  onSelect,
  onRevealTip,
}: EntrantPickCardProps) {
  const tags = entrantAptTags(entrant, raceTrack, raceDistance);
  const canAfford = freeTipReveals > 0 || predictionPoints >= openCost;
  const showTips = partyTips || !hideTips;
  const canRevealPartyTip = partyTips && tipsRemaining > 0 && !revealedTip;
  const disabled = takenByOther;

  return (
    <div
      style={{
        marginBottom: 8,
        borderRadius: 14,
        border: selected || isPick
          ? `2px solid ${colors.blue500}`
          : takenByOther
            ? `1px solid ${colors.grey200}`
            : "1px solid rgba(0,0,0,0.08)",
        background: selected || isPick ? "#F0F6FF" : takenByOther ? colors.grey50 : "#fff",
        boxShadow: selected ? "0 2px 10px rgba(49,130,246,0.12)" : "none",
        overflow: "hidden",
        opacity: takenByOther ? 0.72 : 1,
      }}
    >
      <button
        type="button"
        onClick={disabled ? undefined : onSelect}
        disabled={disabled}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: 12,
          border: "none",
          background: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <RaceHorseIcon
            number={entrant.number}
            name={entrant.name}
            jockeyName={anonymous ? undefined : entrant.jockeyName}
            silkHue={entrant.silkHue}
            coat={entrant.coat}
            isPlayer={selected}
            isGhost={entrant.isGhost}
            size={30}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: colors.grey900 }}>
                {entrant.number}번 {entrant.name}
              </span>
              {selected && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: colors.blue500,
                    color: "#fff",
                  }}
                >
                  내 말
                </span>
              )}
              {takenByOther && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: colors.grey200,
                    color: colors.grey700,
                  }}
                >
                  선택됨
                </span>
              )}
              {!anonymous && entrant.isGhost && (
                <span style={{ fontSize: 11, color: colors.grey600 }}>고스트</span>
              )}
            </div>

            {anonymous ? (
              <p style={{ fontSize: 12, color: colors.grey600, margin: "6px 0 0", lineHeight: 1.4 }}>
                스탯·기수 비공개 · 이름으로 응원 · 찌라시로 힌트
              </p>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.grey700,
                    marginTop: 5,
                    fontWeight: 600,
                  }}
                >
                  {formatJockey({
                    name: entrant.jockeyName,
                    weight: entrant.jockeyWeight,
                    winRate: entrant.jockeyWinRate,
                    tier: entrant.jockeyTier,
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 5,
                    marginTop: 6,
                  }}
                >
                  {tags.map((tag) => (
                    <span
                      key={tag.label}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 7px",
                        borderRadius: 6,
                        background: tag.match ? "#E8F5E9" : colors.grey50,
                        color: tag.match ? "#2E7D32" : colors.grey700,
                        border: tag.match ? "1px solid #A5D6A7" : `1px solid ${colors.grey100}`,
                      }}
                    >
                      {tag.match ? "◎ " : ""}
                      {tag.label}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <StatMini label="스피드" value={entrant.speed} />
                  <StatMini label="스태" value={entrant.stamina} />
                  <StatMini label="가속" value={entrant.accel} />
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      {showTips && (
        <div
          style={{
            borderTop: `1px solid ${colors.grey100}`,
            padding: "10px 12px",
            background: revealedTip ? "#FAFBFC" : "#F5F6F8",
          }}
        >
          {revealedTip ? (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 13,
                color: colors.grey800,
                lineHeight: 1.45,
              }}
            >
              <TipGradeBadge grade={revealedTip.grade} compact />
              <span>{revealedTip.text}</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={revealing || (partyTips ? !canRevealPartyTip : !canAfford)}
              onClick={(e) => {
                e.stopPropagation();
                onRevealTip();
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px dashed ${
                  partyTips
                    ? canRevealPartyTip
                      ? colors.blue300
                      : colors.grey300
                    : canAfford
                      ? colors.blue300
                      : colors.grey300
                }`,
                background: partyTips
                  ? canRevealPartyTip
                    ? "#fff"
                    : colors.grey50
                  : canAfford
                    ? "#fff"
                    : colors.grey50,
                color: partyTips
                  ? canRevealPartyTip
                    ? colors.blue500
                    : colors.grey500
                  : canAfford
                    ? colors.blue500
                    : colors.grey500,
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  revealing || (partyTips ? !canRevealPartyTip : !canAfford)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {revealing
                ? "여는 중..."
                : partyTips
                  ? canRevealPartyTip
                    ? `🔍 찌라시 열기 (남은 ${tipsRemaining}/${PARTY_TIPS_PER_RACE}장)`
                    : `찌라시 ${PARTY_TIPS_PER_RACE}장 모두 사용`
                  : canAfford
                    ? freeTipReveals > 0
                      ? `🎁 찌라시 무료 열기 (보너스 ${freeTipReveals}장)`
                      : `🔒 찌라시 열기 (${openCost}P)`
                    : `예상 포인트 부족 (${openCost}P 필요)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
