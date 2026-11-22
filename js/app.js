import { db, uid, exportBackup, importBackup } from './db.js';
import { t, ut, setLang, getLang, detectLang, LANGS, fmtDate } from './i18n.js';
import { SCENES, SCENE_IDS, PROPS, PROP_IDS, DECOR, DECOR_IDS, EMOJI, PALETTE } from './scenes.js';
import { fitWidth, FONT_IDS, TEXT_STYLES, Editor, newDoc, FORMATS, makePhotoLayer, makeMilestoneLayer, makeTextLayer, makeDecorLayer, makeEmojiLayer, ensureImages, exportBlob, exportSticker, imgCache, blobToImage, render, layerSize } from './editor.js';
import './i18n2.js';
import { CAPTION_KEYS } from './i18n2.js';
import { ANIMAL_IDS, EXTRA_IDS, drawSticker } from './stickers.js';
import { EFFECT_IDS } from './effects.js';
import { WORLDS, WORLD_IDS, applyWorld, buildTalePages } from './worlds.js';
import './i18n3.js';
import { MOCKUP_IDS, renderMockup, toyify } from './mockups.js';
import { PATTERNS, PALETTES } from './scenes.js';
import { downscale, removeBackground, aiPhotoshoot, AI_THEME_IDS, buildPrompt, puterPhotoshoot, loadPuter } from './services.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const iso = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const SWATCHES = ['#E58F95', '#F2B8B5', '#F9D9D6', '#FBD9C3', '#F8D98A', '#FFF0C2', '#D9E8D2', '#DCEBF5', '#E8DDF2', '#FFFFFF', '#6B4E4E', '#8C5A5A'];
function sceneName(id) { const sc = SCENES[id]; if (sc?.pattern) return `${t('pat_' + sc.pattern[0])} · ${t('pal_' + sc.pattern[1])}`; return t('sc_' + id); }
const FONT_CSS = { display: 'Comfortaa', script: "'Marck Script'", festive: 'Lobster', kids: 'Neucha', tall: "'Amatic SC'" };
const MOMENTS = ['smile', 'tooth', 'sat', 'crawl', 'step', 'word', 'bath', 'walk'];
const MOMENT_ICON = { smile: '😊', tooth: '🦷', sat: '🧸', crawl: '🐢', step: '👣', word: '💬', bath: '🛁', walk: '🌳', custom: '💗' };

const S = { kids: [], kidId: null, items: [], moments: [], letters: [], view: 'home', installEvt: null };
const kid = () => S.kids.find(k => k.id === S.kidId) || S.kids[0];

// ---------- Вік і віхи ----------
function diff(birth, date = new Date()) {
  const b = new Date(birth), n = new Date(date);
  let y = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth(), d = n.getDate() - b.getDate();
  if (d < 0) { m--; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d, total: Math.round((sod(n) - sod(b)) / DAY) };
}
function ageText(birth, date = new Date()) {
  const { y, m, d, total } = diff(birth, date);
  if (total < 0) return '';
  if (total === 0) return t('bornToday');
  if (y === 0 && m === 0) { const w = Math.floor(total / 7), dd = total % 7; return [w && ut(w, 'week'), dd && ut(dd, 'day')].filter(Boolean).join(' '); }
  if (y === 0) return [ut(m, 'month'), d && ut(d, 'day')].filter(Boolean).join(' ');
  return [ut(y, 'year'), m && ut(m, 'month')].filter(Boolean).join(' ');
}
function spanText(days) {
  if (days < 14) return ut(days, 'day');
  if (days < 60) return ut(Math.round(days / 7), 'week');
  if (days < 730) return ut(Math.round(days / 30.4), 'month');
  return ut(Math.round(days / 365.25), 'year');
}
function milestones(birth) {
  const b = new Date(birth);
  const addD = n => new Date(b.getTime() + n * DAY);
  const addM = n => { const d = new Date(b); d.setMonth(d.getMonth() + n); return d; };
  const L = [1, 2, 3].map(n => ({ key: 'w' + n, num: n, unit: 'week', date: addD(7 * n) }));
  for (let m = 1; m <= 11; m++) L.push({ key: 'm' + m, num: m, unit: 'month', date: addM(m) });
  L.push({ key: 'd100', num: 100, unit: 'day', date: addD(100) });
  L.push({ key: 'y1', num: 1, unit: 'year', date: addM(12) });
  L.push({ key: 'm18', num: 18, unit: 'month', date: addM(18) });
  for (let y = 2; y <= 5; y++) L.push({ key: 'y' + y, num: y, unit: 'year', date: addM(12 * y) });
  return L.sort((a, c) => a.date - c.date);
}
const msLabel = ms => ut(ms.num, ms.unit);
function nextMilestone(k) { const today = sod(new Date()); return milestones(k.birth).find(m => sod(m.date) >= today); }
function currentMilestone(k) { const today = sod(new Date()); return [...milestones(k.birth)].reverse().find(m => sod(m.date) <= today); }

