export const HORSE_LANE_COUNT = 8;

/** 1바퀴 기준 거리 (트랙 맵·마커) — 게임 최장 2000m는 1600m+α 시뮬 */
export const TRACK_LAP_METERS = 1600;

/** 출발·결승선 — 하단 직선 우측 (progress 0 = 1) */
export const FINISH_LINE_PROGRESS = 0;

export const GATE_PROGRESS_BASE = FINISH_LINE_PROGRESS;

/** 가상 좌표 — 과천형 타원 (뒷직선·4코너·홈스트레치·1600m 슈트) */
export const VIRTUAL_TRACK = { width: 1180, height: 300 };

/** 트랙 주변 월드 여백 (나무·관중석) */
export const TRACK_WORLD_INSET = { left: 130, top: 100, right: 200, bottom: 140 };

export type OvalLayout = {
  width: number;
  height: number;
  worldWidth: number;
  worldHeight: number;
  offsetX: number;
  offsetY: number;
  cx: number;
  cy: number;
  /** 직선 구간 반길이 (중앙선 기준) */
  straightHalf: number;
  /** 코너 중앙선 반경 */
  cornerRadius: number;
  /** 1600m 출발 슈트 기본 길이 (가상 px) */
  chuteLength: number;
  /** 경주 거리 기준 슈트 전체 길이 px (2000m 연장 포함) */
  chuteExtentPx: number;
  laneWidth: number;
  /** @deprecated — straightHalf + cornerRadius */
  rx: number;
  /** @deprecated — cornerRadius */
  ry: number;
};

export type HorsePoint = {
  x: number;
  y: number;
  flipX: boolean;
  tiltDeg: number;
};

export type CameraTransform = {
  scale: number;
  tx: number;
  ty: number;
};

export type VisibleRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TrackDistanceMarker = {
  metersToFinish: number;
  x: number;
  y: number;
  label: string;
  onChute?: boolean;
};

export function getOvalLayout(
  width = VIRTUAL_TRACK.width,
  height = VIRTUAL_TRACK.height,
  maxRaceDistance = 2000,
): OvalLayout {
  const cornerRadius = height * 0.42;
  const straightHalf = Math.max(160, width * 0.31);
  const chuteLength = Math.max(90, width * 0.11);
  const { left, top, bottom } = TRACK_WORLD_INSET;
  const baseRight = TRACK_WORLD_INSET.right;

  const perim = stadiumPerimeter(straightHalf, cornerRadius);
  const chuteM = (chuteLength / perim) * TRACK_LAP_METERS;
  const loopM = TRACK_LAP_METERS - chuteM;
  const onChuteMax = Math.max(0, maxRaceDistance - loopM);
  const pxPerM = chuteM > 0 ? chuteLength / chuteM : 0;
  const chuteExtentPx = onChuteMax * pxPerM;
  const extraRight = Math.max(0, chuteExtentPx - chuteLength) + 70;

  const right = baseRight + extraRight;

  return {
    width,
    height,
    worldWidth: width + left + right,
    worldHeight: height + top + bottom,
    offsetX: left,
    offsetY: top,
    cx: width / 2,
    cy: height / 2,
    straightHalf,
    cornerRadius,
    chuteLength,
    chuteExtentPx,
    laneWidth: 7.5,
    rx: straightHalf + cornerRadius,
    ry: cornerRadius,
  };
}

/** 슈트 구간 거리 (m) — 1600m 기준 */
export function chuteMeters(layout: OvalLayout): number {
  const totalV = stadiumPerimeter(layout.straightHalf, layout.cornerRadius);
  return (layout.chuteLength / totalV) * TRACK_LAP_METERS;
}

/** 슈트 m → px (2000m 등 장거리 슈트 연장 포함) */
export function chuteMetersToPx(layout: OvalLayout): number {
  const chuteM = chuteMeters(layout);
  return chuteM > 0 ? layout.chuteLength / chuteM : 0;
}

