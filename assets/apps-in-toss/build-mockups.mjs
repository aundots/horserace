import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const heroDataUrl = `data:image/png;base64,${readFileSync(join(root, 'source', 'hero-race.png')).toString('base64')}`;

const t = {
  brand: '\uB9D0\uB808\uC774\uC2A4',
  stamina: '\uACBD\uC8FC\uB825',
  practice: '\uC5F0\uC2B5\uC8FC\uD589',
  practiceNow: '\uC9C0\uAE08 \uB2EC\uB9AC\uAE30 \u00B7 \uC57D 1\uBD84 30\uCD08',
  todayPractice: '\uC624\uB298 \uC5F0\uC2B5',
  weekendTicket: '\uC8FC\uB9D0 \uD2F0\uCF13',
  times: '\uD68C',
  friRank: '\uAE08\uC694\uC77C \u00B7 \uB0B4\uC77C \uB79C\uD0B9',
  trackPrep: '\uC8FC\uB85C \uD3B8\uC131: \uC2B5\uC724 \u00B7 \uCC0C\uB77C\uC2DC \uC900\uBE44',
  mission: '\uC624\uB298\uC758 \uBBF8\uC158 2/3',
  segment: '\uAD6C\uAC04 3/4',
  overtake: '\uC5ED\uC804!',
  battle: '2\uBC88 \u2194 4\uBC88 \uC811\uC804',
  myHorse2: '\uB0B4 \uB9D0 2\uC704',
  gap: '1\uC704\uC640 0.1\uCD08 \uCC28',
  finish: '\uCD94\uC785 \uB9C8\uBB34\uB9AC',
  drama: '\uC5CE\uCE58\uB77D\uB4A4\uCE58\uB77D \uACB0\uC2B9 \uC9C1\uC804',
  wetTrack: '\uC8FC\uB85C \uC2B5\uC724 \u00B7 \uD398\uC774\uC2A4 \uCD94\uC785',
  weekendRank: '\uC8FC\uB9D0 \uB79C\uD0B9',
  saturday: '\uD1A0\uC694\uC77C',
  todayTrack: '\uC624\uB298\uC758 \uC8FC\uB85C \u00B7 \uC2B5\uC724 1600m',
  tipsBoard: '\uCC0C\uB77C\uC2DC\uD310',
  sure: '\uD655\uC2E4',
  likely: '\uC720\uB825',
  rumor: '\uC18C\uBB38',
  tip1: '4\uBC88 \uCD94\uC785 \uB9C8\uBB34\uB9AC',
  tip2: '2\uBC88 \uC2B5\uC724 \uAC15\uD568',
  tip3: '7\uBC88 \uCEE8\uB514\uC158 \uC758\uBB38',
  predict: '4\uBC88 \uC608\uC0C1 1\uCC29 \u00B7 \uBCA0\uD305 \uC5C6\uC74C',
  ticket: '\uB79C\uD0B9 \uD2F0\uCF13 3/3',
  hitReward: '\uC801\uC911 \uC2DC \uB3C4\uAC10 \u00B7 \uC801\uC911 \uC0C1\uC790',
  division: '\uB514\uBE44\uC804',
  gold3: '\uACE8\uB4DC 3\uC870',
  weekRank: '\uC774\uBC88 \uC8FC \uC21C\uC704',
  myRank: '12\uC704 / 40\uBA85 \u00B7 \uB9C8\uC2A4\uD130 \uC2B9\uAE09\uAE4C\uC9C0 28\uC810',
  name1: '\uBC14\uB78C\uB3CC\uC774',
  name2: '\uC9C8\uC8FC\uC655',
  name3: '\uB098\uC758\uB9D0',
  startRank: '\uB79C\uD0B9 \uACBD\uC8FC \uC2DC\uC791',
  best2: '\uBCA0\uC2A4\uD2B82 \uD3C9\uADE0 \uBC18\uC601',
  subtitle: '\uB9E4\uC77C \uC5F0\uC2B5\uC8FC\uD589, \uC8FC\uB9D0 \uB79C\uD0B9 \uB808\uC774\uC2A4',
  promo: '\uCC0C\uB77C\uC2DC \uC77D\uACE0 1\uCC29 \uC608\uC0C1 \u00B7 \uBCA0\uD305 \uC5C6\uC74C',
  thumb2: '\uB05D\uAE4C\uC9C0 \uC5CE\uCE58\uB77D\uB4A4\uCE58\uB77D \u00B7 \uCC0C\uB77C\uC2DC \uC608\uC0C1',
  tips: '\uCC0C\uB77C\uC2DC',
  predictShort: '4\uBC88 \uC608\uC0C1 1\uCC29',
  overtakeShort: '\uC5ED\uC804 \uC811\uC804',
};

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800;900&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; background: #111; }
  .phone { width: 390px; height: 844px; background: #f2f4f6; overflow: hidden; position: relative; color: #191f28; }
  .status { height: 44px; padding: 12px 20px 0; font-size: 14px; font-weight: 600; }
  .header { padding: 8px 20px 16px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 24px; font-weight: 800; }
  .badge { background: #e8f3ff; color: #3182f6; font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 999px; }
  .card { margin: 0 16px 12px; background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
  .cta { margin: 0 16px; background: linear-gradient(135deg, #3182f6, #1b64da); color: #fff; border-radius: 16px; padding: 20px; text-align: center; }
  .cta strong { display: block; font-size: 22px; margin-bottom: 6px; }
  .cta span { font-size: 13px; opacity: .9; }
  .row { display: flex; gap: 10px; margin: 0 16px; }
  .mini { flex: 1; background: #fff; border-radius: 14px; padding: 14px; text-align: center; font-size: 13px; font-weight: 700; }
  .mini em { display: block; font-style: normal; font-size: 22px; color: #3182f6; margin-top: 6px; }
  .track { margin: 16px; height: 360px; border-radius: 20px; background: linear-gradient(180deg, #87ceeb 0%, #b8e986 45%, #5ea849 100%); position: relative; overflow: hidden; }
  .lane { position: absolute; left: 24px; right: 24px; height: 2px; background: rgba(255,255,255,.5); }
  .horse { position: absolute; width: 36px; height: 28px; background: #fff; border-radius: 14px 18px 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,.15); }
  .horse::before { content: ""; position: absolute; right: -8px; top: 4px; width: 14px; height: 14px; background: #fff; border-radius: 50%; }
  .hud { position: absolute; top: 12px; left: 12px; right: 12px; background: rgba(0,0,0,.45); color: #fff; border-radius: 12px; padding: 10px 12px; font-size: 12px; }
  .rev { color: #ffd666; font-weight: 800; }
  .rank { position: absolute; bottom: 12px; left: 12px; right: 12px; background: rgba(255,255,255,.92); border-radius: 12px; padding: 12px; font-size: 13px; }
  .rank b { color: #3182f6; }
  .tips .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f2f4f6; font-size: 14px; }
  .tips .tag { color: #3182f6; font-weight: 800; margin-right: 6px; }
  .predict { margin-top: 12px; background: #3182f6; color: #fff; text-align: center; padding: 14px; border-radius: 12px; font-weight: 800; }
  .board .me { background: #e8f3ff; border: 2px solid #3182f6; border-radius: 12px; padding: 12px; margin-top: 8px; font-weight: 700; }
  .wide { width: 1504px; height: 741px; background: linear-gradient(135deg, #e8f3ff, #f2f4f6); display: flex; align-items: center; padding: 48px; gap: 40px; }
  .wide .copy { flex: 1; }
  .wide h2 { font-size: 48px; margin-bottom: 12px; color: #191f28; font-weight: 900; }
  .wide p { font-size: 24px; color: #4e5968; line-height: 1.5; }
  .wide .art {
    width: 620px;
    height: 620px;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 20px 48px rgba(25, 31, 40, 0.12);
    background-image: url('${heroDataUrl}');
    background-size: cover;
    background-position: center;
  }
  .wide .phones { display: flex; gap: 20px; }
</style>
</head>
<body>
<div class="phone" id="screen-home">
  <div class="status">9:41</div>
  <div class="header"><h1>${t.brand}</h1><span class="badge">${t.stamina} 6/8</span></div>
  <div class="cta"><strong>${t.practice}</strong><span>${t.practiceNow}</span></div>
  <div style="height:12px"></div>
  <div class="row">
    <div class="mini">${t.todayPractice}<em>2${t.times}</em></div>
    <div class="mini">${t.weekendTicket}<em>3${t.times}</em></div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="font-size:13px;color:#6b7684;margin-bottom:8px">${t.friRank}</div>
    <div style="font-size:16px;font-weight:700">${t.trackPrep}</div>
  </div>
  <div class="card">
    <div style="font-size:14px;font-weight:700;margin-bottom:8px">${t.mission}</div>
    <div style="height:8px;background:#f2f4f6;border-radius:999px;overflow:hidden"><div style="width:66%;height:100%;background:#3182f6"></div></div>
  </div>
</div>
<div class="phone" id="screen-race">
  <div class="status">9:41</div>
  <div class="header"><h1>${t.practice}</h1><span class="badge">LIVE</span></div>
  <div class="track">
    <div class="lane" style="top:90px"></div><div class="lane" style="top:170px"></div><div class="lane" style="top:250px"></div>
    <div class="hud">${t.segment} \u00B7 <span class="rev">${t.overtake}</span> ${t.battle}</div>
    <div class="horse" style="left:40px;top:130px"></div><div class="horse" style="left:180px;top:118px"></div>
    <div class="horse" style="left:120px;top:210px;background:#e8f3ff"></div><div class="horse" style="left:250px;top:205px"></div>
    <div class="rank"><b>${t.myHorse2}</b> \u00B7 ${t.gap} \u00B7 ${t.finish}</div>
  </div>
  <div class="card"><div style="font-weight:700">${t.drama}</div><div style="font-size:13px;color:#6b7684;margin-top:6px">${t.wetTrack}</div></div>
</div>
<div class="phone" id="screen-tips">
  <div class="status">9:41</div>
  <div class="header"><h1>${t.weekendRank}</h1><span class="badge">${t.saturday}</span></div>
  <div class="card">
    <div style="font-size:13px;color:#6b7684;margin-bottom:8px">${t.todayTrack}</div>
    <div style="font-size:18px;font-weight:800">${t.tipsBoard}</div>
    <div class="tips" style="margin-top:10px">
      <div class="item"><span><span class="tag">\u25CE</span>${t.tip1}</span><span>${t.sure}</span></div>
      <div class="item"><span><span class="tag">\u25CB</span>${t.tip2}</span><span>${t.likely}</span></div>
      <div class="item"><span><span class="tag">\u25B3</span>${t.tip3}</span><span>${t.rumor}</span></div>
    </div>
    <div class="predict">${t.predict}</div>
  </div>
  <div class="card"><div style="font-weight:700">${t.ticket}</div><div style="font-size:13px;color:#6b7684;margin-top:6px">${t.hitReward}</div></div>
</div>
<div class="phone" id="screen-board">
  <div class="status">9:41</div>
  <div class="header"><h1>${t.division}</h1><span class="badge">${t.gold3}</span></div>
  <div class="card board"><div style="font-size:13px;color:#6b7684">${t.weekRank}</div><div class="me">${t.myRank}</div></div>
  <div class="card">
    <div style="font-weight:700;margin-bottom:8px">TOP 3</div>
    <div style="padding:8px 0">1. ${t.name1} \u00B7 8,420</div>
    <div style="padding:8px 0">2. ${t.name2} \u00B7 8,390</div>
    <div style="padding:8px 0">3. ${t.name3} \u00B7 8,120</div>
  </div>
  <div class="cta" style="margin-top:16px"><strong>${t.startRank}</strong><span>${t.best2}</span></div>
</div>
<div class="wide" id="screen-wide">
  <div class="copy"><h2>${t.brand}</h2><p>${t.subtitle}<br/>${t.promo}</p></div>
  <div class="art"></div>
  <div class="phones">
    <div class="phone" style="transform:scale(0.55); margin-right:-120px">
      <div class="status">9:41</div><div class="header"><h1>${t.practice}</h1></div>
      <div class="track" style="height:280px"><div class="hud">${t.overtakeShort}</div><div class="horse" style="left:60px;top:100px"></div><div class="horse" style="left:200px;top:90px"></div></div>
    </div>
    <div class="phone" style="transform:scale(0.55)">
      <div class="status">9:41</div><div class="header"><h1>${t.tips}</h1></div>
      <div class="card"><div class="predict">${t.predictShort}</div></div>
    </div>
  </div>
</div>
</body>
</html>`;

const out = join(dirname(fileURLToPath(import.meta.url)), 'mockups.html');
writeFileSync(out, html, 'utf8');
console.log('Wrote', out);
