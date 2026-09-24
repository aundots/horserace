import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'export');
mkdirSync(outDir, { recursive: true });

async function shotElement(browser, htmlPath, selector, outPath, width, height, bg = '#f2f4f6') {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    (sel, tw, th, background) => {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = background;
      const target = document.querySelector(sel);
      for (const child of document.body.children) {
        if (child !== target) child.style.display = 'none';
      }
      const rect = target.getBoundingClientRect();
      const scale = Math.min(tw / rect.width, th / rect.height);
      const offsetX = (tw - rect.width * scale) / 2;
      const offsetY = (th - rect.height * scale) / 2;
      target.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      target.style.transformOrigin = 'top left';
      document.body.style.width = `${tw}px`;
      document.body.style.height = `${th}px`;
      document.body.style.overflow = 'hidden';
    },
    selector,
    width,
    height,
    bg
  );
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width, height } });
  await page.close();
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const htmlPath = join(__dirname, 'mockups.html');

const shots = [
  ['#screen-home', 'screenshot-vertical-01-home-636x1048.png', 636, 1048],
  ['#screen-race', 'screenshot-vertical-02-race-636x1048.png', 636, 1048],
  ['#screen-tips', 'screenshot-vertical-03-tips-636x1048.png', 636, 1048],
  ['#screen-board', 'screenshot-vertical-04-board-636x1048.png', 636, 1048],
  ['#screen-wide', 'screenshot-horizontal-01-promo-1504x741.png', 1504, 741],
];

for (const [sel, name, w, h] of shots) {
  const bg = sel === '#screen-wide' ? '#e8f3ff' : '#f2f4f6';
  await shotElement(browser, htmlPath, sel, join(outDir, name), w, h, bg);
}

await browser.close();

copyFileSync(join(__dirname, 'search-keywords.txt'), join(outDir, 'search-keywords.txt'));
copyFileSync(join(__dirname, 'UPLOAD-README.txt'), join(outDir, 'README.txt'));

console.log('Exported to', outDir);
