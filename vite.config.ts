import { defineConfig, loadEnv } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/";
  const isPlay = mode === "play";

  return {
    base,
    plugins: [react()],
    resolve: isPlay
      ? {
          alias: [
            {
              find: "@apps-in-toss/web-framework/config",
              replacement: path.resolve(
                __dirname,
                "src/play/shim/apps-in-toss-web-framework-config.ts",
              ),
            },
            {
              find: "@apps-in-toss/web-framework",
              replacement: path.resolve(
                __dirname,
                "src/play/shim/apps-in-toss-web-framework.ts",
              ),
            },
            {
              find: "@toss/tds-mobile-ait",
              replacement: path.resolve(__dirname, "src/play/shim/tds-mobile-ait.tsx"),
            },
            {
              find: "@toss/tds-mobile",
              replacement: path.resolve(__dirname, "src/play/shim/tds-mobile.tsx"),
            },
          ],
        }
      : undefined,
  };
});
