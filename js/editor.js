// Рушій фотостудії: документ із шарів, рендер на canvas, жести, історія.
import { SCENES, PROPS, DECOR, heartPath, PALETTE } from './scenes.js';
import { unitText } from './i18n.js';
import { db } from './db.js';
import { drawSticker, drawBlock } from './stickers.js';
import { applyEffect } from './effects.js';

export const FORMATS = { '9:16': [1080, 1920], '4:5': [1080, 1350], '1:1': [1080, 1080], '3:4': [1080, 1440] };
const CJK = '"Hiragino Maru Gothic ProN", "PingFang SC", "Noto Sans Hebrew", system-ui, sans-serif';
export const FONT = { display: '"Comfortaa", ' + CJK, script: '"Marck Script", "Comfortaa", cursive', festive: '"Lobster", "Comfortaa", ' + CJK, kids: '"Neucha", "Comfortaa", ' + CJK, tall: '"Amatic SC", "Comfortaa", ' + CJK };
export const FONT_IDS = Object.keys(FONT);
export const TEXT_STYLES = ['plain', 'outline', 'plate', 'glow', 'arc', 'ribbon'];
const tstyle = l => l.style || (l.plate ? 'plate' : 'plain');
const fontW = f => (f === 'script' || f === 'kids' ? 400 : 700);

export function newDoc(fmt = '9:16') {
  const [w, h] = FORMATS[fmt];
  return { v: 1, fmt, w, h, scene: 'peach', sceneColor: null, prop: 'blanket', layers: [] };
}
const lid = () => 'l' + Math.random().toString(36).slice(2, 9);

export function makePhotoLayer(doc, imgKey, nw, nh, opts = {}) {
  const base = doc.w * 0.62;
  const w0 = base, h0 = base * nh / nw;
  return { id: lid(), type: 'photo', imgKey, cutKey: null, cut: false, frame: 'soft', shadow: true, outline: false,
    w0, h0, x: doc.w / 2, y: doc.h * 0.6, s: 1, r: 0, o: 1, ...opts };
}
export function makeMilestoneLayer(doc, num, unit, lang, style = 'garland') {
  const y = style === 'garland' ? doc.h * 0.16 : doc.h * 0.22;
  const l = { id: lid(), type: 'milestone', num, unit, lang, style, color: PALETTE.roseDeep, x: doc.w / 2, y, s: 1, r: 0, o: 1 };
  fitWidth(l, doc); return l;
}
export function fitWidth(l, doc, k = 0.9) { const { w } = layerSize(l); l.s = Math.min(l.s || 1, doc.w * k / w); return l; }
export function makeTextLayer(doc, text, font = 'script') {
  return { id: lid(), type: 'text', text, font, size: 110, color: PALETTE.cocoa, plate: false, x: doc.w / 2, y: doc.h * 0.88, s: 1, r: 0, o: 1 };
}
export function makeDecorLayer(doc, name) {
  return { id: lid(), type: 'decor', name, x: doc.w * (0.25 + Math.random() * 0.5), y: doc.h * (0.3 + Math.random() * 0.3), s: 1, r: 0, o: 1 };
}
export function makeEmojiLayer(doc, ch) {
  return { id: lid(), type: 'emoji', ch, x: doc.w * (0.25 + Math.random() * 0.5), y: doc.h * (0.3 + Math.random() * 0.3), s: 1, r: 0, o: 1 };
}

// --- Кеш зображень ---
export const imgCache = new Map();
export async function loadImage(key) {
  if (!key) return null;
  if (imgCache.has(key)) return imgCache.get(key);
  const blob = await db.getBlob(key);
  if (!blob) return null;
  const img = await blobToImage(blob);
  imgCache.set(key, img);
  return img;
}
export function blobToImage(blob) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(blob); const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
}
export async function ensureImages(doc) {
  await Promise.all(doc.layers.filter(l => l.type === 'photo').flatMap(l => [loadImage(l.imgKey), loadImage(l.cutKey)]));
}