// ---------- UI-помічники ----------
function toast(msg, ms = 2600) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), ms); }
function sheet(html, { onMount, cls = '' } = {}) {
  const root = document.createElement('div'); root.className = 'sheet-wrap';
  root.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="sheet-grip"></div><button class="icon-btn sheet-x" data-close aria-label="${t('close')}">✕</button>${html}</div>`;
  document.body.appendChild(root);
  requestAnimationFrame(() => root.classList.add('open'));
  const close = () => { root.classList.remove('open'); setTimeout(() => root.remove(), 250); };
  root.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  onMount && onMount(root.querySelector('.sheet'), close);
  return close;
}
function confirmBox(msg) {
  return new Promise(res => sheet(`<h3>${t('confirm')}</h3><p>${esc(msg)}</p><div class="row gap"><button class="btn ghost" data-a="0">${t('no')}</button><button class="btn danger" data-a="1">${t('yes')}</button></div>`, {
    onMount: (el, close) => el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { close(); res(b.dataset.a === '1'); } })
  }));
}
function pickFiles({ multiple = false } = {}) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = multiple; i.style.display = 'none';
    i.onchange = () => { res([...i.files]); i.remove(); };
    document.body.appendChild(i); i.click();
  });
}
async function shareOrDownload(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: t('appName') }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  download(blob, name);
}
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
const urlCache = new Map();
async function blobUrl(key) { if (!key) return ''; if (urlCache.has(key)) return urlCache.get(key); const b = await db.getBlob(key); if (!b) return ''; const u = URL.createObjectURL(b); urlCache.set(key, u); return u; }
async function hydrateImgs(root) { await Promise.all($$('img[data-key]', root).map(async i => { i.src = await blobUrl(i.dataset.key); })); }
const fileName = (label = 'photo', ext = 'jpg') => `moya-lyubov-${String(label).replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 30)}-${iso(new Date())}.${ext}`;

// ---------- Дані ----------
async function load() {
  [S.kids, S.items, S.moments, S.letters] = await Promise.all(['kids', 'items', 'moments', 'letters'].map(s => db.all(s)));
  S.kids.sort((a, b) => a.created - b.created);
  S.kidId = (await db.setting('kidId')) || S.kids[0]?.id;
  if (!S.kids.find(k => k.id === S.kidId)) S.kidId = S.kids[0]?.id;
}
const kidItems = () => S.items.filter(i => i.kidId === S.kidId).sort((a, b) => new Date(b.date) - new Date(a.date) || b.created - a.created);
const kidMoments = () => S.moments.filter(m => m.kidId === S.kidId);

// ---------- Навігація ----------
const NAV = [['home', '🏠', 'navHome'], ['timeline', '🗓️', 'navTimeline'], ['create', '+', 'navCreate'], ['album', '🖼️', 'navAlbum'], ['more', '☰', 'navMore']];
function renderNav() {
  const nav = $('#nav');
  const hide = ['studio', 'onboard', 'story'].includes(S.view);
  nav.hidden = hide;
  nav.innerHTML = NAV.map(([v, ic, k]) => `<button class="nav-btn ${v === 'create' ? 'nav-create' : ''} ${S.view === v ? 'on' : ''}" data-nav="${v}" aria-label="${t(k)}"><span class="nav-ic">${ic}</span><span class="nav-tx">${t(k)}</span></button>`).join('');
}
function go(view, arg) {
  if (S.editor) { S.editor.destroy(); S.editor = null; }
  S.view = view; renderNav();
  const v = $('#view'); v.className = 'view view-' + view; v.scrollTop = 0; window.scrollTo(0, 0);
  ({ home: viewHome, timeline: viewTimeline, album: viewAlbum, more: viewMore, studio: viewStudio, ai: viewAI, onboard: viewOnboard, letters: viewLetters, story: viewStory })[view](v, arg);
}
function openCreate() {
  sheet(`<h3>${t('navCreate')}</h3>
    <button class="big-card pink" data-c="ai"><span class="bc-ic">✨</span><span><b>${t('aiShoot')}</b><small>${t('aiShootSub')}</small></span></button>
    <button class="big-card yellow" data-c="studio"><span class="bc-ic">🎨</span><span><b>${t('studio')}</b><small>${t('studioSub')}</small></span></button>`, {
    onMount: (el, close) => el.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; close(); b.dataset.c === 'ai' ? go('ai') : go('studio', { milestone: currentMilestone(kid()) }); })
  });
}

// ---------- Онбординг ----------
function langSelect(cls = '') {
  return `<label class="lang-sel ${cls}"><span aria-hidden="true">🌐</span><select data-lang aria-label="${t('lang')}">${LANGS.map(([c, n]) => `<option value="${c}" ${c === getLang() ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
}
function viewOnboard(v, { edit } = {}) {
  const k = edit ? S.kids.find(x => x.id === edit) : null;
  v.innerHTML = `<div class="onboard">
    <div class="ob-top">${k ? `<button class="icon-btn" data-back aria-label="${t('close')}">←</button>` : '<span></span>'}${langSelect()}</div>
    <div class="ob-logo">${logoSvg(96)}</div>
    <h1 class="brand">${t('appName')}</h1>
    ${k ? '' : `<p class="lead">${t('welcomeText')}</p>`}
    <form class="card form" id="obf">
      <label>${t('kidName')}<input name="name" required maxlength="40" placeholder="${t('namePh')}" value="${esc(k?.name || '')}" autocomplete="off"></label>
      <label>${t('birth')}<input name="birth" type="date" required max="${iso(new Date())}" value="${k ? k.birth : iso(new Date())}"></label>
      <button class="btn primary wide" type="submit">${k ? t('save') : t('start')}</button>
      ${k && S.kids.length > 1 ? `<button class="btn ghost danger-text wide" type="button" data-delkid>${t('del')}</button>` : ''}
    </form>
    ${k ? '' : `<p class="fine">🔒 ${t('privacyText')}</p>`}
  </div>`;
  $('#obf').onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    const obj = k ? { ...k } : { id: uid(), created: Date.now() };
    obj.name = String(f.get('name')).trim(); obj.birth = f.get('birth');
    await db.put('kids', obj); await load(); S.kidId = obj.id; await db.setting('kidId', obj.id);
    go(k ? 'more' : 'home');
  };
  $('[data-back]', v)?.addEventListener('click', () => go('more'));
  $('[data-delkid]', v)?.addEventListener('click', async () => { if (await confirmBox(t('delKidConfirm'))) { await db.del('kids', k.id); await load(); S.kidId = S.kids[0]?.id; await db.setting('kidId', S.kidId); go('more'); } });
}
function logoSvg(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="lg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7B9B4"/><stop offset="1" stop-color="#F8D98A"/></linearGradient></defs><path d="M50 88C20 68 8 52 8 34 8 20 19 10 32 10c8 0 14 4 18 10 4-6 10-10 18-10 13 0 24 10 24 24 0 18-12 34-42 54z" fill="url(#lg${size})"/><circle cx="50" cy="46" r="20" fill="#FFF3E8"/><circle cx="43" cy="45" r="2.6" fill="#6B4E4E"/><circle cx="57" cy="45" r="2.6" fill="#6B4E4E"/><path d="M44 53q6 5 12 0" stroke="#6B4E4E" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="38" cy="51" r="3.2" fill="#F5A9A9" opacity=".7"/><circle cx="62" cy="51" r="3.2" fill="#F5A9A9" opacity=".7"/><path d="M50 26q4-6 8-2" stroke="#6B4E4E" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`;
}

// ---------- Головна ----------
async function viewHome(v) {
  const k = kid(); const next = nextMilestone(k); const cur = currentMilestone(k);
  const days = next ? Math.round((sod(next.date) - sod(new Date())) / DAY) : null;
  const items = kidItems().slice(0, 8);
  const curDone = cur && S.items.some(i => i.kidId === k.id && i.milestoneKey === cur.key);
  const target = cur && !curDone && (Date.now() - cur.date) < 45 * DAY ? cur : next;
  v.innerHTML = `
  <header class="topbar"><div class="brand-row">${logoSvg(34)}<span class="brand sm">${t('appName')}</span></div>
    ${S.kids.length > 1 ? `<button class="chip" data-switch>${esc(k.name)} ▾</button>` : ''}</header>
  <section class="hero">
    <div class="hero-txt"><div class="hero-name">${esc(k.name)}</div><div class="hero-age">${esc(ageText(k.birth))}</div></div>
    ${next ? `<div class="next"><span class="next-l">${t('nextMilestone')}</span><b>${msLabel(next)}</b><span class="next-d">${fmtDate(next.date, { day: 'numeric', month: 'long' })} · ${days === 0 ? t('todayExcl') : t('inTime', { t: spanText(days) })}</span></div>` : ''}
    ${target ? `<button class="btn primary wide" data-mk="${target.key}">📸 ${t('createFor', { m: msLabel(target) })}</button>` : ''}
    ${next ? `<button class="link" data-ics>🔔 ${t('remind')}</button>` : ''}
  </section>
  <div class="duo">
    <button class="big-card pink" data-go="ai"><span class="bc-ic">✨</span><span><b>${t('aiShoot')}</b><small>${t('aiShootSub')}</small></span></button>
    <button class="big-card yellow" data-go="studio"><span class="bc-ic">🎨</span><span><b>${t('studio')}</b><small>${t('studioSub')}</small></span></button>
  </div>
  <section class="sec"><div class="sec-h"><h2>${t('moments')}</h2></div>
    <div class="chips scroll-x">${MOMENTS.map(m => `<button class="chip soft" data-moment="${m}">${MOMENT_ICON[m]} ${t('m_' + m)}</button>`).join('')}</div></section>
  <section class="sec"><div class="sec-h"><h2>${t('recent')}</h2>${items.length ? `<button class="link" data-nav="album">${t('seeAll')} →</button>` : ''}</div>
    ${items.length ? `<div class="strip scroll-x">${items.map(i => `<button class="thumb" data-item="${i.id}"><img data-key="${i.thumbKey}" alt="${esc(i.label || '')}"><span>${esc(i.label || fmtDate(i.date, { day: 'numeric', month: 'short' }))}</span></button>`).join('')}</div>`
      : `<div class="empty"><div class="empty-ic">🍼</div><p>${t('emptyAlbum')}</p></div>`}
  </section>
  ${installBanner()}`;
  hydrateImgs(v);
  v.querySelector('[data-mk]')?.addEventListener('click', e => go('studio', { milestone: milestones(k.birth).find(m => m.key === e.currentTarget.dataset.mk) }));
  v.querySelector('[data-ics]')?.addEventListener('click', () => downloadIcs(k, next));
  v.querySelector('[data-switch]')?.addEventListener('click', switchKid);
  $$('[data-go]', v).forEach(b => b.onclick = () => b.dataset.go === 'ai' ? go('ai') : go('studio', { milestone: currentMilestone(k) }));
  $$('[data-moment]', v).forEach(b => b.onclick = () => momentSheet({ type: b.dataset.moment }));
  $$('[data-item]', v).forEach(b => b.onclick = () => viewer(b.dataset.item));
  bindInstall(v);
}
function switchKid() {
  sheet(`<h3>${t('kids')}</h3>${S.kids.map(k => `<button class="list-btn ${k.id === S.kidId ? 'on' : ''}" data-k="${k.id}">👶 ${esc(k.name)} <small>${esc(ageText(k.birth))}</small></button>`).join('')}`, {
    onMount: (el, close) => el.addEventListener('click', async e => { const b = e.target.closest('[data-k]'); if (!b) return; S.kidId = b.dataset.k; await db.setting('kidId', S.kidId); close(); go(S.view); })
  });
}
function downloadIcs(k, ms) {
  const d = iso(ms.date).replaceAll('-', ''); const title = `${t('appName')}: ${k.name} — ${msLabel(ms)}`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MoyaLyubov//UA', 'BEGIN:VEVENT', `UID:${uid()}@moya-lyubov`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${title}`, `DESCRIPTION:📸 ${t('createFor', { m: msLabel(ms) })}`, 'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  download(new Blob([ics], { type: 'text/calendar' }), `${ms.key}.ics`);
}

// ---------- Встановлення ----------
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installBanner() {
  if (isStandalone() || localStorage.getItem('ml-install-x')) return '';
  return `<div class="install card"><div><b>📲 ${t('install')}</b><p>${isIOS() ? t('installIOS') : t('installAndroid')}</p></div>
    ${!isIOS() && S.installEvt ? `<button class="btn primary sm" data-install>${t('installBtn')}</button>` : ''}<button class="icon-btn" data-install-x aria-label="${t('close')}">✕</button></div>`;
}
function bindInstall(v) {
  v.querySelector('[data-install]')?.addEventListener('click', async () => { S.installEvt.prompt(); await S.installEvt.userChoice; S.installEvt = null; go(S.view); });
  v.querySelector('[data-install-x]')?.addEventListener('click', e => { localStorage.setItem('ml-install-x', 1); e.target.closest('.install').remove(); });
}

// ---------- Віхи / таймлайн ----------
function viewTimeline(v) {
  const k = kid(); const today = sod(new Date());
  const ms = milestones(k.birth).map(m => ({ ...m, kind: 'ms', item: kidItems().find(i => i.milestoneKey === m.key) }));
  const mo = kidMoments().map(m => ({ ...m, kind: 'mo', date: new Date(m.date) }));
  const all = [...ms, ...mo].sort((a, b) => a.date - b.date);
  const firstFuture = all.findIndex(x => x.kind === 'ms' && sod(x.date) > today);
  const shown = all.filter((x, i) => x.kind === 'mo' || i <= firstFuture + 2 || firstFuture < 0);
  v.innerHTML = `<header class="topbar"><h1>${t('timeline')}</h1><button class="btn primary sm" data-addm>+ ${t('addMoment')}</button></header>
  <p class="sub">${esc(k.name)} · ${esc(ageText(k.birth))}</p>
  <ol class="tl">${shown.map(x => {
    if (x.kind === 'mo') return `<li class="tl-i mo"><span class="tl-dot">${MOMENT_ICON[x.type] || '💗'}</span><button class="tl-card" data-mo="${x.id}">
      ${x.photoKey ? `<img data-key="${x.photoKey}" alt="">` : ''}<span><b>${esc(x.title || t('m_' + x.type))}</b><small>${fmtDate(x.date)}${x.note ? ' · ' + esc(x.note) : ''}</small></span></button></li>`;
    const future = sod(x.date) > today; const st = x.item ? 'done' : future ? 'up' : 'miss';
    return `<li class="tl-i ${st}"><span class="tl-dot">${x.item ? '✓' : future ? '·' : '♡'}</span><button class="tl-card" data-ms="${x.key}">
      ${x.item ? `<img data-key="${x.item.thumbKey}" alt="">` : ''}<span><b>${msLabel(x)}</b><small>${fmtDate(x.date)}</small></span>
      <em class="pill ${st}">${x.item ? t('done') : future ? t('upcoming') : t('missed')}</em></button></li>`;
  }).join('')}</ol>`;
  hydrateImgs(v);
  $('[data-addm]', v).onclick = () => momentSheet({});
  $$('[data-ms]', v).forEach(b => b.onclick = () => { const m = ms.find(x => x.key === b.dataset.ms); m.item ? viewer(m.item.id) : go('studio', { milestone: m }); });
  $$('[data-mo]', v).forEach(b => b.onclick = () => momentSheet(S.moments.find(m => m.id === b.dataset.mo)));
}
function momentSheet(m) {
  const isNew = !m.id; const type = m.type || 'custom';
  const close = sheet(`<h3>${isNew ? t('addMoment') : esc(m.title || t('m_' + type))}</h3>
    <div class="chips wrap">${[...MOMENTS, 'custom'].map(x => `<button class="chip ${x === type ? 'on' : ''}" data-t="${x}">${MOMENT_ICON[x]} ${t('m_' + x)}</button>`).join('')}</div>
    <form class="form" id="mf">
      <label>${t('title')}<input name="title" maxlength="60" value="${esc(m.title || (type !== 'custom' ? t('m_' + type) : ''))}"></label>
      <label>${t('date')}<input type="date" name="date" value="${m.date ? iso(m.date) : iso(new Date())}" max="${iso(new Date())}"></label>
      <label>${t('note')}<textarea name="note" rows="2" maxlength="300">${esc(m.note || '')}</textarea></label>
      <div class="row gap"><button class="btn primary" type="submit">${t('save')}</button><button class="btn soft" type="button" data-photo>📸 ${t('makePhoto')}</button></div>
      ${isNew ? '' : `<button class="btn ghost danger-text" type="button" data-del>${t('del')}</button>`}
    </form>`, {
    onMount: el => {
      let cur = type;
      $$('[data-t]', el).forEach(b => b.onclick = () => { $$('[data-t]', el).forEach(x => x.classList.toggle('on', x === b)); cur = b.dataset.t; const inp = el.querySelector('[name=title]'); if (cur !== 'custom') inp.value = t('m_' + cur); else { inp.value = ''; inp.focus(); } });
      const save = async () => { const f = new FormData($('#mf', el)); const obj = { ...m, id: m.id || uid(), kidId: S.kidId, type: cur, title: String(f.get('title')).trim() || t('m_' + cur), date: f.get('date') || iso(new Date()), note: String(f.get('note')).trim() }; await db.put('moments', obj); await load(); return obj; };
      $('#mf', el).onsubmit = async e => { e.preventDefault(); await save(); close(); if (S.view === 'timeline') go('timeline'); else toast('💗 ' + t('saved').split(' ')[0]); };
      $('[data-photo]', el).onclick = async () => { const o = await save(); close(); go('studio', { text: o.title, momentId: o.id, date: o.date }); };
      $('[data-del]', el)?.addEventListener('click', async () => { await db.del('moments', m.id); await load(); close(); go(S.view); });
    }
  });
}

// ---------- Альбом ----------
function viewAlbum(v, { pick } = {}) {
  const items = kidItems();
  const groups = {};
  items.forEach(i => { const key = fmtDate(i.date, { month: 'long', year: 'numeric' }); (groups[key] ||= []).push(i); });
  v.innerHTML = `<header class="topbar"><h1>${t('album')}</h1></header>
  ${items.length ? `<div class="duo sm">
    <button class="btn soft" data-story ${items.length < 2 ? 'disabled' : ''}>🎞️ ${t('story')}</button>
    <button class="btn soft" data-thennow ${items.length < 2 ? 'disabled' : ''}>🔁 ${t('thenNow')}</button></div>` : ''}
  ${pick ? `<p class="hint">${t('pickTwo')}</p>` : ''}
  ${items.length ? Object.entries(groups).map(([g, arr]) => `<h3 class="grp">${g}</h3><div class="grid">${arr.map(i => `<button class="g-item" data-item="${i.id}"><img data-key="${i.thumbKey}" alt="${esc(i.label || '')}">${i.label ? `<span>${esc(i.label)}</span>` : ''}</button>`).join('')}</div>`).join('')
    : `<div class="empty big"><div class="empty-ic">🖼️</div><p>${t('emptyAlbum')}</p><button class="btn primary" data-start>📸 ${t('makePhoto')}</button></div>`}`;
  hydrateImgs(v);
  $('[data-start]', v)?.addEventListener('click', openCreate);
  $('[data-story]', v)?.addEventListener('click', () => go('story'));
  $('[data-thennow]', v)?.addEventListener('click', () => go('album', { pick: [] }));
  $$('[data-item]', v).forEach(b => b.onclick = () => {
    if (!pick) return viewer(b.dataset.item);
    b.classList.toggle('picked'); const id = b.dataset.item;
    pick.includes(id) ? pick.splice(pick.indexOf(id), 1) : pick.push(id);
    if (pick.length === 2) thenNow(pick.map(id => S.items.find(i => i.id === id)));
  });
}
async function thenNow(pair) {
  pair.sort((a, b) => new Date(a.date) - new Date(b.date));
  const doc = newDoc('4:5'); doc.scene = 'plain'; doc.prop = 'none'; doc.sceneColor = PALETTE.blush;
  for (const [i, it] of pair.entries()) {
    const img = await blobToImage(await db.getBlob(it.fullKey)); imgCache.set(it.fullKey, img);
    const l = makePhotoLayer(doc, it.fullKey, img.naturalWidth, img.naturalHeight, { frame: 'none', x: doc.w * (0.27 + i * 0.46), y: doc.h * 0.47, shadow: true });
    l.s = (doc.w * 0.42) / l.w0; doc.layers.push(l);
    const tl = makeTextLayer(doc, it.label || fmtDate(it.date, { day: 'numeric', month: 'short', year: 'numeric' }), 'script'); tl.x = l.x; tl.y = doc.h * 0.83; tl.size = 72; doc.layers.push(tl);
  }
  const head = makeTextLayer(doc, t('thenNow'), 'display'); head.y = doc.h * 0.1; head.size = 84; head.color = PALETTE.roseDeep; doc.layers.push(head);
  go('studio', { doc, label: t('thenNow') });
}
async function viewer(id) {
  const it = S.items.find(i => i.id === id); if (!it) return;
  const full = await blobUrl(it.fullKey), orig = it.originalKey ? await blobUrl(it.originalKey) : '';
  sheet(`<div class="viewer">
    <div class="ba" style="--p:100%"><img class="ba-after" src="${full}" alt="">${orig ? `<img class="ba-before" src="${orig}" alt=""><input class="ba-range" type="range" min="0" max="100" value="100" aria-label="${t('before')} / ${t('after')}"><span class="ba-l">${t('before')}</span><span class="ba-r">${t('after')}</span>` : ''}</div>
    <div class="v-meta"><b>${esc(it.label || '')}</b><small>${fmtDate(it.date)}</small></div>
    <div class="v-actions">
      <button class="btn primary" data-a="share">📤 ${t('share')}</button>
      <button class="btn soft" data-a="dl">⬇️ ${t('download')}</button>
      <button class="btn soft" data-a="where">🖼️ ${t('whereTitle')}</button>
      <button class="btn soft" data-a="edit">✏️ ${t('edit')}</button>
      <button class="btn ghost danger-text" data-a="del">🗑️ ${t('del')}</button>
    </div></div>`, {
    cls: 'tall', onMount: (el, close) => {
      const r = $('.ba-range', el); if (r) r.oninput = () => el.querySelector('.ba').style.setProperty('--p', r.value + '%');
      el.addEventListener('click', async e => {
        const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
        const blob = await db.getBlob(it.fullKey);
        if (a === 'share') shareOrDownload(blob, fileName(it.label));
        if (a === 'dl') download(blob, fileName(it.label));
        if (a === 'edit') { close(); go('studio', { item: it }); }
        if (a === 'where') { close(); const ph = it.doc?.layers?.find(x => x.type === 'photo' && x.cut && x.cutKey); let cut = null; if (ph) { const cb = await db.getBlob(ph.cutKey); if (cb) cut = await blobToImage(cb); } openMockups({ img: await blobToImage(blob), cut, label: it.label }); }
        if (a === 'del' && await confirmBox(t('delConfirm'))) { await db.del('items', it.id); await db.del('blobs', it.fullKey); await db.del('blobs', it.thumbKey); await load(); close(); go(S.view); }
      });
    }
  });
}

// ---------- Фотостудія ----------
async function viewStudio(v, arg = {}) {
  const k = kid();
  let doc, item = arg.item || null, milestoneKey = arg.milestone?.key || item?.milestoneKey || null;
  let label = arg.label || (arg.milestone ? msLabel(arg.milestone) : arg.text) || item?.label || '';
  let date = item?.date || arg.date || (arg.milestone && arg.milestone.date < new Date() ? iso(arg.milestone.date) : iso(new Date()));
  if (item) doc = JSON.parse(JSON.stringify(item.doc));
  else if (arg.doc) doc = arg.doc;
  else {
    doc = newDoc((await db.setting('lastFmt')) || '9:16');
    if (arg.milestone) doc.layers.push(makeMilestoneLayer(doc, arg.milestone.num, arg.milestone.unit, getLang(), 'garland'));
    if (arg.text) { const tl = makeTextLayer(doc, arg.text, 'script'); tl.y = doc.h * 0.14; tl.size = 120; tl.color = PALETTE.roseDeep; doc.layers.push(tl); }
    const nl = makeTextLayer(doc, k.name, 'script'); nl.y = doc.h * 0.9; doc.layers.push(nl);
    if (arg.photoBlob) {
      const l = await addPhotoToDoc(doc, arg.photoBlob, { frame: 'none', shadow: false, s: 1 });
      l.s = Math.max(doc.w / l.w0, doc.h / l.h0); l.x = doc.w / 2; l.y = doc.h / 2; doc.prop = 'none';
      doc.layers.unshift(l);
    }
  }
  await ensureImages(doc); await document.fonts.ready;

  v.innerHTML = `<div class="studio">
    <header class="st-top">
      <button class="icon-btn" data-x aria-label="${t('close')}">←</button>
      <div class="st-hist"><button class="icon-btn" data-undo aria-label="${t('undo')}" title="${t('undo')}">↶</button><button class="icon-btn" data-redo aria-label="${t('redo')}" title="${t('redo')}">↷</button></div>
      <div class="row gap"><button class="icon-btn" data-where aria-label="${t('whereTitle')}" title="${t('whereTitle')}">🖼️</button><button class="btn primary sm" data-save>💾 ${t('save')}</button></div>
    </header>
    <div class="st-stage"><canvas id="cv"></canvas><div class="st-empty" hidden><button class="btn primary" data-addphoto>📷 ${t('addPhoto')}</button></div><div class="st-busy" hidden><div class="spinner"></div><p></p></div></div>
    <div class="st-panel" id="panel"></div>
    <nav class="st-tabs">${[['worlds', '🪄', 'tWorlds'], ['bg', '🌸', 'tBg'], ['photo', '📷', 'tPhoto'], ['mile', '🎉', 'tMile'], ['text', '✍️', 'tText'], ['decor', '🧸', 'tDecor'], ['fx', '✨', 'tFx']].map(([id, ic, key]) => `<button class="st-tab" data-tab="${id}"><span>${ic}</span>${t(key)}</button>`).join('')}</nav>
  </div>`;
  const ed = S.editor = new Editor($('#cv', v), doc, { onChange: () => syncTop(), onSelect: (l, live) => { if (!live) panel(); else syncSliders(l); } });
  let tab = doc.layers.some(l => l.type === 'photo') ? 'worlds' : 'photo';
  const empty = $('.st-empty', v);
  const syncTop = () => { $('[data-undo]', v).disabled = !ed.canUndo; $('[data-redo]', v).disabled = !ed.canRedo; empty.hidden = doc.layers.some(l => l.type === 'photo'); };
  const busy = (msg) => { const b = $('.st-busy', v); b.hidden = !msg; if (msg) $('p', b).textContent = msg; };
  syncTop();

  let savedAt = ed.hi;
  $('[data-x]', v).onclick = async () => { if (ed.hi !== savedAt && doc.layers.some(l => l.type === 'photo') && !(await confirmBox(t('unsaved')))) return; go(item ? 'album' : 'home'); };
  $('[data-undo]', v).onclick = () => ed.undo();
  $('[data-redo]', v).onclick = () => ed.redo();
  $('[data-addphoto]', v).onclick = () => addPhoto();
  $$('[data-tab]', v).forEach(b => b.onclick = () => { tab = b.dataset.tab; ed.select(null); });
  $('[data-where]', v).onclick = async () => {
    ed.select(null); busy('…');
    const img = await blobToImage(await exportBlob(doc, { scale: 0.6 })); const ph = doc.layers.find(x => x.type === 'photo' && x.cut && x.cutKey);
    busy(null); openMockups({ img, cut: ph ? imgCache.get(ph.cutKey) : null, label });
  };
  $('[data-save]', v).onclick = async () => {
    ed.select(null); busy('…');
    const full = await exportBlob(doc); const thumb = (await downscale(full, 420, 'image/jpeg', 0.82)).blob;
    const ph = doc.layers.find(l => l.type === 'photo');
    const rec = { ...(item || {}), id: item?.id || uid(), kidId: item?.kidId || S.kidId, created: item?.created || Date.now(), updated: Date.now(), date, milestoneKey, label, doc: JSON.parse(JSON.stringify(doc)), originalKey: ph?.imgKey || item?.originalKey || null };
    if (item) { await db.del('blobs', item.fullKey); await db.del('blobs', item.thumbKey); urlCache.delete(item.fullKey); urlCache.delete(item.thumbKey); }
    rec.fullKey = await db.putBlob(full); rec.thumbKey = await db.putBlob(thumb);
    await db.put('items', rec); item = rec; await load(); busy(null); savedAt = ed.hi;
    toast('💗 ' + t('saved'));
    sheet(`<h3>${t('saved')}</h3><img class="saved-prev" src="${URL.createObjectURL(full)}" alt=""><div class="row gap"><button class="btn primary" data-a="share">📤 ${t('share')}</button><button class="btn soft" data-a="dl">⬇️ ${t('download')}</button></div><button class="btn soft wide where-btn" data-a="where">🖼️ ${t('whereBtn')}</button><button class="btn ghost wide" data-a="album">🖼️ ${t('album')}</button>`, {
      onMount: (el, close) => el.addEventListener('click', async e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'share') shareOrDownload(full, fileName(label)); if (a === 'dl') download(full, fileName(label)); if (a === 'album') { close(); go('album'); } if (a === 'where') { close(); const ph = doc.layers.find(x => x.type === 'photo' && x.cut && x.cutKey); openMockups({ img: await blobToImage(full), cut: ph ? imgCache.get(ph.cutKey) : null, label }); } })
    });
  };

  async function addPhoto(extra = {}) {
    const files = await pickFiles(); if (!files.length) return;
    busy('…');
    const l = await addPhotoToDoc(doc, files[0], extra);
    busy(null); ed.add(l); tab = 'photo'; panel(); syncTop();
  }
  async function cutBg(l) {
    if (l.cutKey) { ed.update(() => { l.cut = !l.cut; }); panel(); return; }
    busy(t('removing'));
    try {
      const res = await removeBackground(await db.getBlob(l.imgKey), p => busy(`${t('removing')} ${p}%`));
      const key = await db.putBlob(res.blob); imgCache.set(key, await blobToImage(res.blob));
      ed.update(() => { const area = l.w0 * l.h0; l.cutKey = key; l.cut = true; l.w0 = Math.sqrt(area * res.w / res.h); l.h0 = l.w0 * res.h / res.w; });
      if (doc.prop === 'none') ed.update(d => { d.prop = 'blanket'; });
    } catch (e) { console.warn(e); toast(t('removeFail'), 4000); ed.update(() => { l.frame = 'heart'; }); }
    busy(null); panel();
  }

  async function makeTale() {
    const ph = doc.layers.find(x => x.type === 'photo');
    if (!ph) { toast(t('taleNeed'), 3500); tab = 'photo'; return panel(); }
    busy(t('taleMaking'));
    try {
      const name = k.name, texts = [1, 2, 3, 4].map(i => t('tale' + i, { name })), title = t('taleTitle', { name });
      const pages = buildTalePages(ph, texts, title); const ids = [];
      for (const [i, pd] of pages.entries()) {
        busy(`${t('taleMaking')} ${i + 1}/4`);
        const full = await exportBlob(pd); const th = (await downscale(full, 420, 'image/jpeg', 0.82)).blob;
        const id = uid(); ids.push(id);
        await db.put('items', { id, kidId: S.kidId, created: Date.now() + i, date, label: `${t('tale')} ${i + 1}/4`, doc: pd, originalKey: ph.imgKey, fullKey: await db.putBlob(full), thumbKey: await db.putBlob(th), tale: title });
      }
      await load(); busy(null); toast('📖 ' + t('taleDone'), 3500);
      go('story', { ids, title });
    } catch (e) { console.warn(e); busy(null); toast(t('err', { e: e.message }), 4000); }
  }

  // --- Панель ---
  function sw(cur, attr = 'data-color') { return `<div class="swatches">${SWATCHES.map(c => `<button class="sw ${c === cur ? 'on' : ''}" ${attr}="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')}<label class="sw sw-pick" aria-label="${t('color')}"><input type="color" ${attr}-pick value="${cur && cur.length === 7 ? cur : '#E58F95'}"></label></div>`; }
  function range(name, min, max, step, val, lbl) { return `<label class="rng"><span>${lbl}</span><input type="range" data-r="${name}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`; }
  function common(l) {
    return `${range('s', 0.1, 4, 0.01, l.s, t('size'))}${range('r', -180, 180, 1, Math.round(l.r * 180 / Math.PI), t('rotate'))}${range('o', 0.1, 1, 0.01, l.o ?? 1, t('opacity'))}
    <div class="tools"><button class="tool" data-act="dup">⧉<span>${t('dup')}</span></button><button class="tool" data-act="up">⬆<span>${t('front')}</span></button><button class="tool" data-act="down">⬇<span>${t('backL')}</span></button><button class="tool" data-act="sticker">🏷️<span>${t('sticker')}</span></button><button class="tool danger" data-act="del">🗑<span>${t('del')}</span></button></div>`;
  }
  function syncSliders(l) { const p = $('#panel'); if (!p || !l) return; const s = p.querySelector('[data-r=s]'), r = p.querySelector('[data-r=r]'); if (s) s.value = l.s; if (r) r.value = Math.round(l.r * 180 / Math.PI); }
  function sceneThumb(id) { const c = document.createElement('canvas'); c.width = 90; c.height = 120; const x = c.getContext('2d'); x.scale(90 / 1080, 120 / 1440); SCENES[id].draw(x, 1080, 1440, SCENES[id].color); return c.toDataURL(); }
  function decorThumb(id) { const c = document.createElement('canvas'); c.width = 72; c.height = 72; const x = c.getContext('2d'); x.translate(36, 38); x.scale(0.26, 0.26); if (DECOR[id]) DECOR[id](x, 200); else drawSticker(x, id, 240); return c.toDataURL(); }
  function worldThumb(id) { const d = newDoc('9:16'); applyWorld(d, id, null); const c = document.createElement('canvas'); c.width = 84; c.height = 150; const x = c.getContext('2d'); x.scale(84 / 1080, 150 / 1920); render(x, d); return c.toDataURL(); }
  function fxThumb(id) { const d = JSON.parse(JSON.stringify(doc)); d.effect = id; const c = document.createElement('canvas'); c.width = 72; c.height = Math.round(72 * d.h / d.w); const x = c.getContext('2d'); x.scale(72 / d.w, c.height / d.h); render(x, d); return c.toDataURL(); }
  const thumbs = {};
  function panel() {
    const p = $('#panel'); const l = ed.layer();
    $$('.st-tab', v).forEach(b => b.classList.toggle('on', !l && b.dataset.tab === tab));
    let h = '';
    if (l) {
      h += `<div class="pn-head"><b>${{ photo: t('tPhoto'), text: t('tText'), milestone: t('tMile'), decor: t('tDecor'), emoji: t('tDecor') }[l.type]}</b><button class="btn ghost sm" data-desel>✓ OK</button></div>`;
      if (l.type === 'photo') h += `<div class="row gap wrap"><button class="btn ${l.cut ? 'soft' : 'primary'} sm" data-act="cut">✂️ ${l.cut ? t('original') : t('removeBg')}</button>
          <button class="chip ${l.shadow ? 'on' : ''}" data-tog="shadow">${t('shadow')}</button><button class="chip ${l.outline ? 'on' : ''}" data-tog="outline">${t('outline')}</button></div>
          ${l.cut ? '' : `<div class="lbl">${t('frame')}</div><div class="chips wrap">${['soft', 'none', 'round', 'oval', 'heart'].map(f => `<button class="chip ${l.frame === f ? 'on' : ''}" data-frame="${f}">${t('fr_' + f)}</button>`).join('')}</div>`}`;
      if (l.type === 'text') { const st = l.style || (l.plate ? 'plate' : 'plain');
        h += `<textarea class="txt" data-text rows="2" maxlength="120">${esc(l.text)}</textarea>
          <div class="lbl">${t('fontLbl')}</div><div class="chips scroll-x">${FONT_IDS.map(f => `<button class="chip ${l.font === f ? 'on' : ''}" data-font="${f}" style="font-family:${FONT_CSS[f]}">${t('fn_' + f)}</button>`).join('')}</div>
          <div class="lbl">${t('styleLbl')}</div><div class="chips scroll-x">${TEXT_STYLES.map(x => `<button class="chip ${st === x ? 'on' : ''}" data-tstyle="${x}">${t('ts_' + x)}</button>`).join('')}</div>
          <div class="lbl">${t('color')}</div>${sw(l.color)}
          ${st === 'ribbon' ? `<div class="lbl">${t('ribbonColor')}</div>${sw(l.ribbon || '#F2B8B5', 'data-rcolor')}` : ''}`; }
      if (l.type === 'milestone') h += mileControls(l) + sw(l.color);
      if (l.type === 'decor') h += sw(l.color);
      h += common(l);
    } else if (tab === 'bg') {
      const sceneTile = id => `<button class="scene ${doc.scene === id ? 'on' : ''}" data-scene="${id}"><img src="${thumbs['s' + id] ||= sceneThumb(id)}" alt=""><span>${sceneName(id)}</span></button>`;
      h += `<div class="lbl">${t('tBg')}</div><div class="scenes scroll-x">${SCENE_IDS.filter(id => !id.startsWith('p_')).map(sceneTile).join('')}</div>
        <div class="lbl">${t('patternsLbl')}</div><div class="scenes scroll-x">${SCENE_IDS.filter(id => id.startsWith('p_')).map(sceneTile).join('')}</div>`;
      h += `<div class="lbl">${t('color')}</div>${sw(doc.sceneColor || SCENES[doc.scene].color, 'data-scolor')}
        <div class="lbl">${t('propLabel')}</div><div class="chips wrap">${PROP_IDS.map(id => `<button class="chip ${doc.prop === id ? 'on' : ''}" data-prop="${id}">${t('pr_' + id)}</button>`).join('')}</div>
        <div class="lbl">${t('tFormat')}</div><div class="fmts">${Object.keys(FORMATS).map(f => { const [w, hh] = FORMATS[f]; return `<button class="fmt ${doc.fmt === f ? 'on' : ''}" data-fmt="${f}"><i style="aspect-ratio:${w}/${hh}"></i><span>${t('f' + f.replace(':', ''))}</span></button>`; }).join('')}</div>`;
    } else if (tab === 'photo') {
      const photos = doc.layers.filter(x => x.type === 'photo');
      h += `${photos.length ? `<button class="btn primary wide" data-act="addphoto">📷 ${t('addPhoto')}</button>` : ''}
        ${photos.length ? `<button class="btn soft wide" data-act="addparent">👨‍👩‍👧 ${t('addParent')}</button><div class="chips wrap">${photos.map((x, i) => `<button class="chip" data-sel="${x.id}">📷 ${i + 1}</button>`).join('')}</div>` : ''}
        <p class="hint">${t('tapHint')}</p>`;
    } else if (tab === 'mile') {
      const cur = currentMilestone(k); const nx = nextMilestone(k);
      const sugg = [cur, nx].filter(Boolean);
      h += `<div class="chips wrap">${sugg.map(m => `<button class="chip soft" data-addms="${m.num}|${m.unit}|${m.key}">🎉 ${msLabel(m)}</button>`).join('')}</div>
        <div class="lbl">${t('addMile')}</div>${mileControls({ num: cur?.num || 1, unit: cur?.unit || 'month', style: 'garland' }, true)}`;
    } else if (tab === 'text') {
      h += `<div class="lbl">✍️ ${t('yourText')}</div><div class="row gap"><input class="txt" data-newtext placeholder="${t('textPh')}" maxlength="120" enterkeyhint="done"><button class="btn primary sm" data-act="addtext">+ ${t('addText')}</button></div>
        <div class="lbl">${t('captionsLbl')}</div><div class="chips wrap">${CAPTION_KEYS.map(c => `<button class="chip soft" data-quick="${esc(t(c))}">${esc(t(c))}</button>`).join('')}</div>
        <div class="chips wrap"><button class="chip soft" data-quick="${esc(k.name)}">👶 ${esc(k.name)}</button><button class="chip soft" data-quick="${esc(fmtDate(date))}">📅 ${esc(fmtDate(date))}</button><button class="chip soft" data-quick="${esc(ageText(k.birth, date))}">⏳ ${esc(ageText(k.birth, date))}</button><button class="chip soft" data-quick="💗 ${t('appName')} 💗">💗 ${t('appName')}</button></div>`;
    } else if (tab === 'decor') {
      const grid = ids => `<div class="decor-grid">${ids.map(id => `<button class="dec" data-decor="${id}" aria-label="${id}"><img src="${thumbs['d' + id] ||= decorThumb(id)}" alt=""></button>`).join('')}</div>`;
      h += `<button class="btn soft wide" data-act="blocks">🔤 ${t('blocksBtn', { name: k.name })}</button><div class="lbl">🐾 ${t('secAnimals')}</div>${grid(ANIMAL_IDS)}<div class="lbl">🎀 ${t('secDecor')}</div>${grid([...EXTRA_IDS, ...DECOR_IDS])}
        <div class="lbl">😊 ${t('secEmoji')}</div><div class="decor-grid">${EMOJI.map(e => `<button class="dec emo" data-emoji="${e}">${e}</button>`).join('')}</div>`;
    } else if (tab === 'worlds') {
      const ph1 = doc.layers.find(x => x.type === 'photo');
      h += `${ph1 && !ph1.cut ? `<button class="btn primary wide cut-tip" data-cutfirst="${ph1.id}">✂️ ${t('cutTip')}</button>` : ''}<p class="hint">${t('worldsHint')}</p><div class="worlds scroll-x">${WORLD_IDS.map(id => `<button class="world ${doc.world === id ? 'on' : ''}" data-world="${id}"><img src="${thumbs['w' + id] ||= worldThumb(id)}" alt=""><span>${t('w_' + id)}</span></button>`).join('')}</div>
        <button class="big-card pink tale-card" data-act="tale"><span class="bc-ic">📖</span><span><b>${t('taleBtn')}</b><small>${t('taleSub')}</small></span></button>`;
    } else if (tab === 'fx') {
      h += `<p class="hint">${t('fxHint')}</p><div class="worlds scroll-x">${EFFECT_IDS.map(id => `<button class="world fx ${(doc.effect || 'none') === id ? 'on' : ''}" data-fx="${id}"><img src="${fxThumb(id)}" alt=""><span>${t('fx_' + id)}</span></button>`).join('')}</div>`;
    }
    p.innerHTML = h;
  }
  function mileControls(m, isNew) {
    const units = ['week', 'month', 'day', 'year'];
    return `<div class="row gap mile-c"><div class="stepper"><button data-step="-1" aria-label="-">−</button><input type="number" data-num min="1" max="999" value="${m.num}" aria-label="${t('number')}"><button data-step="1" aria-label="+">+</button></div>
      <select data-unit aria-label="${t('unit')}">${units.map(u => `<option value="${u}" ${m.unit === u ? 'selected' : ''}>${ut(m.num, u).replace(String(m.num), '').trim()}</option>`).join('')}</select></div>
      <div class="chips wrap">${['garland', 'big', 'badge', 'plain'].map(s => `<button class="chip ${m.style === s ? 'on' : ''}" data-mstyle="${s}">${t('ms_' + s)}</button>`).join('')}</div>
      ${isNew ? `<button class="btn primary wide" data-act="addmile">+ ${t('addMile')}</button>` : ''}`;
  }
  let newMile = { num: currentMilestone(k)?.num || 1, unit: currentMilestone(k)?.unit || 'month', style: 'garland' };

  const P = $('#panel');
  P.addEventListener('input', e => {
    const l = ed.layer(); const el = e.target;
    if (el.dataset.r && l) { const val = +el.value; ed.update(() => { if (el.dataset.r === 'r') l.r = val * Math.PI / 180; else l[el.dataset.r] = val; }, { commit: false }); ed.commitSoon(); }
    if (el.hasAttribute('data-text') && l) { ed.update(() => { l.text = el.value; }, { commit: false }); ed.commitSoon(); }
    if (el.hasAttribute('data-color-pick') && l) { ed.update(() => { l.color = el.value; l.colorSet = true; }, { commit: false }); ed.commitSoon(); }
    if (el.hasAttribute('data-rcolor-pick') && l) { ed.update(() => { l.ribbon = el.value; }, { commit: false }); ed.commitSoon(); }
    if (el.hasAttribute('data-scolor-pick')) { ed.update(d => { d.sceneColor = el.value; }, { commit: false }); ed.commitSoon(); }
    if (el.hasAttribute('data-num')) { const n = Math.max(1, Math.min(999, parseInt(el.value) || 1)); if (l?.type === 'milestone') { ed.update(() => { l.num = n; }, { commit: false }); ed.commitSoon(); } else newMile.num = n; }
  });
  P.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-newtext]')) { e.preventDefault(); P.querySelector('[data-act=addtext]').click(); } });
  P.addEventListener('change', e => {
    const l = ed.layer(); const el = e.target;
    if (el.hasAttribute('data-unit')) { if (l?.type === 'milestone') ed.update(() => { l.unit = el.value; }); else newMile.unit = el.value; }
  });
  P.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const l = ed.layer(); const d = b.dataset;
    if ('desel' in d) return ed.select(null);
    if (d.scene) { ed.update(dd => { dd.scene = d.scene; dd.sceneColor = null; }); return panel(); }
    if (d.scolor) { ed.update(dd => { dd.sceneColor = d.scolor; }); return panel(); }
    if (d.prop) { ed.update(dd => { dd.prop = d.prop; }); return panel(); }
    if (d.color && l) { ed.update(() => { l.color = d.color; l.colorSet = true; }); return panel(); }
    if (d.rcolor && l) { ed.update(() => { l.ribbon = d.rcolor; }); return panel(); }
    if (d.tstyle && l) { ed.update(() => { l.style = d.tstyle; delete l.plate; l.s = 1; fitWidth(l, doc, 0.95); }); return panel(); }
    if (d.world) { ed.update(dd => { applyWorld(dd, d.world, t('w_' + d.world)); dd.world = d.world; }); label = label || t('w_' + d.world); return panel(); }
    if (d.fx) { ed.update(dd => { dd.effect = d.fx; }); return panel(); }
    if (d.frame && l) { ed.update(() => { l.frame = d.frame; }); return panel(); }
    if (d.tog && l) { ed.update(() => { l[d.tog] = !l[d.tog]; }); return panel(); }
    if (d.font && l) { ed.update(() => { l.font = d.font; l.s = 1; fitWidth(l, doc, 0.95); }); return panel(); }
    if (d.sel) return ed.select(d.sel);
    if (d.cutfirst) { const pl = ed.layer(d.cutfirst); return pl && cutBg(pl); }
    if (d.mstyle) { if (l?.type === 'milestone') { ed.update(() => { l.style = d.mstyle; l.s = 1; fitWidth(l, doc); l.y = d.mstyle === 'garland' ? doc.h * 0.16 : l.y; }); } else newMile.style = d.mstyle; return panel(); }
    if (d.step) { const inp = P.querySelector('[data-num]'); inp.value = Math.max(1, (+inp.value || 1) + +d.step); inp.dispatchEvent(new Event('input', { bubbles: true })); if (l?.type === 'milestone') ed.commit(); return; }
    if (d.addms) { const [num, unit, key] = d.addms.split('|'); ed.add(makeMilestoneLayer(doc, +num, unit, getLang(), 'garland')); milestoneKey = key; label = ut(+num, unit); return; }
    if (d.decor) return ed.add(makeDecorLayer(doc, d.decor));
    if (d.emoji) return ed.add(makeEmojiLayer(doc, d.emoji));
    if (d.quick) return ed.add(fitWidth(Object.assign(makeTextLayer(doc, d.quick, 'festive'), { style: 'outline', color: PALETTE.roseDeep, colorSet: true, y: doc.h * (0.78 + Math.random() * 0.08) }), doc, 0.9));
    if (d.fmt) {
      const [w, h] = FORMATS[d.fmt]; const ky = h / doc.h;
      ed.update(dd => { dd.layers.forEach(x => { x.y *= ky; }); dd.fmt = d.fmt; dd.w = w; dd.h = h; });
      db.setting('lastFmt', d.fmt); ed.resize(); return panel();
    }
    switch (d.act) {
      case 'addphoto': return addPhoto({ frame: 'soft' });
      case 'addparent': return addPhoto({ frame: 'heart', x: doc.w * 0.68, y: doc.h * 0.5, s: 0.7 });
      case 'cut': return cutBg(l);
      case 'addtext': { const inp = P.querySelector('[data-newtext]'); if (!inp.value.trim()) return inp.focus(); return ed.add(fitWidth(Object.assign(makeTextLayer(doc, inp.value.trim(), 'festive'), { style: 'outline', color: PALETTE.roseDeep, colorSet: true }), doc, 0.9)); }
      case 'tale': return makeTale();
      case 'blocks': {
        const chars = [...k.name.replace(/\s+/g, '')].slice(0, 10); const n = chars.length; if (!n) return;
        const sz = Math.min(200, (doc.w * 0.9) / n) / 220, gap = 220 * sz * 1.02, x0 = doc.w / 2 - (n - 1) * gap / 2;
        chars.forEach((ch, i) => doc.layers.push({ id: 'b' + Math.random().toString(36).slice(2, 8), type: 'block', ch: ch.toLocaleUpperCase(getLang()), i, x: x0 + i * gap, y: doc.h * 0.8 + (i % 2 ? -12 : 12), s: sz, r: (i % 2 ? 0.06 : -0.06), o: 1 }));
        ed.draw(); ed.commit(); return toast('🔤 ' + k.name);
      }
      case 'addmile': { const ml = makeMilestoneLayer(doc, newMile.num, newMile.unit, getLang(), newMile.style); ml.y += doc.layers.filter(x => x.type === 'milestone').length * doc.h * 0.12; ed.add(ml); label = label || ut(newMile.num, newMile.unit); return; }
      case 'dup': return ed.duplicate();
      case 'up': return ed.order(1);
      case 'down': return ed.order(-1);
      case 'del': return ed.remove();
      case 'sticker': { const blob = await exportSticker(l); return shareOrDownload(blob, fileName(t('sticker'), 'png')); }
    }
  });
  panel();
  if (!doc.layers.some(l => l.type === 'photo') && !arg.doc) { /* одразу пропонуємо фото */ }
}
async function addPhotoToDoc(doc, file, extra = {}) {
  const { blob, w, h } = await downscale(file, 2000);
  const key = await db.putBlob(blob); imgCache.set(key, await blobToImage(blob));
  const l = makePhotoLayer(doc, key, w, h, extra);
  if (!extra.s) { const maxH = doc.h * 0.55; if (l.h0 > maxH) l.s = maxH / l.h0; }
  else if (extra.s !== 1) l.s = extra.s;
  return l;
}

