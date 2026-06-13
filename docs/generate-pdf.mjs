import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mdPath = join(__dirname, 'horserace-marketing-brief.md');
const htmlPath = join(__dirname, 'horserace-marketing-brief.html');
const pdfPath = join(__dirname, 'horserace-marketing-brief.pdf');

const md = readFileSync(mdPath, 'utf8');

function mdToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let inCode = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCode = !inCode;
      html += inCode ? '<pre class="code">' : '</pre>';
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + '\n';
      continue;
    }
    if (line.startsWith('---')) {
      if (inTable) {
        html += '</tbody></table>';
        inTable = false;
      }
      continue;
    }
    if (line.startsWith('|')) {
      const cells = line
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      if (!inTable) {
        html +=
          '<table><thead><tr>' +
          cells.map((c) => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>';
        inTable = true;
      } else {
        html += '<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
      }
      continue;
    }
    if (inTable) {
      html += '</tbody></table>';
      inTable = false;
    }

    if (line.startsWith('# ')) html += `<h1>${inline(line.slice(2))}</h1>`;
    else if (line.startsWith('## ')) html += `<h2>${inline(line.slice(3))}</h2>`;
    else if (line.startsWith('### ')) html += `<h3>${inline(line.slice(4))}</h3>`;
    else if (line.startsWith('> ')) html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    else if (line.trim() !== '') html += `<p>${inline(line)}</p>`;
  }
  if (inTable) html += '</tbody></table>';
  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

const body = mdToHtml(md.replace(/^---[\s\S]*?---\n/, ''));

const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>인앱토스 말경주 — 마케팅 브리프</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1a1a2e;
    margin: 0;
    padding: 0;
  }
  .cover {
    background: linear-gradient(135deg, #0064ff 0%, #3182f6 50%, #1a1a2e 100%);
    color: #fff;
    padding: 32px 28px;
    border-radius: 12px;
    margin-bottom: 24px;
  }
  .cover h1 { font-size: 22pt; margin: 0 0 8px; border: none; color: #fff; }
  .cover .meta { font-size: 10pt; opacity: 0.9; line-height: 1.8; }
  .badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 9pt;
    margin-right: 6px;
    margin-top: 12px;
  }
  h1 { font-size: 16pt; color: #0064ff; border-bottom: 2px solid #0064ff; padding-bottom: 6px; margin-top: 22px; }
  h2 { font-size: 12.5pt; color: #1a1a2e; margin-top: 20px; border-left: 4px solid #0064ff; padding-left: 10px; }
  h3 { font-size: 11pt; color: #333; margin-top: 14px; }
  p { margin: 6px 0; }
  blockquote {
    background: #f0f6ff;
    border-left: 4px solid #0064ff;
    margin: 12px 0;
    padding: 12px 16px;
    font-size: 11pt;
    font-weight: 600;
    color: #0064ff;
    border-radius: 0 8px 8px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th { background: #0064ff; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { border: 1px solid #e5e8eb; padding: 7px 10px; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  pre.code {
    background: #f4f5f7;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 9pt;
    line-height: 1.5;
    white-space: pre-wrap;
    border: 1px solid #e5e8eb;
    page-break-inside: avoid;
  }
  code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-size: 9pt; }
  .footer {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #e5e8eb;
    font-size: 8.5pt;
    color: #888;
    font-style: italic;
  }
  strong { color: #0064ff; }
</style>
</head>
<body>
<div class="cover">
  <h1>인앱토스 말경주 게임</h1>
  <div class="meta">마케팅팀 원페이지 브리프 · 2026년 6월</div>
  <span class="badge">Apps in Toss</span>
  <span class="badge">캐주얼 레이스</span>
  <span class="badge">베팅 없음</span>
  <span class="badge">F2P</span>
</div>
${body}
<div class="footer">horserace · 내부 기획 문서 · 검수 전 카피·수치는 변경될 수 있음</div>
</body>
</html>`;

writeFileSync(htmlPath, fullHtml, 'utf8');

const puppeteer = await import('puppeteer');
const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
});
await browser.close();
console.log('PDF created:', pdfPath);