/** 경주 거리에 맞춘 슈트 직선 길이 (px) */
export function chuteLengthPx(layout: OvalLayout, raceDistance = 1600): number {
  if (raceDistance >= 2000) return layout.chuteExtentPx;
  const loopM = mainLoopMeters(layout);
  const onChuteM = Math.max(0, raceDistance - loopM);
  return onChuteM * chuteMetersToPx(layout);
}

/** 결승까지 남은 거리 → 슈트 위 m */
export function onChuteMeters(metersToFinish: number, layout: OvalLayout): number {
  const loopM = mainLoopMeters(layout);
  return Math.max(0, metersToFinish - loopM);
}

/** 메인 루프(슈트 제외) 거리 (m) */
export function mainLoopMeters(layout: OvalLayout): number {
  return TRACK_LAP_METERS - chuteMeters(layout);
}

function laneRadius(layout: OvalLayout, lane: number) {
  const midLane = (HORSE_LANE_COUNT - 1) / 2;
  return layout.cornerRadius + (lane - midLane) * layout.laneWidth;
}

function segmentMeters(layout: OvalLayout) {
  const L = layout.straightHalf;
  const R = layout.cornerRadius;
  const totalV = stadiumPerimeter(L, R);
  const joinFinishV = joinToFinishVirtual(L, R);
  const scale = TRACK_LAP_METERS / totalV;
  return {
    joinFinishM: joinFinishV * scale,
    lapM: TRACK_LAP_METERS,
    totalV,
  };
}

/** 주로 내·외곽 반경 */
export function getTrackRadii(layout: OvalLayout) {
  const outerR = layout.cornerRadius + layout.laneWidth * 4;
  const innerR = Math.max(layout.cornerRadius - layout.laneWidth * 3.2, layout.laneWidth * 2);
  return { innerR, outerR };
}

export type TrackCrossLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mx: number;
  my: number;
  tx: number;
  ty: number;
};

/** 진행 방향에 수직인 가로선 (출발·결승) */
function crossLineAtProgress(layout: OvalLayout, progress: number): TrackCrossLine {
  const { cx, cy, straightHalf } = layout;
  const { innerR, outerR } = getTrackRadii(layout);
  const midR = (innerR + outerR) / 2;
  const center = stadiumPointAt(cx, cy, straightHalf, midR, progress);
  const len = Math.hypot(center.dx, center.dy) || 1;
  const nx = -center.dy / len;
  const ny = center.dx / len;
  const halfW = (outerR - innerR) / 2;
  return {
    x1: center.x + nx * halfW,
    y1: center.y + ny * halfW,
    x2: center.x - nx * halfW,
    y2: center.y - ny * halfW,
    mx: center.x,
    my: center.y,
    tx: center.dx / len,
    ty: center.dy / len,
  };
}

function chuteCrossLineAtOnChute(layout: OvalLayout, onChuteM: number): TrackCrossLine {
  const { cx, cy, straightHalf } = layout;
  const { innerR, outerR } = getTrackRadii(layout);
  const x = cx + straightHalf + onChuteM * chuteMetersToPx(layout);
  return {
    x1: x,
    y1: cy - outerR,
    x2: x,
    y2: cy - innerR,
    mx: x,
    my: cy - midR(innerR, outerR),
    tx: 1,
    ty: 0,
  };
}

function chuteCrossLine(layout: OvalLayout, metersRemaining: number): TrackCrossLine {
  const loopM = mainLoopMeters(layout);
  const onChute = Math.max(0, metersRemaining - loopM);
  return chuteCrossLineAtOnChute(layout, onChute);
}

function midR(a: number, b: number) {
  return (a + b) / 2;
}

