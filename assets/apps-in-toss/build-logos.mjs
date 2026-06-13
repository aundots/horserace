import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { horseSvg } from './horse-graphic.mjs';

const title = '\uB9D0\uB808\uC774\uC2A4';
const dir = dirname(fileURLToPath(import.meta.url));

function logoPage({ bg, ground, titleColor, horse }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 600px; height: 600px; overflow: hidden; font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; }
  .logo { width: 600px; height: 600px; background: ${bg}; position: relative; }
  .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 120px; background: ${ground}; }
  .title {
    position: absolute; left: 0; right: 0; bottom: 34px;
    text-align: center; color: ${titleColor};
    font-size: 42px; font-weight: 700; letter-spacing: -0.02em;
  }
  svg { position: absolute; left: 0; top: 0; }
</style>
</head>
<body>
<div class="logo">
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    ${horse}
  </svg>
  <div class="ground"></div>
  <div class="title">${title}</div>
</div>
</body>
</html>`;
}

writeFileSync(
  join(dir, 'logo-light.html'),
  logoPage({
    bg: '#3182f6',
    ground: '#1b64da',
    titleColor: '#fff',
    horse: horseSvg({ body: '#FFFFFF', shadow: '#1B64DA' }),
  }),
  'utf8'
);

writeFileSync(
  join(dir, 'logo-dark.html'),
  logoPage({
    bg: '#191f28',
    ground: '#0f1419',
    titleColor: '#f2f4f6',
    horse: horseSvg({
      body: '#FFFFFF',
      shadow: '#000000',
      speed: '#8BB9FF',
      shadowOpacity: 0.4,
    }),
  }),
  'utf8'
);

console.log('Wrote logo-light.html and logo-dark.html');
