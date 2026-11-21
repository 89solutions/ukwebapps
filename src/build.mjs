// Builds the static site into public/. Run: node src/build.mjs
// No dependencies. Writes HTML pages, sitemap.xml and robots.txt; assets in public/assets are hand-edited.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, projects, earlier, services, faqs } from './data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TODAY = new Date().toISOString().slice(0, 10);
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path) => site.url + path;
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

// Lucide-style stroke icons
const P = {
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20h10M9 9h2M13 9h2M9 12h6"/>',
  map: '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-4-6.3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  gauge: '<path d="M12 14 16 9"/><path d="M3.3 19a10 10 0 1 1 17.4 0z"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.check}</svg>`;

const orgId = site.url + '/#organization';
const orgSchema = {
  '@type': 'ProfessionalService',
  '@id': orgId,
  name: site.name,
  alternateName: site.altName,
  url: site.url + '/',
  logo: abs('/assets/img/icon-512.png'),
  image: abs('/assets/img/og/home.jpg'),
  description: 'Web design and app development: business websites, web apps, mobile apps and SMS systems for businesses in Newcastle upon Tyne, the North East and across the UK.',
  telephone: site.phoneIntl,
  email: site.email,
  address: { '@type': 'PostalAddress', addressLocality: 'Newcastle upon Tyne', addressRegion: 'Tyne and Wear', addressCountry: 'GB' },
  areaServed: [{ '@type': 'City', name: 'Newcastle upon Tyne' }, { '@type': 'AdministrativeArea', name: 'North East England' }, { '@type': 'Country', name: 'United Kingdom' }],
  knowsAbout: ['Web design', 'Web application development', 'Mobile app development', 'SMS systems', 'Local SEO'],
};

const NAV = [['/', 'Home'], ['/services/', 'Services'], ['/work/', 'Our work'], ['/about/', 'About'], [site.blog, 'Blog']];

function layout({ path, title, description, ogImage = '/assets/img/og/home.jpg', schema = [], body, noindex = false, buy = false }) {
  const canonical = abs(path);
  const graph = { '@context': 'https://schema.org', '@graph': [orgSchema, { '@type': 'WebSite', '@id': site.url + '/#website', url: site.url + '/', name: site.name, alternateName: site.altName, publisher: { '@id': orgId }, inLanguage: 'en-GB' }, ...schema] };
  const nav = NAV.map(([href, label]) => `<li><a href="${href}"${href === path || (href !== '/' && path.startsWith(href)) ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#c8332b">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${abs(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/css/site.css?v=${TODAY}">
<script type="application/ld+json">${json(graph)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <nav class="wrap nav" aria-label="Main">
    <a class="brand" href="/" aria-label="${esc(site.name)} home"><img src="/assets/img/logo.svg" alt="" width="38" height="38"><span>${esc(site.name)}<small>Websites &amp; apps · Newcastle</small></span></a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav-links"><span class="visually-hidden">Menu</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <ul class="nav-links" id="nav-links">${nav}<li><a class="btn btn-primary" href="/contact/"${path === '/contact/' ? ' aria-current="page"' : ''}>Get a quote</a></li></ul>
  </nav>
</header>
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/js/site.js?v=${TODAY}" defer></script>${buy ? `
<div id="paddle-config" hidden data-environment="${esc(site.paddle.environment)}" data-token="${esc(site.paddle.clientToken)}"></div>
<script src="/assets/js/buy.js?v=${TODAY}" defer></script>` : ''}
</body>
</html>
`;
}

function footer() {
  const work = projects.map((p) => `<li><a href="/work/${p.slug}/">${esc(p.name)}</a></li>`).join('');
  const svc = services.map((s) => `<li><a href="/services/#${s.id}">${esc(s.name)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="/"><img src="/assets/img/logo.svg" alt="" width="38" height="38" loading="lazy"><span>${esc(site.name)}<small>${esc(site.altName)}</small></span></a>
        <p>Websites, web apps and mobile apps for businesses in ${esc(site.area)} and across the UK.</p>
        <p><a href="tel:${site.phoneIntl}">${site.phone}</a><br><a href="mailto:${site.email}">${site.email}</a></p>
      </div>
      <div><h2>Services</h2><ul>${svc}</ul></div>
      <div><h2>Our work</h2><ul>${work}</ul></div>
      <div><h2>Company</h2><ul><li><a href="/about/">About us</a></li><li><a href="/work/">Portfolio</a></li><li><a href="${site.blog}">Blog</a></li><li><a href="/contact/">Contact</a></li><li><a href="/terms/">Terms of sale</a></li><li><a href="/refunds/">Refund policy</a></li><li><a href="/privacy/">Privacy policy</a></li></ul></div>
    </div>
    <div class="foot-base"><span>© <span id="year">${new Date().getFullYear()}</span> ${esc(site.name)} (${esc(site.altName)}). All rights reserved.</span><span>Made in the North East with toffee and apples.</span></div>
  </div>
</footer>`;
}

const crumbs = (items) => ({
  html: `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([href, label], i) => i === items.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ol></nav>`,
  schema: { '@type': 'BreadcrumbList', itemListElement: items.map(([href, label], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: abs(href) })) },
});

const canBuy = (p) => Boolean(p.buy && p.buy.priceId && site.paddle.clientToken);
const buyButton = (p, cls = 'btn btn-primary') => `<button type="button" class="${cls}" data-buy data-price-id="${esc(p.buy.priceId)}" data-thanks="/work/${p.slug}/thanks/">Buy ${esc(p.name)} for ${esc(p.buy.display)}</button>`;
const statusTag = (p) => `<span class="tag ${p.status === 'Live' ? 'green' : p.status === 'In development' ? 'red' : 'grey'}">${esc(p.status)}</span>`;

const workCard = (p, lazy = true) => `<a class="work-card reveal" href="/work/${p.slug}/" data-kind="${p.kind}">
  <div class="thumb"><img src="/assets/img/work/${p.image}" alt="${esc(p.imageAlt)}" width="1280" height="800"${lazy ? ' loading="lazy"' : ''} decoding="async"></div>
  <div class="body">
    <div class="tags"><span class="tag">${esc(p.type)}</span>${statusTag(p)}</div>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.tagline)}</p>
    <span class="cta">View project →</span>
  </div>
</a>`;

const ctaBand = (heading = 'Got an idea, or a website that isn’t pulling its weight?', text = 'Tell us what you need. We’ll give you honest advice and a clear, no-obligation quote.') => `<section><div class="wrap"><div class="cta-band reveal">
  <div><h2>${heading}</h2><p>${text}</p></div>
  <div class="btn-row"><a class="btn btn-light" href="/contact/">Get a free quote</a><a class="btn btn-ghost" style="border-color:#fff;color:#fff" href="tel:${site.phoneIntl}">${icon('call')} ${site.phone}</a></div>
</div></div></section>`;

const faqBlock = (list) => `<div class="faq">${list.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const faqSchema = (list) => ({ '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

// ---------- Pages ----------
const pages = {};

pages['/'] = () => {
  const featured = ['truckfood', 'whitfield-electrical', 'tea-and-company', 'dj-plumbing-heating', 'van-stock', 'mapgoals', 'residents-documents', 'file-vault', 'missing-child-locator'].map((s) => bySlug[s]);
  return layout({
    path: '/',
    title: 'Web Design & App Development Newcastle | Toffee Apple Web',
    description: 'Toffee Apple Web (UK Web Apps) builds fast, mobile-friendly websites, web apps and mobile apps for businesses in Newcastle, the North East and the UK.',
    schema: [{ '@type': 'WebPage', '@id': abs('/#webpage'), url: abs('/'), name: 'Web design & app development in Newcastle', isPartOf: { '@id': site.url + '/#website' }, about: { '@id': orgId } }, faqSchema(faqs)],
    body: `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="eyebrow">Newcastle upon Tyne · North East · UK-wide</span>
      <h1>Websites and apps that <em>win you work</em></h1>
      <p class="lead">We design and build fast, good-looking websites, web apps and mobile apps for local businesses. Easy to find on Google, easy to use on a phone, and built to bring in enquiries.</p>
      <div class="btn-row"><a class="btn btn-primary" href="/contact/">Get a free quote ${icon('arrow')}</a><a class="btn btn-ghost" href="/work/">See our work</a></div>
      <ul class="ticks"><li>Mobile-first design</li><li>SEO built in</li><li>You own the code</li></ul>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="shot shot-a"><div class="bar"><i></i><i></i><i></i></div><img src="/assets/img/work/truckfood.webp" alt="" width="1280" height="800" fetchpriority="high"></div>
      <div class="shot shot-b"><div class="bar"><i></i><i></i><i></i></div><img src="/assets/img/work/whitfield-electrical.webp" alt="" width="1280" height="800"></div>
    </div>
  </div>
</section>

<div class="strip"><div class="wrap"><ul>
  <li><span class="icon">${icon('gauge')}</span><div>Fast-loading pages<span>No bloated page builders</span></div></li>
  <li><span class="icon">${icon('search')}</span><div>Found on Google<span>Local SEO &amp; structured data</span></div></li>
  <li><span class="icon">${icon('phone')}</span><div>Made for phones<span>Where your customers are</span></div></li>
  <li><span class="icon">${icon('heart')}</span><div>Local &amp; friendly<span>Talk to the people who build it</span></div></li>
</ul></div></div>

<section>
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">What we do</span><h2>Everything you need to get online and get busy</h2><p class="lead">From a website that makes the phone ring to the custom app that runs your business.</p></div>
    <div class="grid grid-3">
      ${services.slice(0, 5).map((s) => `<article class="card reveal"><span class="icon">${icon(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><a class="more" href="/services/#${s.id}">Find out more</a></article>`).join('\n      ')}
      <article class="card reveal" style="background:var(--toffee-soft);border-color:#f3cfab"><span class="icon" style="background:#fff">${icon('code')}</span><h3>Something else?</h3><p>Alexa skills, integrations, data tools… if it runs on the web, we’re happy to talk about it.</p><a class="more" href="/contact/">Tell us your idea</a></article>
    </div>
  </div>
</section>

<section class="section-sand">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Recent work</span><h2>Websites and apps we’ve built</h2><p class="lead">A few of our latest projects, from trades websites to a street food platform and a phone service for older people.</p></div>
    <div class="grid grid-3">${featured.map((p) => workCard(p)).join('')}</div>
    <p class="center" style="margin-top:2.5rem"><a class="btn btn-primary" href="/work/">See all our work ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section-dark">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">How it works</span><h2>Simple, from first chat to launch</h2></div>
    <ol class="steps grid grid-4">
      <li class="reveal"><h3>Chat</h3><p>Tell us about your business and what you want to achieve. No jargon, no hard sell.</p></li>
      <li class="reveal"><h3>Plan &amp; quote</h3><p>We suggest the right approach and send a clear quote, so you know what you’re getting.</p></li>
      <li class="reveal"><h3>Design &amp; build</h3><p>You see your site or app early and often, and your feedback shapes it.</p></li>
      <li class="reveal"><h3>Launch &amp; grow</h3><p>We set up Google, go live, and stay on hand for updates and improvements.</p></li>
    </ol>
  </div>
</section>

<section>
  <div class="wrap split">
    <div class="reveal">
      <span class="eyebrow">Why Toffee Apple?</span>
      <h2>The apple and toffee really shouldn’t go together… but they do</h2>
      <p class="lead">Mixing different technologies is what we love. Websites, databases, maps, text messages and phone calls, blended into something that just works for your customers.</p>
      <ul class="check-list">
        <li><strong>Built properly, by hand.</strong> Clean code that loads fast and keeps working.</li>
        <li><strong>Search-ready from day one.</strong> Titles, descriptions, structured data and sitemaps on every site.</li>
        <li><strong>Accessible to everyone.</strong> Readable text, good contrast and full keyboard support.</li>
        <li><strong>No lock-in.</strong> You own your site, your content and your domain.</li>
      </ul>
      <a class="btn btn-ghost" href="/about/">About us</a>
    </div>
    <div class="reveal">
      <div class="shot"><div class="bar"><i></i><i></i><i></i></div><img src="/assets/img/work/dj-plumbing-heating.webp" alt="D&amp;J Plumbing and Heating website, built by Toffee Apple Web" width="1280" height="800" loading="lazy"></div>
    </div>
  </div>
</section>

<section class="section-sand">
  <div class="wrap narrow">
    <div class="section-head center"><span class="eyebrow">Questions</span><h2>Frequently asked questions</h2></div>
    ${faqBlock(faqs)}
  </div>
</section>
${ctaBand()}`,
  });
};

pages['/services/'] = () => {
  const c = crumbs([['/', 'Home'], ['/services/', 'Services']]);
  return layout({
    path: '/services/',
    title: 'Web Design, Apps & SMS Systems | Toffee Apple Web',
    description: 'Business websites, custom web apps, mobile apps, SMS and voice systems and order status displays, built in Newcastle upon Tyne for businesses UK-wide.',
    ogImage: '/assets/img/og/home.jpg',
    schema: [c.schema, ...services.map((s) => ({ '@type': 'Service', name: s.name, description: s.short, provider: { '@id': orgId }, areaServed: 'GB', url: abs('/services/#' + s.id) }))],
    body: `
<section class="hero">
  <div class="wrap narrow">
    ${c.html}
    <span class="eyebrow">Services</span>
    <h1>Websites, apps and systems that make life easier</h1>
    <p class="lead">Whether you need to be found on Google, take bookings, share documents securely or keep customers updated, we’ll build the right thing, and only the thing you need.</p>
    <div class="btn-row">${services.map((s) => `<a class="tag" style="font-size:.85rem;padding:.45rem .9rem;text-decoration:none" href="#${s.id}">${esc(s.name)}</a>`).join('')}</div>
  </div>
</section>
<div class="wrap">
${services.map((s, i) => `<article class="service" id="${s.id}">
  <div class="split top">
    <div>
      <span class="icon">${icon(s.icon)}</span>
      <h2 style="margin-top:1rem">${esc(s.name)}</h2>
      <p class="lead">${esc(s.short)}</p>
      ${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}
      ${s.related.length ? `<p class="related">See it in action: ${s.related.map((r) => `<a href="/work/${r}/">${esc(bySlug[r].name)}</a>`).join(', ')}</p>` : ''}
    </div>
    <div>
      <ul class="check-list">${s.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${s.apps ? `<ul class="app-list">${s.apps.map(([n, d]) => `<li><strong>${esc(n)}</strong>${esc(d)}</li>`).join('')}</ul>` : ''}
      ${s.related[0] && !s.apps ? `<a class="shot" style="display:block" href="/work/${s.related[0]}/"><div class="bar"><i></i><i></i><i></i></div><img src="/assets/img/work/${bySlug[s.related[0]].image}" alt="${esc(bySlug[s.related[0]].imageAlt)}" width="1280" height="800" loading="lazy"></a>` : ''}
    </div>
  </div>
</article>`).join('\n')}
</div>
${ctaBand('Not sure what you need?', 'Tell us the problem you’re trying to solve and we’ll suggest the simplest way to fix it.')}`,
  });
};

pages['/work/'] = () => {
  const c = crumbs([['/', 'Home'], ['/work/', 'Our work']]);
  return layout({
    path: '/work/',
    title: 'Our Work: Websites & Apps Portfolio | Toffee Apple Web',
    description: 'Websites, web apps and mobile apps built by Toffee Apple Web, including TruckFood, Whitfield Electrical, D&J Plumbing, Van Stock and Tea and Company.',
    schema: [c.schema, { '@type': 'CollectionPage', name: 'Our work', url: abs('/work/'), mainEntity: { '@type': 'ItemList', itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/work/${p.slug}/`), name: p.name })) } }],
    body: `
<section class="hero" style="padding-bottom:1rem">
  <div class="wrap">
    ${c.html}
    <span class="eyebrow">Portfolio</span>
    <h1>Our work</h1>
    <p class="lead" style="max-width:680px">Websites for local trades, apps that solve real problems, and services that make a difference. Every one designed and built by us.</p>
  </div>
</section>
<section style="padding-top:1rem">
  <div class="wrap">
    <div class="filters" role="group" aria-label="Filter projects">
      <button type="button" data-filter="all" aria-pressed="true">All projects</button>
      <button type="button" data-filter="website" aria-pressed="false">Websites</button>
      <button type="button" data-filter="webapp" aria-pressed="false">Web apps</button>
      <button type="button" data-filter="mobile" aria-pressed="false">Mobile apps</button>
    </div>
    <div class="grid grid-3">${projects.map((p, i) => workCard(p, i > 2)).join('')}</div>
  </div>
</section>
<section class="section-sand">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">From the archive</span><h2>Earlier websites</h2><p class="lead">Some of the businesses we’ve built websites for over the years.</p></div>
    <div class="grid grid-2">${earlier.map(([n, img, d]) => `<div class="mini-card reveal"><img src="/assets/img/work/${img}" alt="${esc(n)} website screenshot" width="600" height="300" loading="lazy"><div><h3>${esc(n)}</h3><p>${esc(d)}</p></div></div>`).join('')}</div>
  </div>
</section>
${ctaBand('Want to be our next success story?')}`,
  });
};

