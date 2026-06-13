import type { CommentaryLine } from "../lib/raceCommentary";

type RaceCommentaryBarProps = {
  line: CommentaryLine;
  visible: boolean;
  overlay?: boolean;
};

export function RaceCommentaryBar({
  line,
  visible,
  overlay = false,
}: RaceCommentaryBarProps) {
  if (!visible || !line.text) return null;

  const cls = [
    "race-commentary",
    line.urgent ? "race-commentary--urgent" : "",
    overlay ? "race-commentary--overlay" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="status" aria-live="polite">
      <span className="race-commentary__live">LIVE</span>
      <p className="race-commentary__text" key={line.text}>
        {line.text}
      </p>
    </div>
  );
}
