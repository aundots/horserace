import type { ReactNode } from "react";
import { PlayToastProvider } from "./tds-mobile.tsx";
import "./play-shim.css";

export function TDSMobileAITProvider({
  children,
  brandPrimaryColor = "#3182F6",
}: {
  children: ReactNode;
  brandPrimaryColor?: string;
  userAgent?: unknown;
  fontScaleAvailable?: boolean;
}) {
  return (
    <PlayToastProvider>
      <div className="play-shell" style={{ ["--brand-primary" as string]: brandPrimaryColor }}>
        <div className="app-top-chrome" aria-hidden>
          <div className="app-top-banner-slot" id="app-top-banner-slot" />
        </div>
        <div className="play-shell__main">{children}</div>
      </div>
    </PlayToastProvider>
  );
}
