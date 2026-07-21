import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "..", "play-store-screenshots");
mkdirSync(outDir, { recursive: true });

const sourceFile =
  "C:/Users/User/AppData/Local/Temp/claude/C--Users-User-Desktop-horserace/fdbd3069-309c-4e37-8baf-3e481690dc04/scratchpad/horserace-screenshots.html";

// .phone 요소의 DOM 순서 = 갤러리에 나열한 순서(경주 → 홈 → 예상 → 파티 → 결과)
const names = ["01-race", "02-home", "03-predict", "04-party", "05-result"];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();

// max-width:640px 미디어쿼리로 1열(모바일) 레이아웃을 강제해서 폰 크기를 고정한다.
await page.setViewport({ width: 480, height: 1400, deviceScaleFactor: 5 });
await page.goto(`file://${sourceFile}`, { waitUntil: "networkidle0" });

const phones = await page.$$(".phone");
console.log(`found ${phones.length} .phone elements`);

for (let i = 0; i < phones.length; i++) {
  const name = names[i] ?? `screen-${i + 1}`;
  const path = join(outDir, `${name}.png`);
  await phones[i].screenshot({ path });
  console.log("saved", path);
}

await browser.close();