// ---------- «Де фото»: мокапи ----------
function mockOpts(src) {
  const k = kid(); const now = new Date();
  return { img: src.img, toy: src.toy || null, name: k?.name || '', t, issue: `№ ${now.getMonth() + 1} · ${fmtDate(now, { month: 'long', year: 'numeric' })}`, date: fmtDate(now, { weekday: 'long', day: 'numeric', month: 'long' }), year: String(now.getFullYear()), tale: t('taleTitle', { name: k?.name || '' }) };
}
function openMockups(src) {
  if (src.cut && !src.toy) { try { src.toy = toyify(src.cut); } catch (e) { console.warn(e); } }
  const o = mockOpts(src);
  const close = sheet(`<h3>🖼️ ${t('whereTitle')}</h3><p class="hint">${t('whereHint')}</p>
    ${src.toy ? '' : `<p class="hint">🗿 ${t('statueTip')}</p>`}
    <div class="mock-grid">${MOCKUP_IDS.map(id => `<button class="mock" data-mk="${id}"><canvas width="216" height="270"></canvas><span>${t('mk_' + id)}</span></button>`).join('')}</div>`, {
    cls: 'tall', onMount: (el) => {
      const tiles = $$('[data-mk]', el); let i = 0;
      const step = () => { if (i >= tiles.length) return; const b = tiles[i++]; try { b.querySelector('canvas').getContext('2d').drawImage(renderMockup(b.dataset.mk, 216, 270, o), 0, 0); } catch (e) { console.warn(e); } requestAnimationFrame(step); };
      requestAnimationFrame(step);
      el.addEventListener('click', e => { const b = e.target.closest('[data-mk]'); if (b) showMockup(b.dataset.mk, src, o); });
    }
  });
}
async function showMockup(id, src, o) {
  const c = renderMockup(id, 1080, 1350, o);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); const url = URL.createObjectURL(blob); const label = t('mk_' + id);
  sheet(`<h3>🖼️ ${label}</h3><img class="saved-prev" src="${url}" alt="">
    <div class="v-actions"><button class="btn primary" data-a="share">📤 ${t('share')}</button><button class="btn soft" data-a="dl">⬇️ ${t('download')}</button><button class="btn soft" data-a="album">💗 ${t('toAlbum')}</button></div>`, {
    cls: 'tall', onMount: (el) => el.addEventListener('click', async e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'share') shareOrDownload(blob, fileName(label));
      if (a === 'dl') download(blob, fileName(label));
      if (a === 'album') {
        const btn = e.target.closest('[data-a]'); if (btn.disabled) return; btn.disabled = true;
        const doc = newDoc('4:5'); const l = await addPhotoToDoc(doc, blob, { frame: 'none', shadow: false, s: 1 }); l.s = Math.max(doc.w / l.w0, doc.h / l.h0); l.x = doc.w / 2; l.y = doc.h / 2; doc.prop = 'none'; doc.layers.push(l);
        const th = (await downscale(blob, 420)).blob;
        await db.put('items', { id: uid(), kidId: S.kidId, created: Date.now(), date: iso(new Date()), label, doc, fullKey: await db.putBlob(blob), thumbKey: await db.putBlob(th) });
        await load(); btn.innerHTML = '✓ ' + t('saved'); toast('💗 ' + t('saved'));
      }
    })
  });
}