// --- Вимірювання шарів ---
const mctx = document.createElement('canvas').getContext('2d');
function textLines(l) { return String(l.text || ' ').split('\n'); }
export function layerSize(l) {
  switch (l.type) {
    case 'photo': return l.frame === 'round' || l.frame === 'heart' ? { w: Math.min(l.w0, l.h0), h: Math.min(l.w0, l.h0) } : { w: l.w0, h: l.h0 };
    case 'text': {
      const st = tstyle(l);
      mctx.font = `${fontW(l.font)} ${l.size}px ${FONT[l.font] || FONT.display}`;
      const lines = textLines(l);
      const tw = Math.max(...lines.map(s => mctx.measureText(s).width));
      if (st === 'arc') return { w: tw * 0.92 + l.size, h: l.size * 1.2 + tw * 0.22 };
      const pad = st === 'plate' || st === 'ribbon' ? l.size * (st === 'ribbon' ? 1.6 : 1) : l.size * 0.3;
      return { w: tw + pad, h: lines.length * l.size * 1.25 + (st === 'plate' || st === 'ribbon' ? l.size * 0.5 : 0) };
    }
    case 'milestone': {
      const txt = unitText(l.lang, l.num, l.unit);
      if (l.style === 'garland') { const n = [...txt].filter(c => c !== ' ').length + (txt.includes(' ') ? 0.6 : 0); return { w: Math.max(3, n) * 128 + 60, h: 300 }; }
      if (l.style === 'big') return { w: 520, h: 600 };
      if (l.style === 'badge') return { w: 420, h: 420 };
      mctx.font = `400 140px ${FONT.script}`; return { w: mctx.measureText(txt).width + 40, h: 190 };
    }
    case 'decor': return { w: 220, h: 220 };
    case 'emoji': return { w: 200, h: 200 };
    case 'block': return { w: 180, h: 180 };
  }
  return { w: 100, h: 100 };
}

