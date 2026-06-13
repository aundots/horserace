import { colors } from "@toss/tds-colors";
import { Button, List, ListRow, Top } from "@toss/tds-mobile";
import { useState } from "react";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [soundOn, setSoundOn] = useState(
    () => localStorage.getItem("horserace.sound") !== "off",
  );

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem("horserace.sound", next ? "on" : "off");
  }

  return (
    <>
      <Top title={<Top.TitleParagraph size={22}>설정</Top.TitleParagraph>} />

      <List>
        <ListRow
          verticalPadding="large"
          onClick={toggleSound}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="사운드"
              topProps={{ color: colors.grey900, fontWeight: "bold" }}
              bottom={soundOn ? "켜짐" : "꺼짐"}
              bottomProps={{ color: colors.grey600 }}
            />
          }
          withArrow
        />
      </List>

      <div style={{ padding: "12px 20px 24px" }}>
        <Button display="block" size="large" color="dark" variant="weak" onClick={onBack}>
          돌아가기
        </Button>
      </div>
    </>
  );
}