export function crossLinePolygon(line: TrackCrossLine, thickness: number): string {
  const len = Math.hypot(line.tx, line.ty) || 1;
  const ox = (line.tx / len) * (thickness / 2);
  const oy = (line.ty / len) * (thickness / 2);
  return [
    `${line.x1 + ox},${line.y1 + oy}`,
    `${line.x1 - ox},${line.y1 - oy}`,
    `${line.x2 - ox},${line.y2 - oy}`,
    `${line.x2 + ox},${line.y2 + oy}`,
  ].join(" ");
}

export function getFinishLineSegment(layout: OvalLayout): TrackCrossLine {
  return crossLineAtProgress(layout, finishLineProgress(layout));
}

export function getStartLineSegment(
  layout: OvalLayout,
  raceDistance: number,
): TrackCrossLine {
  const loopM = mainLoopMeters(layout);
  if (raceDistance > loopM) {
    return chuteCrossLineAtOnChute(layout, raceDistance - loopM);
  }
  const progress = progressAtMetersToFinish(raceDistance, layout);
  return crossLineAtProgress(layout, progress);
}

/** 게이트 — 말 번호별 가로 위치 (0=안쪽 ~ 1=바깥) */
export function gateLateralT(horseNumber: number): number {
  return (horseNumber - 1) / (HORSE_LANE_COUNT - 1);
}

/** 주행 중 목표 가로 위치 — 순위와 분리, 말 번호·주행 리듬 기반 */
export function racingLateralTarget(
  horseNumber: number,
  rankIdx: number,
  count: number,
  raceProgress: number,
): number {
  const gate = gateLateralT(horseNumber);
  const seed = (horseNumber * 1.618) % 1;
  let target = 0.1 + seed * 0.8;
  target += Math.sin(raceProgress * 2.6 + horseNumber * 1.15) * 0.05;
  target += Math.cos(raceProgress * 5.2 + horseNumber * 0.55) * 0.025;

  if (count > 1 && raceProgress > 0.12) {
    const rankLane = 0.1 + (rankIdx / (count - 1)) * 0.8;
    const spreadBlend = Math.min(1, (raceProgress - 0.12) / 0.22) * 0.3;
    target = target * (1 - spreadBlend) + rankLane * spreadBlend;
  }

  if (raceProgress < 0.12) {
    const blend = raceProgress / 0.12;
    target = gate + (target - gate) * blend * blend;
  }
  return Math.max(0.05, Math.min(0.95, target));
}

/** 프레임 간 부드러운 인·아웃 이동 */
export function smoothLateralT(
  horseNumber: number,
  target: number,
  state: Map<number, number>,
  alpha = 0.09,
): number {
  const prev = state.get(horseNumber);
  if (prev == null) {
    state.set(horseNumber, target);
    return target;
  }
  const next = prev + (target - prev) * alpha;
  state.set(horseNumber, next);
  return next;
}

/** @deprecated racingLateralTarget + smoothLateralT 사용 */
export function racingLateralT(
  horseNumber: number,
  rankIdx: number,
  count: number,
  raceProgress: number,
): number {
  return racingLateralTarget(horseNumber, rankIdx, count, raceProgress);
}

/** 직선 2 + 좌·우 반원 — 반시계(CCW) 1바퀀 (과천형 타원) */
export function stadiumPerimeter(straightHalf: number, cornerRadius: number) {
  return 4 * straightHalf + 2 * Math.PI * cornerRadius;
}

/** 슈트 접합(뒷직선 우·2코너) → 결승선 가상 길이 */
function joinToFinishVirtual(straightHalf: number, cornerRadius: number) {
  const L = straightHalf;
  const R = cornerRadius;
  return 2 * L + Math.PI * R + 2 * L * 0.9;
}

/**
 * CCW 1바퀴 — progress 0 = 슈트 접합(뒷직선 우·2코너)
 * 뒷직선 → 3코너(좌) → 홈스트레치 → 4코너(우) → 접합
 */