// --- Малювання ---
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function framePath(ctx, frame, w, h) {
  ctx.beginPath();
  if (frame === 'round') ctx.arc(0, 0, Math.min(w, h) / 2, 0, 7);
  else if (frame === 'oval' || frame === 'soft') ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 7);
  else if (frame === 'heart') { heartPath(ctx, 0, -h * 0.05, w * 0.98); }
  else roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.06);
}
const outlineCache = new Map();
function outlined(img, rad) {
  const k = img.src + '|' + rad;
  if (outlineCache.has(k)) return outlineCache.get(k);
  const c = document.createElement('canvas'); c.width = img.naturalWidth + rad * 2; c.height = img.naturalHeight + rad * 2;
  const x = c.getContext('2d');
  for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; x.drawImage(img, rad + Math.cos(t) * rad, rad + Math.sin(t) * rad); }
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-over'; x.drawImage(img, rad, rad);
  outlineCache.set(k, c); return c;
}
const softCache = new Map();
function softMask(img, w, h) {
  const k = img.src + '|soft|' + Math.round(w) + 'x' + Math.round(h);
  if (softCache.has(k)) return softCache.get(k);
  const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h);
  const x = c.getContext('2d');
  coverDraw(x, img, 0, 0, w, h);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.52);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.75, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.save(); x.translate(w / 2, h / 2); x.scale(1, h / w); x.translate(-w / 2, -w / 2); x.fillRect(0, 0, w, w); x.restore();
  softCache.set(k, c); return c;
}
function coverDraw(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

function drawPhoto(ctx, l) {
  const useCut = l.cut && l.cutKey && imgCache.get(l.cutKey);
  const img = useCut ? imgCache.get(l.cutKey) : imgCache.get(l.imgKey);
  const { w, h } = layerSize(l);
  if (!img) { ctx.fillStyle = 'rgba(255,255,255,.6)'; roundRect(ctx, -w / 2, -h / 2, w, h, 30); ctx.fill(); return; }
  if (useCut) {
    if (l.shadow) { ctx.shadowColor = 'rgba(90,55,45,.32)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; }
    if (l.outline) { const rad = Math.round(img.naturalWidth * 0.018) + 4; const o = outlined(img, rad); const k = w / img.naturalWidth; ctx.drawImage(o, -w / 2 - rad * k, -h / 2 - rad * k, o.width * k, o.height * k); }
    else ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.shadowColor = 'transparent';
    return;
  }
  if (l.frame === 'soft') { ctx.drawImage(softMask(img, w, h), -w / 2, -h / 2, w, h); return; }
  ctx.save();
  if (l.shadow) { ctx.shadowColor = 'rgba(90,55,45,.3)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16; framePath(ctx, l.frame, w, h); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; }
  framePath(ctx, l.frame, w, h); ctx.clip();
  coverDraw(ctx, img, -w / 2, -h / 2, w, h);
  ctx.restore();
  if (l.outline || l.frame !== 'none') { framePath(ctx, l.frame, w, h); ctx.lineWidth = l.outline ? 22 : 10; ctx.strokeStyle = '#fff'; ctx.stroke(); }
}

function drawText(ctx, l) {
  const st = tstyle(l), { w, h } = layerSize(l);
  const font = `${fontW(l.font)} ${l.size}px ${FONT[l.font] || FONT.display}`;
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const lines = textLines(l), lh = l.size * 1.25;
  if (st === 'plate') { ctx.fillStyle = 'rgba(255,255,255,.85)'; roundRect(ctx, -w / 2, -h / 2, w, h, l.size * 0.5); ctx.fill(); }
  if (st === 'ribbon') {
    const rh = h * 0.86, tail = l.size * 0.55;
    ctx.fillStyle = shade(l.ribbon || '#F2B8B5', -18);
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * (w / 2 - tail * 0.6), -rh / 2 + rh * 0.18); ctx.lineTo(sx * (w / 2 + tail * 0.4), -rh / 2 + rh * 0.18); ctx.lineTo(sx * (w / 2 + tail * 0.05), rh * 0.18); ctx.lineTo(sx * (w / 2 + tail * 0.4), rh / 2 + rh * 0.18); ctx.lineTo(sx * (w / 2 - tail * 0.6), rh / 2 + rh * 0.18); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = l.ribbon || '#F2B8B5'; ctx.beginPath(); ctx.moveTo(-w / 2 + tail * 0.3, -rh / 2); ctx.quadraticCurveTo(0, -rh / 2 - l.size * 0.25, w / 2 - tail * 0.3, -rh / 2); ctx.lineTo(w / 2 - tail * 0.3, rh / 2); ctx.quadraticCurveTo(0, rh / 2 - l.size * 0.25, -w / 2 + tail * 0.3, rh / 2); ctx.closePath(); ctx.fill();
  }
  const paint = (txt, x, y) => {
    if (st === 'outline') { ctx.lineWidth = l.size * 0.16; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(txt, x, y); }
    if (st === 'glow') { ctx.save(); ctx.shadowColor = l.glow || '#FFFFFF'; ctx.shadowBlur = l.size * 0.45; ctx.fillStyle = l.color; for (let k = 0; k < 2; k++) ctx.fillText(txt, x, y); ctx.restore(); }
    ctx.fillStyle = st === 'ribbon' && !l.colorSet ? '#FFFFFF' : l.color; ctx.fillText(txt, x, y);
  };
  if (st === 'arc') {
    const txt = lines.join(' '); ctx.font = font; const tw = ctx.measureText(txt).width;
    const R = Math.max(tw * 0.75, l.size * 2), ang = tw / R; let a = -ang / 2;
    ctx.save(); ctx.translate(0, R - h / 2 + l.size * 0.6);
    for (const ch of [...txt]) { const cw = ctx.measureText(ch).width; a += cw / 2 / R; ctx.save(); ctx.rotate(a); ctx.translate(0, -R); ctx.lineWidth = l.size * 0.16; ctx.strokeStyle = '#fff'; ctx.strokeText(ch, 0, 0); ctx.fillStyle = l.color; ctx.fillText(ch, 0, 0); ctx.restore(); a += cw / 2 / R; }
    ctx.restore(); return;
  }
  lines.forEach((s, i) => paint(s, 0, (i - (lines.length - 1) / 2) * lh - (st === 'ribbon' ? l.size * 0.05 : 0)));
}
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + amt)); return `rgb(${c(n >> 16 & 255)},${c(n >> 8 & 255)},${c(n & 255)})`; }

