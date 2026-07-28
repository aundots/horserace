import { silkColorFromHue, silkHueForNumber } from "../lib/horseSilk";
import { useT } from "../i18n/LangContext";

export type PartyPick = {
  userKey: number;
  name: string;
  number: number;
  silkHue?: number;
};

type RacePartyPicksProps = {
  picks: PartyPick[];
  visible: boolean;
};

export function RacePartyPicks({ picks, visible }: RacePartyPicksProps) {
  const t = useT();
  if (!visible || picks.length === 0) return null;

  return (
    <div className="race-party-picks" aria-label={t.opponentPicks}>
      <div className="race-party-picks__header">{t.opponentPicks}</div>
      <ul className="race-party-picks__list">
        {picks.map((p) => {
          const hue = p.silkHue ?? silkHueForNumber(p.number);
          const silk = silkColorFromHue(hue);
          return (
            <li key={p.userKey} className="race-party-picks__row">
              <span
                className="race-party-picks__silk"
                style={{ background: silk }}
                aria-hidden
              />
              <span className="race-party-picks__num">{p.number}</span>
              <span className="race-party-picks__name">{p.name.slice(0, 5)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
