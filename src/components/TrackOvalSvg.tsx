import { useId } from "react";
import { TrackScenery } from "./TrackScenery";
import {
  chuteLengthPx,
  chuteRingD,
  crossLinePolygon,
  getCornerMarkers,
  getFinishLineSegment,
  getStartLineSegment,
  getTrackDistanceMarkers,
  stadiumPathD,
  stadiumRingD,
  type OvalLayout,
} from "../lib/ovalTrack";

type TrackType = "DRY" | "WET" | "HEAVY" | string;

const TRACK_STYLES: Record<
  string,
  {
    grassTop: string;
    grassMid: string;
    grassBot: string;
    infield: string;
    infieldLight: string;
    rail: string;
    railShadow: string;
    dirtLight: string;
    dirtMid: string;
    dirtDark: string;
  }
> = {
  DRY: {
    grassTop: "#2d6a4f",
    grassMid: "#1b4332",
    grassBot: "#14352a",
    infield: "#40916c",
    infieldLight: "#52b788",
    rail: "#FFFFFF",
    railShadow: "rgba(0,0,0,0.12)",
    dirtLight: "#E8D4B0",
    dirtMid: "#C9A66B",
    dirtDark: "#9A7348",
  },
  WET: {
    grassTop: "#5A9E6A",
    grassMid: "#458A55",
    grassBot: "#356B42",
    infield: "#4A8F58",
    infieldLight: "#5FA06D",
    rail: "#E8F0F4",
    railShadow: "rgba(0,0,0,0.18)",
    dirtLight: "#B8A080",
    dirtMid: "#8F7355",
    dirtDark: "#6B5540",
  },
  HEAVY: {
    grassTop: "#5A7A52",
    grassMid: "#4A6644",
    grassBot: "#3A5238",
    infield: "#4D6B48",
    infieldLight: "#5E7D58",
    rail: "#D8DEE4",
    railShadow: "rgba(0,0,0,0.2)",
    dirtLight: "#A89070",
    dirtMid: "#7A6348",
    dirtDark: "#5C4835",
  },
};

type TrackOvalSvgProps = {
  layout: OvalLayout;
  track: TrackType;
  compact?: boolean;
  raceDistance?: number;
};

