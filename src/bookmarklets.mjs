// Bookmarklets for /tools/bookmarklets/. Each `run` is a real function: build.mjs turns it into
// `javascript:(...)()` with Function.prototype.toString, so write it as self-contained browser code
// (no imports, no outside variables). Keep them small and readable.

export const groups = [
  { id: 'reading', name: 'Reading and focus', icon: 'eye' },
  { id: 'productivity', name: 'Productivity', icon: 'bolt' },
  { id: 'uk', name: 'UK and shopping', icon: 'pin' },
  { id: 'dev', name: 'Web and developer tools', icon: 'code' },
  { id: 'media', name: 'Video and images', icon: 'image' },
];

export const bookmarklets = [
  // ---------- Reading ----------
  {
    group: 'reading', name: 'Remove pop-ups',
    desc: 'Removes sticky headers, cookie banners and “subscribe” overlays, and lets the page scroll again.',
    run() {
      document.querySelectorAll('body *').forEach((el) => {
        const p = getComputedStyle(el).position;
        if (p === 'fixed' || p === 'sticky') el.remove();
      });
      for (const el of [document.documentElement, document.body]) {
        el.style.setProperty('overflow', 'auto', 'important');
        el.style.setProperty('position', 'static', 'important');
      }
    },
  },
  {
    group: 'reading', name: 'Dark mode',
    desc: 'Flips the page to dark colours while keeping photos and videos looking normal. Click again to undo.',
    run() {
      const id = 'bm-dark';
      const old = document.getElementById(id);
      if (old) { old.remove(); return; }
      const s = document.createElement('style');
      s.id = id;
      s.textContent = 'html{filter:invert(1) hue-rotate(180deg);background:#fff}img,video,picture,canvas,iframe,svg image,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)}';
      document.head.appendChild(s);
    },
  },
  {
    group: 'reading', name: 'Reader view',
    desc: 'Shows just the main article text in a clean, easy-to-read column. Reload the page to go back.',
    run() {
      const pick = document.querySelector('article') || document.querySelector('main') || [...document.querySelectorAll('div,section')].sort((a, b) => b.querySelectorAll(':scope > p').length - a.querySelectorAll(':scope > p').length)[0] || document.body;
      const html = pick.innerHTML;
      const title = document.title;
      document.open();
      document.write('<!doctype html><meta name="viewport" content="width=device-width"><title></title><style>body{max-width:680px;margin:3rem auto;padding:0 1.2rem;font:19px/1.7 Georgia,serif;color:#222;background:#fdfaf5}img,video{max-width:100%;height:auto}nav,aside,form,button,iframe,script,style{display:none!important}a{color:#9a4513}</style><body></body>');
      document.close();
      document.title = title;
      const h = document.createElement('h1');
      h.textContent = title;
      document.body.appendChild(h);
      document.body.insertAdjacentHTML('beforeend', html);
      document.querySelectorAll('script').forEach((s) => s.remove());
    },
  },
  {
    group: 'reading', name: 'Reading time',
    desc: 'Counts the words on the page and tells you roughly how long it will take to read.',
    run() {
      const words = (document.body.innerText.match(/\S+/g) || []).length;
      const mins = Math.max(1, Math.round(words / 230));
      alert(words.toLocaleString('en-GB') + ' words: about ' + mins + ' minute' + (mins === 1 ? '' : 's') + ' to read.');
    },
  },
  {
    group: 'reading', name: 'Allow copy and right-click',
    desc: 'Undoes sites that stop you selecting text, copying or using the right-click menu.',
    run() {
      const s = document.createElement('style');
      s.textContent = '*{user-select:text!important;-webkit-user-select:text!important}';
      document.head.appendChild(s);
      for (const t of ['copy', 'cut', 'paste', 'selectstart', 'contextmenu', 'mousedown', 'dragstart']) {
        document.addEventListener(t, (e) => e.stopPropagation(), true);
      }
      document.oncontextmenu = document.onselectstart = document.oncopy = null;
      document.body.oncontextmenu = document.body.onselectstart = document.body.oncopy = null;
    },
  },

  // ---------- Productivity ----------
  {
    group: 'productivity', name: 'Copy as Markdown link',
    desc: 'Copies the page as [Page title](address), ready to paste into notes, Slack, GitHub or Notion.',
    run() {
      const t = '[' + document.title.replace(/[[\]]/g, '') + '](' + location.href + ')';
      navigator.clipboard.writeText(t).then(() => alert('Copied:\n' + t), () => prompt('Copy this:', t));
    },
  },
  {
    group: 'productivity', name: 'Clean link',
    desc: 'Strips tracking codes such as utm_source, fbclid and gclid from the address, then copies the tidy link.',
    run() {
      const u = new URL(location.href);
      const junk = /^(utm_|fbclid$|gclid$|gbraid$|wbraid$|msclkid$|mc_|igshid$|si$|ref_?src$|_hs|yclid$|dclid$|twclid$|ttclid$|li_fat_id$|s_cid$|spm$)/i;
      [...u.searchParams.keys()].forEach((k) => { if (junk.test(k)) u.searchParams.delete(k); });
      const clean = u.toString();
      history.replaceState(null, '', clean);
      navigator.clipboard.writeText(clean).then(() => alert('Copied:\n' + clean), () => prompt('Copy this:', clean));
    },
  },
  {
    group: 'productivity', name: 'Email this page',
    desc: 'Starts an email with the page title as the subject, and the link plus any text you’ve highlighted in the body.',
    run() {
      const sel = String(getSelection()).trim();
      location.href = 'mailto:?subject=' + encodeURIComponent(document.title) + '&body=' + encodeURIComponent((sel ? '“' + sel + '”\n\n' : '') + location.href);
    },
  },
  {
    group: 'productivity', name: 'Look it up',
    desc: 'Highlight a word or phrase, then click to search for it. Asks what to search if nothing is highlighted.',
    run() {
      const q = String(getSelection()).trim() || prompt('Search for:');
      if (q) window.open('https://www.google.co.uk/search?q=' + encodeURIComponent(q));
    },
  },
  {
    group: 'productivity', name: 'Archived copy',
    desc: 'Opens the page in the Wayback Machine. Handy for dead links, or to see how a page used to look.',
    run() { window.open('https://web.archive.org/web/*/' + location.href); },
  },
  {
    group: 'productivity', name: 'Send to phone (QR code)',
    desc: 'Shows a QR code of the page address. Scan it with your phone’s camera to open the page there.',
    run() {
      const id = 'bm-qr';
      document.getElementById(id)?.remove();
      const d = document.createElement('div');
      d.id = id;
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:grid;place-items:center;cursor:pointer';
      const img = document.createElement('img');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=' + encodeURIComponent(location.href);
      img.alt = 'QR code for this page';
      img.style.cssText = 'width:280px;height:280px;background:#fff;border-radius:12px';
      d.appendChild(img);
      d.onclick = () => d.remove();
      document.body.appendChild(d);
    },
  },

  // ---------- UK ----------
  {
    group: 'uk', name: 'Add or remove VAT',
    desc: 'Highlight a price (or type one in) to see it with 20% VAT added and taken off.',
    run() {
      const raw = String(getSelection()).trim() || prompt('Price (£):');
      const n = parseFloat((String(raw || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/) || [])[0]);
      if (!n) return;
      const f = (x) => '£' + x.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      alert('Price: ' + f(n) + '\n\nPlus 20% VAT: ' + f(n * 1.2) + '  (VAT ' + f(n * 0.2) + ')\nIf VAT is included: ' + f(n / 1.2) + ' before VAT  (VAT ' + f(n - n / 1.2) + ')');
    },
  },
  {
    group: 'uk', name: 'Price per kg or litre',
    desc: 'Compare shop prices. Highlight something like “£3.50 750g” or “£4 for 4 x 330ml” to get the price per kg or litre.',
    run() {
      const t = (String(getSelection()).trim() || prompt('Price and size, e.g. £3.50 750g') || '').toLowerCase();
      const price = t.match(/£\s*(\d+(?:\.\d+)?)|(\d+)\s*p\b/);
      if (!price) return alert('Couldn’t find a price in “' + t + '”.');
      const pounds = price[1] ? parseFloat(price[1]) : parseInt(price[2], 10) / 100;
      const sz = t.match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l|litres?)\b/);
      if (!sz) return alert('Couldn’t find a size (g, kg, ml, cl or l) in “' + t + '”.');
      const mult = { kg: 1, g: 0.001, l: 1, litre: 1, litres: 1, cl: 0.01, ml: 0.001 };
      const qty = (sz[1] ? parseInt(sz[1], 10) : 1) * parseFloat(sz[2]) * mult[sz[3]];
      const unit = /g$/.test(sz[3]) ? 'kg' : 'litre';
      const per = pounds / qty;
      alert('£' + per.toFixed(2) + ' per ' + unit + '\n(' + (per * 10).toFixed(1) + 'p per ' + (unit === 'kg' ? '100g' : '100ml') + ')');
    },
  },
  {
    group: 'uk', name: 'Amazon price history',
    desc: 'On an Amazon UK product page, shows the product’s price history on CamelCamelCamel so you know if a “deal” really is one.',
    run() {
      const m = location.href.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
      if (!m) return alert('Open an Amazon product page first.');
      window.open('https://uk.camelcamelcamel.com/product/' + m[1]);
    },
  },
  {
    group: 'uk', name: 'Look up a company',
    desc: 'Highlight a company name to look it up on Companies House: directors, accounts and whether it’s still trading.',
    run() {
      const q = String(getSelection()).trim() || prompt('Company name or number:');
      if (q) window.open('https://find-and-update.company-information.service.gov.uk/search?q=' + encodeURIComponent(q));
    },
  },
  {
    group: 'uk', name: 'Postcode on a map',
    desc: 'Highlight a UK postcode (or type one) to see it on a map.',
    run() {
      const t = String(getSelection()).trim() || prompt('Postcode:') || '';
      const m = t.toUpperCase().match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/);
      if (!m) return alert('That doesn’t look like a UK postcode.');
      window.open('https://www.google.co.uk/maps/search/' + encodeURIComponent(m[0]));
    },
  },

  // ---------- Dev ----------
  {
    group: 'dev', name: 'Edit this page',
    desc: 'Lets you click and type anywhere on the page, for mock-ups or screenshots. Only you see the changes; click again to stop.',
    run() {
      const on = document.designMode !== 'on';
      document.designMode = on ? 'on' : 'off';
      document.body.style.outline = on ? '3px dashed #c8332b' : '';
    },
  },
  {
    group: 'dev', name: 'Show page layout',
    desc: 'Outlines every element on the page, so you can see how it’s built and spot what’s breaking the layout. Click again to undo.',
    run() {
      const id = 'bm-outline';
      const old = document.getElementById(id);
      if (old) { old.remove(); return; }
      const s = document.createElement('style');
      s.id = id;
      s.textContent = '*{outline:1px solid rgba(200,51,43,.55)!important}*:hover{outline:2px solid #2f7a4b!important}';
      document.head.appendChild(s);
    },
  },
  {
    group: 'dev', name: 'Screen size',
    desc: 'Shows the browser window’s width and height in CSS pixels, plus the screen’s pixel ratio. Updates as you resize.',
    run() {
      const id = 'bm-size';
      const old = document.getElementById(id);
      if (old) { old.remove(); return; }
      const d = document.createElement('div');
      d.id = id;
      d.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483647;background:#1d1712;color:#fff;font:600 14px/1 system-ui,sans-serif;padding:8px 12px;border-radius:8px;cursor:pointer';
      d.title = 'Click to close';
      const show = () => { d.textContent = innerWidth + ' × ' + innerHeight + '  @' + devicePixelRatio + 'x'; };
      show();
      addEventListener('resize', show);
      d.onclick = () => { removeEventListener('resize', show); d.remove(); };
      document.body.appendChild(d);
    },
  },
  {
    group: 'dev', name: 'Check images for alt text',
    desc: 'Highlights images with no alt text (red) and decorative ones with empty alt text (orange), and tells you how many.',
    run() {
      let missing = 0, empty = 0;
      document.querySelectorAll('img').forEach((i) => {
        if (!i.hasAttribute('alt')) { i.style.outline = '4px solid #c8332b'; missing++; }
        else if (!i.alt.trim()) { i.style.outline = '4px dashed #c9691f'; empty++; }
      });
      alert(document.images.length + ' images\n' + missing + ' with no alt text (red)\n' + empty + ' marked decorative (orange dashed)');
    },
  },
  {
    group: 'dev', name: 'SEO and sharing tags',
    desc: 'Lists the page’s title, description, canonical link, headings and social sharing (Open Graph) tags.',
    run() {
      const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || '(none)';
      const lines = [
        'Title (' + document.title.length + '): ' + document.title,
        'Description (' + meta('meta[name="description"]').length + '): ' + meta('meta[name="description"]'),
        'Canonical: ' + (document.querySelector('link[rel="canonical"]')?.href || '(none)'),
        'Robots: ' + meta('meta[name="robots"]'),
        'H1: ' + ([...document.querySelectorAll('h1')].map((h) => h.textContent.trim()).join(' | ') || '(none)'),
        '',
        ...[...document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')].map((m) => (m.getAttribute('property') || m.name) + ': ' + m.content),
      ];
      alert(lines.join('\n'));
    },
  },
  {
    group: 'dev', name: 'List all links',
    desc: 'Opens a list of every link on the page, with external ones marked, so you can copy or check them.',
    run() {
      const links = [...new Set([...document.links].map((a) => a.href))].sort();
      const w = window.open('', '_blank');
      if (!w) return alert('Allow pop-ups for this site to see the list.');
      w.document.title = links.length + ' links on ' + location.hostname;
      const ul = w.document.createElement('ol');
      ul.style.cssText = 'font:14px/1.6 system-ui,sans-serif';
      links.forEach((h) => {
        const li = w.document.createElement('li');
        const a = w.document.createElement('a');
        a.href = a.textContent = h;
        li.appendChild(a);
        if (new URL(h).hostname !== location.hostname) li.append(' (external)');
        ul.appendChild(li);
      });
      w.document.body.appendChild(ul);
    },
  },
  {
    group: 'dev', name: 'Pick a colour',
    desc: 'Pick any colour on your screen and copy its hex code. Works in Chrome and Edge.',
    run() {
      if (!window.EyeDropper) return alert('Your browser doesn’t support the colour picker. Try Chrome or Edge.');
      new EyeDropper().open().then((r) => navigator.clipboard.writeText(r.sRGBHex).then(() => alert('Copied ' + r.sRGBHex)), () => {});
    },
  },

  // ---------- Media ----------
  {
    group: 'media', name: 'Video speed',
    desc: 'Set every video on the page to any speed, including faster than the site normally allows.',
    run() {
      const v = document.querySelectorAll('video');
      if (!v.length) return alert('No videos found on this page.');
      const r = parseFloat(prompt('Playback speed (e.g. 1.5, 2, 3):', v[0].playbackRate === 1 ? '2' : '1'));
      if (r > 0) v.forEach((x) => { x.playbackRate = r; });
    },
  },
  {
    group: 'media', name: 'Picture-in-picture',
    desc: 'Pops the video out into a small floating window that stays on top while you use other tabs and apps.',
    run() {
      if (document.pictureInPictureElement) { document.exitPictureInPicture(); return; }
      const v = [...document.querySelectorAll('video')].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
      if (!v) return alert('No videos found on this page.');
      v.disablePictureInPicture = false;
      v.requestPictureInPicture().catch((e) => alert('Couldn’t pop out this video: ' + e.message));
    },
  },
  {
    group: 'media', name: 'All images',
    desc: 'Opens every image on the page in a gallery at full size, so you can save the ones you want.',
    run() {
      const srcs = [...new Set([...document.images].map((i) => i.currentSrc || i.src).filter((s) => s && !s.startsWith('data:')))];
      if (!srcs.length) return alert('No images found on this page.');
      const w = window.open('', '_blank');
      if (!w) return alert('Allow pop-ups for this site to see the gallery.');
      w.document.title = srcs.length + ' images from ' + location.hostname;
      w.document.body.style.cssText = 'margin:0;padding:12px;background:#222;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start';
      srcs.forEach((s) => {
        const a = w.document.createElement('a');
        a.href = s; a.target = '_blank';
        const i = w.document.createElement('img');
        i.src = s;
        i.style.cssText = 'max-width:320px;max-height:320px;background:#fff';
        a.appendChild(i);
        w.document.body.appendChild(a);
      });
    },
  },
];
