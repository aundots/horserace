import type { CameraTransform, OvalLayout } from "../lib/ovalTrack";
import { getFinishLineRect } from "../lib/ovalTrack";
import type { RaceEntrant } from "../types/game";

type FinishLineTop3Props = {
  layout: OvalLayout;
  camera: CameraTransform;
  top3: number[];
  entrantMap: Map<number, RaceEntrant>;
  visible: boolean;
};

const MEDAL = ["🥇", "🥈", "🥉"];

export function FinishLineTop3({
  layout,
  camera,
  top3,
  entrantMap,
  visible,
}: FinishLineTop3Props) {
  if (!visible || top3.length === 0) return null;

  const finish = getFinishLineRect(layout);
  const ox = layout.offsetX;
  const oy = layout.offsetY;
  const cx = (finish.labelX + ox) * camera.scale + camera.tx;
  const top = (finish.labelY + oy) * camera.scale + camera.ty;

  return (
    <div
      className="finish-line-top3"
      style={{
        left: cx,
        top: top - 6,
        transform: "translate(-50%, -100%)",
      }}
    >
      {top3.map((num, i) => {
        const ent = entrantMap.get(num);
        return (
          <div key={num} className="finish-line-top3__item">
            <span className="finish-line-top3__medal">{MEDAL[i] ?? `${i + 1}`}</span>
            <span className="finish-line-top3__num">{num}</span>
            <span className="finish-line-top3__name">{ent?.name?.slice(0, 5) ?? ""}</span>
          </div>
        );
      })}
    </div>
  );
}
