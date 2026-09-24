import { colors } from "@toss/tds-colors";
import { Button, Top } from "@toss/tds-mobile";
import { useT } from "../i18n/LangContext";
import type { PlayerSnapshot } from "../types/game";

interface MissionsPageProps {
  snapshot: PlayerSnapshot;
  claimAttendance: () => Promise<void>;
  onBack: () => void;
}

export function MissionsPage({
  snapshot,
  claimAttendance,
  onBack,
}: MissionsPageProps) {
  const t = useT();

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>{t.attendanceTitle}</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            {t.attendanceSubtitle(snapshot.streak, snapshot.predictionPoints)}
          </Top.SubtitleParagraph>
        }
      />

      <div style={{ padding: "0 20px 16px" }}>
        <p style={{ fontSize: 14, color: colors.grey600, lineHeight: 1.55, margin: "0 0 16px" }}>
          {t.attendanceDesc}
        </p>
        <Button
          display="block"
          size="xlarge"
          disabled={snapshot.attendanceClaimedToday}
          onClick={claimAttendance}
        >
          {snapshot.attendanceClaimedToday
            ? t.attendanceDone(snapshot.attendanceIndex)
            : t.attendanceClaim}
        </Button>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <Button display="block" size="large" color="dark" variant="weak" onClick={onBack}>
          {t.back}
        </Button>
      </div>
    </>
  );
}
