import type { WhipJudgment } from "../lib/whipTap";

type WhipTapButtonProps = {
  visible: boolean;
  combo: number;
  effect: WhipJudgment | null;
  onTap: () => void;
};

export function WhipTapButton({ visible, combo, effect, onTap }: WhipTapButtonProps) {
  if (!visible) return null;

  return (
    <div className="whip-tap">
      {effect && (
        <span
          key={`${effect}-${combo}`}
          className={
            effect === "great" ? "whip-tap__judge whip-tap__judge--great" : "whip-tap__judge whip-tap__judge--miss"
          }
        >
          {effect === "great" ? "GREAT!" : "너무 빨라요!"}
        </span>
      )}
      <button
        type="button"
        className="whip-tap__btn"
        onPointerDown={(e) => {
          e.preventDefault();
          onTap();
        }}
      >
        <span className="whip-tap__icon">🏇</span>
        <span className="whip-tap__label">채찍질!</span>
        {combo > 1 && <span className="whip-tap__combo">{combo} 콤보</span>}
      </button>
    </div>
  );
}
