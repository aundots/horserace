import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import config from "../granite.config.ts";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { isPlayStoreBuild } from "./lib/playStore";
import { applyNativeSafeAreaInsets } from "./lib/appChrome";
import "./index.css";

if (isPlayStoreBuild()) {
  document.documentElement.classList.add("play-store");
  applyNativeSafeAreaInsets();
  window.addEventListener("load", applyNativeSafeAreaInsets);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TDSMobileAITProvider>
  </StrictMode>,
);
