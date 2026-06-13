/** 경주마 + 기수 스프라이트 (실사 일러스트, 투명 배경) */
import { useEffect, useState } from "react";
import { getHorseSpriteTransform } from "../lib/ovalTrack";
import {
  RACE_HORSE_BASE,
  RACE_HORSE_FRAMES,
  silkFilter,
  silkHueForNumber,
} from "../lib/horseSilk";
import type { HorseCoatId } from "../lib/horseCoat";

type RaceHorseIconProps = {
  number: number;
  name?: string;
  jockeyName?: string;
  coat?: HorseCoatId;
  silkHue?: number;
  isPlayer?: boolean;
  isGhost?: boolean;
  size?: number;
  flipX?: boolean;
  tiltDeg?: number;
  animating?: boolean;
  compact?: boolean;
};

export function RaceHorseIcon({
  number,
  name,
  jockeyName,
  silkHue,
  isPlayer = false,
  isGhost = false,
  size = 20,
  flipX = false,
  tiltDeg = 0,
  animating = false,
  compact = false,
}: RaceHorseIconProps) {
  const [frame, setFrame] = useState(0);
  const hue = silkHue ?? silkHueForNumber(number);
  const w = size * (compact ? 1.42 : 2.15);
  const h = size * (compact ? 0.95 : 1.05);
  const bodyTransform = getHorseSpriteTransform({ flipX, tiltDeg, x: 0, y: 0 });
  const jockeyShort = jockeyName?.slice(0, 3) ?? "";
  const src =
    animating && RACE_HORSE_FRAMES.length > 0
      ? RACE_HORSE_FRAMES[frame]!
      : RACE_HORSE_BASE;

  useEffect(() => {
    if (!animating || RACE_HORSE_FRAMES.length === 0) {
      setFrame(0);
      return;
    }
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % RACE_HORSE_FRAMES.length);
    }, 110);
    return () => window.clearInterval(id);
  }, [animating]);

  return (
    <div
      className={`race-horse-unit${compact ? " race-horse-unit--track" : ""}`}
      style={{
        width: w,
        height: compact ? h : undefined,
        position: "relative",
        opacity: isGhost ? 0.82 : 1,
        transform: isPlayer ? "scale(1.04)" : undefined,
        zIndex: isPlayer ? 2 : 1,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          transform: bodyTransform,
          transformOrigin: "center bottom",
          position: "relative",
        }}
      >
        <div className={animating ? "horse-gallop-bob" : undefined}>
          <img
            src={src}
            alt=""
            draggable={false}
            className="race-horse-sprite"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center bottom",
              display: "block",
              filter: isPlayer
                ? `${silkFilter(hue)} drop-shadow(0 0 4px rgba(49,130,246,0.45))`
                : silkFilter(hue),
            }}
          />
          {!compact && (
            <span className="race-horse-unit__silk-num" aria-hidden>
              {number}
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="race-horse-unit__label">
          {name && <span className="race-horse-unit__horse">{name}</span>}
          {jockeyName && (
            <span className="race-horse-unit__jockey">기수 {jockeyShort}</span>
          )}
        </div>
      )}

      {compact && name && (
        <div className="race-horse-unit__tag">
          <span className="race-horse-unit__tag-name">{name.slice(0, 4)}</span>
        </div>
      )}

      {isGhost && <span className="race-horse-unit__ghost">G</span>}
    </div>
  );
}
