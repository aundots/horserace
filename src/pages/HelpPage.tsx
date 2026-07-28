import { colors } from "@toss/tds-colors";
import { Button, Top } from "@toss/tds-mobile";
import { useT } from "../i18n/LangContext";

interface HelpPageProps {
  onBack: () => void;
}

export function HelpPage({ onBack }: HelpPageProps) {
  const t = useT();
  const h3 = { fontSize: 16, margin: "16px 0 8px" } as const;

  return (
    <>
      <Top title={<Top.TitleParagraph size={22}>{t.help}</Top.TitleParagraph>} />

      <div style={{ padding: "0 20px 24px", fontSize: 14, lineHeight: 1.6, color: colors.grey800 }}>
        <h3 style={h3}>{t.helpHowToTitle}</h3>
        <p>{t.helpHowTo}</p>

        <h3 style={h3}>{t.helpTicketTitle}</h3>
        <p>{t.helpTicket}</p>

        <h3 style={h3}>{t.helpPointsTitle}</h3>
        <p>{t.helpPoints}</p>

        <h3 style={h3}>{t.helpPartyTitle}</h3>
        <p>{t.helpParty}</p>
        <p>{t.helpScoring}</p>

        <h3 style={h3}>{t.helpLoopTitle}</h3>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>{t.helpLoop1}</li>
          <li>{t.helpLoop2}</li>
          <li>{t.helpLoop3}</li>
          <li>{t.helpLoop4}</li>
        </ul>

        <h3 style={h3}>{t.helpGoldTitle}</h3>
        <p>{t.helpGold}</p>

        <h3 style={h3}>{t.helpAccidentTitle}</h3>
        <p>{t.helpAccident1}</p>
        <p style={{ marginTop: 8 }}>{t.helpAccident2}</p>

        <h3 style={h3}>{t.helpPolicyTitle}</h3>
        <p>{t.helpPolicy}</p>

        <h3 style={h3}>{t.helpSupportTitle}</h3>
        <p>{t.helpSupport}</p>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <Button display="block" size="large" color="dark" variant="weak" onClick={onBack}>
          {t.back}
        </Button>
      </div>
    </>
  );
}