const FLAG_COLORS = ['#F2B8B5', '#FFF0C2', '#FBD9C3', '#E58F95', '#F8D98A'];
function drawMilestone(ctx, l) {
  const txt = unitText(l.lang, l.num, l.unit);
  const { w, h } = layerSize(l);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (l.style === 'garland') {
    let chars = [...txt.toLocaleUpperCase(l.lang)]; if (l.lang === 'he') chars = chars.reverse();
    const fw = 118, gap = 10, sag = 46;
    const slots = []; let x = 0;
    chars.forEach(c => { if (c === ' ') { x += fw * 0.6; } else { slots.push({ c, x }); x += fw + gap; } });
    const total = x - gap, x0 = -total / 2, top = -h / 2 + 40;
    const yAt = t => top + Math.sin(t * Math.PI) * sag;
    ctx.strokeStyle = '#B98C7A'; ctx.lineWidth = 5; ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const t = i / 30; const px = -w / 2 + t * w; const yy = top + Math.sin(t * Math.PI) * sag * (w / total); i ? ctx.lineTo(px, yy) : ctx.moveTo(px, yy); }
    ctx.stroke();
    slots.forEach((s, i) => {
      const cx = x0 + s.x + fw / 2; const t = (cx + w / 2) / w; const y = top + Math.sin(t * Math.PI) * sag * (w / total);
      ctx.save(); ctx.translate(cx, y); ctx.rotate((t - 0.5) * -0.35);
      ctx.shadowColor = 'rgba(100,60,50,.18)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
      ctx.fillStyle = i % 5 === 3 ? l.color : FLAG_COLORS[i % FLAG_COLORS.length];
      ctx.beginPath(); ctx.moveTo(-fw / 2, 0); ctx.lineTo(fw / 2, 0); ctx.lineTo(fw / 2, 170); ctx.lineTo(0, 130); ctx.lineTo(-fw / 2, 170); ctx.closePath(); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-fw / 2, 0, fw, 10);
      ctx.fillStyle = i % 5 === 3 ? '#fff' : '#8C5A5A'; ctx.font = `700 80px ${FONT.display}`; ctx.fillText(s.c, 0, 68);
      ctx.restore();
    });
    return;
  }
  if (l.style === 'big') {
    let fs = 400; ctx.font = `700 ${fs}px ${FONT.display}`;
    const nw = ctx.measureText(String(l.num)).width; if (nw > 470) { fs = Math.floor(fs * 470 / nw); ctx.font = `700 ${fs}px ${FONT.display}`; }
    ctx.lineJoin = 'round'; ctx.lineWidth = 34; ctx.strokeStyle = '#fff';
    ctx.shadowColor = 'rgba(100,60,50,.2)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
    ctx.strokeText(String(l.num), 0, -70); ctx.shadowColor = 'transparent';
    const g = ctx.createLinearGradient(0, -280, 0, 140); g.addColorStop(0, '#F7C4B7'); g.addColorStop(1, l.color);
    ctx.fillStyle = g; ctx.fillText(String(l.num), 0, -70);
    const word = unitText(l.lang, l.num, l.unit).replace(String(l.num), '').trim();
    ctx.font = `700 74px ${FONT.display}`; const ww = ctx.measureText(word).width + 80;
    ctx.fillStyle = '#FFF8F0'; roundRect(ctx, -ww / 2, 170, ww, 110, 55); ctx.fill();
    ctx.strokeStyle = l.color; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#8C5A5A'; ctx.fillText(word, 0, 228);
    return;
  }
  if (l.style === 'badge') {
    const R = 190;
    ctx.shadowColor = 'rgba(100,60,50,.2)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fff'; ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ctx.arc(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, R * 0.13, a - Math.PI / 2, a + Math.PI / 2); }
    ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFF0C2'; ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, 7); ctx.fill();
    ctx.strokeStyle = l.color; ctx.setLineDash([10, 10]); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, R * 0.72, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    let bf = 170; ctx.font = `700 ${bf}px ${FONT.display}`; const bw = ctx.measureText(String(l.num)).width; if (bw > R * 1.15) { bf = Math.floor(bf * R * 1.15 / bw); ctx.font = `700 ${bf}px ${FONT.display}`; }
    ctx.fillStyle = l.color; ctx.fillText(String(l.num), 0, -20);
    const word = unitText(l.lang, l.num, l.unit).replace(String(l.num), '').trim();
    ctx.fillStyle = '#8C5A5A'; ctx.font = `700 50px ${FONT.display}`; ctx.fillText(word, 0, 92);
    return;
  }
  ctx.font = `400 140px ${FONT.script}`; ctx.fillStyle = l.color;
  ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineJoin = 'round'; ctx.strokeText(txt, 0, 0); ctx.fillText(txt, 0, 0);
}

