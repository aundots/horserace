import { silkColorFromHue, silkHueForNumber } from "../lib/horseSilk";

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
  if (!visible || picks.length === 0) return null;

  return (
    <div className="race-party-picks" aria-label="상대방 선택">
      <div className="race-party-picks__header">상대 선택</div>
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
