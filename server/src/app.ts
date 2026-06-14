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