export function stadiumPointAt(
  cx: number,
  cy: number,
  straightHalf: number,
  cornerRadius: number,
  progress: number,
): { x: number; y: number; dx: number; dy: number } {
  const L = straightHalf;
  const R = cornerRadius;
  const x0 = cx - L;
  const x1 = cx + L;
  const yb = cy + R;
  const yt = cy - R;
  const back = 2 * L;
  const leftArc = Math.PI * R;
  const home = 2 * L;
  const rightArc = Math.PI * R;
  const total = back + leftArc + home + rightArc;
  let d = ((progress % 1) + 1) % 1 * total;

  // 1) 뒷직선 — 우 → 좌 (내리막)
  if (d <= back) {
    const u = d / back;
    return { x: x1 - u * 2 * L, y: yt, dx: -1, dy: 0 };
  }
  d -= back;

  // 2) 3코너 (좌측 곡선)
  if (d <= leftArc) {
    const u = d / leftArc;
    const angle = -Math.PI / 2 - u * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const tangentScale = (Math.PI * R) / leftArc;
    return {
      x: x0 + R * cos,
      y: cy + R * sin,
      dx: -sin * tangentScale,
      dy: cos * tangentScale,
    };
  }
  d -= leftArc;

  // 3) 홈스트레치 — 좌 → 우 (오르막·결승)
  if (d <= home) {
    const u = d / home;
    return { x: x0 + u * 2 * L, y: yb, dx: 1, dy: 0 };
  }
  d -= home;

  // 4) 4코너 (우측 곡선)
  const u = d / rightArc;
  const angle = Math.PI / 2 - u * Math.PI;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const tangentScale = (Math.PI * R) / rightArc;
  return {
    x: x1 + R * cos,
    y: cy + R * sin,
    dx: -sin * tangentScale,
    dy: cos * tangentScale,
  };
}

/** SVG path — 과천형 타원 (좌·우 반원 + 직선 2) */
export function stadiumPathD(
  cx: number,
  cy: number,
  straightHalf: number,
  cornerRadius: number,
): string {
  const L = straightHalf;
  const R = cornerRadius;
  const x0 = cx - L;
  const x1 = cx + L;
  const yb = cy + R;
  const yt = cy - R;
  return [
    `M ${x1} ${yt}`,
    `L ${x0} ${yt}`,
    `A ${R} ${R} 0 0 0 ${x0} ${yb}`,
    `L ${x1} ${yb}`,
    `A ${R} ${R} 0 0 0 ${x1} ${yt}`,
    "Z",
  ].join(" ");
}

/** 홈스트레치 결승선 progress (4코너 직전) */
export function finishLineProgress(layout: OvalLayout): number {
  const L = layout.straightHalf;
  const R = layout.cornerRadius;
  const back = 2 * L;
  const leftArc = Math.PI * R;
  const home = 2 * L;
  const rightArc = Math.PI * R;
  const total = back + leftArc + home + rightArc;
  return (back + leftArc + home * 0.9) / total;
}

/** 4코너 라벨 위치 (과천 경주로 기준) */
export function getCornerMarkers(layout: OvalLayout): { n: number; x: number; y: number }[] {
  const { cx, cy, straightHalf, cornerRadius } = layout;
  const R = cornerRadius + layout.laneWidth * 2;
  const x0 = cx - straightHalf;
  const x1 = cx + straightHalf;
  const yb = cy + R;
  const yt = cy - R;
  return [
    { n: 1, x: x0, y: yb },
    { n: 2, x: x1, y: yt },
    { n: 3, x: x0, y: yt },
    { n: 4, x: x1, y: yb },
  ];
}

/** 슈트 — 상단 백스트레치 우측 직선 연장 (2000m 등 장거리 슈트 포함) */
export function chuteStripD(
  layout: OvalLayout,
  outerR: number,
  innerR: number,
  raceDistance?: number,
): string {
  const { cx, cy, straightHalf } = layout;
  const len = raceDistance != null ? chuteLengthPx(layout, raceDistance) : layout.chuteLength;
  const x0 = cx + straightHalf;
  const x1 = x0 + len;
  const ytOuter = cy - outerR;
  const ytInner = cy - innerR;
  return `M ${x0} ${ytOuter} L ${x1} ${ytOuter} L ${x1} ${ytInner} L ${x0} ${ytInner} Z`;
}

