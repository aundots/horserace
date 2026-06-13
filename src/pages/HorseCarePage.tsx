import { colors } from "@toss/tds-colors";
import { Button, List, ListRow, Top, useToast } from "@toss/tds-mobile";
import { useEffect, useState, type CSSProperties } from "react";
import { RaceHorseIcon } from "../components/RaceHorseIcon";
import { COAT_STYLES, HORSE_COAT_IDS } from "../lib/horseCoat";
import {
  DISTANCE_OPTIONS,
  HORSE_PRESETS,
  PACE_OPTIONS,
  STAT_BUDGET,
  TRACK_OPTIONS,
  adjustStat,
  horseToDraft,
  isDraftValid,
  statPointsLeft,
  type HorseDraft,
  type HorsePresetId,
} from "../lib/horseBuild";
import type { HorseCoatId, PlayerSnapshot } from "../types/game";

interface HorseCarePageProps {
  snapshot: PlayerSnapshot;
  onAction: (action: "train" | "feed" | "rest") => Promise<void>;
  onCustomize: (draft: HorseDraft) => Promise<void>;
  onApplyPreset: (presetId: HorsePresetId, coat?: HorseCoatId) => Promise<void>;
  onBack: () => void;
}

function Chip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        border: selected ? `2px solid ${colors.blue500}` : "1px solid rgba(0,0,0,0.1)",
        borderRadius: 999,
        padding: "8px 14px",
        background: selected ? "#F0F6FF" : "#fff",
        fontSize: 13,
        fontWeight: selected ? 700 : 600,
        color: selected ? colors.blue500 : colors.grey700,
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

