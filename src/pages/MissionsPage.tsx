import { colors } from "@toss/tds-colors";
import { Button, Top } from "@toss/tds-mobile";
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
  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>출석 보상</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            스트릭 {snapshot.streak}일 · 골드 {snapshot.gold}G
          </Top.SubtitleParagraph>
        }
      />

      <div style={{ padding: "0 20px 16px" }}>
        <p style={{ fontSize: 14, color: colors.grey600, lineHeight: 1.55, margin: "0 0 16px" }}>
          매일 출석하면 골드가 지급됩니다. 골드는 추가 경주 티켓 구매에 사용할 수 있어요.
        </p>
        <Button
          display="block"
          size="xlarge"
          disabled={snapshot.attendanceClaimedToday}
          onClick={claimAttendance}
        >
          {snapshot.attendanceClaimedToday
            ? `오늘 출석 완료 (${snapshot.attendanceIndex}/28)`
            : "오늘 출석하기"}
        </Button>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <Button display="block" size="large" color="dark" variant="weak" onClick={onBack}>
          돌아가기
        </Button>
      </div>
    </>
  );
}