/** @deprecated chuteStripD 사용 */
export function chutePathD(layout: OvalLayout, radius: number): string {
  return chuteStripD(layout, radius + 4, radius - 4);
}

/** 슈트 중심선 (마커·레일) */
export function chuteCenterlineD(
  layout: OvalLayout,
  radius: number,
  raceDistance?: number,
): string {
  const { cx, cy, straightHalf } = layout;
  const len = raceDistance != null ? chuteLengthPx(layout, raceDistance) : layout.chuteLength;
  const yt = cy - radius;
  const xJoin = cx + straightHalf;
  return `M ${xJoin} ${yt} L ${xJoin + len} ${yt}`;
}

export function chuteRingD(
  layout: OvalLayout,
  outerR: number,
  innerR: number,
  raceDistance?: number,
): string {
  return chuteStripD(layout, outerR, innerR, raceDistance);
}

/** 외곽·내곽 링 (evenodd) */
export function stadiumRingD(
  cx: number,
  cy: number,
  straightHalf: number,
  outerR: number,
  innerR: number,
): string {
  return `${stadiumPathD(cx, cy, straightHalf, outerR)} ${stadiumPathD(cx, cy, straightHalf, innerR)}`;
}

/** 결승선까지 남은 거리(m) → progress (0=슈트 접합, finishLineProgress=결승) */
export function progressAtMetersToFinish(metersToFinish: number, layout: OvalLayout): number {
  const loopM = mainLoopMeters(layout);
  const m = Math.max(0, Math.min(loopM, metersToFinish));
  if (m <= 0) return finishLineProgress(layout);
  const traveled = loopM - m;
  return progressFromJoinTraveled(traveled, layout);
}

/** 접합점에서 결승 방향으로 traveled(m)만큼 진행한 progress */
function progressFromJoinTraveled(traveledM: number, layout: OvalLayout): number {
  const loopM = mainLoopMeters(layout);
  const t = Math.max(0, Math.min(1, traveledM / loopM));
  const L = layout.straightHalf;
  const R = layout.cornerRadius;
  const back = 2 * L;
  const leftArc = Math.PI * R;
  const home = 2 * L;
  const total = back + leftArc + home + Math.PI * R;
  const joinFinishV = back + leftArc + home * 0.9;
  let d = t * joinFinishV;

  if (d <= back) return d / total;
  d -= back;
  if (d <= leftArc) return (back + d) / total;
  d -= leftArc;
  return (back + leftArc + d) / total;
}

/** 슈트 — 접합점과 동일 좌표계, m 단위 연장 (2000m 등 장거리 슈트 포함) */
export function getChutePosition(
  layout: OvalLayout,
  metersToFinish: number,
  lateralT: number,
): HorsePoint {
  const onChute = onChuteMeters(metersToFinish, layout);
  const base = getHorsePositionAtLateral(layout, 0, lateralT);
  return {
    x: base.x + onChute * chuteMetersToPx(layout),
    y: base.y,
    flipX: base.flipX,
    tiltDeg: base.tiltDeg,
  };
}

type SmoothHorseState = HorsePoint & { facing: number };

