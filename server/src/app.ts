import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { partyPersistenceEnabled } from "./lib/partyPersistence.js";
import { isPlayDemoEnabled } from "./lib/playDemo.js";
import { startSettlementScheduler } from "./jobs/weeklySettlement.js";
import { adsRouter } from "./routes/ads.js";
import { authRouter } from "./routes/auth.js";
import { horseRouter } from "./routes/horse.js";
import { marketRouter } from "./routes/market.js";
import { partyRouter } from "./routes/party.js";
import { playerRouter } from "./routes/player.js";
import { raceRouter } from "./routes/race.js";
import { retentionRouter } from "./routes/retention.js";
import { rewardRouter } from "./routes/reward.js";
import { shopRouter } from "./routes/shop.js";
import { weeklyPassRouter } from "./routes/weeklyPass.js";

export const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "X-Session-Id",
      "X-Horserace-Demo-State",
    ],
  }),
);
app.use(express.json());

// AdMob app-ads.txt 인증용. IAB 사양상 반드시 "도메인 루트"에 있어야 하므로,
// GitHub Pages 서브경로(aundots.github.io/horserace/...) 대신 이 서버가 직접
// 소유한 도메인 루트에서 서빙한다. Play Console 스토어 등록정보의 "웹사이트"를
// 이 서버 주소로 설정해야 AdMob이 이 파일을 찾는다.
app.get("/app-ads.txt", (_req, res) => {
  res.type("text/plain").send("google.com, pub-3585849238017368, DIRECT, f08c47fec0942fa0\n");
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: config.appName,
    playDemo: isPlayDemoEnabled(),
    partyRedis: partyPersistenceEnabled(),
  });
});

app.use("/auth", authRouter);
app.use("/player", playerRouter);
app.use("/horse", horseRouter);
app.use("/race", raceRouter);
app.use("/shop", shopRouter);
app.use("/market", marketRouter);
app.use("/ads", adsRouter);
app.use("/retention", retentionRouter);
app.use("/party", partyRouter);
app.use("/weekly-pass", weeklyPassRouter);
app.use("/reward", rewardRouter);

startSettlementScheduler();

export default app;