export function drawLayer(ctx, l) {
  ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.r); ctx.scale(l.s, l.s); ctx.globalAlpha = l.o ?? 1;
  if (l.type === 'photo') drawPhoto(ctx, l);
  else if (l.type === 'text') drawText(ctx, l);
  else if (l.type === 'milestone') drawMilestone(ctx, l);
  else if (l.type === 'decor') { if (DECOR[l.name]) DECOR[l.name](ctx, 200, l.color); else if (drawSticker(ctx, l.name, 240) === false) DECOR.heart(ctx, 200); }
  else if (l.type === 'block') { drawBlock(ctx, 230, l.ch, l.i || 0); }
  else if (l.type === 'emoji') { ctx.font = `180px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l.ch, 0, 10); }
  ctx.restore();
}

export function render(ctx, doc, { bg = true } = {}) {
  const { w, h } = doc;
  if (bg) {
    const sc = SCENES[doc.scene] || SCENES.plain;
    ctx.save(); sc.draw(ctx, w, h, doc.sceneColor || sc.color); ctx.restore();
    ctx.save(); (PROPS[doc.prop] || PROPS.none).draw(ctx, w, h); ctx.restore();
  }
  for (const l of doc.layers) drawLayer(ctx, l);
  if (doc.effect && doc.effect !== 'none') applyEffect(ctx, doc.effect);
}

export async function exportBlob(doc, { type = 'image/jpeg', q = 0.92, scale = 1 } = {}) {
  await ensureImages(doc); await document.fonts.ready;
  const c = document.createElement('canvas'); c.width = doc.w * scale; c.height = doc.h * scale;
  const ctx = c.getContext('2d'); ctx.scale(scale, scale); render(ctx, doc);
  return new Promise(r => c.toBlob(r, type, q));
}
export async function exportSticker(layer) {
  const l = { ...layer, x: 0, y: 0, r: 0, s: 1, outline: true, shadow: false };
  if (l.type === 'photo' && !l.cut) l.frame = l.frame === 'none' || l.frame === 'soft' ? 'heart' : l.frame;
  const { w, h } = layerSize(l); const pad = 60;
  const c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad * 2;
  const ctx = c.getContext('2d'); ctx.translate(c.width / 2, c.height / 2); drawLayer(ctx, l);
  return new Promise(r => c.toBlob(r, 'image/png'));
}

const strip = doc => JSON.stringify(doc);

// --- Інтерактивний редактор ---
export class Editor {
  constructor(canvas, doc, { onChange, onSelect } = {}) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.doc = doc;
    this.onChange = onChange || (() => {}); this.onSelect = onSelect || (() => {});
    this.sel = null; this.hist = [strip(doc)]; this.hi = 0; this.pointers = new Map();
    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas.parentElement);
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.move(e));
    canvas.addEventListener('pointerup', e => this.up(e));
    canvas.addEventListener('pointercancel', e => this.up(e));
    canvas.addEventListener('wheel', e => { if (!this.sel) return; e.preventDefault(); const l = this.layer(); l.s = clamp(l.s * (e.deltaY < 0 ? 1.06 : 0.94), 0.1, 6); this.draw(); this.commitSoon(); }, { passive: false });
    this.resize();
  }
  destroy() { this.ro.disconnect(); }
  resize() {
    const st = getComputedStyle(this.cv.parentElement); const pad = parseFloat(st.paddingLeft) * 2 || 0;
    const r0 = this.cv.parentElement.getBoundingClientRect(); const box = { width: r0.width - pad, height: r0.height - pad };
    if (box.width <= 0 || box.height <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const k = Math.min(box.width / this.doc.w, box.height / this.doc.h);
    this.k = k; this.cssW = this.doc.w * k; this.cssH = this.doc.h * k;
    this.cv.style.width = this.cssW + 'px'; this.cv.style.height = this.cssH + 'px';
    this.cv.width = Math.round(this.cssW * dpr); this.cv.height = Math.round(this.cssH * dpr); this.dpr = dpr;
    this.draw();
  }
  layer(id = this.sel) { return this.doc.layers.find(l => l.id === id); }
  draw() {
    const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    c.setTransform(this.k * this.dpr, 0, 0, this.k * this.dpr, 0, 0);
    render(c, this.doc);
    const l = this.layer();
    if (l) {
      const { w, h } = layerSize(l);
      c.save(); c.translate(l.x, l.y); c.rotate(l.r);
      const W = w * l.s / 2 + 14, H = h * l.s / 2 + 14, lw = 3 / this.k;
      c.strokeStyle = '#E58F95'; c.lineWidth = lw; c.setLineDash([12 / this.k, 8 / this.k]); c.strokeRect(-W, -H, W * 2, H * 2); c.setLineDash([]);
      c.fillStyle = '#fff'; c.strokeStyle = '#E58F95'; c.lineWidth = lw * 1.5;
      const hr = 16 / this.k; c.beginPath(); c.arc(W, H, hr, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#E58F95'; c.font = `${18 / this.k}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⤡', W, H);
      c.restore();
    }
  }
  toDoc(e) { const r = this.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / this.k, y: (e.clientY - r.top) / this.k }; }
  hit(p) {
    for (let i = this.doc.layers.length - 1; i >= 0; i--) {
      const l = this.doc.layers[i]; const { w, h } = layerSize(l);
      const dx = p.x - l.x, dy = p.y - l.y, c = Math.cos(-l.r), s = Math.sin(-l.r);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      if (Math.abs(lx) <= w * l.s / 2 + 10 && Math.abs(ly) <= h * l.s / 2 + 10) return l;
    }
    return null;
  }
  handleHit(p) {
    const l = this.layer(); if (!l) return false;
    const { w, h } = layerSize(l); const W = w * l.s / 2 + 14, H = h * l.s / 2 + 14;
    const hx = l.x + W * Math.cos(l.r) - H * Math.sin(l.r), hy = l.y + W * Math.sin(l.r) + H * Math.cos(l.r);
    return Math.hypot(p.x - hx, p.y - hy) < 40 / this.k;
  }
  select(id) { this.sel = id; this.draw(); this.onSelect(this.layer()); }
  down(e) {
    this.cv.setPointerCapture(e.pointerId);
    const p = this.toDoc(e); this.pointers.set(e.pointerId, p);
    if (this.pointers.size === 2 && this.sel) { this.startPinch(); return; }
    if (this.handleHit(p)) { const l = this.layer(); this.mode = { t: 'handle', s0: l.s, r0: l.r, d0: Math.hypot(p.x - l.x, p.y - l.y), a0: Math.atan2(p.y - l.y, p.x - l.x) }; return; }
    const l = this.hit(p);
    if (l) { if (l.id !== this.sel) this.select(l.id); this.mode = { t: 'drag', ox: p.x - l.x, oy: p.y - l.y }; }
    else { if (this.sel) this.select(null); this.mode = null; }
  }
  startPinch() {
    const [a, b] = [...this.pointers.values()]; const l = this.layer();
    this.mode = { t: 'pinch', d0: Math.hypot(b.x - a.x, b.y - a.y), a0: Math.atan2(b.y - a.y, b.x - a.x), s0: l.s, r0: l.r };
  }
  move(e) {
    if (!this.pointers.has(e.pointerId)) return;
    const p = this.toDoc(e); this.pointers.set(e.pointerId, p);
    const l = this.layer(); if (!l || !this.mode) return;
    if (this.mode.t === 'drag') { l.x = p.x - this.mode.ox; l.y = p.y - this.mode.oy; }
    else if (this.mode.t === 'handle') { const d = Math.hypot(p.x - l.x, p.y - l.y), a = Math.atan2(p.y - l.y, p.x - l.x); l.s = clamp(this.mode.s0 * d / this.mode.d0, 0.1, 6); l.r = this.mode.r0 + a - this.mode.a0; }
    else if (this.mode.t === 'pinch' && this.pointers.size >= 2) { const [a, b] = [...this.pointers.values()]; l.s = clamp(this.mode.s0 * Math.hypot(b.x - a.x, b.y - a.y) / this.mode.d0, 0.1, 6); l.r = this.mode.r0 + Math.atan2(b.y - a.y, b.x - a.x) - this.mode.a0; }
    this.moved = true; this.draw(); this.onSelect(l, true);
  }
  up(e) {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 1 && this.mode?.t === 'pinch') { const l = this.layer(); const p = [...this.pointers.values()][0]; this.mode = { t: 'drag', ox: p.x - l.x, oy: p.y - l.y }; return; }
    if (this.moved) { this.commit(); this.moved = false; }
    if (!this.pointers.size) this.mode = null;
  }
  commitSoon() { clearTimeout(this._ct); this._ct = setTimeout(() => this.commit(), 350); }
  commit() {
    const s = strip(this.doc); if (s === this.hist[this.hi]) return;
    this.hist = this.hist.slice(0, this.hi + 1); this.hist.push(s); if (this.hist.length > 60) this.hist.shift(); this.hi = this.hist.length - 1;
    this.onChange();
  }
  get canUndo() { return this.hi > 0; }
  get canRedo() { return this.hi < this.hist.length - 1; }
  restore(i) { this.hi = i; const d = JSON.parse(this.hist[i]); Object.keys(this.doc).forEach(k => delete this.doc[k]); Object.assign(this.doc, d); if (!this.layer()) this.sel = null; ensureImages(this.doc).then(() => { this.resize(); this.onSelect(this.layer()); this.onChange(); }); }
  undo() { if (this.canUndo) this.restore(this.hi - 1); }
  redo() { if (this.canRedo) this.restore(this.hi + 1); }
  update(fn, { commit = true } = {}) { fn(this.doc, this.layer()); this.draw(); if (commit) this.commit(); }
  add(layer) { this.doc.layers.push(layer); this.select(layer.id); this.commit(); }
  remove() { const i = this.doc.layers.findIndex(l => l.id === this.sel); if (i < 0) return; this.doc.layers.splice(i, 1); this.select(null); this.commit(); }
  duplicate() { const l = this.layer(); if (!l) return; const c = { ...JSON.parse(JSON.stringify(l)), id: lid(), x: l.x + 40, y: l.y + 40 }; this.add(c); }
  order(dir) { const a = this.doc.layers, i = a.findIndex(l => l.id === this.sel), j = i + dir; if (i < 0 || j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; this.draw(); this.commit(); }
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
