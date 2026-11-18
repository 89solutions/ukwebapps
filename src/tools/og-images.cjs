// Generates 1200x630 social share images into public/assets/img/og/.
// Needs Playwright (npx playwright / a global install). Run: node src/tools/og-images.cjs
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const pub = path.join(__dirname, '..', '..', 'public');
const logo = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
const img = (f) => 'data:image/webp;base64,' + fs.readFileSync(path.join(pub, 'assets/img/work', f)).toString('base64');
const font = `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap" rel="stylesheet">`;
const card = (title, sub, shot) => `${font}<style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#fff9f2;overflow:hidden;position:relative}
.glow{position:absolute;right:-200px;top:-200px;width:800px;height:800px;background:radial-gradient(circle,rgba(201,105,31,.25),transparent 60%)}
.txt{position:absolute;left:70px;top:70px;width:${shot ? 560 : 1000}px}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;color:#1d1712}.brand svg{width:64px;height:64px}
h1{font-size:${shot ? 54 : 72}px;line-height:1.08;color:#1d1712;margin:60px 0 20px;letter-spacing:-.02em}p{font-size:26px;color:#6b5f56;margin:0;font-weight:600}
.shot{position:absolute;right:-60px;top:110px;width:600px;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(60,35,15,.5);border:1px solid #eadccc;transform:rotate(-2deg)}.shot img{width:100%;display:block}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:linear-gradient(90deg,#c8332b,#c9691f)}
</style><div class="glow"></div><div class="txt"><div class="brand">${logo}Toffee Apple Web</div><h1>${title}</h1><p>${sub}</p></div>${shot ? `<div class="shot"><img src="${shot}"></div>` : ''}<div class="bar"></div>`;
(async () => {
  const { projects } = await import(path.join(__dirname, '..', 'data.mjs'));
  const out = path.join(pub, 'assets/img/og'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const jobs = [['home', card('Websites and apps that win you work', 'Web design &amp; app development · Newcastle upon Tyne')]];
  for (const pr of projects) jobs.push([pr.slug, card(pr.name, `${pr.type} · ${pr.sector}`, img(pr.image))]);
  for (const [n, html] of jobs) { await p.setContent(html, { waitUntil: 'networkidle' }); await p.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 85 }); console.log('og', n); }
  await b.close();
})();
