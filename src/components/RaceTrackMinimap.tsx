import type { VisibleRect } from "../lib/ovalTrack";
import { type OvalLayout } from "../lib/ovalTrack";
import { TrackOvalSvg } from "./TrackOvalSvg";

import { silkColorFromHue, silkHueForNumber } from "../lib/horseSilk";

type HorseDot = {
  number: number;
  x: number;
  y: number;
  isPlayer?: boolean;
  silkHue?: number;
};

type RaceTrackMinimapProps = {
  track: string;
  layout: OvalLayout;
  horses: HorseDot[];
  visibleRect: VisibleRect;
};

export function RaceTrackMinimap({
  track,
  layout,
  horses,
  visibleRect,
}: RaceTrackMinimapProps) {
  const mapW = 100;
  const mapH = Math.round(mapW * (layout.worldHeight / layout.worldWidth));
  const scaleX = mapW / layout.worldWidth;
  const scaleY = mapH / layout.worldHeight;

  return (
    <div className="race-minimap">
      <div className="race-minimap__label">MAP</div>
      <div style={{ width: mapW, height: mapH, position: "relative" }}>
        <div
          style={{
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: "top left",
            width: layout.worldWidth,
            height: layout.worldHeight,
          }}
        >
          <TrackOvalSvg layout={layout} track={track} compact />
        </div>

        <div
          style={{
            position: "absolute",
            left: visibleRect.x * scaleX,
            top: visibleRect.y * scaleY,
            width: visibleRect.w * scaleX,
            height: visibleRect.h * scaleY,
            border: "1.5px solid rgba(255,255,255,0.9)",
            borderRadius: 3,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}
        />

        {horses.map((h) => {
          const dotColor = silkColorFromHue(h.silkHue ?? silkHueForNumber(h.number));
          const size = h.isPlayer ? 7 : 5;
          return (
            <div
              key={h.number}
              style={{
                position: "absolute",
                left: h.x * scaleX - size / 2,
                top: h.y * scaleY - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: dotColor,
                border: h.isPlayer
                  ? "1.5px solid #191F28"
                  : "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
