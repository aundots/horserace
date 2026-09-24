import type { OvalLayout } from "../lib/ovalTrack";

type TrackSceneryProps = {
  layout: OvalLayout;
  compact?: boolean;
};

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={0} cy={8} rx={10} ry={4} fill="rgba(0,0,0,0.08)" />
      <rect x={-2} y={2} width={4} height={10} fill="#5C4033" rx={1} />
      <circle cx={0} cy={-2} r={9} fill="#3D8B4F" />
      <circle cx={-5} cy={1} r={7} fill="#48A058" />
      <circle cx={5} cy={1} r={7} fill="#35884A" />
    </g>
  );
}

function StandSection({ x, y, w, h, flip = false }: { x: number; y: number; w: number; h: number; flip?: boolean }) {
  const rows = 4;
  return (
    <g transform={`translate(${x}, ${y})${flip ? " scale(-1,1)" : ""}`}>
      <rect x={0} y={0} width={w} height={h} fill="#6B7280" rx={2} />
      {Array.from({ length: rows }).map((_, i) => (
        <rect
          key={i}
          x={4}
          y={4 + i * (h / rows)}
          width={w - 8}
          height={h / rows - 3}
          fill={i % 2 === 0 ? "#9CA3AF" : "#D1D5DB"}
          rx={1}
        />
      ))}
      <rect x={0} y={h - 4} width={w} height={4} fill="#4B5563" />
    </g>
  );
}

export function TrackScenery({ layout, compact = false }: TrackSceneryProps) {
  if (compact) return null;

  const { cx, cy, straightHalf, cornerRadius, chuteLength, chuteExtentPx, offsetX, offsetY, worldWidth, worldHeight } =
    layout;
  const chuteSpan = Math.max(chuteLength, chuteExtentPx);
  const outerR = cornerRadius + layout.laneWidth * 4;
  const tx = cx + offsetX;
  const ty = cy + offsetY;

  const trees: { x: number; y: number; s: number }[] = [
    { x: offsetX + 40, y: offsetY + 30, s: 0.9 },
    { x: offsetX + 90, y: offsetY + 55, s: 1.1 },
    { x: offsetX + 30, y: ty + outerR + 50, s: 1 },
    { x: offsetX + 80, y: ty + outerR + 80, s: 0.85 },
    { x: worldWidth - offsetX - 50, y: offsetY + 40, s: 1 },
    { x: worldWidth - offsetX - 100, y: offsetY + 70, s: 0.95 },
    { x: worldWidth - offsetX - 60, y: ty - outerR - 30, s: 1.05 },
    { x: tx - straightHalf - 70, y: ty - outerR - 20, s: 0.9 },
    { x: tx - straightHalf - 50, y: ty + outerR + 40, s: 1 },
    { x: tx + straightHalf + chuteSpan + 60, y: ty - outerR - 10, s: 0.88 },
    { x: tx + straightHalf + 40, y: ty + outerR + 70, s: 1.1 },
    { x: worldWidth - 60, y: worldHeight - 80, s: 1.15 },
    { x: 50, y: worldHeight - 100, s: 1 },
  ];

  return (
    <g aria-hidden>
      {/* 외곽 잔디 */}
      <rect width={worldWidth} height={worldHeight} fill="#1b4332" />
      <ellipse
        cx={tx}
        cy={ty}
        rx={straightHalf + outerR + 90}
        ry={outerR + 70}
        fill="#234f36"
      />
      <ellipse cx={tx} cy={ty} rx={straightHalf + 40} ry={outerR - 10} fill="#2d6a4f" opacity={0.35} />

      {/* 펜스 */}
      <ellipse
        cx={tx}
        cy={ty}
        rx={straightHalf + outerR + 28}
        ry={outerR + 22}
        fill="none"
        stroke="#8B7355"
        strokeWidth={2.5}
        opacity={0.55}
      />

      {/* 홈스트레치 관중석 */}
      <StandSection x={tx - straightHalf * 0.5} y={ty + outerR + 24} w={straightHalf * 1.1} h={36} />
      <StandSection x={tx - straightHalf * 0.3} y={ty + outerR + 64} w={straightHalf * 0.7} h={28} />

      {/* 백스트레치 관중석 */}
      <StandSection x={tx - straightHalf * 0.4} y={ty - outerR - 58} w={straightHalf * 0.9} h={32} flip />

      {/* 슈트 옆 스탠드 */}
      <StandSection
        x={tx + straightHalf + chuteSpan * 0.15}
        y={ty - outerR - 52}
        w={chuteSpan + 40}
        h={26}
        flip
      />

      {/* 좌·우 코너 스탠드 */}
      <StandSection x={tx - straightHalf - 78} y={ty - 18} w={52} h={48} />
      <StandSection x={tx + straightHalf + chuteSpan + 20} y={ty + 10} w={48} h={42} />

      {/* 나무 */}
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} y={t.y} s={t.s} />
      ))}

      {/* 플래그 · 장식 */}
      <g transform={`translate(${tx + straightHalf + 8}, ${ty + outerR + 18})`}>
        <line x1={0} y1={0} x2={0} y2={-22} stroke="#666" strokeWidth={1.5} />
        <polygon points="0,-22 16,-16 0,-10" fill="#E53935" />
      </g>
    </g>
  );
}