// ---------- ШІ-фотосесія ----------
async function viewAI(v) {
  const key = await db.setting('aiKey');
  const st = { photo: null, second: null, theme: 'studio' };
  v.innerHTML = `<header class="topbar"><button class="icon-btn" data-nav="home" aria-label="${t('close')}">←</button><h1>✨ ${t('aiShoot')}</h1><span></span></header>
  <p class="sub">${t('aiIntro')}</p>
  <section class="sec"><h2>1 · ${t('step1')}</h2><button class="drop" data-p="photo"><span class="drop-in">📷 ${t('choose')}</span></button></section>
  <section class="sec"><h2>2 · ${t('step2')}</h2><div class="themes">${AI_THEME_IDS.map(id => `<button class="theme ${id === st.theme ? 'on' : ''}" data-theme="${id}">${t('th_' + id)}</button>`).join('')}</div>
    <div class="second" hidden><p class="hint">${t('secondPhoto')}</p><button class="drop sm" data-p="second"><span class="drop-in">👩 ${t('choose')}</span></button></div></section>
  <p class="hint center gen-hint">↑ ${t('step1')}</p>
  <div class="card puter-card"><h3>✨ ${t('puterTitle')}</h3><p class="hint">${t('puterText')}</p>
    <button class="btn primary wide big" data-puter disabled>✨ ${t('generate')}</button></div>
  <div class="card free-card"><h3>🆓 ${t('freeTitle')}</h3><p class="hint">${t('freeText')}</p>
    <button class="btn primary wide" data-free>📋 ${t('copyOpen')}</button>
    <button class="btn soft wide" data-import>📥 ${t('addResult')}</button></div>
  <div class="card"><h3>⚡ ${t('autoTitle')}</h3><p class="hint">${t('autoText')}</p>
    <button class="btn soft wide" data-gen disabled>⚡ ${t('generate')}</button>
    ${key ? '' : `<button class="btn ghost wide" data-settings>🔑 ${t('openSettings')}</button>`}</div>
  <div class="ai-out"></div>`;
  $('[data-settings]', v)?.addEventListener('click', () => aiSettings());
  const genBtn = $('[data-gen]', v);
  const puterBtn = $('[data-puter]', v);
  loadPuter().catch(() => {});
  const check = () => { const off = !st.photo || (st.theme === 'family' && !st.second); genBtn.disabled = off; puterBtn.disabled = off; $('.gen-hint', v).hidden = !off; };
  $$('[data-p]', v).forEach(b => b.onclick = async () => { const [f] = await pickFiles(); if (!f) return; st[b.dataset.p] = f; b.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`; b.classList.add('has'); check(); });
  $$('[data-theme]', v).forEach(b => b.onclick = () => { st.theme = b.dataset.theme; $$('[data-theme]', v).forEach(x => x.classList.toggle('on', x === b)); $('.second', v).hidden = st.theme !== 'family'; check(); });
  $('[data-free]', v).onclick = async () => {
    const prompt = buildPrompt(st.theme, st.theme === 'family');
    let ok = false; try { await navigator.clipboard.writeText(prompt); ok = true; } catch {}
    sheet(`<h3>🆓 ${t('freeTitle')}</h3>${ok ? `<p>✅ ${t('copied')}</p>` : ''}
      <textarea rows="6" readonly class="prompt-box">${esc(prompt)}</textarea>
      <div class="row gap"><button class="btn soft" data-copy>📋 ${t('copy')}</button>
      <a class="btn primary" href="https://gemini.google.com/app" target="_blank" rel="noopener">✨ ${t('openGemini')}</a></div>
      <p class="hint">${t('freeText')}</p>`, {
      onMount: el => { const ta = $('.prompt-box', el); $('[data-copy]', el).onclick = async () => { ta.select(); try { await navigator.clipboard.writeText(prompt); } catch { document.execCommand && document.execCommand('copy'); } toast('📋 ' + t('copied')); }; }
    });
  };
  $('[data-import]', v).onclick = async () => { const [f] = await pickFiles(); if (f) go('studio', { photoBlob: f, milestone: currentMilestone(kid()), label: t('th_' + st.theme) }); };
  puterBtn.onclick = async () => {
    try { if (window.puter && !window.puter.auth.isSignedIn()) await window.puter.auth.signIn(); } catch (e) { return toast(t('puterSign'), 4000); }
    runGen(() => puterPhotoshoot({ photo: st.photo, second: st.second, theme: st.theme }));
  };
  genBtn.onclick = async () => {
    const k2 = await db.setting('aiKey'); if (!k2) return aiSettings();
    runGen(async () => aiPhotoshoot({ key: k2, model: (await db.setting('aiModel')) || 'gemini-2.5-flash-image', photo: st.photo, second: st.second, theme: st.theme }));
  };
  async function runGen(fn) {
    const out = $('.ai-out', v); genBtn.disabled = true; puterBtn.disabled = true;
    out.innerHTML = `<div class="card center"><div class="spinner"></div><p>${t('generating')}</p></div>`;
    out.scrollIntoView({ behavior: 'smooth' });
    try {
      const blob = await fn();
      const url = URL.createObjectURL(blob), orig = URL.createObjectURL(st.photo);
      out.innerHTML = `<div class="ba res" style="--p:100%"><img class="ba-after" src="${url}" alt=""><img class="ba-before" src="${orig}" alt=""><input class="ba-range" type="range" min="0" max="100" value="100" aria-label="${t('before')} / ${t('after')}"><span class="ba-l">${t('before')}</span><span class="ba-r">${t('after')}</span></div>
        <div class="v-actions"><button class="btn primary" data-o="studio">🎉 ${t('toStudio')}</button><button class="btn soft" data-o="album">🖼️ ${t('toAlbum')}</button><button class="btn soft" data-o="again">🔄 ${t('again')}</button><button class="btn ghost" data-o="dl">⬇️ ${t('download')}</button></div>`;
      const r = $('.ba-range', out); r.oninput = () => $('.ba', out).style.setProperty('--p', r.value + '%');
      out.onclick = async e => {
        const o = e.target.closest('[data-o]')?.dataset.o; if (!o) return;
        if (o === 'again') return runGen(fn);
        if (o === 'dl') return download(blob, fileName(t('th_' + st.theme)));
        if (o === 'studio') return go('studio', { photoBlob: blob, milestone: currentMilestone(kid()), label: t('th_' + st.theme) });
        if (o === 'album') {
          const btn = e.target.closest('[data-o]'); if (btn.disabled) return; btn.disabled = true; const lbl = btn.innerHTML; btn.innerHTML = '<span class="spinner sm"></span>';
          const doc = newDoc('9:16'); const l = await addPhotoToDoc(doc, blob, { frame: 'none', shadow: false });
          l.s = Math.max(doc.w / l.w0, doc.h / l.h0); l.x = doc.w / 2; l.y = doc.h / 2; doc.layers.push(l); doc.prop = 'none';
          const full = await exportBlob(doc); const th = (await downscale(full, 420)).blob;
          await db.put('items', { id: uid(), kidId: S.kidId, created: Date.now(), date: iso(new Date()), label: t('th_' + st.theme), doc, originalKey: await db.putBlob((await downscale(st.photo, 1600)).blob), fullKey: await db.putBlob(full), thumbKey: await db.putBlob(th) });
          await load(); toast('💗 ' + t('saved')); btn.innerHTML = '✓ ' + t('saved');
        }
      };
    } catch (e) { console.warn(e); out.innerHTML = `<div class="card warn"><p>${e.billing ? t('aiBilling') : esc(t('err', { e: e.message }))}</p>${e.puter ? `<p class="hint">${t('puterFail')}</p>` : ''}</div>`; }
    check();
  }
}
async function aiSettings() {
  const key = (await db.setting('aiKey')) || '', model = (await db.setting('aiModel')) || 'gemini-2.5-flash-image';
  sheet(`<h3>🔑 ${t('ai')}</h3><form class="form" id="aif">
    <label>${t('aiKey')}<input name="key" type="password" autocomplete="off" value="${esc(key)}" placeholder="AIza…"></label>
    <p class="hint">${t('aiKeyHelp')} <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com</a></p>
    <label>${t('model')}<input name="model" value="${esc(model)}" autocomplete="off"></label>
    <button class="btn primary wide">${t('save')}</button></form>`, {
    onMount: (el, close) => $('#aif', el).onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); await db.setting('aiKey', String(f.get('key')).trim()); await db.setting('aiModel', String(f.get('model')).trim() || 'gemini-2.5-flash-image'); close(); toast('✓'); if (S.view === 'ai') go('ai'); }
  });
}

// ---------- Історія росту (слайдшоу + відео) ----------
async function viewStory(v, arg = {}) {
  const items = arg.ids ? arg.ids.map(id => S.items.find(i => i.id === id)).filter(Boolean) : kidItems().slice().reverse();
  v.innerHTML = `<div class="story"><header class="st-top dark"><button class="icon-btn" data-x aria-label="${t('close')}">←</button><b>${esc(arg.title || t('story'))}</b><span></span></header>
    <div class="story-stage"><canvas id="scv" width="1080" height="1920"></canvas></div>
    <div class="story-bar"><button class="btn primary" data-play>▶ ${t('play')}</button><button class="btn soft" data-rec>🎬 ${t('saveVideo')}</button></div></div>`;
  const cv = $('#scv', v), ctx = cv.getContext('2d');
  const imgs = await Promise.all(items.map(async i => blobToImage(await db.getBlob(i.fullKey))));
  const k = kid(); const PER = 2600, FADE = 700;
  let raf, start;
  const frame = (ms) => {
    const n = imgs.length, total = n * PER; const tt = Math.min(ms, total - 1); const i = Math.floor(tt / PER), local = tt - i * PER;
    ctx.fillStyle = '#FFF8F0'; ctx.fillRect(0, 0, 1080, 1920);
    const drawI = (idx, alpha, zoom) => { const img = imgs[idx]; if (!img) return; const s = Math.max(1080 / img.naturalWidth, 1920 / img.naturalHeight) * zoom; ctx.globalAlpha = alpha; ctx.drawImage(img, 540 - img.naturalWidth * s / 2, 960 - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s); ctx.globalAlpha = 1; };
    drawI(i, 1, 1 + local / PER * 0.06);
    if (local > PER - FADE && i + 1 < n) drawI(i + 1, (local - (PER - FADE)) / FADE, 1);
    const g = ctx.createLinearGradient(0, 1500, 0, 1920); g.addColorStop(0, 'rgba(107,78,78,0)'); g.addColorStop(1, 'rgba(107,78,78,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 1500, 1080, 420);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '700 64px Comfortaa'; ctx.fillText(items[i].label || '', 540, 1760);
    ctx.font = '400 54px "Marck Script"'; ctx.fillText(`${k.name} · ${fmtDate(items[i].date)}`, 540, 1840);
    return ms < total;
  };
  frame(0);
  const play = (onEnd) => { cancelAnimationFrame(raf); start = performance.now(); const step = now => { if (frame(now - start)) raf = requestAnimationFrame(step); else onEnd && onEnd(); }; raf = requestAnimationFrame(step); };
  $('[data-x]', v).onclick = () => { cancelAnimationFrame(raf); go('album'); };
  $('[data-play]', v).onclick = () => play();
  $('[data-rec]', v).onclick = async () => {
    if (!cv.captureStream || !window.MediaRecorder) return toast('✕ MediaRecorder');
    const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mime = types.find(x => MediaRecorder.isTypeSupported(x)) || '';
    const rec = new MediaRecorder(cv.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : {});
    const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => { const blob = new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' }); shareOrDownload(blob, fileName(t('story'), blob.type.includes('mp4') ? 'mp4' : 'webm')); };
    toast(t('recording'), (imgs.length * PER) + 1000); rec.start(250); play(() => setTimeout(() => rec.stop(), 300));
  };
}

// ---------- Листи у майбутнє ----------
function viewLetters(v) {
  const k = kid(); const list = S.letters.filter(l => l.kidId === k.id).sort((a, b) => a.openDate.localeCompare(b.openDate));
  v.innerHTML = `<header class="topbar"><button class="icon-btn" data-nav="more" aria-label="${t('close')}">←</button><h1>💌 ${t('letter')}</h1><span></span></header>
  <p class="sub">${t('letterSub')}</p>
  <button class="btn primary wide" data-write>✍️ ${t('writeLetter')}</button>
  <div class="letters">${list.map(l => { const sealed = new Date(l.openDate) > new Date(); return `<button class="envelope ${sealed ? 'sealed' : 'open'}" data-l="${l.id}"><span class="env-ic">${sealed ? '💌' : '📖'}</span><span><b>${esc(l.title || t('letter'))}</b><small>${sealed ? t('sealedUntil', { d: fmtDate(l.openDate) }) + ' · ' + t('inYears', { t: spanText(Math.round((new Date(l.openDate) - new Date()) / DAY)) }) : fmtDate(l.openDate)}</small></span></button>`; }).join('')}</div>`;
  $('[data-write]', v).onclick = () => letterSheet();
  $$('[data-l]', v).forEach(b => b.onclick = () => { const l = S.letters.find(x => x.id === b.dataset.l); new Date(l.openDate) > new Date() ? sealedSheet(l) : sheet(`<h3>📖 ${esc(l.title)}</h3><p class="letter-body">${esc(l.body).replace(/\n/g, '<br>')}</p><small>${fmtDate(l.created)}</small>`); });
}
function letterSheet() {
  const k = kid(); const b = new Date(k.birth);
  const opts = [[1, 'year'], [5, 'year'], [10, 'year'], [18, 'year']].map(([n]) => { const d = new Date(b); d.setFullYear(d.getFullYear() + n); return [n, d]; }).filter(([, d]) => d > new Date());
  sheet(`<h3>✍️ ${t('writeLetter')}</h3><form class="form" id="lf">
    <label>${t('title')}<input name="title" maxlength="60" value="${esc(k.name)}"></label>
    <label><textarea name="body" rows="7" required placeholder="${t('letterPh')}"></textarea></label>
    <div class="lbl">${t('openOn')}</div><div class="chips wrap">${opts.map(([n, d], i) => `<button type="button" class="chip ${i === opts.length - 1 ? 'on' : ''}" data-od="${iso(d)}">${ut(n, 'year')}</button>`).join('')}</div>
    <input type="date" name="openDate" value="${opts.length ? iso(opts[opts.length - 1][1]) : iso(new Date(Date.now() + 365 * DAY))}" min="${iso(new Date(Date.now() + DAY))}">
    <button class="btn primary wide">💌 ${t('seal')}</button></form>`, {
    onMount: (el, close) => {
      $$('[data-od]', el).forEach(c => c.onclick = () => { $$('[data-od]', el).forEach(x => x.classList.toggle('on', x === c)); el.querySelector('[name=openDate]').value = c.dataset.od; });
      $('#lf', el).onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); await db.put('letters', { id: uid(), kidId: S.kidId, title: String(f.get('title')).trim(), body: String(f.get('body')), openDate: f.get('openDate'), created: Date.now() }); await load(); close(); go('letters'); };
    }
  });
}
function sealedSheet(l) {
  sheet(`<div class="center"><div class="seal-big">💌</div><h3>${esc(l.title)}</h3><p>${t('sealedUntil', { d: fmtDate(l.openDate) })}</p><button class="btn ghost danger-text" data-del>${t('del')}</button></div>`, {
    onMount: (el, close) => $('[data-del]', el).onclick = async () => { if (await confirmBox(t('del') + '?')) { await db.del('letters', l.id); await load(); close(); go('letters'); } }
  });
}

// ---------- Ще ----------
function viewMore(v) {
  v.innerHTML = `<header class="topbar"><h1>${t('more')}</h1></header>
  <div class="card list">
    <div class="list-row"><span>🌐 ${t('lang')}</span>${langSelect('inline')}</div>
  </div>
  <h3 class="grp">${t('kids')}</h3>
  <div class="card list">${S.kids.map(k => `<button class="list-row btn-row" data-kid="${k.id}"><span>👶 ${esc(k.name)} <small>${esc(ageText(k.birth))}${k.id === S.kidId ? ' · ' + t('active') : ''}</small></span><span>✏️</span></button>`).join('')}
    <button class="list-row btn-row" data-addkid><span>➕ ${t('addKid')}</span></button></div>
  <div class="card list">
    <button class="list-row btn-row" data-nav="letters"><span>💌 ${t('letter')}<small>${t('letterSub')}</small></span><span>›</span></button>
    <button class="list-row btn-row" data-ai><span>🔑 ${t('ai')}<small>${t('aiKey')}</small></span><span>›</span></button>
    <button class="list-row btn-row" data-bexp><span>💾 ${t('backupExport')}</span><span>›</span></button>
    <button class="list-row btn-row" data-bimp><span>📂 ${t('backupImport')}</span><span>›</span></button>
  </div>
  <div class="card"><h3>🔒 ${t('privacy')}</h3><p>${t('privacyText')}</p></div>
  ${isStandalone() ? '' : `<div class="card"><h3>📲 ${t('install')}</h3><p>${t('installIOS')}</p><p>${t('installAndroid')}</p>${S.installEvt ? `<button class="btn primary" data-install>${t('installBtn')}</button>` : ''}</div>`}
  <div class="card center about">${logoSvg(56)}<b>${t('appName')}</b><p>${t('aboutText')}</p><small>v1.0</small></div>`;
  $$('[data-kid]', v).forEach(b => b.onclick = async () => { if (b.dataset.kid !== S.kidId) { S.kidId = b.dataset.kid; await db.setting('kidId', S.kidId); } go('onboard', { edit: b.dataset.kid }); });
  $('[data-addkid]', v).onclick = () => go('onboard');
  $('[data-ai]', v).onclick = () => aiSettings();
  $('[data-bexp]', v).onclick = async () => download(await exportBackup(), `moya-lyubov-backup-${iso(new Date())}.json`);
  $('[data-bimp]', v).onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json'; i.onchange = async () => { try { await importBackup(i.files[0]); await load(); toast('✓ ' + t('backupDone')); go('home'); } catch (e) { toast(e.message, 4000); } }; i.click(); };
  bindInstall(v);
}

// ---------- Старт ----------
document.addEventListener('click', e => {
  const n = e.target.closest('[data-nav]'); if (!n) return;
  const view = n.dataset.nav; if (view === 'create') openCreate(); else go(view);
});
document.addEventListener('change', async e => {
  if (!e.target.matches('[data-lang]')) return;
  setLang(e.target.value); await db.setting('lang', e.target.value);
  document.title = t('appName'); go(S.view === 'onboard' ? 'onboard' : S.view, S.view === 'onboard' ? (S.kids.length ? {} : {}) : undefined);
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (S.view === 'home' || S.view === 'more') go(S.view); });

(async function init() {
  setLang((await db.setting('lang')) || detectLang());
  document.title = t('appName');
  await load();
  try { await Promise.all(['700 20px Comfortaa', '400 20px "Marck Script"', '400 20px Lobster', '400 20px Neucha', '700 20px "Amatic SC"'].map(f => document.fonts.load(f, 'Аa'))); } catch {}
  go(S.kids.length ? 'home' : 'onboard');
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
window.__ml = { S, go, db };