/** 프레임 간 x·y·방향 부드럽게 보간 (코너 3C·1C 텔레포트 완화) */
export function smoothHorsePoint(
  horseNumber: number,
  target: HorsePoint,
  state: Map<number, HorsePoint>,
  alpha = 0.16,
): HorsePoint {
  const prev = state.get(horseNumber) as SmoothHorseState | undefined;
  if (!prev) {
    const initial: SmoothHorseState = {
      ...target,
      facing: target.flipX ? -1 : 1,
    };
    state.set(horseNumber, initial);
    return target;
  }
  const dx = target.x - prev.x;
  const dy = target.y - prev.y;
  const moveLen = Math.hypot(dx, dy);
  let targetFacing = target.flipX ? -1 : 1;
  if (moveLen > 0.4) {
    targetFacing = dx < -0.08 ? -1 : dx > 0.08 ? 1 : prev.facing;
  }
  const facing = prev.facing + (targetFacing - prev.facing) * alpha;
  const next: SmoothHorseState = {
    x: prev.x + (target.x - prev.x) * alpha,
    y: prev.y + (target.y - prev.y) * alpha,
    flipX: facing < 0,
    tiltDeg: prev.tiltDeg + (target.tiltDeg - prev.tiltDeg) * alpha,
    facing,
  };
  state.set(horseNumber, next);
  return next;
}

/** 프레임 간 주행 거리(m) 보간 */
export function smoothMetersRemaining(
  horseNumber: number,
  target: number,
  state: Map<number, number>,
  alpha = 0.2,
): number {
  const prev = state.get(horseNumber);
  if (prev == null) {
    state.set(horseNumber, target);
    return target;
  }
  const next = Math.max(0, prev + (target - prev) * alpha);
  state.set(horseNumber, next);
  return next;
}

/** 경주 거리별 출발 → 결승 progress (0=결승) */
export function progressForRaceDistance(
  raceProgress: number,
  raceDistance: number,
  layout: OvalLayout,
): number {
  const remaining = Math.max(0, raceDistance * (1 - raceProgress));
  if (remaining > mainLoopMeters(layout)) {
    return -1;
  }
  return progressAtMetersToFinish(remaining, layout);
}

export function getGateProgressForDistance(raceDistance: number, layout: OvalLayout): number {
  const loopM = mainLoopMeters(layout);
  if (raceDistance > loopM) return -1;
  return progressAtMetersToFinish(raceDistance, layout);
}

/** 트랙 맵 거리 마커 (JRA 스타일) */
export function getTrackDistanceMarkers(layout: OvalLayout): TrackDistanceMarker[] {
  const { cx, cy, straightHalf, cornerRadius, chuteLength } = layout;
  const R = cornerRadius + layout.laneWidth * 2;
  const markers: TrackDistanceMarker[] = [];

  const mainMarks = [200, 400, 600, 1100, 1200, 1300, 1400];
  for (const m of mainMarks) {
    const progress = progressAtMetersToFinish(m, layout);
    const pt = stadiumPointAt(cx, cy, straightHalf, R, progress);
    markers.push({
      metersToFinish: m,
      x: pt.x,
      y: pt.y,
      label: `${m}`,
    });
  }

  const chute1600 = chuteMeters(layout);
  const pt1600 = chuteCrossLineAtOnChute(layout, chute1600);
  markers.push({
    metersToFinish: 1600,
    x: pt1600.mx,
    y: pt1600.my,
    label: "1600",
    onChute: true,
  });

  const on2000 = 2000 - mainLoopMeters(layout);
  const pt2000 = chuteCrossLineAtOnChute(layout, on2000);
  markers.push({
    metersToFinish: 2000,
    x: pt2000.mx,
    y: pt2000.my,
    label: "2000",
    onChute: true,
  });

  return markers;
}

export function getFinishLineRect(layout: OvalLayout, compact = false) {
  const line = getFinishLineSegment(layout);
  const thickness = compact ? 3 : 6;
  const minX = Math.min(line.x1, line.x2) - thickness;
  const maxX = Math.max(line.x1, line.x2) + thickness;
  const minY = Math.min(line.y1, line.y2) - thickness;
  const maxY = Math.max(line.y1, line.y2) + thickness;
  const labelOff = compact ? 10 : 20;
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    labelX: line.mx + line.tx * labelOff,
    labelY: line.my + line.ty * labelOff,
    segment: line,
  };
}

