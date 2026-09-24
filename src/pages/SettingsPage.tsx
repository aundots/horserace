import { colors } from "@toss/tds-colors";
import { Button, List, ListRow, Top } from "@toss/tds-mobile";
import { useState } from "react";
import { useLang } from "../i18n/LangContext";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { lang, toggleLang, t } = useLang();
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
      <Top title={<Top.TitleParagraph size={22}>{t.settings}</Top.TitleParagraph>} />

      <List>
        <ListRow
          verticalPadding="large"
          onClick={toggleSound}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={t.sound}
              topProps={{ color: colors.grey900, fontWeight: "bold" }}
              bottom={soundOn ? t.on : t.off}
              bottomProps={{ color: colors.grey600 }}
            />
          }
          withArrow
        />
        <ListRow
          verticalPadding="large"
          onClick={toggleLang}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={t.language}
              topProps={{ color: colors.grey900, fontWeight: "bold" }}
              // 현재 언어를 그 언어로 표기 — 어느 쪽을 쓰든 읽을 수 있게.
              bottom={lang === "ko" ? "한국어" : "English"}
              bottomProps={{ color: colors.grey600 }}
            />
          }
          withArrow
        />
      </List>

      <div style={{ padding: "12px 20px 24px" }}>
        <Button display="block" size="large" color="dark" variant="weak" onClick={onBack}>
          {t.back}
        </Button>
      </div>
    </>
  );
}
