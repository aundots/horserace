import type { CSSProperties, ReactNode } from "react";
import type { CameraTransform, OvalLayout } from "../lib/ovalTrack";
import { RaceTrackMinimap } from "./RaceTrackMinimap";
import { TrackOvalSvg } from "./TrackOvalSvg";

type TrackType = "DRY" | "WET" | "HEAVY" | string;

const SKY: Record<string, string> = {
  DRY: "linear-gradient(180deg, #7EC8FF 0%, #B8E4FF 38%, #40916c 72%, #1b4332 100%)",
  WET: "linear-gradient(180deg, #6B8FA8 0%, #9BB8CC 42%, #A8C4B0 78%, #6B9470 100%)",
  HEAVY: "linear-gradient(180deg, #8A96A8 0%, #B0BAC6 45%, #9AAA90 80%, #6B8060 100%)",
};

type HorseDot = { number: number; x: number; y: number; isPlayer?: boolean };

type RaceTrackSceneProps = {
  track: TrackType;
  layout: OvalLayout;
  viewportW: number;
  viewportH: number;
  camera: CameraTransform;
  visibleRect: { x: number; y: number; w: number; h: number };
  minimapHorses: HorseDot[];
  raceDistance?: number;
  hud?: ReactNode;
  footer?: ReactNode;
  finishOverlay?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
};

export function RaceTrackScene({
  track,
  layout,
  viewportW,
  viewportH,
  camera,
  visibleRect,
  minimapHorses,
  raceDistance,
  hud,
  footer,
  finishOverlay,
  children,
  style,
}: RaceTrackSceneProps) {
  const sky = SKY[track] ?? SKY.DRY;

  return (
    <div
      className="race-track-scene"
      style={{
        position: "relative",
        width: viewportW,
        height: viewportH,
        ...style,
      }}
    >
      <div
        className="race-track-scene__frame"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          overflow: "hidden",
          background: sky,
          boxShadow:
            "0 12px 40px rgba(15, 40, 80, 0.14), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* 구름 */}
        <div className="race-track-scene__cloud race-track-scene__cloud--a" />
        <div className="race-track-scene__cloud race-track-scene__cloud--b" />

        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <TrackOvalSvg layout={layout} track={track} raceDistance={raceDistance} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: layout.worldWidth,
              height: layout.worldHeight,
              pointerEvents: "none",
            }}
          >
            {children}
          </div>
        </div>

        <div className="race-track-scene__vignette" aria-hidden />

        {finishOverlay}

        {hud && (
          <div className="race-track-scene__hud">{hud}</div>
        )}

        {footer && (
          <div className="race-track-scene__footer">{footer}</div>
        )}

        <RaceTrackMinimap
          track={track}
          layout={layout}
          horses={minimapHorses}
          visibleRect={visibleRect}
        />
      </div>
    </div>
  );
}