/** 진행 방향 수직 오프셋 — 출발·결승선이 트랙과 직각 */
export function getHorsePositionAtLateral(
  layout: OvalLayout,
  progress: number,
  lateralT: number,
): HorsePoint {
  const { cx, cy, straightHalf, offsetX, offsetY } = layout;
  const { innerR, outerR } = getTrackRadii(layout);
  const midR = (innerR + outerR) / 2;
  const center = stadiumPointAt(cx, cy, straightHalf, midR, progress);
  const len = Math.hypot(center.dx, center.dy) || 1;
  const nx = -center.dy / len;
  const ny = center.dx / len;
  const halfW = (outerR - innerR) / 2;
  const offset = (lateralT - 0.5) * 2 * halfW;

  const flipX = center.dx < -0.12;
  const tiltDeg = Math.max(
    -22,
    Math.min(22, (Math.atan2(center.dy, Math.abs(center.dx) || 0.001) * 180) / Math.PI),
  );

  return {
    x: center.x + nx * offset + offsetX,
    y: center.y + ny * offset + offsetY,
    flipX,
    tiltDeg,
  };
}

export function getHorsePosition(
  layout: OvalLayout,
  progressAlong: number,
  lateralT: number,
): HorsePoint {
  return getHorsePositionAtLateral(layout, progressAlong, lateralT);
}

/** 결승까지 남은 거리 + 가로 위치 (TRACK_LAP_METERS 래핑 없음) */
export function getHorsePositionAtMetersRemaining(
  layout: OvalLayout,
  metersRemaining: number,
  lateralT: number,
): HorsePoint {
  const loopM = mainLoopMeters(layout);
  const meters = Math.max(0, metersRemaining);
  if (meters > loopM) {
    return getChutePosition(layout, meters, lateralT);
  }
  const traveled = loopM - meters;
  const progress = meters <= 0
    ? finishLineProgress(layout)
    : progressFromJoinTraveled(traveled, layout);
  return getHorsePositionAtLateral(layout, progress, lateralT);
}

export function getHorseSpriteTransform(point: HorsePoint): string {
  const parts: string[] = [];
  if (point.flipX) parts.push("scaleX(-1)");
  if (Math.abs(point.tiltDeg) > 0.4) {
    parts.push(`rotate(${point.flipX ? -point.tiltDeg : point.tiltDeg}deg)`);
  }
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function progressForRank(
  baseProgress: number,
  rankIdx: number,
  spread = 0.011,
): number {
  return Math.max(0, baseProgress - rankIdx * spread);
}

export function gateLane(horseNumber: number): number {
  return Math.min(HORSE_LANE_COUNT - 1, Math.max(0, horseNumber - 1));
}

export const RACE_CAMERA_SCALE = 2.05;

export function getCameraTransform(
  focus: HorsePoint,
  viewportW: number,
  viewportH: number,
  scale = RACE_CAMERA_SCALE,
): CameraTransform {
  return {
    scale,
    tx: viewportW / 2 - focus.x * scale,
    ty: viewportH / 2 - focus.y * scale,
  };
}

export function getVisibleRect(
  camera: CameraTransform,
  viewportW: number,
  viewportH: number,
): VisibleRect {
  return {
    x: -camera.tx / camera.scale,
    y: -camera.ty / camera.scale,
    w: viewportW / camera.scale,
    h: viewportH / camera.scale,
  };
}

export function viewportDimensions() {
  if (typeof window === "undefined") {
    return { width: 360, height: 320 };
  }
  const width = Math.min(window.innerWidth - 12, 480);
  const height = Math.min(
    420,
    Math.max(300, Math.floor(window.innerHeight * 0.48)),
  );
  return { width, height };
}

export function raceHorseIconSize(viewportH: number) {
  return Math.round(Math.min(9, Math.max(6, viewportH * 0.02)));
}

/** @deprecated stadiumPointAt 사용 */
export function thetaFromProgress(progressAlong: number): number {
  return Math.PI / 2 - progressAlong * Math.PI * 2;
}
