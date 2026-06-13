import { copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import puppeteer from 'puppeteer';

const dir = dirname(fileURLToPath(import.meta.url));
const source = join(dir, 'source', 'hero-race.png');
const outDir = join(dir, 'export');
mkdirSync(outDir, { recursive: true });

const logoPath = join(outDir, 'app-logo-600x600.png');
const logoDarkPath = join(outDir, 'app-logo-dark-600x600.png');
const thumbPath = join(outDir, 'thumbnail-1932x828.png');

await sharp(source)
  .resize(600, 600, { fit: 'cover', position: 'centre' })
  .png()
  .toFile(logoPath);

const darkOverlay = Buffer.from(`
<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#191F28" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#191F28" stop-opacity="0.28"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
</svg>`);

const logoBuffer = await sharp(source)
  .resize(600, 600, { fit: 'cover', position: 'centre' })
  .png()
  .toBuffer();

await sharp(logoBuffer)
  .composite([{ input: darkOverlay, blend: 'multiply' }])
  .png()
  .toFile(logoDarkPath);

const heroDataUrl = `data:image/png;base64,${(await sharp(source).png().toBuffer()).toString('base64')}`;
const thumbHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1932px; height: 828px; overflow: hidden; font-family: "Noto Sans KR", sans-serif; }
  .banner {
    width: 1932px;
    height: 828px;
    position: relative;
    background: #1b64da;
    overflow: hidden;
  }
  .bg {
    position: absolute;
    inset: 0;
    background-image: url('${heroDataUrl}');
    background-size: cover;
    background-position: 58% center;
  }
  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(15, 20, 25, 0.92) 0%,
      rgba(15, 20, 25, 0.78) 34%,
      rgba(27, 100, 218, 0.35) 62%,
      rgba(49, 130, 246, 0.15) 100%
    );
  }
  .copy {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 96px;
    max-width: 980px;
    color: #fff;
  }
  h1 {
    font-size: 96px;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin-bottom: 24px;
  }
  p {
    font-size: 34px;
    font-weight: 700;
    line-height: 1.45;
    opacity: 0.95;
  }
  .badge {
    display: inline-block;
    margin-bottom: 28px;
    padding: 10px 18px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    font-size: 22px;
    font-weight: 700;
  }
</style>
</head>
<body>
  <div class="banner">
    <div class="bg"></div>
    <div class="shade"></div>
    <div class="copy">
      <span class="badge">캐주얼 말 레이싱</span>
      <h1>말레이스</h1>
      <p>매일 연습주행, 주말 랭킹 레이스<br/>끝까지 엎치락뒤치락 · 찌라시 예상</p>
    </div>
  </div>
</body>
</html>`;

const thumbHtmlPath = join(dir, 'thumbnail-render.html');
writeFileSync(thumbHtmlPath, thumbHtml, 'utf8');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1932, height: 828, deviceScaleFactor: 1 });
await page.goto('file:///' + thumbHtmlPath.replace(/\\/g, '/'), {
  waitUntil: 'networkidle0',
});
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: thumbPath, clip: { x: 0, y: 0, width: 1932, height: 828 } });
await browser.close();

console.log('Brand assets:', logoPath, logoDarkPath, thumbPath);
