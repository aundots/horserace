import { copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const exportDir = join(root, 'export');
const gracDir = join(root, 'grac-screenshots');

mkdirSync(gracDir, { recursive: true });

/** 화면1: 경주 관람 / 화면2: 찌라시·예상 (베팅 없음 강조) */
const pairs = [
  {
    source: 'screenshot-vertical-02-race-636x1048.png',
    self: '01-race-self-rated.png',
    ait: '01-race-apps-in-toss.png',
    label: '경주 관람 (LIVE)',
  },
  {
    source: 'screenshot-vertical-03-tips-636x1048.png',
    self: '02-tips-self-rated.png',
    ait: '02-tips-apps-in-toss.png',
    label: '찌라시·1착 예상',
  },
];

for (const { source, self, ait, label } of pairs) {
  const src = join(exportDir, source);
  copyFileSync(src, join(gracDir, self));
  copyFileSync(src, join(gracDir, ait));
  console.log(label, '→', self, ait);
}

writeFileSync(
  join(gracDir, 'UPLOAD-README.txt'),
  `GRAC / 앱인토ss 콘솔 — 게임 주요화면 업로드

게임 주요화면 1
  자체등급분류 게임물 화면 → 01-race-self-rated.png
  앱인토ss 게임물 화면     → 01-race-apps-in-toss.png

게임 주요화면 2
  자체등급분류 게임물 화면 → 02-tips-self-rated.png
  앱인토ss 게임물 화면     → 02-tips-apps-in-toss.png

※ GRAC 직접 신청(기타-앱인토ss) 시 두 칸 모두 같은 플레이 화면이면 됩니다.
  (위 파일은 동일 원본 — 콘솔 양식용 이름만 구분)

재생성: cd assets/apps-in-toss && npm run build && node build-grac-screenshots.mjs
`,
  'utf8',
);

console.log('GRAC folder:', gracDir);