export function TrackOvalSvg({ layout, track, compact = false, raceDistance }: TrackOvalSvgProps) {
  const uid = useId().replace(/:/g, "");
  const t = TRACK_STYLES[track] ?? TRACK_STYLES.DRY;
  const { width, height, worldWidth, worldHeight, offsetX, offsetY, cx, cy, straightHalf, cornerRadius, laneWidth, chuteLength } =
    layout;
  const finishLine = getFinishLineSegment(layout);
  const startLine = raceDistance && !compact ? getStartLineSegment(layout, raceDistance) : null;
  const distanceMarkers = compact ? [] : getTrackDistanceMarkers(layout);
  const cornerMarkers = compact ? [] : getCornerMarkers(layout);

  const outerR = cornerRadius + laneWidth * 4;
  const innerR = Math.max(cornerRadius - laneWidth * 3.2, laneWidth * 2);
  const ringPath = stadiumRingD(cx, cy, straightHalf, outerR, innerR);
  const innerPath = stadiumPathD(cx, cy, straightHalf, innerR);
  const chutePx = raceDistance ? chuteLengthPx(layout, raceDistance) : chuteLength;
  const chuteRing = chuteRingD(layout, outerR, innerR, raceDistance);
  const lineThick = compact ? 4 : 8;
  const startThick = compact ? 3 : 6;

  const vbW = compact ? width : worldWidth;
  const vbH = compact ? height : worldHeight;

  return (
    <svg
      width={vbW}
      height={vbH}
      viewBox={compact ? `${offsetX} ${offsetY} ${width} ${height}` : `0 0 ${worldWidth} ${worldHeight}`}
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`grass-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={t.grassTop} />
          <stop offset="45%" stopColor={t.grassMid} />
          <stop offset="100%" stopColor={t.grassBot} />
        </linearGradient>
        <linearGradient id={`dirt-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={t.dirtLight} />
          <stop offset="45%" stopColor={t.dirtMid} />
          <stop offset="100%" stopColor={t.dirtDark} />
        </linearGradient>
        <radialGradient id={`infield-${uid}`} cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor={t.infieldLight} />
          <stop offset="100%" stopColor={t.infield} />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`ring-${uid}`}>
          <path d={stadiumPathD(cx, cy, straightHalf, outerR)} />
        </clipPath>
        <pattern
          id={`finish-${uid}`}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect width="4" height="4" fill="#191F28" />
          <rect x="4" y="4" width="4" height="4" fill="#191F28" />
          <rect x="4" width="4" height="4" fill="#FFFFFF" />
          <rect y="4" width="4" height="4" fill="#FFFFFF" />
        </pattern>
      </defs>

      {!compact && <TrackScenery layout={layout} />}

      <g transform={`translate(${offsetX}, ${offsetY})`}>
      <rect width={width} height={height} fill="transparent" />

      {!compact &&
        Array.from({ length: 20 }).map((_, i) => (
          <ellipse
            key={`g${i}`}
            cx={(i * 97 + 40) % width}
            cy={(i * 53 + 20) % height}
            rx={18 + (i % 5) * 4}
            ry={8 + (i % 3) * 2}
            fill="rgba(255,255,255,0.04)"
          />
        ))}

      {/* 주로 링 + 1600m 슈트 */}
      <path d={ringPath} fill={`url(#dirt-${uid})`} fillRule="evenodd" />
      <path d={chuteRing} fill={`url(#dirt-${uid})`} />

      {/* 내야 잔디 */}
      <path d={innerPath} fill={`url(#infield-${uid})`} />

      {/* 출발선 */}
      {startLine && (
        <polygon
          points={crossLinePolygon(startLine, startThick)}
          fill="rgba(255,255,255,0.65)"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={1}
        />
      )}

      {/* 직선 구간 표시 */}
      {!compact && (
        <>
          <text
            x={cx}
            y={cy + outerR + 14}
            textAnchor="middle"
            fill="rgba(255,255,255,0.45)"
            fontSize={8}
            fontWeight={700}
            letterSpacing="0.06em"
          >
            HOME · 오르막
          </text>
          <text
            x={cx}
            y={cy - outerR - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={7}
            fontWeight={600}
            letterSpacing="0.06em"
          >
            BACK · 내리막
          </text>
          <text
            x={cx + straightHalf + chutePx * 0.55}
            y={cy - outerR - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.28)"
            fontSize={6}
            fontWeight={600}
          >
            CHUTE · {raceDistance && raceDistance > 1600 ? `${raceDistance}m` : "1600m"}
          </text>
        </>
      )}

      {/* 4코너 (과천형) */}
      {!compact &&
        cornerMarkers.map((c) => (
          <g key={`corner-${c.n}`}>
            <circle cx={c.x} cy={c.y} r={3} fill="rgba(255,255,255,0.35)" />
            <text
              x={c.x}
              y={c.y - 6}
              textAnchor="middle"
              fill="rgba(255,255,255,0.55)"
              fontSize={7}
              fontWeight={700}
            >
              {c.n}C
            </text>
          </g>
        ))}

      {/* 거리 마커 (결승까지 남은 m) */}
      {!compact &&
        distanceMarkers.map((m) => (
          <g key={m.label}>
            <circle
              cx={m.x}
              cy={m.y}
              r={2.2}
              fill="rgba(255,255,255,0.55)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={0.4}
            />
            <text
              x={m.x}
              y={m.y - 5}
              textAnchor="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize={6.5}
              fontWeight={700}
            >
              {m.label}
            </text>
          </g>
        ))}

      {/* 외곽·내곽 레일 */}
      <path
        d={stadiumPathD(cx, cy, straightHalf, outerR)}
        fill="none"
        stroke={t.rail}
        strokeWidth={compact ? 1.4 : 3}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.95}
      />
      <path
        d={innerPath}
        fill="none"
        stroke={t.rail}
        strokeWidth={compact ? 1 : 2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />

      {/* 결승선 — 트랙 폭 전체 직각 */}
      <polygon
        points={crossLinePolygon(finishLine, lineThick)}
        fill={`url(#finish-${uid})`}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={1.5}
      />
      {!compact && (
        <>
          <text
            x={finishLine.mx + finishLine.tx * 16}
            y={finishLine.my + finishLine.ty * 16 + 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.9)"
            fontSize={9}
            fontWeight={700}
            letterSpacing="0.08em"
          >
            FINISH
          </text>
        </>
      )}

      {track === "WET" && (
        <g clipPath={`url(#ring-${uid})`} opacity={0.22}>
          {Array.from({ length: compact ? 6 : 12 }).map((_, i) => (
            <ellipse
              key={i}
              cx={(i * 120 + 60) % width}
              cy={(i * 70 + 40) % height}
              rx={8 + (i % 3) * 3}
              ry={4 + (i % 2)}
              fill="rgba(180,210,230,0.5)"
            />
          ))}
        </g>
      )}

      {track === "HEAVY" && !compact && (
        <g clipPath={`url(#ring-${uid})`} opacity={0.15}>
          <ellipse cx={cx - 80} cy={cy + 20} rx={60} ry={25} fill="rgba(80,60,40,0.4)" />
          <ellipse cx={cx + 100} cy={cy - 15} rx={50} ry={20} fill="rgba(80,60,40,0.35)" />
        </g>
      )}
      </g>
    </svg>
  );
}