function StatRow({
  label,
  value,
  onMinus,
  onPlus,
  disabled,
  plusDisabled,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  disabled?: boolean;
  plusDisabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: `1px solid ${colors.grey100}`,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: colors.grey800 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          disabled={disabled}
          onClick={onMinus}
          style={stepBtnStyle}
        >
          −
        </button>
        <span style={{ width: 28, textAlign: "center", fontWeight: 800 }}>{value}</span>
        <button
          type="button"
          disabled={disabled || plusDisabled}
          onClick={onPlus}
          style={stepBtnStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}

const stepBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#fff",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
};

export function HorseCarePage({
  snapshot,
  onAction,
  onCustomize,
  onApplyPreset,
  onBack,
}: HorseCarePageProps) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<HorseDraft>(() => horseToDraft(snapshot.horse));

  useEffect(() => {
    setDraft(horseToDraft(snapshot.horse));
  }, [snapshot.horse]);

  const bonus = snapshot.statBonusEarned ?? 0;
  const pointsLeft = statPointsLeft(draft, bonus);
  const canSave = isDraftValid(draft, bonus);

  async function act(action: "train" | "feed" | "rest") {
    setBusy(action);
    try {
      await onAction(action);
      if (action === "train") {
        toast.openToast("스탯 포인트 +1! 아래 배분에서 올릴 수 있어요.", {
          type: "success",
        });
      } else if (action === "feed") {
        toast.openToast("스탯 포인트 +1! 피로도가 회복됐어요.", { type: "success" });
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveBuild() {
    if (!canSave || busy) return;
    setBusy("save");
    try {
      await onCustomize(draft);
      toast.openToast("말 설정이 저장됐어요.", { type: "success" });
    } catch (error) {
      toast.openToast(
        error instanceof Error ? error.message : "저장에 실패했어요.",
        { type: "bottom" },
      );
    } finally {
      setBusy(null);
    }
  }

  async function applyPreset(presetId: HorsePresetId) {
    if (busy) return;
    setBusy("preset");
    try {
      const preset = HORSE_PRESETS[presetId];
      await onApplyPreset(presetId, draft.coat);
      setDraft({ ...preset, coat: draft.coat });
      toast.openToast(`${preset.label} 프리셋을 적용했어요.`, { type: "success" });
    } catch (error) {
      toast.openToast(
        error instanceof Error ? error.message : "프리셋 적용에 실패했어요.",
        { type: "bottom" },
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>말 관리</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            말·스탯·적성을 직접 설정하고 훈련하세요
          </Top.SubtitleParagraph>
        }
      />

      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
        <RaceHorseIcon number={1} coat={draft.coat} isPlayer size={52} />
      </div>

      <List>
        <ListRow
          verticalPadding="large"
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="컨디션 / 피로"
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom={`${snapshot.horse.condition} · 피로 ${snapshot.horse.fatigue} · 주말 버프 +${snapshot.weekendBuffPct}%`}
              bottomProps={{ color: colors.blue500 }}
            />
          }
        />
      </List>

      <div style={{ padding: "12px 16px 0" }}>
        <SectionTitle>말 이름</SectionTitle>
        <input
          value={draft.name}
          maxLength={12}
          disabled={busy !== null}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="말 이름 (12자)"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 15,
          }}
        />
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <SectionTitle>유형 프리셋</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {(Object.keys(HORSE_PRESETS) as HorsePresetId[]).map((id) => {
            const p = HORSE_PRESETS[id];
            return (
              <button
                key={id}
                type="button"
                disabled={busy !== null}
                onClick={() => applyPreset(id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "#fff",
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: colors.grey900 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 12, color: colors.grey600, marginTop: 2 }}>
                  {p.desc} · 스피드 {p.speed} / 스태 {p.stamina} / 가속 {p.accel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <SectionTitle>털색</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {HORSE_COAT_IDS.map((coatId) => (
            <button
              key={coatId}
              type="button"
              disabled={busy !== null}
              onClick={() => setDraft((d) => ({ ...d, coat: coatId }))}
              style={{
                border:
                  draft.coat === coatId
                    ? `2px solid ${colors.blue500}`
                    : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: "6px 2px 4px",
                background: draft.coat === coatId ? "#F0F6FF" : "#fff",
                cursor: busy ? "wait" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <RaceHorseIcon number={1} coat={coatId} size={26} />
              <span style={{ fontSize: 9, fontWeight: 600, color: colors.grey700 }}>
                {COAT_STYLES[coatId].label.replace("말", "")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <SectionTitle>페이스 (주행 스타일)</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PACE_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={draft.pace === o.id}
              disabled={busy !== null}
              onClick={() => setDraft((d) => ({ ...d, pace: o.id }))}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <SectionTitle>주로 적성</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TRACK_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={draft.trackApt === o.id}
              disabled={busy !== null}
              onClick={() => setDraft((d) => ({ ...d, trackApt: o.id }))}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <SectionTitle>거리 적성</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DISTANCE_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={draft.distanceApt === o.id}
              disabled={busy !== null}
              onClick={() => setDraft((d) => ({ ...d, distanceApt: o.id }))}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <SectionTitle>
          스탯 배분 (기본 {STAT_BUDGET}
          {bonus > 0 ? ` + 보너스 ${bonus}` : ""})
        </SectionTitle>
        <div
          style={{
            fontSize: 13,
            color: pointsLeft === 0 ? colors.blue500 : "#E65100",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {pointsLeft > 0
            ? `배분 가능 ${pointsLeft}P (훈련·먹이로 획득 포함)`
            : pointsLeft < 0
              ? `보너스 초과 ${-pointsLeft}P — 스탯을 낮춰 주세요`
              : "배분 완료"}
        </div>
        <StatRow
          label="스피드"
          value={draft.speed}
          disabled={busy !== null}
          onMinus={() => setDraft((d) => adjustStat(d, "speed", -1, bonus))}
          onPlus={() => setDraft((d) => adjustStat(d, "speed", 1, bonus))}
          plusDisabled={pointsLeft <= 0}
        />
        <StatRow
          label="스태미나"
          value={draft.stamina}
          disabled={busy !== null}
          onMinus={() => setDraft((d) => adjustStat(d, "stamina", -1, bonus))}
          onPlus={() => setDraft((d) => adjustStat(d, "stamina", 1, bonus))}
          plusDisabled={pointsLeft <= 0}
        />
        <StatRow
          label="가속"
          value={draft.accel}
          disabled={busy !== null}
          onMinus={() => setDraft((d) => adjustStat(d, "accel", -1, bonus))}
          onPlus={() => setDraft((d) => adjustStat(d, "accel", 1, bonus))}
          plusDisabled={pointsLeft <= 0}
        />
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <Button
          display="block"
          size="xlarge"
          disabled={!canSave || busy !== null}
          onClick={saveBuild}
        >
          설정 저장
        </Button>
      </div>

      <div style={{ padding: "16px 20px", display: "grid", gap: 10 }}>
        <Button
          display="block"
          size="large"
          disabled={snapshot.trainLeft <= 0 || busy !== null}
          onClick={() => act("train")}
        >
          훈련하기 · 스탯+1 ({snapshot.trainLeft}회 남음)
        </Button>
        <Button
          display="block"
          size="large"
          color="dark"
          variant="weak"
          disabled={snapshot.feedLeft <= 0 || busy !== null}
          onClick={() => act("feed")}
        >
          먹이 주기 · 스탯+1
        </Button>
        <Button
          display="block"
          size="large"
          color="dark"
          variant="weak"
          disabled={snapshot.restLeft <= 0 || busy !== null}
          onClick={() => act("rest")}
        >
          휴식하기
        </Button>
        <Button display="block" size="medium" color="dark" variant="weak" onClick={onBack}>
          돌아가기
        </Button>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: colors.grey700,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
