import { silkColorFromHue, silkHueForNumber } from "../lib/horseSilk";
import { useT } from "../i18n/LangContext";

export type LiveLeader = {
  rank: number;
  number: number;
  name: string;
  silkHue?: number;
  isPlayer?: boolean;
};

type RaceLiveScoreboardProps = {
  leaders: LiveLeader[];
  visible: boolean;
};

const RANK_LABEL = ["1st", "2nd", "3rd"] as const;

export function RaceLiveScoreboard({ leaders, visible }: RaceLiveScoreboardProps) {
  const t = useT();
  if (!visible || leaders.length === 0) return null;

  return (
    <div className="race-scoreboard" aria-label={t.officialRanks}>
      <div className="race-scoreboard__header">{t.officialRanks}</div>
      <ol className="race-scoreboard__list">
        {leaders.map((leader) => {
          const hue = leader.silkHue ?? silkHueForNumber(leader.number);
          const silk = silkColorFromHue(hue);
          return (
            <li
              key={leader.number}
              className={`race-scoreboard__col race-scoreboard__col--${leader.rank}`}
            >
              <span className="race-scoreboard__rank">
                {RANK_LABEL[leader.rank - 1] ?? leader.rank}
              </span>
              <span
                className="race-scoreboard__silk"
                style={{ background: silk }}
                aria-hidden
              />
              <span className="race-scoreboard__num">{leader.number}</span>
              <span className="race-scoreboard__name">
                {leader.name.slice(0, 5)}
                {leader.isPlayer ? " ★" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
