import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const gallopSvg = readFileSync(join(dir, 'horse-gallop.svg'), 'utf8');
const viewBox = gallopSvg.match(/viewBox="([^"]+)"/)[1];
const pathStart = gallopSvg.indexOf('<path d="') + 9;
const pathEnd = gallopSvg.indexOf('z"/>', pathStart) + 1;
const gallopPath = gallopSvg.slice(pathStart, pathEnd).replace(/\s+/g, ' ').trim();

export function horseSvg({
  body = '#FFFFFF',
  shadow = '#1B64DA',
  speed = '#FFFFFF',
  shadowOpacity = 0.35,
}) {
  return `<g transform="translate(300 228)">
  <ellipse cx="0" cy="108" rx="118" ry="12" fill="${shadow}" opacity="${shadowOpacity}"/>
  <g opacity="0.5" stroke="${speed}" stroke-width="6" stroke-linecap="round">
    <line x1="-168" y1="-20" x2="-108" y2="-20"/>
    <line x1="-178" y1="10" x2="-112" y2="10"/>
    <line x1="-162" y1="40" x2="-100" y2="40"/>
    <line x1="-150" y1="70" x2="-95" y2="70"/>
  </g>
  <svg x="-262" y="-118" width="524" height="264" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
    <path d="${gallopPath}" fill="${body}"/>
  </svg>
</g>`;
}
