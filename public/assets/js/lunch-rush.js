/* Lunch Rush: a small food truck game for /games/lunch-rush/. No dependencies.
   Cook on the grill and fryer, build each order on the tray, then tap the customer to serve it. */
(() => {
  'use strict';
  const root = document.getElementById('lunch-rush');
  if (!root) return;

  // ---------- Art (inline SVG, so it looks the same everywhere) ----------
  const sv = (body, vb = '0 0 48 48') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
  const mix = (a, b, t) => {
    const p = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0')).join('');
  };
  const MEAT = { raw: '#e8949b', ready: '#7b4526', burnt: '#2b1c15' };
  const SESAME = '<g fill="#fff3d6"><ellipse cx="17" cy="16" rx="1.6" ry="1"/><ellipse cx="25" cy="13.5" rx="1.6" ry="1"/><ellipse cx="31" cy="17.5" rx="1.6" ry="1"/><ellipse cx="21" cy="19.5" rx="1.6" ry="1"/></g>';
  const ART = {
    bun: () => sv(`<path d="M6 25c0-9 8-15 18-15s18 6 18 15z" fill="#e0a65a"/>${SESAME}<rect x="6" y="29" width="36" height="9" rx="4.5" fill="#d69a4f"/>`),
    patty: (c = MEAT.ready) => sv(`<rect x="5" y="17" width="38" height="14" rx="7" fill="${c}"/><path d="M13 21l5 5M21 21l5 5M29 21l5 5" stroke="rgba(0,0,0,.22)" stroke-width="2" stroke-linecap="round"/>`),
    cheese: () => sv('<path d="M5 15h38l-3 10-5-3-4 8-5-6-5 7-4-7-5 4z" fill="#f6c431"/><circle cx="16" cy="19" r="1.7" fill="#e2a91c"/><circle cx="31" cy="18" r="1.4" fill="#e2a91c"/>'),
    roll: () => sv('<path d="M3 27c0-6 5-9 21-9s21 3 21 9-5 8-21 8S3 33 3 27z" fill="#e3ad66"/><path d="M9 23c5-2 25-2 30 0" stroke="#f3cf93" stroke-width="2.5" fill="none" stroke-linecap="round"/>'),
    sausage: (c = '#a0502a') => sv(`<rect x="3" y="18" width="42" height="12" rx="6" fill="${c}"/><path d="M10 21.5h14" stroke="rgba(255,255,255,.3)" stroke-width="2" stroke-linecap="round"/>`),
    onion: () => sv('<g fill="none" stroke="#9b4f96" stroke-width="3"><ellipse cx="16" cy="25" rx="9" ry="7"/><ellipse cx="32" cy="28" rx="10" ry="7"/><ellipse cx="25" cy="18" rx="7" ry="5"/></g>'),
    chips: (burnt) => sv(`<g fill="${burnt ? '#5b4128' : '#f4cf5b'}" stroke="${burnt ? '#3a2a1a' : '#d9a92e'}" stroke-width=".8"><rect x="14" y="6" width="5" height="22" rx="1" transform="rotate(-10 16 17)"/><rect x="20" y="4" width="5" height="22" rx="1"/><rect x="26" y="5" width="5" height="22" rx="1" transform="rotate(8 28 16)"/><rect x="31" y="9" width="5" height="20" rx="1" transform="rotate(16 33 19)"/></g><path d="M11 21h26l-4 23H15z" fill="#c8332b"/><path d="M13 27h22" stroke="#fff" stroke-width="2.5"/>`),
    pop: () => sv('<rect x="14" y="7" width="20" height="35" rx="4" fill="#2f7a4b"/><ellipse cx="24" cy="8" rx="9" ry="2.5" fill="#cfd6d2"/><rect x="14" y="19" width="20" height="9" fill="#fff9f2"/><path d="M18 23.5h12" stroke="#c8332b" stroke-width="2.5" stroke-linecap="round"/><rect x="16" y="12" width="2.5" height="26" rx="1" fill="rgba(255,255,255,.25)"/>'),
    apple: () => sv('<rect x="22.5" y="2" width="3" height="18" rx="1.5" fill="#e3cfa6"/><circle cx="24" cy="30" r="14" fill="#c8332b"/><path d="M10.4 27a13.8 13.8 0 0 1 27.2 0c-.6 2-2 1.5-2.8 4.2s-2.4 1.6-3-.8-1.8 2.8-3.6 2.6-1.4-3.6-3.2-3.2-1.6 3.2-3.4.4-2.6 1.2-3.6-.8-4.2-.6-3.6-2.4z" fill="#a8551c"/><ellipse cx="18" cy="22" rx="3" ry="2" fill="rgba(255,255,255,.45)"/>'),
  };
  const DISH_ART = {
    burger: (cheese) => sv(`<rect x="6" y="33" width="36" height="8" rx="4" fill="#d69a4f"/><rect x="5" y="24" width="38" height="10" rx="5" fill="${MEAT.ready}"/>${cheese ? '<path d="M6 25h36l-3 7-4-2-4 4-4-3-4 4-4-4-4 3-4-4z" fill="#f6c431"/>' : ''}<path d="M6 25c0-10 8-16 18-16s18 6 18 16z" fill="#e0a65a"/>${SESAME}`),
    hotdog: (onion) => sv(`<path d="M4 24c0-5 6-7 20-7s20 2 20 7z" fill="#c98a3e"/><rect x="2" y="20" width="44" height="10" rx="5" fill="#a0502a"/>${onion ? '<g fill="none" stroke="#9b4f96" stroke-width="2.4"><path d="M9 21q4-5 8 0M19 20q4-5 8 0M29 21q4-5 8 0"/></g>' : ''}<path d="M3 27c0 6 6 9 21 9s21-3 21-9z" fill="#e3ad66"/>`),
  };
  const SKIN = ['#f3cdb0', '#e2ae88', '#c68863', '#8d5a3b', '#5c3a24'];
  const HAIR = ['#2b1c15', '#5a3a22', '#a8551c', '#d8b56a', '#9a9a9a', '#1d1712'];
  const SHIRT = ['#2f7a4b', '#3b6fb0', '#c9691f', '#7d4fa0', '#c8332b', '#46505a', '#d6a419'];
  const face = (L, mood, happy) => {
    const hair = [
      `<path d="M21 36c-2-14 7-21 19-21s21 7 19 21c-3-7-9-10-19-10s-16 3-19 10z" fill="${L.hair}"/>`,
      `<path d="M20 31c0-11 9-17 20-17s20 6 20 17z" fill="${L.cap}"/><path d="M38 28h28c0 3-2 5-5 5H38z" fill="${L.cap}"/>`,
      `<path d="M19 62V36c0-14 9-21 21-21s21 7 21 21v26h-7V38c-4-6-9-8-14-8s-10 2-14 8v24z" fill="${L.hair}"/>`,
      `<circle cx="40" cy="13" r="7" fill="${L.hair}"/><path d="M21 34c0-12 8-18 19-18s19 6 19 18c-4-5-10-8-19-8s-15 3-19 8z" fill="${L.hair}"/>`,
      `<path d="M22 30c2-9 9-13 18-13s16 4 18 13c-5-4-10-5-18-5s-13 1-18 5z" fill="${L.hair}" opacity=".85"/>`,
    ][L.style];
    const m = happy ? 'M32 46q8 9 16 0' : mood > 0.6 ? 'M33 47q7 6 14 0' : mood > 0.3 ? 'M34 49h12' : 'M33 51q7-6 14 0';
    const brows = !happy && mood <= 0.3 ? '<path d="M30 31l7 3M50 31l-7 3" stroke="#1d1712" stroke-width="2.2" stroke-linecap="round"/>' : '';
    const sweat = !happy && mood <= 0.3 ? '<path d="M60 30q3 5 0 7q-3-2 0-7z" fill="#7cc4ec"/>' : '';
    return sv(`<path d="M12 90c0-18 12-28 28-28s28 10 28 28z" fill="${L.shirt}"/><circle cx="40" cy="40" r="20" fill="${L.skin}"/>${hair}<circle cx="33" cy="39" r="2.3" fill="#1d1712"/><circle cx="47" cy="39" r="2.3" fill="#1d1712"/>${brows}<path d="${m}" stroke="#1d1712" stroke-width="2.4" fill="none" stroke-linecap="round"/>${sweat}${L.blush ? '<circle cx="28" cy="46" r="3" fill="#e8949b" opacity=".5"/><circle cx="52" cy="46" r="3" fill="#e8949b" opacity=".5"/>' : ''}`, '0 0 80 90');
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- Menu and rules ----------
  const NAMES = { bun: 'Bun', patty: 'Burger', cheese: 'Cheese', roll: 'Roll', sausage: 'Sausage', onion: 'Onions', chips: 'Chips', pop: 'Pop', apple: 'Toffee apple' };
  const DISHES = [
    { id: 'burger', name: 'Burger', parts: ['bun', 'patty'], price: 4, day: 1, art: () => DISH_ART.burger(false) },
    { id: 'pop', name: 'Can of pop', parts: ['pop'], price: 1.2, day: 1, art: ART.pop },
    { id: 'cheeseburger', name: 'Cheeseburger', parts: ['bun', 'patty', 'cheese'], price: 4.5, day: 2, art: () => DISH_ART.burger(true) },
    { id: 'chips', name: 'Chips', parts: ['chips'], price: 2.5, day: 2, art: () => ART.chips(false) },
    { id: 'hotdog', name: 'Hot dog', parts: ['roll', 'sausage'], price: 3.5, day: 3, art: () => DISH_ART.hotdog(false) },
    { id: 'oniondog', name: 'Hot dog with onions', parts: ['roll', 'sausage', 'onion'], price: 4, day: 3, art: () => DISH_ART.hotdog(true) },
    { id: 'apple', name: 'Toffee apple', parts: ['apple'], price: 2, day: 4, art: ART.apple },
  ];
  const SHELF = [['bun', 'B', 1], ['pop', 'P', 1], ['cheese', 'C', 2], ['roll', 'R', 3], ['onion', 'O', 3], ['apple', 'A', 4]];
  const INTRO = [
    null,
    ['Burgers and pop', 'Put burgers on the grill and pick them up when they’re brown (not black!). Add a bun, then tap the customer to serve them.'],
    ['Cheese and chips', 'Cheeseburgers and chips are on the menu. Chips take a while, so get the fryer going early.'],
    ['Hot dogs', 'Sausages go on the grill too. Some people want onions on theirs.'],
    ['Toffee apples', 'The house special, straight from the shelf. Orders get bigger from today.'],
    ['It’s getting busy', 'Word has got around. Customers come quicker, order more and wait less.'],
  ];
  const SPOTS = 4, GRILL = 4, BASKETS = 2, TRAY_MAX = 6, DAY_LEN = 80, BURN_AFTER = 8;
  const COOK = { patty: 5, sausage: 6, chips: 7 };
  const cfg = (d) => ({
    spawnEvery: Math.max(2.8, 7.5 - d * 0.85),
    patience: Math.max(20, 42 - d * 3.5),
    sizes: d < 2 ? [1] : d < 4 ? [1, 1, 1, 2] : d < 5 ? [1, 1, 2, 2] : [1, 2, 2, 3],
  });
  const money = (n) => '£' + n.toFixed(2);
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  // ---------- Sound ----------
  let actx;
  let muted = store.get('lunchRushMute') === '1';
  const beep = (freqs, dur = 0.09, type = 'sine', vol = 0.07) => {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      for (const f of freqs) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur);
        t += dur * 0.85;
      }
    } catch (e) { /* no audio */ }
  };
  const SFX = {
    tap: () => beep([520], 0.04, 'triangle', 0.04),
    sizzle: () => beep([180, 160], 0.06, 'sawtooth', 0.02),
    ready: () => beep([990], 0.07, 'sine', 0.05),
    serve: () => beep([660, 880, 1320], 0.09, 'triangle'),
    wrong: () => beep([220, 160], 0.12, 'square', 0.04),
    walk: () => beep([420, 320, 220], 0.12, 'sawtooth', 0.035),
    burnt: () => beep([140], 0.2, 'sawtooth', 0.03),
    day: () => beep([523, 659, 784, 1046], 0.1, 'triangle'),
  };

  // ---------- Markup ----------
  const kbd = (k) => `<kbd>${k}</kbd>`;
  root.innerHTML = `
<div class="lr-hud">
  <span class="lr-day">Day 1</span>
  <span class="lr-clock"><span class="lr-time">12:00</span><span class="lr-clockbar"><i></i></span></span>
  <span class="lr-hearts" aria-label="Lives"></span>
  <span class="lr-cash">£0.00</span>
  <button type="button" class="lr-icon" data-act="mute" aria-label="Sound"></button>
  <button type="button" class="lr-icon" data-act="pause" aria-label="Pause">${sv('<rect x="14" y="11" width="7" height="26" rx="2" fill="currentColor"/><rect x="27" y="11" width="7" height="26" rx="2" fill="currentColor"/>')}</button>
</div>
<div class="lr-hatch">${Array.from({ length: SPOTS }, (_, i) => `<button type="button" class="lr-spot" data-act="serve:${i}" aria-label="Customer ${i + 1}">${kbd(i + 1)}</button>`).join('')}</div>
<div class="lr-counter">
  <section class="lr-st lr-grill"><h3>Grill</h3>
    <div class="lr-slots">${Array.from({ length: GRILL }, (_, i) => `<button type="button" class="lr-slot" data-act="grill:${i}" aria-label="Grill space ${i + 1}"></button>`).join('')}</div>
    <div class="lr-adds">
      <button type="button" class="lr-item" data-act="add:patty">${ART.patty(MEAT.raw)}<span>Burger</span>${kbd('G')}</button>
      <button type="button" class="lr-item" data-act="add:sausage" data-day="3">${ART.sausage(MEAT.raw)}<span>Sausage</span>${kbd('S')}</button>
    </div>
  </section>
  <section class="lr-st lr-fryer" data-day="2"><h3>Fryer ${kbd('F')}</h3>
    <div class="lr-baskets">${Array.from({ length: BASKETS }, (_, i) => `<button type="button" class="lr-slot lr-basket" data-act="fry:${i}" aria-label="Fryer basket ${i + 1}"></button>`).join('')}</div>
  </section>
  <section class="lr-st lr-shelf"><h3>Shelf</h3>
    <div class="lr-shelf-grid">${SHELF.map(([id, k, d]) => `<button type="button" class="lr-item" data-act="shelf:${id}" data-day="${d}">${ART[id]()}<span>${NAMES[id]}</span>${kbd(k)}</button>`).join('')}</div>
  </section>
</div>
<div class="lr-traybar">
  <div class="lr-tray" aria-label="Tray"></div>
  <button type="button" class="lr-bin" data-act="bin" aria-label="Bin everything on the tray">${sv('<path d="M10 14h28M19 14V9h10v5M13 14l2 26h18l2-26" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>')}${kbd('X')}</button>
</div>
<p class="lr-msg" aria-live="polite"></p>
<div class="lr-overlay"></div>`;

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const el = {
    day: $('.lr-day'), time: $('.lr-time'), clock: $('.lr-clockbar i'), hearts: $('.lr-hearts'), cash: $('.lr-cash'),
    mute: $('[data-act="mute"]'), spots: $$('.lr-spot'), slots: $$('.lr-grill .lr-slot'), baskets: $$('.lr-basket'),
    tray: $('.lr-tray'), msg: $('.lr-msg'), overlay: $('.lr-overlay'), locks: $$('[data-day]'),
  };
  const setHTML = (node, key, html) => { if (node._k !== key) { node._k = key; node.innerHTML = html; } };

  // ---------- State ----------
  let S;
  let best = parseFloat(store.get('lunchRushBest')) || 0;
  let customerId = 0;
  let msgTimer = 0;

  const newGame = () => { S = { day: 0, cash: 0, hearts: 3, servedTotal: 0, phase: 'title' }; };
  const startDay = () => {
    Object.assign(S, {
      day: S.day + 1, t: 0, spawnT: 1, customers: Array(SPOTS).fill(null), grill: Array(GRILL).fill(null),
      fryer: Array(BASKETS).fill(null), tray: [], dayCash: 0, served: 0, walkouts: 0, phase: 'intro',
    });
    if (S.day > 1) S.hearts = Math.min(3, S.hearts + 1);
    showOverlay();
  };
  const cookState = (item, len) => (item.t < len ? 'cooking' : item.t < len + BURN_AFTER ? 'ready' : 'burnt');
  const say = (text) => { el.msg.textContent = text; msgTimer = 3; };

  const float = (node, text, cls = '') => {
    const r = node.getBoundingClientRect(), R = root.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'lr-float ' + cls;
    f.textContent = text;
    f.style.left = (r.left - R.left + r.width / 2) + 'px';
    f.style.top = (r.top - R.top + r.height * 0.3) + 'px';
    root.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  };

  const spawn = () => {
    const free = S.customers.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    if (!free.length) return false;
    const c = cfg(S.day);
    const menu = DISHES.filter((d) => d.day <= S.day);
    let order;
    do {
      const n = pick(c.sizes);
      order = Array.from({ length: n }, () => pick(menu));
    } while (order.reduce((s, d) => s + d.parts.length, 0) > TRAY_MAX);
    // New dishes get a little extra love on the day they arrive
    if (S.day <= 4 && Math.random() < 0.35) { const fresh = menu.filter((d) => d.day === S.day); if (fresh.length) order[0] = pick(fresh); }
    order.sort((a, b) => DISHES.indexOf(a) - DISHES.indexOf(b));
    const max = c.patience + (order.length - 1) * 6;
    S.customers[pick(free)] = {
      id: ++customerId, order, p: max, max, leave: null, leaveT: 0, shake: 0,
      look: { skin: pick(SKIN), hair: pick(HAIR), cap: pick(SHIRT), shirt: pick(SHIRT), style: Math.floor(Math.random() * 5), blush: Math.random() < 0.4 },
    };
    return true;
  };

  // ---------- Actions ----------
  const toTray = (id) => {
    if (S.tray.length >= TRAY_MAX) { say('The tray is full. Serve someone, or tap an item to bin it.'); SFX.wrong(); return false; }
    S.tray.push(id); SFX.tap(); return true;
  };
  const act = (a) => {
    const [cmd, arg] = a.split(':');
    if (cmd === 'mute') { muted = !muted; store.set('lunchRushMute', muted ? '1' : '0'); drawHud(); if (!muted) SFX.tap(); return; }
    if (cmd === 'start') { newGame(); startDay(); SFX.day(); return; }
    if (cmd === 'open') { S.phase = 'play'; hideOverlay(); SFX.day(); return; }
    if (cmd === 'next') { startDay(); SFX.day(); return; }
    if (cmd === 'pause') { if (S.phase === 'play') { S.phase = 'paused'; showOverlay(); } return; }
    if (cmd === 'resume') { S.phase = 'play'; hideOverlay(); return; }
    if (cmd === 'share') { share(); return; }
    if (S.phase !== 'play') return;
    const i = +arg;
    if (cmd === 'shelf') toTray(arg);
    else if (cmd === 'add') {
      const free = S.grill.findIndex((g) => !g);
      if (free < 0) { say('The grill is full. Pick up what’s cooked first.'); SFX.wrong(); return; }
      S.grill[free] = { type: arg, t: 0 }; SFX.sizzle();
    } else if (cmd === 'grill' || cmd === 'fry') {
      const list = cmd === 'grill' ? S.grill : S.fryer;
      const item = list[i];
      if (!item) {
        if (cmd === 'fry') { list[i] = { type: 'chips', t: 0 }; SFX.sizzle(); }
        else say('Tap Burger' + (S.day >= 3 ? ' or Sausage' : '') + ' below the grill to start cooking.');
        return;
      }
      const st = cookState(item, COOK[item.type]);
      if (st === 'cooking') { say('Not ready yet. Wait until it’s cooked.'); return; }
      if (st === 'burnt') { list[i] = null; SFX.tap(); say('Into the bin it goes.'); return; }
      if (toTray(item.type)) list[i] = null;
    } else if (cmd === 'fryany') {
      const free = S.fryer.findIndex((f) => !f);
      if (free >= 0) act('fry:' + free); else say('Both fryer baskets are busy.');
    } else if (cmd === 'pickup') {
      // Keyboard helper: pick up whichever cooked item has been waiting longest
      const ready = [...S.grill.map((g, n) => ['grill', n, g]), ...S.fryer.map((f, n) => ['fry', n, f])]
        .filter(([, , g]) => g && cookState(g, COOK[g.type]) === 'ready')
        .sort((a, b) => (b[2].t - COOK[b[2].type]) - (a[2].t - COOK[a[2].type]));
      if (ready[0]) act(ready[0][0] + ':' + ready[0][1]); else say('Nothing is ready to pick up yet.');
    } else if (cmd === 'tray') { S.tray.splice(i, 1); SFX.tap(); }
    else if (cmd === 'bin') { if (S.tray.length) { S.tray = []; SFX.tap(); } }
    else if (cmd === 'serve') serve(i);
    draw();
  };

  const orderKey = (c) => c.order.flatMap((d) => d.parts).sort().join();
  const serve = (i) => {
    const c = S.customers[i];
    if (!c || c.leave) return;
    if (!S.tray.length) { say('Make their order on the tray, then tap them to serve it.'); return; }
    if (orderKey(c) !== [...S.tray].sort().join()) {
      c.p = Math.max(0.5, c.p - 4); c.shake = 0.45; SFX.wrong();
      float(el.spots[i], 'That’s not my order!', 'bad');
      return;
    }
    const price = c.order.reduce((s, d) => s + d.price, 0);
    const tip = Math.round(price * 0.5 * (c.p / c.max) * 10) / 10;
    S.cash += price + tip; S.dayCash += price + tip; S.served++; S.servedTotal++;
    S.tray = [];
    c.leave = 'happy'; c.leaveT = 0.7;
    SFX.serve();
    float(el.spots[i], '+' + money(price + tip) + (tip >= price * 0.35 ? ' Speedy!' : ''), 'good');
  };

  const share = () => {
    const text = `I made ${money(S.cash)} in ${S.day} day${S.day === 1 ? '' : 's'} on Lunch Rush, the food truck game. Can you beat it?`;
    const url = location.origin + location.pathname;
    if (navigator.share) navigator.share({ title: 'Lunch Rush', text, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(() => say('Copied. Paste it to a friend!'));
  };

  // ---------- Loop ----------
  const tick = (dt) => {
    S.t += dt;
    if (msgTimer > 0 && (msgTimer -= dt) <= 0) el.msg.textContent = '';
    for (const list of [S.grill, S.fryer]) {
      for (const it of list) {
        if (!it) continue;
        const len = COOK[it.type], before = cookState(it, len);
        it.t += dt;
        const after = cookState(it, len);
        if (before !== after) (after === 'ready' ? SFX.ready : SFX.burnt)();
      }
    }
    S.customers.forEach((c, i) => {
      if (!c || S.phase !== 'play') return;
      if (c.shake > 0) c.shake -= dt;
      if (c.leave) { if ((c.leaveT -= dt) <= 0) S.customers[i] = null; return; }
      if ((c.p -= dt) <= 0) {
        c.leave = 'angry'; c.leaveT = 0.7; S.hearts--; S.walkouts++; SFX.walk();
        float(el.spots[i], 'I’m off!', 'bad');
        if (S.hearts <= 0) gameOver();
      }
    });
    if (S.phase !== 'play') return;
    if (S.t >= DAY_LEN) { endDay(); return; }
    S.spawnT -= dt;
    if (S.customers.every((c) => !c) && S.spawnT > 1.2) S.spawnT = 1.2;
    if (S.spawnT <= 0 && S.t < DAY_LEN - 6) {
      const c = cfg(S.day);
      S.spawnT = spawn() ? c.spawnEvery * (0.7 + Math.random() * 0.6) : 0.6;
    }
  };

  const endDay = () => {
    S.phase = 'dayEnd';
    S.customers = S.customers.map(() => null);
    SFX.day();
    showOverlay();
  };
  const gameOver = () => {
    S.phase = 'over';
    S.newBest = S.cash > best;
    if (S.newBest) { best = S.cash; store.set('lunchRushBest', String(best)); }
    setTimeout(showOverlay, 700);
  };

  // ---------- Drawing ----------
  const drawHud = () => {
    el.day.textContent = 'Day ' + Math.max(1, S.day);
    const frac = S.t ? Math.min(1, S.t / DAY_LEN) : 0;
    const mins = Math.floor(frac * 120);
    el.time.textContent = (12 + Math.floor(mins / 60)) + ':' + String(mins % 60).padStart(2, '0');
    el.clock.style.width = frac * 100 + '%';
    setHTML(el.hearts, S.hearts, '<span>♥</span>'.repeat(Math.max(0, S.hearts)) + '<span class="off">♥</span>'.repeat(3 - Math.max(0, S.hearts)));
    el.cash.textContent = money(S.cash);
    setHTML(el.mute, muted, muted
      ? sv('<path d="M8 19h7l9-8v26l-9-8H8z" fill="currentColor"/><path d="M31 19l10 10M41 19 31 29" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>')
      : sv('<path d="M8 19h7l9-8v26l-9-8H8z" fill="currentColor"/><path d="M30 18q5 6 0 12M35 13q10 11 0 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'));
    el.mute.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  };

  const drawCooker = (node, item) => {
    if (!item) { setHTML(node, 'empty', node.classList.contains('lr-basket') ? '<span class="lr-hint">Tap to fry</span>' : ''); node.className = node.className.replace(/ (cooking|ready|warn|burnt)/g, ''); return; }
    const len = COOK[item.type], st = cookState(item, len);
    const warn = st === 'ready' && item.t > len + BURN_AFTER * 0.55;
    let art;
    if (item.type === 'chips') art = st === 'cooking' ? `<span class="lr-oil">${ART.chips(false)}</span>` : ART.chips(st === 'burnt');
    else {
      const col = st === 'cooking' ? mix(MEAT.raw, MEAT.ready, Math.min(1, item.t / len) * 0.85) : st === 'ready' ? (warn ? mix(MEAT.ready, MEAT.burnt, 0.4) : MEAT.ready) : MEAT.burnt;
      art = ART[item.type](col);
    }
    const label = st === 'ready' ? '<b class="lr-tag ok">Ready</b>' : st === 'burnt' ? '<b class="lr-tag bad">Burnt: bin it</b>' : '';
    setHTML(node, item.type + st + (warn ? 'w' : '') + (st === 'cooking' ? Math.floor(item.t * 2) : ''), art + label + (st === 'cooking' ? `<span class="lr-prog"><i style="width:${Math.min(100, (item.t / len) * 100)}%"></i></span>` : '') + (st === 'burnt' ? '<span class="lr-smoke"></span>' : ''));
    node.classList.toggle('cooking', st === 'cooking');
    node.classList.toggle('ready', st === 'ready');
    node.classList.toggle('warn', warn);
    node.classList.toggle('burnt', st === 'burnt');
  };

  const draw = () => {
    if (!S) return;
    drawHud();
    const day = Math.max(1, S.day);
    el.locks.forEach((n) => { const l = +n.dataset.day > day; n.classList.toggle('locked', l); if (n.tagName === 'BUTTON') n.disabled = l; });
    el.baskets.forEach((n) => { n.disabled = day < 2; });
    const trayKey = [...(S.tray || [])].sort().join();
    el.spots.forEach((node, i) => {
      const c = S.customers && S.customers[i];
      if (!c) { setHTML(node, 'none', kbd(i + 1)); node.className = 'lr-spot'; node.disabled = true; return; }
      node.disabled = !!c.leave;
      const mood = c.p / c.max;
      const bucket = c.leave ? c.leave : mood > 0.6 ? 'a' : mood > 0.3 ? 'b' : 'c';
      setHTML(node, c.id + bucket, `${kbd(i + 1)}<span class="lr-bubble">${c.order.map((d) => `<span class="lr-dish" title="${d.name}">${d.art()}</span>`).join('')}</span><span class="lr-cust">${face(c.look, mood, c.leave === 'happy')}</span><span class="lr-pat"><i></i></span><span class="visually-hidden">wants ${c.order.map((d) => d.name).join(' and ')}</span>`);
      const bar = node.querySelector('.lr-pat i');
      if (bar) { bar.style.width = Math.max(0, mood * 100) + '%'; bar.style.background = mood > 0.6 ? '#4cc072' : mood > 0.3 ? '#f6c431' : '#e5483f'; }
      node.className = 'lr-spot' + (c.leave ? ' ' + c.leave : '') + (c.shake > 0 ? ' shake' : '') + (!c.leave && trayKey && orderKey(c) === trayKey ? ' match' : '');
    });
    if (S.grill) {
      S.grill.forEach((g, i) => drawCooker(el.slots[i], g));
      S.fryer.forEach((f, i) => drawCooker(el.baskets[i], f));
    }
    const tray = S.tray || [];
    setHTML(el.tray, tray.join(), tray.length
      ? tray.map((id, i) => `<button type="button" data-act="tray:${i}" aria-label="Remove ${NAMES[id]}">${id === 'patty' || id === 'sausage' ? ART[id]() : id === 'chips' ? ART.chips(false) : ART[id]()}</button>`).join('')
      : '<span class="lr-hint">Your tray. Tap food to put it here, then tap a customer to serve them.</span>');
  };

  const menuList = (day) => DISHES.filter((d) => d.day === day).map((d) => `<li><span class="lr-dish">${d.art()}</span><span><b>${d.name}</b><small>${d.parts.map((p) => NAMES[p]).join(' + ')} · ${money(d.price)}</small></span></li>`).join('');
  const showOverlay = () => {
    const o = el.overlay;
    let h = '';
    if (S.phase === 'title') {
      h = `<div class="lr-truck">${truckArt()}</div><h2>Lunch Rush</h2>
<p>You’re running the hatch at <b>The Toffee Apple</b> food truck. Cook, build each order on your tray, then tap the customer to serve them before they get fed up.</p>
<ul class="lr-rules"><li>Food on the grill and fryer cooks by itself. Pick it up when it says <b>Ready</b>, before it burns.</li><li>Order glowing green? Your tray matches: tap them!</li><li>Fast service earns tips. Three walk-outs and it’s game over.</li></ul>
${best ? `<p class="lr-best">Your best: <b>${money(best)}</b></p>` : ''}
<button type="button" class="btn btn-primary" data-act="start">Start your shift</button>`;
    } else if (S.phase === 'intro') {
      const [t, d] = INTRO[Math.min(S.day, INTRO.length - 1)];
      h = `<p class="lr-kicker">Day ${S.day}</p><h2>${t}</h2><p>${d}</p>${menuList(S.day) ? `<ul class="lr-menu">${menuList(S.day)}</ul>` : ''}${S.day > 1 ? `<p class="lr-small">You’re on ${S.hearts} ${S.hearts === 1 ? 'life' : 'lives'} and ${money(S.cash)} so far.</p>` : ''}
<button type="button" class="btn btn-primary" data-act="open">Open the hatch</button>`;
    } else if (S.phase === 'dayEnd') {
      h = `<p class="lr-kicker">2:00pm, closing time</p><h2>Day ${S.day} done!</h2>
<dl class="lr-stats"><div><dt>Served</dt><dd>${S.served}</dd></div><div><dt>Walk-outs</dt><dd>${S.walkouts}</dd></div><div><dt>Today</dt><dd>${money(S.dayCash)}</dd></div><div><dt>Total</dt><dd>${money(S.cash)}</dd></div></dl>
${S.hearts < 3 ? '<p class="lr-small">A good night’s sleep gives you back a life.</p>' : ''}
<button type="button" class="btn btn-primary" data-act="next">On to day ${S.day + 1}</button>`;
    } else if (S.phase === 'over') {
      h = `<p class="lr-kicker">Out of lives</p><h2>${S.newBest ? 'New best!' : 'Hatch closed'}</h2>
<p>You served <b>${S.servedTotal}</b> customer${S.servedTotal === 1 ? '' : 's'} over ${S.day} day${S.day === 1 ? '' : 's'} and took</p><p class="lr-big">${money(S.cash)}</p>
<p class="lr-small">Your best: ${money(best)}</p>
<div class="lr-btns"><button type="button" class="btn btn-primary" data-act="start">Play again</button><button type="button" class="btn btn-ghost" data-act="share">Share score</button></div>`;
    } else if (S.phase === 'paused') {
      h = `<h2>Paused</h2><p>Your customers are frozen in time. Lucky you.</p><button type="button" class="btn btn-primary" data-act="resume">Carry on</button>`;
    }
    o.innerHTML = `<div class="lr-card" role="dialog" aria-label="Lunch Rush">${h}</div>`;
    o.hidden = false;
    root.classList.add('lr-dim');
    draw();
    const b = o.querySelector('.btn-primary');
    if (b && root.contains(document.activeElement)) b.focus({ preventScroll: true });
  };
  const hideOverlay = () => { el.overlay.hidden = true; root.classList.remove('lr-dim'); };

  function truckArt() {
    return sv(`<rect x="10" y="30" width="130" height="62" rx="8" fill="#c8332b"/><path d="M140 48h28l14 20v24h-42z" fill="#a92820"/><path d="M146 54h19l10 14h-29z" fill="#bfe3f2"/>
<rect x="24" y="40" width="80" height="32" rx="4" fill="#2a211b"/><rect x="24" y="40" width="80" height="32" rx="4" fill="none" stroke="#fff9f2" stroke-width="3"/>
<path d="M18 40h92l-6-12H24z" fill="#fff9f2"/><path d="M24 28h12l-2 12H18zM48 28h12l-2 12H42zM72 28h12l-2 12H66zM96 28h12l2 12h-16z" fill="#c8332b" opacity=".9"/>
<rect x="18" y="72" width="92" height="6" rx="2" fill="#d9dde0"/>
<g transform="translate(112 6) scale(.6)"><rect x="22.5" y="2" width="3" height="18" rx="1.5" fill="#e3cfa6"/><circle cx="24" cy="30" r="14" fill="#f6c431"/><path d="M10.4 27a13.8 13.8 0 0 1 27.2 0c-.6 2-2 1.5-2.8 4.2s-2.4 1.6-3-.8-1.8 2.8-3.6 2.6-1.4-3.6-3.2-3.2-1.6 3.2-3.4.4-2.6 1.2-3.6-.8-4.2-.6-3.6-2.4z" fill="#a8551c"/></g>
<circle cx="45" cy="94" r="12" fill="#1d1712"/><circle cx="45" cy="94" r="5" fill="#9aa2a8"/><circle cx="155" cy="94" r="12" fill="#1d1712"/><circle cx="155" cy="94" r="5" fill="#9aa2a8"/>
<g transform="translate(40 44) scale(.55)">${ART.patty(MEAT.ready).replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(66 44) scale(.55)">${ART.chips(false).replace(/<\/?svg[^>]*>/g, '')}</g>`, '0 0 190 110');
  }

  // ---------- Input ----------
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && root.contains(b) && !b.disabled) act(b.dataset.act);
  });
  const KEYS = { g: 'add:patty', s: 'add:sausage', f: 'fryany', ' ': 'pickup', x: 'bin', b: 'shelf:bun', p: 'shelf:pop', c: 'shelf:cheese', r: 'shelf:roll', o: 'shelf:onion', a: 'shelf:apple' };
  document.addEventListener('keydown', (e) => {
    if (!S || e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (S.phase === 'play') {
      if (k === 'escape') { act('pause'); return; }
      const shelfDay = { b: 1, p: 1, c: 2, r: 3, o: 3, a: 4, s: 3, f: 2 };
      if (/^[1-4]$/.test(k)) { e.preventDefault(); act('serve:' + (+k - 1)); }
      else if (KEYS[k] && (shelfDay[k] || 1) <= S.day) { e.preventDefault(); act(KEYS[k]); }
    } else if (S.phase === 'paused' && (k === 'escape' || k === ' ')) { e.preventDefault(); act('resume'); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.phase === 'play') act('pause'); });

  let last = 0;
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    requestAnimationFrame(frame);
    if (S && S.phase === 'play') tick(dt);
    draw();
  };

  newGame();
  showOverlay();
  requestAnimationFrame(frame);
})();