for (const [i, p] of projects.entries()) {
  pages[`/work/${p.slug}/`] = () => {
    const c = crumbs([['/', 'Home'], ['/work/', 'Our work'], [`/work/${p.slug}/`, p.name]]);
    const prev = projects[(i - 1 + projects.length) % projects.length];
    const next = projects[(i + 1) % projects.length];
    const isSoftware = p.kind !== 'website';
    const item = isSoftware
      ? { '@type': p.kind.includes('mobile') && !p.kind.includes('webapp') ? 'MobileApplication' : 'WebApplication', name: p.name, description: p.tagline, applicationCategory: 'BusinessApplication', operatingSystem: p.kind === 'mobile' ? 'Android, iOS' : 'Any (web browser)', creator: { '@id': orgId }, image: abs('/assets/img/work/' + p.image), ...(p.url ? { url: p.url } : {}) }
      : { '@type': 'WebSite', name: p.name, description: p.tagline, url: p.url, creator: { '@id': orgId }, image: abs('/assets/img/work/' + p.image) };
    if (isSoftware) {
      item.featureList = p.features.map(([, h]) => h);
      if (p.gallery) item.screenshot = p.gallery.map((g) => abs('/assets/img/work/' + g.img));
      if (p.buy) item.offers = { '@type': 'Offer', price: p.buy.price.toFixed(2), priceCurrency: p.buy.currency, availability: 'https://schema.org/' + (canBuy(p) ? 'InStock' : 'PreOrder'), url: abs(`/work/${p.slug}/#buy`), seller: { '@id': orgId } };
      if (p.offline) item.availableOnDevice = 'Mobile phone';
    }
    const related = projects.filter((x) => x.slug !== p.slug && x.kind.split(' ').some((k) => p.kind.includes(k))).slice(0, 3);
    return layout({
      path: `/work/${p.slug}/`,
      title: `${p.title} | Toffee Apple Web`,
      description: p.metaDescription,
      ogImage: `/assets/img/og/${p.slug}.jpg`,
      buy: canBuy(p),
      schema: [c.schema, { '@type': 'WebPage', url: abs(`/work/${p.slug}/`), name: p.title, about: item, isPartOf: { '@id': site.url + '/#website' }, primaryImageOfPage: abs('/assets/img/work/' + p.image) }, ...(p.faqs ? [faqSchema(p.faqs)] : [])],
      body: `
<section class="hero project-hero">
  <div class="wrap">
    ${c.html}
    <div class="narrow">
      <div class="tags"><span class="tag">${esc(p.type)}</span><span class="tag grey">${esc(p.sector)}</span>${statusTag(p)}</div>
      <h1>${esc(p.name)}</h1>
      <p class="lead">${esc(p.tagline)}</p>
      <div class="btn-row">
        ${p.buy ? `<a class="btn btn-primary" href="#buy">Buy for ${esc(p.buy.display)} ${icon('arrow')}</a>` : p.url ? `<a class="btn btn-primary" href="${p.url}" target="_blank" rel="noopener">Visit ${esc(p.urlLabel)} ${icon('external')}</a>` : `<a class="btn btn-primary" href="/contact/?project=${encodeURIComponent(p.name)}">Ask for a demo ${icon('arrow')}</a>`}
        <a class="btn btn-ghost" href="/contact/">Build something similar</a>
      </div>
    </div>
    <div class="project-shot"><div class="shot"><div class="bar"><i></i><i></i><i></i></div><img src="/assets/img/work/${p.image}" alt="${esc(p.imageAlt)}" width="1280" height="800" fetchpriority="high"></div></div>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap">
    <dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap split top">
    <div>
      <span class="eyebrow">The project</span>
      <h2>${esc(p.introHeading || 'About ' + p.name)}</h2>
      ${p.intro.map((x) => `<p>${esc(x)}</p>`).join('')}
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
    </div>
    <div>
      <span class="eyebrow">How it’s built</span>
      <h2>Under the bonnet</h2>
      <ul class="tech">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
  </div>
</section>
<section class="section-sand">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Key features</span><h2>${esc(p.featuresHeading || 'What ' + p.name + ' does')}</h2></div>
    <div class="grid grid-2">${p.features.map(([ic, h, t]) => `<div class="card feature reveal"><span class="icon">${icon(ic)}</span><div><h3>${esc(h)}</h3><p>${esc(t)}</p></div></div>`).join('')}</div>
  </div>
</section>
${p.gallery ? `<section>
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Screenshots</span><h2>${esc(p.galleryHeading || p.name + ' screenshots')}</h2>${p.galleryIntro ? `<p class="lead">${esc(p.galleryIntro)}</p>` : ''}</div>
    <div class="gallery">${p.gallery.map((g) => `<figure class="reveal"><div class="phone-frame"><img src="/assets/img/work/${g.img}" alt="${esc(g.alt)}" width="480" height="1038" loading="lazy" decoding="async"></div><figcaption><strong>${esc(g.title)}</strong>${esc(g.caption)}</figcaption></figure>`).join('')}</div>
  </div>
</section>` : ''}
${p.steps ? `<section class="section-dark">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">How it works</span><h2>${esc(p.stepsHeading || 'How ' + p.name + ' works')}</h2></div>
    <ol class="steps grid grid-4">${p.steps.map(([h, t]) => `<li class="reveal"><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
  </div>
</section>` : ''}
${p.list ? `<section>
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">${esc(p.list.eyebrow)}</span><h2>${esc(p.list.heading)}</h2><p class="lead">${esc(p.list.intro)}</p></div>
    <ul class="list-grid">${p.list.items.map(([n, d]) => `<li><strong>${esc(n)}</strong><span>${esc(d)}</span></li>`).join('')}</ul>
    ${p.list.footer ? `<p style="margin-top:1.5rem">${esc(p.list.footer)}</p>` : ''}
  </div>
</section>` : ''}
${p.more ? `<section class="section-sand">
  <div class="wrap grid grid-2">${p.more.map(([h, paras]) => `<div class="reveal"><h2 style="font-size:1.6rem">${esc(h)}</h2>${paras.map((x) => `<p>${esc(x)}</p>`).join('')}</div>`).join('')}</div>
</section>` : ''}
${p.buy ? `<section class="section-sand" id="buy">
  <div class="wrap">
    <div class="price-box reveal">
      <div>
        <span class="eyebrow">Get ${esc(p.name)}</span>
        <h2>${esc(p.name)} for ${esc(p.buy.display)}</h2>
        <p class="lead">${esc(p.buy.label)}. No subscription, no account.</p>
        <ul class="check-list">${p.buy.includes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="price-card">
        <p class="price"><span>${esc(p.buy.display)}</span> one-off</p>
        ${canBuy(p) ? buyButton(p, 'btn btn-primary btn-block') : `<a class="btn btn-primary btn-block" href="/contact/?project=${encodeURIComponent(p.name)}">Register your interest</a><p class="small-print">Online checkout is coming soon.</p>`}
        <p class="small-print">${icon('lock')} Secure checkout by Paddle, our reseller and Merchant of Record. By buying you agree to our <a href="/terms/">terms of sale</a>. <a href="/refunds/">14-day refund policy</a>.</p>
      </div>
    </div>
  </div>
</section>` : ''}
${p.faqs ? `<section>
  <div class="wrap narrow">
    <div class="section-head center"><span class="eyebrow">Questions</span><h2>${esc(p.name)} FAQs</h2></div>
    ${faqBlock(p.faqs)}
  </div>
</section>` : ''}
${related.length ? `<section>
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">More like this</span><h2>Related projects</h2></div>
    <div class="grid grid-3">${related.map((r) => workCard(r)).join('')}</div>
  </div>
</section>` : ''}
<section style="padding-top:0">
  <div class="wrap pager">
    <a href="/work/${prev.slug}/" rel="prev"><span>← Previous</span>${esc(prev.name)}</a>
    <a class="next" href="/work/${next.slug}/" rel="next"><span>Next →</span>${esc(next.name)}</a>
  </div>
</section>
${ctaBand(`Want something like ${esc(p.name)}?`, 'We’d love to hear about your project. Get in touch for a friendly chat and a no-obligation quote.')}`,
    });
  };
}

pages['/about/'] = () => {
  const c = crumbs([['/', 'Home'], ['/about/', 'About']]);
  return layout({
    path: '/about/',
    title: 'About Us | Toffee Apple Web, Newcastle Web Developers',
    description: 'Toffee Apple Web (UK Web Apps) is a small, friendly web and app development team in Newcastle upon Tyne, building websites, apps and SMS systems since 2019.',
    schema: [c.schema, { '@type': 'AboutPage', url: abs('/about/'), name: 'About Toffee Apple Web', about: { '@id': orgId } }],
    body: `
<section class="hero">
  <div class="wrap split">
    <div>
      ${c.html}
      <span class="eyebrow">About us</span>
      <h1>A small team that loves mixing technologies</h1>
      <p class="lead">The apple and toffee really shouldn’t go together… but they do, and beautifully. That’s how we think about technology too.</p>
    </div>
    <div style="display:grid;place-items:center"><img src="/assets/img/logo.svg" alt="Toffee Apple Web logo: a red apple with a toffee coating" width="260" height="260"></div>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap split top">
    <div>
      <h2>Who we are</h2>
      <p>Toffee Apple Web, trading online as UK Web Apps, is a small, independent web and app development team based in the North East of England. You’ll deal directly with Peter and Ellie Whitfield. Ellie is also a talented wedding and portrait photographer, so we care about how things look as much as how they work.</p>
      <p>We started out building SMS and voice applications: text message bookings, receipts, two-factor logins and monitoring alerts. Since then we’ve built websites for trades and shops across the region, order status displays for busy food outlets, and full web and mobile apps.</p>
      <p>When you work with us, you talk directly to the people building your website or app. No account managers, no call centres.</p>
    </div>
    <div>
      <h2>What we believe</h2>
      <ul class="check-list">
        <li><strong>Simple beats clever.</strong> We build the simplest thing that solves your problem well.</li>
        <li><strong>Fast matters.</strong> Quick pages rank better and keep visitors around.</li>
        <li><strong>Everyone should be able to use it.</strong> We design for older users, small screens and slow connections.</li>
        <li><strong>Privacy by design.</strong> We collect only what’s needed and look after it properly.</li>
        <li><strong>You should own your stuff.</strong> Your domain, your content, your code.</li>
      </ul>
    </div>
  </div>
</section>
<section class="section-sand">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Recent projects</span><h2>Some of what we’ve been building</h2></div>
    <div class="grid grid-3">${['tea-and-company', 'truckfood', 'whitfield-electrical'].map((s) => workCard(bySlug[s])).join('')}</div>
  </div>
</section>
${ctaBand()}`,
  });
};

pages['/contact/'] = () => {
  const c = crumbs([['/', 'Home'], ['/contact/', 'Contact']]);
  return layout({
    path: '/contact/',
    title: 'Contact Us for a Free Quote | Toffee Apple Web, Newcastle',
    description: 'Get in touch with Toffee Apple Web for a free, no-obligation quote on a website, web app or mobile app. Call 07723 104412 or email info@uk-web-apps.co.uk.',
    schema: [c.schema, { '@type': 'ContactPage', url: abs('/contact/'), name: 'Contact Toffee Apple Web', about: { '@id': orgId } }],
    body: `
<section class="hero">
  <div class="wrap">
    ${c.html}
    <div class="split top">
      <div>
        <span class="eyebrow">Contact</span>
        <h1>Let’s talk about your project</h1>
        <p class="lead">Tell us a little about what you need and we’ll get back to you as soon as we can. No obligation, no hard sell.</p>
        <ul class="contact-list" style="margin-top:2rem">
          <li><span class="icon">${icon('call')}</span><div><strong>Call or text</strong><a href="tel:${site.phoneIntl}">${site.phone}</a></div></li>
          <li><span class="icon">${icon('mail')}</span><div><strong>Email</strong><a href="mailto:${site.email}">${site.email}</a><br><span style="font-size:.92rem">or <a href="mailto:sales@uk-web-apps.co.uk">sales@</a> for quotes, <a href="mailto:ideas@uk-web-apps.co.uk">ideas@</a> for your big idea</span></div></li>
          <li><span class="icon">${icon('pin')}</span><div><strong>Where we work</strong>${esc(site.area)}, and anywhere in the UK by phone and video call</div></li>
        </ul>
      </div>
      <div class="card">
        <h2 style="font-size:1.5rem">Send us a message</h2>
        <form class="form" id="contact-form" action="/sendText.php" method="get">
          <div class="row">
            <label>Your name<input name="name" autocomplete="name" required></label>
            <label>Phone<input name="phone" type="tel" autocomplete="tel" required></label>
          </div>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          <label>What do you need?
            <select name="service"><option value="">Choose one (optional)</option>${services.map((s) => `<option>${esc(s.name)}</option>`).join('')}<option>Something else</option></select>
          </label>
          <label>Message<textarea name="message" rows="5" required placeholder="Tell us about your business and what you’d like to do"></textarea></label>
          <label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
          <button class="btn btn-primary" type="submit">Send message</button>
          <p id="form-status" class="form-status" role="status" tabindex="-1" hidden></p>
          <p style="font-size:.85rem;color:var(--muted);margin:0">We only use your details to reply to your enquiry.</p>
        </form>
      </div>
    </div>
  </div>
</section>
<script>
  // Prefill from "Ask for a demo" links on project pages
  (function(){var p=new URLSearchParams(location.search).get('project');if(p){var m=document.querySelector('#contact-form textarea');m.value='I’d like to see a demo of '+p+'. ';}})();
</script>`,
  });
};

for (const p of projects.filter((x) => x.buy)) {
  pages[`/work/${p.slug}/thanks/`] = () => layout({
    path: `/work/${p.slug}/thanks/`,
    noindex: true,
    buy: true,
    title: `Thank you for buying ${p.name} | Toffee Apple Web`,
    description: `Your ${p.name} download.`,
    body: `<section class="hero"><div class="wrap narrow center" id="download-box">
  <span class="eyebrow">Order complete</span>
  <h1>Thanks for buying ${esc(p.name)}!</h1>
  <p class="lead" style="max-width:600px;margin-inline:auto">${p.buy.hosted ? `Your personal ${esc(p.name)} link is below. We’ve also emailed it to you,` : `Your download is ready below. We’ve also emailed you the link,`} and Paddle will send your receipt.</p>
  <p id="download-status" class="form-status" role="status">Confirming your payment…</p>
  <p class="btn-row" style="justify-content:center"><a id="download-link" class="btn btn-primary" href="#" hidden>${p.buy.hosted ? 'Open' : 'Download'} ${esc(p.name)}</a><button id="copy-link" type="button" class="btn btn-ghost" hidden>Copy link</button></p>
  ${p.buy.hosted ? `<div id="install-steps" class="card" style="text-align:left;margin-top:2rem" hidden>
    <h2 style="font-size:1.3rem">Put ${esc(p.name)} on your phone</h2>
    <ol>
      <li><strong>Open your link on your phone.</strong> On a computer now? Open the email we’ve sent on your phone instead.</li>
      <li><strong>iPhone:</strong> in Safari, tap the Share button, then <em>Add to Home Screen</em>.</li>
      <li><strong>Android:</strong> in Chrome, tap the ⋮ menu, then <em>Add to Home screen</em> or <em>Install app</em>.</li>
      <li>Open ${esc(p.name)} from your home screen. It works offline from then on.</li>
    </ol>
    <p class="small-print" style="text-align:left">Your link is personal to you, so please don’t share it. Keep the email in case you change phone; you can restore your stock from a backup on the new phone.</p>
  </div>` : ''}
  <p style="margin-top:2rem"><a href="/work/${p.slug}/">Back to ${esc(p.name)}</a> · <a href="/contact/">Need help?</a></p>
</div></section>`,
  });
}

const legal = (path, title, description, heading, html) => layout({
  path, title, description,
  schema: [crumbs([['/', 'Home'], [path, heading]]).schema],
  body: `<section class="hero"><div class="wrap narrow legal">${crumbs([['/', 'Home'], [path, heading]]).html}<h1>${heading}</h1><p class="lead">Last updated ${new Date(TODAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>${html}</div></section>`,
});
const LEGAL_NAME = site.legalName || site.name;
const paddleNote = `<p>Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.</p>`;

pages['/terms/'] = () => legal('/terms/', 'Terms of Sale | Toffee Apple Web', 'Terms of sale for apps bought from Toffee Apple Web, including how payment, delivery, licences and refunds work.', 'Terms of sale', `
<h2>Who we are</h2>
<p>This website is run by ${esc(LEGAL_NAME)} (“we”, “us”), trading as ${esc(site.name)} and ${esc(site.altName)}. You can contact us at <a href="mailto:${site.email}">${site.email}</a> or on ${site.phone}.</p>
<h2>Who you are buying from</h2>
${paddleNote}
<p>When you buy, you also agree to <a href="https://www.paddle.com/legal/checkout-buyer-terms" rel="noopener" target="_blank">Paddle’s buyer terms</a>. Prices are shown in pounds sterling. Any tax that applies is worked out by Paddle at checkout.</p>
<h2>What you get</h2>
<p>After payment you get access to the app you bought:</p>
<ul>
<li><strong>Web apps such as Van Stock</strong> are hosted by us. You get a personal link, shown on screen and emailed to you, which opens the app and lets you add it to your phone’s home screen. Once installed, it works offline. The link is for you alone; please don’t share it.</li>
<li><strong>Downloadable apps</strong> come with a download link that works for 30 days and up to 5 downloads.</li>
</ul>
<p>If you have any trouble getting access, contact us and we’ll help. We may switch off access for a link that has been refunded or shared publicly.</p>
<h2>Your licence</h2>
<p>We give you a personal, non-exclusive licence to use the app for yourself or your own business. You may not resell, share publicly or redistribute it. We, or our licensors, keep all intellectual property rights in the app.</p>
<h2>Digital content and your right to cancel</h2>
<p>Because the app is digital content supplied straight away, you agree at checkout that supply starts immediately. Even so, we offer refunds within 14 days, as explained in our <a href="/refunds/">refund policy</a>.</p>
<h2>If something goes wrong</h2>
<p>The app is supplied as described on its page. If it is faulty or not as described, you have rights under the Consumer Rights Act 2015, and we will repair it, replace it or refund you. Nothing in these terms affects your statutory rights.</p>
<p>We will keep hosted apps available for as long as we sell them. If we ever stop, we’ll email you at least 3 months beforehand so you can back up your data.</p>
<p>The app stores your data on your own device. Please use the backup feature regularly; we are not responsible for data lost if a device is lost, reset or replaced without a backup.</p>
<h2>Changes</h2>
<p>We may update these terms from time to time. The version on this page when you buy applies to your purchase.</p>
<p>These terms are governed by the law of England and Wales.</p>`);

pages['/refunds/'] = () => legal('/refunds/', 'Refund Policy | Toffee Apple Web', 'Our 14-day refund policy for apps bought from Toffee Apple Web, and how to ask for a refund.', 'Refund policy', `
<p>We want you to be happy with your purchase. If you’re not, you can ask for a full refund within <strong>14 days</strong> of buying, for any reason.</p>
<h2>How to ask for a refund</h2>
<p>Email <a href="mailto:${site.email}">${site.email}</a> with your order number (it starts <code>txn_</code> and is on your receipt), or reply to your Paddle receipt email. You can also request a refund directly from Paddle at <a href="https://paddle.net" rel="noopener" target="_blank">paddle.net</a>.</p>
${paddleNote}
<p>Refunds go back to the original payment method, usually within 5 to 10 working days. After a refund, please delete your copy of the app.</p>
<p>After 14 days, you still have your full rights under the Consumer Rights Act 2015 if the app is faulty or not as described.</p>`);

pages['/privacy/'] = () => legal('/privacy/', 'Privacy Policy | Toffee Apple Web', 'How Toffee Apple Web collects, uses and protects your personal information when you contact us or buy an app.', 'Privacy policy', `
<p>${esc(LEGAL_NAME)} (trading as ${esc(site.name)}) is responsible for personal information collected through this website. Questions? Email <a href="mailto:${site.email}">${site.email}</a>.</p>
<h2>What we collect and why</h2>
<ul>
<li><strong>Contact form:</strong> your name, phone, email and message, so we can reply to you. Messages are sent to us by text message and email.</li>
<li><strong>Purchases:</strong> Paddle collects your payment details and billing information as Merchant of Record; we never see your card details. Paddle shares your email address and order number with us so we can send your download link and help with any problems.</li>
</ul>
<p>We keep enquiries for as long as needed to deal with them, and order records for up to 6 years for accounting purposes.</p>
<h2>Who we share it with</h2>
<p>Paddle (payments), our web host, and our email and SMS providers, only as needed to provide our service. We never sell your information. See <a href="https://www.paddle.com/legal/privacy" rel="noopener" target="_blank">Paddle’s privacy policy</a> for how Paddle handles your data.</p>
<h2>Cookies</h2>
<p>This website doesn’t use advertising or tracking cookies. Paddle’s checkout may set cookies needed to process your payment securely. Fonts are loaded from Google Fonts.</p>
<h2>Our apps</h2>
<p>Our apps such as Van Stock store your data on your own device. It isn’t sent to us.</p>
<h2>Your rights</h2>
<p>Under UK data protection law you can ask to see, correct or delete the personal information we hold about you, or object to how we use it. Email us and we’ll respond within one month. You can also complain to the Information Commissioner’s Office at <a href="https://ico.org.uk" rel="noopener" target="_blank">ico.org.uk</a>.</p>`);

pages['/404.html'] = () => layout({
  path: '/404.html',
  noindex: true,
  title: 'Page not found | Toffee Apple Web',
  description: 'Sorry, we couldn’t find that page. Try our home page or browse the websites and apps we’ve built for businesses across the UK.',
  body: `<section class="hero"><div class="wrap narrow center">
  <span class="eyebrow">Error 404</span>
  <h1>This page has been eaten</h1>
  <p class="lead">Sorry, we couldn’t find the page you were looking for. It may have moved when we updated the site.</p>
  <div class="btn-row" style="justify-content:center"><a class="btn btn-primary" href="/">Go to the home page</a><a class="btn btn-ghost" href="/work/">See our work</a></div>
</div></section>`,
});

// ---------- Write ----------
const write = (rel, content) => { const f = join(OUT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); };
const urls = [];
for (const [path, fn] of Object.entries(pages)) {
  const file = path.endsWith('.html') ? path.slice(1) : path.slice(1) + 'index.html';
  write(file, fn());
  if (!path.endsWith('.html') && !path.endsWith('/thanks/')) urls.push(path);
}

const prio = (u) => (u === '/' ? '1.0' : u.split('/').length > 3 ? '0.7' : '0.8');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => {
  const p = u.startsWith('/work/') && u !== '/work/' ? bySlug[u.split('/')[2]] : null;
  const imgs = p ? [p.image, ...(p.gallery || []).map((g) => g.img)] : [];
  return `  <url><loc>${abs(u)}</loc><lastmod>${TODAY}</lastmod><priority>${prio(u)}</priority>${imgs.map((i) => `<image:image><image:loc>${abs('/assets/img/work/' + i)}</image:loc></image:image>`).join('')}</url>`;
}).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *
Allow: /
Disallow: /sendText.php
Disallow: /api/
Disallow: /apps/
Disallow: /work/van-stock/thanks/

Sitemap: ${abs('/sitemap.xml')}
`);
console.log(`Built ${urls.length + 1} pages into public/`);
