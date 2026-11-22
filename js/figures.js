// Фігурки без ШІ: малюк лишається піксель-у-піксель (риси обличчя не перемальовуються),
// змінюється тільки «матеріал» — колір, блиск, фактура — і підставка під фігуркою.

const rnd = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function ramp(stops) { const cs = stops.map(hex); return l => { const p = l * (cs.length - 1), i = Math.min(cs.length - 2, Math.floor(p)), f = p - i; const a = cs[i], b = cs[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }; }
function canvasOf(src, maxSide = 900) {
  const W0 = src.naturalWidth || src.width, H0 = src.naturalHeight || src.height, k = Math.min(1, maxSide / Math.max(W0, H0));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W0 * k)); c.height = Math.max(1, Math.round(H0 * k));
  c.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0, c.width, c.height); return c;
}
function blurred(c, k = 8) {
  const a = document.createElement('canvas'); a.width = Math.max(1, c.width / k | 0); a.height = Math.max(1, c.height / k | 0); a.getContext('2d').drawImage(c, 0, 0, a.width, a.height);
  const b = document.createElement('canvas'); b.width = c.width; b.height = c.height; const bx = b.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(a, 0, 0, c.width, c.height); return b;
}
// карта «внутрішнього краю» з альфа-каналу: 1 біля контуру, 0 у центрі — для обідка світла
function rimMap(c) {
  const b = blurred(c, 14), d = b.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data; return d;
}

const MAT = {
  // пластик: оригінальні кольори, соковитіше + глянцеві відблиски з найсвітліших місць
  vinyl: { sat: 1.18, con: 1.05, keep: 1, gloss: 0.8, rim: 0.4, rimCol: [255, 255, 255] },
  clay: { sat: 0.95, con: 0.96, keep: 1, warm: [12, 4, -6], post: 14, noise: 10, gloss: 0, rim: 0.25, rimCol: [255, 240, 230], prints: true },
  porcelain: { map: ramp(['#6E6888', '#BDB6CF', '#EAE5EE', '#FFFFFF']), keep: 0.28, detail: 1.9, gloss: 0.9, rim: 0.55, rimCol: [255, 255, 255], edge: '#E2BE6E' },
  gold: { map: ramp(['#2E1A04', '#7A4F12', '#C9922E', '#F2CE68', '#FFF2C2']), keep: 0, detail: 1.5, gloss: 1, rim: 0.5, rimCol: [255, 240, 190] },
  bronze: { map: ramp(['#1E130B', '#553722', '#9A6538', '#D9AE78']), keep: 0, detail: 1.5, gloss: 0.6, rim: 0.35, rimCol: [255, 220, 170], patina: true },
  marble: { map: ramp(['#5F5C69', '#B3AEBB', '#E6E3E9', '#FFFFFF']), keep: 0.12, detail: 1.9, gloss: 0.35, rim: 0.3, rimCol: [255, 255, 255], veins: true },
  chocolate: { map: ramp(['#2A1309', '#5A2E16', '#93562F', '#D9A27A', '#F2CBA8']), keep: 0, detail: 1.8, gloss: 0.95, rim: 0.3, rimCol: [255, 220, 190] },
  crystal: { map: ramp(['#2F64A8', '#80B4E3', '#CFE8FF', '#FFFFFF']), keep: 0.2, detail: 1.9, gloss: 1, rim: 0.6, rimCol: [235, 250, 255], alpha: 0.92, sparkle: true },
  plush: { sat: 0.82, con: 0.92, keep: 1, lift: 18, noise: 14, fabric: true, gloss: 0, rim: 0.35, rimCol: [255, 248, 240], stitch: true },
  wood: { map: ramp(['#3E2412', '#77492A', '#B4804E', '#E6C394']), keep: 0.1, detail: 1.5, gloss: 0.25, rim: 0.2, rimCol: [255, 230, 190], grain: true },
  gingerbread: { map: ramp(['#552A10', '#93532A', '#C88446', '#EDB880']), keep: 0.12, detail: 1.5, gloss: 0.15, rim: 0, icing: true },
  candy: { sat: 1.15, con: 1.0, keep: 1, pastel: 0.2, gloss: 0.85, rim: 0.6, rimCol: [255, 255, 255], sparkle: true, alpha: 0.95 },
  acrylic: { sat: 1.1, con: 1.04, keep: 1, gloss: 0.5, rim: 0, acrylic: true },
  gummy: { sat: 1.45, con: 1.05, keep: 1, lift: 8, gloss: 1, rim: 0.55, rimCol: [255, 255, 255], alpha: 0.86, sparkle: true },
  ice: { map: ramp(['#3E78B8', '#8CC4EC', '#D8F0FF', '#FFFFFF']), keep: 0.15, detail: 1.9, noise: 10, gloss: 1, rim: 0.7, rimCol: [235, 250, 255], alpha: 0.9, sparkle: true },
  bubble: { sat: 1.15, con: 1.04, keep: 1, pastel: 0.08, iri: 0.26, gloss: 1, rim: 0.65, rimCol: [255, 255, 255], alpha: 0.88 },
  holo: { sat: 1.1, con: 1.05, keep: 1, iri: 0.4, gloss: 0.9, rim: 0.5, rimCol: [230, 250, 255] },
  pearl: { map: ramp(['#8F8A9E', '#D6D0DE', '#F3EFF4', '#FFFFFF']), keep: 0.3, detail: 2.2, iri: 0.1, gloss: 1, rim: 0.5, rimCol: [255, 255, 255] },
  silver: { map: ramp(['#3A3C46', '#7E828F', '#C3C7D2', '#F2F4F8', '#FFFFFF']), keep: 0, detail: 1.6, gloss: 1, rim: 0.45, rimCol: [255, 255, 255] },
  rosegold: { map: ramp(['#5A2E2A', '#9E5F55', '#DCA190', '#F6D3C6', '#FFF1EA']), keep: 0, detail: 1.6, gloss: 1, rim: 0.45, rimCol: [255, 235, 225] },
  terracotta: { map: ramp(['#5A2A18', '#9A4E30', '#CF7F5A', '#EBB08F']), keep: 0.08, detail: 1.5, noise: 12, gloss: 0, rim: 0.15, rimCol: [255, 220, 200] },
  snow: { map: ramp(['#7890B8', '#C9D8EC', '#F2F6FB', '#FFFFFF']), keep: 0.28, detail: 2.2, noise: 3, gloss: 0.4, rim: 0.4, rimCol: [255, 255, 255], sparkle: true },
  cotton: { map: ramp(['#9E93AE', '#DAD3E3', '#F6F3F8', '#FFFFFF']), keep: 0.35, detail: 2.2, noise: 6, gloss: 0, rim: 0.3, rimCol: [255, 255, 255], fluffy: true },
  amigurumi: { sat: 0.95, con: 0.97, keep: 1, lift: 8, knit: true, gloss: 0, rim: 0.2, rimCol: [255, 248, 240] },
  felt: { sat: 0.85, con: 0.93, keep: 1, lift: 12, noise: 20, fabric: true, gloss: 0, rim: 0.15, rimCol: [255, 248, 240], stitch: true },
  paper: { sat: 1.05, con: 1.0, keep: 1, post: 9, gloss: 0, rim: 0, paper: true },
  sugarcookie: { sat: 1.0, con: 0.98, keep: 1, pastel: 0.28, noise: 6, gloss: 0.2, rim: 0, icing: true },
  marzipan: { sat: 0.95, con: 0.96, keep: 1, pastel: 0.2, warm: [8, 4, 0], noise: 7, gloss: 0.1, rim: 0.2, rimCol: [255, 245, 235], prints: true }
};

export function material(src, kind) {
  const m = MAT[kind] || MAT.vinyl;
  const c = canvasOf(src), W = c.width, H = c.height, ctx = c.getContext('2d', { willReadFrequently: true });
  const im = ctx.getImageData(0, 0, W, H), d = im.data;
  const blur = blurred(c, 10).getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const rim = (m.rim || m.stitch || m.icing) ? rimMap(c) : null;
  const r0 = rnd(17);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; const A = d[i + 3]; if (A < 8) { d[i + 3] = 0; continue; }
    let R = d[i], G = d[i + 1], B = d[i + 2]; const L = (R * 0.3 + G * 0.59 + B * 0.11) / 255;
    const Lb0 = (blur[i] * 0.3 + blur[i + 1] * 0.59 + blur[i + 2] * 0.11) / 255;
    if (m.map) { const Lm = Math.max(0, Math.min(1, 0.06 + L * 0.86 + (L - Lb0) * (m.detail || 1.3))); const [mr, mg, mb] = m.map(Lm); const k = m.keep || 0; R = mr * (1 - k) + R * k; G = mg * (1 - k) + G * k; B = mb * (1 - k) + B * k; }
    else {
      const l2 = L * 255, s = m.sat || 1, cn = m.con || 1;
      R = l2 + (R - l2) * s; G = l2 + (G - l2) * s; B = l2 + (B - l2) * s;
      R = (R - 128) * cn + 128; G = (G - 128) * cn + 128; B = (B - 128) * cn + 128;
      if (m.warm) { R += m.warm[0]; G += m.warm[1]; B += m.warm[2]; }
      if (m.lift) { R += m.lift; G += m.lift; B += m.lift; }
      if (m.pastel) { R = R * (1 - m.pastel) + 255 * m.pastel; G = G * (1 - m.pastel) + 240 * m.pastel; B = B * (1 - m.pastel) + 248 * m.pastel; }
      if (m.post) { const q = 255 / m.post; R = Math.round(R / q) * q * 0.5 + R * 0.5; G = Math.round(G / q) * q * 0.5 + G * 0.5; B = Math.round(B / q) * q * 0.5 + B * 0.5; }
    }
    // фактури
    if (m.noise) { const n = (r0() - 0.5) * m.noise; R += n; G += n; B += n; }
    if (m.fabric) { const f = ((x + y) % 4 < 2 ? 6 : -6) + ((x - y + 1000) % 6 < 3 ? 4 : -4); R += f; G += f; B += f; }
    if (m.grain) { const g = Math.sin(x * 0.045 + Math.sin(y * 0.02) * 3.2) * 7 + Math.sin(x * 0.4) * 2; R += g; G += g * 0.8; B += g * 0.6; }
    if (m.veins) { const v = Math.abs(Math.sin((x * 0.6 + y) * 0.018 + Math.sin(x * 0.03) * 2.5 + Math.sin(y * 0.011) * 3)); if (v < 0.02) { const k = (0.02 - v) / 0.02 * 40; R -= k; G -= k; B -= k * 0.9; } }
    if (m.patina) { const p = Math.sin(x * 0.07) * Math.sin(y * 0.09) + Math.sin((x + y) * 0.031); if (p > 1.6) { R = R * 0.82 + 90 * 0.18; G = G * 0.82 + 150 * 0.18; B = B * 0.82 + 120 * 0.18; } }
    if (m.iri) { const hsh = (x / W * 1.6 + y / H * 0.9 + L * 1.2) * Math.PI * 2; const ir = [Math.sin(hsh) * 0.5 + 0.5, Math.sin(hsh + 2.1) * 0.5 + 0.5, Math.sin(hsh + 4.2) * 0.5 + 0.5]; R = R * (1 - m.iri) + (170 + ir[0] * 85) * m.iri; G = G * (1 - m.iri) + (170 + ir[1] * 85) * m.iri; B = B * (1 - m.iri) + (190 + ir[2] * 65) * m.iri; }
    if (m.knit) { const cw = Math.max(5, W / 90), u = (x % cw) / cw, v = (y % (cw * 0.8)) / (cw * 0.8), col = Math.floor(x / cw); const k = Math.abs(u - 0.5) * 2; const vv = (col % 2 ? v : 1 - v); const st = (1 - Math.abs(vv - k)) * 22 - 11; R += st; G += st; B += st; }
    if (m.fluffy) { const n2 = (r0() - 0.5) * 10; R += n2; G += n2; B += n2; }
    // м'яка тінь знизу (об'єм) та глянець зі світлих ділянок розмитої версії
    const Lb = (blur[i] * 0.3 + blur[i + 1] * 0.59 + blur[i + 2] * 0.11) / 255;
    const vol = (y / H - 0.5) * -14; R += vol; G += vol; B += vol;
    if (m.gloss) { const g = smooth(0.86, 1.0, Lb) * m.gloss * 70 * (1 - y / H * 0.6); R += g; G += g; B += g; }
    if (rim && m.rim) { const inner = 1 - rim[i + 3] / 255; const rr = smooth(0.08, 0.5, inner) * m.rim * (x < W * 0.55 ? 1 : 0.55); R = R + (m.rimCol[0] - R) * rr; G = G + (m.rimCol[1] - G) * rr; B = B + (m.rimCol[2] - B) * rr; }
    d[i] = clamp(R); d[i + 1] = clamp(G); d[i + 2] = clamp(B); d[i + 3] = A * (m.alpha || 1);
  }
  ctx.putImageData(im, 0, 0);
  // точкові відблиски й іскорки
  if (m.gloss >= 0.7) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; const r = rnd(5); for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(W * (0.18 + r() * 0.45), H * (0.12 + r() * 0.6)); ctx.rotate(-0.7); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(0, 0, W * (0.015 + r() * 0.025), W * 0.006, 0, 0, 7); ctx.fill(); ctx.restore(); } ctx.restore(); }
  if (m.sparkle) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; const r = rnd(9); for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; const x = r() * W, y = r() * H, s = W * (0.002 + r() * 0.006); ctx.beginPath(); ctx.moveTo(x, y - s * 2.5); ctx.lineTo(x + s * 0.6, y); ctx.lineTo(x, y + s * 2.5); ctx.lineTo(x - s * 0.6, y); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - s * 2.5, y); ctx.lineTo(x, y + s * 0.6); ctx.lineTo(x + s * 2.5, y); ctx.lineTo(x, y - s * 0.6); ctx.fill(); } ctx.restore(); }
  if (m.prints) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; const r = rnd(3); ctx.strokeStyle = 'rgba(120,80,60,.08)'; ctx.lineWidth = Math.max(1, W * 0.0025); for (let k = 0; k < 5; k++) { const cx = W * (0.15 + r() * 0.7), cy = H * (0.45 + r() * 0.45); for (let q = 1; q < 6; q++) { ctx.beginPath(); ctx.ellipse(cx, cy, W * 0.012 * q, W * 0.009 * q, r(), 0, 7); ctx.stroke(); } } ctx.restore(); }
  material._last = c;
  return outline(c, m);
}

// контур навколо фігурки (як у справжніх іграшок): світлий обідок, шов, глазур, акрил
function outline(c, m) {
  const p = Math.round(Math.max(c.width, c.height) * (m.acrylic ? 0.06 : 0.025));
  const out = document.createElement('canvas'); out.width = c.width + p * 2; out.height = c.height + p * 2; const o = out.getContext('2d');
  const ring = (rad, col) => { const t = document.createElement('canvas'); t.width = out.width; t.height = out.height; const tx = t.getContext('2d'); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; tx.drawImage(c, p + Math.cos(a) * rad, p + Math.sin(a) * rad); } tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, t.width, t.height); return t; };
  if (m.acrylic) {
    o.drawImage(ring(p * 0.95, 'rgba(235,245,255,.55)'), 0, 0);
    o.drawImage(ring(p * 0.25, '#FFFFFF'), 0, 0);
  } else if (m.paper) {
    o.drawImage(ring(p * 0.9, 'rgba(120,90,80,.25)'), p * 0.25, p * 0.35);
    o.drawImage(ring(p * 0.75, '#FFFFFF'), 0, 0);
  } else if (m.icing) {
    o.drawImage(ring(p * 0.6, '#8B4A1E'), 0, 0);
    const ic = ring(p * 0.45, '#FFFFFF'); const ix = ic.getContext('2d'); ix.globalCompositeOperation = 'destination-out'; ix.drawImage(ring(p * 0.18, '#000'), 0, 0);
    const tile = document.createElement('canvas'); tile.width = Math.max(2, Math.round(p * 0.9)); tile.height = tile.width; const tc = tile.getContext('2d'); tc.fillStyle = '#000'; tc.beginPath(); tc.arc(tile.width / 2, tile.height / 2, p * 0.33, 0, 7); tc.fill();
    ix.globalCompositeOperation = 'destination-in'; ix.fillStyle = ix.createPattern(tile, 'repeat'); ix.fillRect(0, 0, out.width, out.height);
    o.drawImage(ic, 0, 0);
  } else if (m.stitch) {
    o.drawImage(ring(p * 0.7, '#FFF4EA'), 0, 0);
    const st = ring(p * 0.4, '#E8A9B6'); const sx = st.getContext('2d'); sx.globalCompositeOperation = 'destination-out'; sx.drawImage(ring(p * 0.22, '#000'), 0, 0);
    sx.globalCompositeOperation = 'destination-in'; sx.save(); sx.translate(out.width / 2, out.height / 2); sx.rotate(0.8); sx.fillStyle = '#000'; for (let x = -out.width; x < out.width; x += p * 0.9) sx.fillRect(x, -out.height, p * 0.5, out.height * 2); sx.restore();
    o.drawImage(st, 0, 0);
  } else {
    o.drawImage(ring(p * 0.75, m.edge || 'rgba(255,248,244,.95)'), 0, 0);
  }
  o.drawImage(c, p, p);
  return out;
}

// --- Сцени і підставки ---
function vg(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function studio(ctx, W, H, top, bottom) {
  ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, top], [0.72, bottom], [1, bottom]]); ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.36, 0, W / 2, H * 0.36, W * 0.62); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function sparkles(ctx, W, H, n, col = '#fff', seed = 3) { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * 0.7, s = W * (0.008 + r() * 0.016); ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = s; ctx.beginPath(); for (let k = 0; k < 8; k++) { const q = k % 2 ? s * 0.2 : s, a = k * Math.PI / 4; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.fill(); ctx.restore(); } }
function cylinder(ctx, cx, top, w, h, e, side, cap, rim) {
  ctx.fillStyle = 'rgba(80,40,50,.2)'; ctx.beginPath(); ctx.ellipse(cx, top + h + e * 0.6, w * 1.2, e * 0.8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = side; ctx.beginPath(); ctx.ellipse(cx, top + h, w, e, 0, 0, Math.PI); ctx.lineTo(cx - w, top); ctx.ellipse(cx, top, w, e, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
  if (rim) { ctx.fillStyle = rim; ctx.beginPath(); ctx.ellipse(cx, top, w, e, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(cx, top - e * 0.06, w * (rim ? 0.95 : 1), e * (rim ? 0.86 : 1), 0, 0, 7); ctx.fill();
}
function plaque(ctx, cx, y, w, h, text, bg = ['#FFE9A8', '#E2BE6E'], fg = '#6E4E1E', font = 'Comfortaa') {
  if (!text) return; ctx.fillStyle = vg(ctx, 0, y, 0, y + h, [[0, bg[0]], [1, bg[1]]]); rr(ctx, cx - w / 2, y, w, h, h * 0.22); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let f = h * 0.56; ctx.font = `700 ${f}px ${font}, sans-serif`; const tw = ctx.measureText(text).width; if (tw > w * 0.9) { f *= w * 0.9 / tw; ctx.font = `700 ${f}px ${font}, sans-serif`; } ctx.fillText(text, cx, y + h / 2 + h * 0.03);
}
function place(ctx, fig, cx, baseY, maxW, maxH, sh = 'rgba(100,50,60,.32)') {
  const k = Math.min(maxW / fig.width, maxH / fig.height), w = fig.width * k, h = fig.height * k;
  ctx.save(); ctx.shadowColor = sh; ctx.shadowBlur = maxW * 0.05; ctx.shadowOffsetY = maxW * 0.02; ctx.drawImage(fig, cx - w / 2, baseY - h, w, h); ctx.restore(); return { w, h };
}
const getMat = (o, kind) => { o._mat ||= {}; if (!o._mat[kind]) o._mat[kind] = o.cut ? material(o.cut, kind) : material(ovalOf(o.img), kind); return o._mat[kind]; };
function ovalOf(img) { const c = document.createElement('canvas'); c.width = 600; c.height = 700; const x = c.getContext('2d'); x.beginPath(); x.ellipse(300, 350, 290, 340, 0, 0, 7); x.clip(); const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(600 / iw, 700 / ih); x.drawImage(img, 300 - iw * k / 2, 350 - ih * k / 2, iw * k, ih * k); return c; }

export const FIGURES = {
  fig_vinyl(ctx, W, H, o) { studio(ctx, W, H, '#FBEFF3', '#EBD3DC'); const bx = W / 2, by = H * 0.8; cylinder(ctx, bx, by, W * 0.32, H * 0.08, W * 0.065, vg(ctx, bx - W * 0.32, 0, bx + W * 0.32, 0, [[0, '#E7A9B6'], [0.45, '#F8D3DB'], [1, '#D98C9C']]), vg(ctx, 0, by - W * 0.06, 0, by + W * 0.06, [[0, '#FFF0F3'], [1, '#F6C9D3']]), '#F8D98A'); plaque(ctx, bx, by + H * 0.035, W * 0.36, H * 0.045, o.name); place(ctx, getMat(o, 'vinyl'), bx, by + W * 0.03, W * 0.66, H * 0.64); sparkles(ctx, W, H, 4); },
  fig_clay(ctx, W, H, o) { studio(ctx, W, H, '#FFF4E6', '#F6DCC4'); const bx = W / 2, by = H * 0.83; ctx.fillStyle = 'rgba(120,80,60,.18)'; ctx.beginPath(); ctx.ellipse(bx, by + W * 0.07, W * 0.4, W * 0.05, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; for (const [dx, dy, r] of [[-0.25, 0.02, 0.12], [-0.08, -0.03, 0.15], [0.1, -0.02, 0.14], [0.27, 0.02, 0.11], [0, 0.04, 0.16]]) { ctx.beginPath(); ctx.arc(bx + W * dx, by + W * dy, W * r, 0, 7); ctx.fill(); } ctx.strokeStyle = 'rgba(200,180,170,.5)'; ctx.lineWidth = W * 0.004; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(bx + W * (-0.2 + k * 0.08), by + W * 0.02, W * 0.03, 0.2, 2); ctx.stroke(); } place(ctx, getMat(o, 'clay'), bx, by - W * 0.03, W * 0.62, H * 0.64, 'rgba(120,80,60,.3)'); },
  fig_porcelain(ctx, W, H, o) { studio(ctx, W, H, '#EEF2FA', '#D9E0EF'); const bx = W / 2, by = H * 0.8; cylinder(ctx, bx, by, W * 0.3, H * 0.07, W * 0.06, vg(ctx, bx - W * 0.3, 0, bx + W * 0.3, 0, [[0, '#E9E5F0'], [0.45, '#FFFFFF'], [1, '#D6D0E2']]), '#FFFFFF', '#E2BE6E'); ctx.strokeStyle = '#A9BCE0'; ctx.lineWidth = W * 0.004; ctx.beginPath(); ctx.ellipse(bx, by + H * 0.04, W * 0.3, W * 0.05, 0, 0.15, Math.PI - 0.15); ctx.stroke(); plaque(ctx, bx, by + H * 0.025, W * 0.32, H * 0.04, o.name, ['#FFFFFF', '#E9EEF8'], '#6E7FA8'); place(ctx, getMat(o, 'porcelain'), bx, by + W * 0.02, W * 0.62, H * 0.64, 'rgba(80,90,130,.3)'); sparkles(ctx, W, H, 5, '#fff', 8); },
  fig_gold(ctx, W, H, o) { ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#3A2A3E'], [1, '#1E1622']]); ctx.fillRect(0, 0, W, H); const sp = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.35, W * 0.6); sp.addColorStop(0, 'rgba(255,230,170,.45)'); sp.addColorStop(1, 'rgba(255,230,170,0)'); ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H); const bx = W / 2, by = H * 0.76; ctx.fillStyle = '#16111A'; ctx.fillRect(bx - W * 0.22, by, W * 0.44, H * 0.14); ctx.fillStyle = '#2A2130'; ctx.fillRect(bx - W * 0.26, by + H * 0.14, W * 0.52, H * 0.05); plaque(ctx, bx, by + H * 0.035, W * 0.32, H * 0.07, o.name, ['#FFF1B0', '#C9952E'], '#4A3008'); ctx.fillStyle = '#F7DA7A'; ctx.font = `700 ${W * 0.026}px Comfortaa, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(o.t ? o.t('magLine1') : '', bx, by + H * 0.13); place(ctx, getMat(o, 'gold'), bx, by + W * 0.005, W * 0.6, H * 0.62, 'rgba(0,0,0,.5)'); sparkles(ctx, W, H, 12, '#FFE9A8', 4); },
  fig_bronze(ctx, W, H, o) { studio(ctx, W, H, '#EFE7DE', '#D9CCBE'); const bx = W / 2, by = H * 0.78; ctx.fillStyle = vg(ctx, bx - W * 0.25, 0, bx + W * 0.25, 0, [[0, '#7A6A60'], [0.5, '#A8988C'], [1, '#6A5A50']]); ctx.fillRect(bx - W * 0.25, by, W * 0.5, H * 0.16); ctx.fillStyle = '#B9A99C'; ctx.fillRect(bx - W * 0.27, by - H * 0.012, W * 0.54, H * 0.02); plaque(ctx, bx, by + H * 0.05, W * 0.3, H * 0.05, o.name, ['#E0B887', '#A0703F'], '#3E2410'); place(ctx, getMat(o, 'bronze'), bx, by, W * 0.6, H * 0.64, 'rgba(60,40,30,.4)'); },
  fig_marble(ctx, W, H, o) { studio(ctx, W, H, '#F1EEF0', '#DCD7DB'); const bx = W / 2, by = H * 0.74; ctx.fillStyle = vg(ctx, bx - W * 0.2, 0, bx + W * 0.2, 0, [[0, '#DCD8DE'], [0.5, '#FFFFFF'], [1, '#CFCAD2']]); ctx.fillRect(bx - W * 0.2, by, W * 0.4, H * 0.22); ctx.fillStyle = '#F4F2F4'; ctx.fillRect(bx - W * 0.24, by - H * 0.02, W * 0.48, H * 0.03); ctx.fillRect(bx - W * 0.24, by + H * 0.21, W * 0.48, H * 0.03); ctx.strokeStyle = 'rgba(140,135,150,.35)'; ctx.lineWidth = W * 0.003; ctx.beginPath(); ctx.moveTo(bx - W * 0.15, by + H * 0.02); ctx.bezierCurveTo(bx - W * 0.05, by + H * 0.08, bx + W * 0.02, by + H * 0.06, bx + W * 0.12, by + H * 0.19); ctx.stroke(); plaque(ctx, bx, by + H * 0.08, W * 0.28, H * 0.045, o.name, ['#FFFFFF', '#E7E3E9'], '#6F6878', 'Comfortaa'); place(ctx, getMat(o, 'marble'), bx, by - H * 0.01, W * 0.56, H * 0.6, 'rgba(70,60,80,.3)'); },
  fig_chocolate(ctx, W, H, o) { studio(ctx, W, H, '#FDEFE6', '#F2D6C6'); const bx = W / 2, by = H * 0.83; ctx.fillStyle = 'rgba(120,70,50,.2)'; ctx.beginPath(); ctx.ellipse(bx, by + W * 0.04, W * 0.43, W * 0.07, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(bx, by, W * 0.42, W * 0.09, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#F4EEEA'; ctx.beginPath(); ctx.ellipse(bx, by - W * 0.005, W * 0.33, W * 0.065, 0, 0, 7); ctx.fill(); const r = rnd(6), cols = ['#F6B7C0', '#FFE3A3', '#C9E4F5', '#CDEBD3']; for (let i = 0; i < 26; i++) { ctx.save(); ctx.translate(bx + (r() - 0.5) * W * 0.6, by + (r() - 0.5) * W * 0.09); ctx.rotate(r() * 6); ctx.fillStyle = cols[i % 4]; ctx.fillRect(-W * 0.012, -W * 0.004, W * 0.024, W * 0.008); ctx.restore(); } place(ctx, getMat(o, 'chocolate'), bx, by + W * 0.01, W * 0.6, H * 0.66, 'rgba(60,30,20,.4)'); plaque(ctx, bx, H * 0.92, W * 0.34, H * 0.045, o.name, ['#7E4626', '#4A2411'], '#FBE3CF'); },
  fig_crystal(ctx, W, H, o) { ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#DCEBFA'], [1, '#B9CFEA']]); ctx.fillRect(0, 0, W, H); const sp = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.6); sp.addColorStop(0, 'rgba(255,255,255,.75)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H); const bx = W / 2, by = H * 0.82; ctx.fillStyle = vg(ctx, 0, by - W * 0.08, 0, by + W * 0.08, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(170,200,235,.9)']]); ctx.beginPath(); ctx.ellipse(bx, by, W * 0.36, W * 0.08, 0, 0, 7); ctx.fill(); const fig = getMat(o, 'crystal'); const sz = place(ctx, fig, bx, by, W * 0.6, H * 0.64, 'rgba(80,120,170,.3)'); ctx.save(); ctx.globalAlpha = 0.22; ctx.translate(bx, by); ctx.scale(1, -0.35); ctx.drawImage(fig, -sz.w / 2, -sz.h, sz.w, sz.h); ctx.restore(); sparkles(ctx, W, H, 16, '#FFFFFF', 12); plaque(ctx, bx, H * 0.9, W * 0.3, H * 0.04, o.name, ['#FFFFFF', '#DCEBFA'], '#5E8FC9'); },
  fig_plush(ctx, W, H, o) { studio(ctx, W, H, '#FDF1F4', '#F6DDE5'); const bx = W / 2, by = H * 0.86; ctx.fillStyle = 'rgba(160,90,110,.18)'; ctx.beginPath(); ctx.ellipse(bx, by + W * 0.03, W * 0.42, W * 0.05, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#F6C2CC'; rr(ctx, bx - W * 0.4, by - W * 0.09, W * 0.8, W * 0.14, W * 0.07); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.setLineDash([W * 0.015, W * 0.012]); ctx.lineWidth = W * 0.005; rr(ctx, bx - W * 0.37, by - W * 0.065, W * 0.74, W * 0.09, W * 0.05); ctx.stroke(); ctx.setLineDash([]); place(ctx, getMat(o, 'plush'), bx, by - W * 0.04, W * 0.64, H * 0.66, 'rgba(150,80,100,.3)'); const tag = W * 0.1; ctx.fillStyle = '#FFFFFF'; rr(ctx, bx + W * 0.24, by - W * 0.2, tag, tag * 0.6, tag * 0.1); ctx.fill(); ctx.fillStyle = '#E07F88'; ctx.font = `700 ${tag * 0.28}px Comfortaa, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', bx + W * 0.24 + tag / 2, by - W * 0.2 + tag * 0.3); plaque(ctx, bx, H * 0.93, W * 0.34, H * 0.04, o.name, ['#FFFFFF', '#FDE9EE'], '#C9626E'); },
  fig_wood(ctx, W, H, o) { studio(ctx, W, H, '#F3EEE2', '#DFD4BF'); const bx = W / 2, by = H * 0.8; cylinder(ctx, bx, by, W * 0.3, H * 0.09, W * 0.07, vg(ctx, bx - W * 0.3, 0, bx + W * 0.3, 0, [[0, '#7E522F'], [0.5, '#A87447'], [1, '#6A4325']]), '#E2C394'); ctx.strokeStyle = 'rgba(126,82,47,.45)'; ctx.lineWidth = W * 0.003; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.ellipse(bx, by - W * 0.005, W * 0.3 * k / 5, W * 0.07 * k / 5, 0, 0, 7); ctx.stroke(); } place(ctx, getMat(o, 'wood'), bx, by + W * 0.01, W * 0.6, H * 0.64, 'rgba(80,50,30,.35)'); plaque(ctx, bx, H * 0.93, W * 0.32, H * 0.04, o.name, ['#E6C394', '#B98552'], '#4A2C17'); ctx.fillStyle = '#A9CB9A'; for (const [x, y, r] of [[0.15, 0.85, 0.03], [0.85, 0.86, 0.025]]) { ctx.beginPath(); ctx.ellipse(W * x, H * y, W * r, W * r * 1.8, 0.5, 0, 7); ctx.fill(); } },
  fig_gingerbread(ctx, W, H, o) { studio(ctx, W, H, '#FFF3EC', '#F6DFD3'); const bx = W / 2, by = H * 0.84; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(bx, by, W * 0.42, W * 0.09, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#F6B7C0'; ctx.lineWidth = W * 0.008; ctx.beginPath(); ctx.ellipse(bx, by, W * 0.38, W * 0.075, 0, 0, 7); ctx.stroke(); const r = rnd(2); for (let i = 0; i < 6; i++) { const x = bx + (i - 2.5) * W * 0.13, y = by + W * 0.01; ctx.fillStyle = ['#E58F95', '#9FD3A8', '#F8D98A'][i % 3]; ctx.beginPath(); ctx.arc(x, y, W * 0.018, 0, 7); ctx.fill(); } place(ctx, getMat(o, 'gingerbread'), bx, by + W * 0.01, W * 0.6, H * 0.64, 'rgba(100,50,20,.35)'); sparkles(ctx, W, H, 8, '#FFFFFF', 5); plaque(ctx, bx, H * 0.93, W * 0.32, H * 0.04, o.name, ['#C98447', '#99582A'], '#FFFFFF'); },
  fig_candy(ctx, W, H, o) { studio(ctx, W, H, '#FDEAF3', '#F3D4E6'); const bx = W / 2, by = H * 0.82; cylinder(ctx, bx, by, W * 0.3, H * 0.07, W * 0.065, vg(ctx, bx - W * 0.3, 0, bx + W * 0.3, 0, [[0, '#F6B7C0'], [0.5, '#FFFFFF'], [1, '#C9E4F5']]), '#FFFFFF', '#F8D98A'); ctx.save(); ctx.beginPath(); ctx.ellipse(bx, by + H * 0.035, W * 0.3, H * 0.05, 0, 0, 7); ctx.clip(); for (let x = -W * 0.4; x < W * 0.4; x += W * 0.05) { ctx.fillStyle = 'rgba(246,183,192,.6)'; ctx.fillRect(bx + x, by, W * 0.02, H * 0.12); } ctx.restore(); place(ctx, getMat(o, 'candy'), bx, by + W * 0.02, W * 0.62, H * 0.64, 'rgba(180,90,130,.3)'); sparkles(ctx, W, H, 12, '#FFFFFF', 15); plaque(ctx, bx, H * 0.93, W * 0.3, H * 0.04, o.name, ['#FFFFFF', '#FDE1EC'], '#E07F88'); },
  fig_acrylic(ctx, W, H, o) { studio(ctx, W, H, '#F1F6FB', '#DDE7F2'); const bx = W / 2, by = H * 0.84; ctx.fillStyle = 'rgba(80,110,150,.18)'; ctx.beginPath(); ctx.ellipse(bx, by + W * 0.03, W * 0.3, W * 0.04, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(230,242,255,.9)'; rr(ctx, bx - W * 0.25, by - W * 0.035, W * 0.5, W * 0.07, W * 0.015); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = W * 0.004; ctx.stroke(); ctx.fillStyle = 'rgba(200,220,240,.7)'; ctx.fillRect(bx - W * 0.05, by - W * 0.05, W * 0.1, W * 0.02); place(ctx, getMat(o, 'acrylic'), bx, by - W * 0.03, W * 0.66, H * 0.68, 'rgba(80,110,150,.25)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = vg(ctx, 0, 0, W, H, [[0.3, 'rgba(255,255,255,0)'], [0.45, 'rgba(255,255,255,.35)'], [0.5, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, H * 0.8); ctx.restore(); plaque(ctx, bx, by - W * 0.028, W * 0.4, W * 0.055, o.name, ['rgba(255,255,255,.0)', 'rgba(255,255,255,.0)'], '#7FA8CC'); },
  fig_keychain(ctx, W, H, o) { studio(ctx, W, H, '#FFF6E8', '#F6E3CC'); const cx = W / 2, top = H * 0.08; ctx.strokeStyle = '#C9C9D1'; ctx.lineWidth = W * 0.022; ctx.beginPath(); ctx.arc(cx, top + W * 0.08, W * 0.08, 0, 7); ctx.stroke(); ctx.strokeStyle = '#E6E6EC'; ctx.lineWidth = W * 0.008; ctx.beginPath(); ctx.arc(cx - W * 0.01, top + W * 0.07, W * 0.08, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.strokeStyle = '#C9C9D1'; ctx.lineWidth = W * 0.01; ctx.beginPath(); ctx.ellipse(cx, top + W * 0.18 + k * W * 0.035, W * 0.012, W * 0.02, 0, 0, 7); ctx.stroke(); } const fig = getMat(o, 'acrylic'); const k = Math.min(W * 0.66 / fig.width, H * 0.66 / fig.height); ctx.save(); ctx.translate(cx, top + W * 0.32); ctx.rotate(0.05); ctx.shadowColor = 'rgba(120,90,60,.3)'; ctx.shadowBlur = W * 0.04; ctx.shadowOffsetY = W * 0.02; ctx.drawImage(fig, -fig.width * k / 2, 0, fig.width * k, fig.height * k); ctx.restore(); ctx.fillStyle = '#F6B7C0'; ctx.beginPath(); ctx.arc(cx + W * 0.15, top + W * 0.22, W * 0.03, 0, 7); ctx.fill(); plaque(ctx, cx, H * 0.92, W * 0.32, H * 0.04, o.name, ['#FFFFFF', '#FDEBDC'], '#C97A50'); },
  fig_toybox(ctx, W, H, o) {
    studio(ctx, W, H, '#FDEFEA', '#F3DAD3');
    const bw = W * 0.7, bh = H * 0.84, bx = (W - bw) / 2, by = H * 0.07;
    ctx.save(); ctx.shadowColor = 'rgba(120,60,70,.3)'; ctx.shadowBlur = W * 0.05; ctx.shadowOffsetY = W * 0.025; ctx.fillStyle = '#F29AAE'; rr(ctx, bx, by, bw, bh, W * 0.02); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#F6B7C0'; ctx.fillRect(bx + bw * 0.92, by, bw * 0.08, bh);
    ctx.fillStyle = '#FFFFFF'; rr(ctx, bx + bw * 0.38, by - H * 0.035, bw * 0.24, H * 0.05, H * 0.025); ctx.fill(); ctx.fillStyle = '#F29AAE'; ctx.beginPath(); ctx.ellipse(bx + bw * 0.5, by - H * 0.012, bw * 0.06, H * 0.012, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let f = bw * 0.1; ctx.font = `700 ${f}px Lobster, Comfortaa, sans-serif`; const title = o.t ? o.t('appName') : ''; const tw = ctx.measureText(title).width; if (tw > bw * 0.8) { f *= bw * 0.8 / tw; ctx.font = `700 ${f}px "Great Vibes", Lobster, Comfortaa, sans-serif`; } ctx.fillText(title, bx + bw * 0.46, by + bh * 0.08);
    const wx = bx + bw * 0.08, wy = by + bh * 0.15, ww = bw * 0.76, wh = bh * 0.64;
    ctx.fillStyle = vg(ctx, 0, wy, 0, wy + wh, [[0, '#FFF6F8'], [1, '#FCE3EA']]); rr(ctx, wx, wy, ww, wh, W * 0.04); ctx.fill();
    const fig = getMat(o, 'vinyl'); place(ctx, fig, wx + ww / 2, wy + wh * 0.97, ww * 0.86, wh * 0.9, 'rgba(150,70,90,.3)');
    ctx.save(); rr(ctx, wx, wy, ww, wh, W * 0.04); ctx.clip(); ctx.fillStyle = vg(ctx, wx, wy, wx + ww, wy + wh, [[0.15, 'rgba(255,255,255,0)'], [0.3, 'rgba(255,255,255,.45)'], [0.36, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0)'], [0.66, 'rgba(255,255,255,.25)'], [0.7, 'rgba(255,255,255,0)']]); ctx.fillRect(wx, wy, ww, wh); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = W * 0.008; rr(ctx, wx, wy, ww, wh, W * 0.04); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = `400 ${bw * 0.075}px "Marck Script", Comfortaa, sans-serif`; ctx.fillText(o.name || '', bx + bw * 0.46, by + bh * 0.87);
    ctx.font = `700 ${bw * 0.03}px Comfortaa, sans-serif`; ctx.fillText(o.age || '', bx + bw * 0.46, by + bh * 0.93);
    ctx.fillStyle = '#FFE9A8'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r2 = k % 2 ? bw * 0.03 : bw * 0.07, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(bx + bw * 0.86 + Math.cos(a) * r2, by + bh * 0.16 + Math.sin(a) * r2); } ctx.fill(); ctx.fillStyle = '#C9626E'; ctx.font = `700 ${bw * 0.03}px Comfortaa, sans-serif`; ctx.fillText('№1', bx + bw * 0.86, by + bh * 0.163);
  }
};

// --- Ще 15 фігурок: різні матеріали й подачі ---
function stand(ctx, W, H, o, kind, cfg) {
  studio(ctx, W, H, cfg.bg[0], cfg.bg[1]);
  const bx = W / 2, by = H * (cfg.by || 0.82);
  const base = cfg.base;
  if (base === 'pedestal') cylinder(ctx, bx, by, W * 0.3, H * 0.075, W * 0.065, vg(ctx, bx - W * 0.3, 0, bx + W * 0.3, 0, [[0, cfg.c1], [0.45, cfg.c2], [1, cfg.c1]]), cfg.c2, cfg.rim || null);
  if (base === 'cake') { cylinder(ctx, bx, by, W * 0.36, H * 0.12, W * 0.08, vg(ctx, bx - W * 0.36, 0, bx + W * 0.36, 0, [[0, '#F6C9D3'], [0.5, '#FDE6EC'], [1, '#F0B8C6']]), '#FFFFFF', null); for (let k = 0; k < 14; k++) { const a = Math.PI * (k / 13); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(bx - Math.cos(a) * W * 0.36, by + Math.sin(a) * W * 0.08, W * 0.03, 0, 7); ctx.fill(); } for (let k = 0; k < 8; k++) { ctx.fillStyle = ['#F29AA0', '#FFE3A3', '#C9E4F5'][k % 3]; ctx.beginPath(); ctx.arc(bx - W * 0.3 + k * W * 0.085, by + H * 0.07, W * 0.012, 0, 7); ctx.fill(); } }
  if (base === 'nest') { ctx.fillStyle = 'rgba(120,80,50,.2)'; ctx.beginPath(); ctx.ellipse(bx, by + W * 0.06, W * 0.4, W * 0.06, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#C9A07D'; ctx.lineWidth = W * 0.012; const r = rnd(4); for (let k = 0; k < 40; k++) { ctx.beginPath(); const a = r() * Math.PI; ctx.ellipse(bx, by, W * (0.3 + r() * 0.06), W * (0.06 + r() * 0.03), 0, a, a + 1.4 + r()); ctx.stroke(); } }
  if (base === 'gift') { ctx.fillStyle = 'rgba(120,60,70,.2)'; ctx.beginPath(); ctx.ellipse(bx, by + H * 0.13, W * 0.36, W * 0.05, 0, 0, 7); ctx.fill(); ctx.fillStyle = cfg.c1; ctx.fillRect(bx - W * 0.3, by, W * 0.6, H * 0.13); ctx.fillStyle = cfg.c2; ctx.fillRect(bx - W * 0.33, by - H * 0.02, W * 0.66, H * 0.04); ctx.fillStyle = '#FFE3A3'; ctx.fillRect(bx - W * 0.03, by - H * 0.02, W * 0.06, H * 0.15); }
  if (base === 'snow') { ctx.fillStyle = '#FFFFFF'; for (const [dx, r] of [[-0.25, 0.14], [-0.08, 0.18], [0.12, 0.17], [0.28, 0.13]]) { ctx.beginPath(); ctx.arc(bx + W * dx, by + W * 0.08, W * r, Math.PI, 0); ctx.fill(); } ctx.fillRect(0, by + W * 0.08, W, H); }
  if (base === 'cushion') { ctx.fillStyle = 'rgba(120,60,90,.2)'; ctx.beginPath(); ctx.ellipse(bx, by + W * 0.07, W * 0.42, W * 0.05, 0, 0, 7); ctx.fill(); ctx.fillStyle = cfg.c1; rr(ctx, bx - W * 0.38, by - W * 0.06, W * 0.76, W * 0.15, W * 0.075); ctx.fill(); ctx.fillStyle = cfg.c2; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(bx + sx * W * 0.38, by + W * 0.015, W * 0.03, 0, 7); ctx.fill(); } }
  if (base === 'musicbox') { ctx.fillStyle = 'rgba(100,60,70,.25)'; ctx.beginPath(); ctx.ellipse(bx, by + H * 0.15, W * 0.42, W * 0.05, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#F6C9D3'; ctx.fillRect(bx - W * 0.36, by, W * 0.72, H * 0.14); ctx.fillStyle = '#F8D98A'; ctx.fillRect(bx - W * 0.36, by, W * 0.72, H * 0.012); ctx.fillRect(bx - W * 0.36, by + H * 0.128, W * 0.72, H * 0.012); ctx.fillStyle = '#FDE6EC'; ctx.beginPath(); ctx.moveTo(bx - W * 0.36, by); ctx.lineTo(bx - W * 0.3, by - H * 0.42); ctx.lineTo(bx + W * 0.3, by - H * 0.42); ctx.lineTo(bx + W * 0.36, by); ctx.closePath(); ctx.globalAlpha = 0.0; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(bx, by, W * 0.2, W * 0.04, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#E2BE6E'; ctx.beginPath(); ctx.arc(bx + W * 0.38, by + H * 0.07, W * 0.025, 0, 7); ctx.fill(); ctx.fillStyle = '#C9626E'; ctx.font = `700 ${W * 0.05}px Comfortaa, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪ ♫ ♪', bx, by + H * 0.07); }
  if (base === 'cloud') { ctx.fillStyle = '#FFFFFF'; for (const [dx, dy, r] of [[-0.25, 0.02, 0.12], [-0.08, -0.03, 0.15], [0.1, -0.02, 0.14], [0.27, 0.02, 0.11], [0, 0.04, 0.16]]) { ctx.beginPath(); ctx.arc(bx + W * dx, by + W * dy, W * r, 0, 7); ctx.fill(); } }
  if (base === 'mirror') { ctx.fillStyle = vg(ctx, 0, by - W * 0.08, 0, by + W * 0.08, [[0, 'rgba(255,255,255,.95)'], [1, cfg.c1]]); ctx.beginPath(); ctx.ellipse(bx, by, W * 0.36, W * 0.08, 0, 0, 7); ctx.fill(); }
  const fig = getMat(o, kind); const sz = place(ctx, fig, bx, by + W * (cfg.lift || 0.02), W * (cfg.fw || 0.62), H * 0.64, cfg.sh || 'rgba(100,60,80,.3)');
  if (base === 'mirror') { ctx.save(); ctx.globalAlpha = 0.2; ctx.translate(bx, by); ctx.scale(1, -0.35); ctx.drawImage(fig, -sz.w / 2, -sz.h, sz.w, sz.h); ctx.restore(); }
  if (base === 'musicbox') { ctx.save(); ctx.strokeStyle = 'rgba(226,190,110,.7)'; ctx.lineWidth = W * 0.006; ctx.setLineDash([W * 0.01, W * 0.015]); ctx.beginPath(); ctx.ellipse(bx, by - W * 0.02, W * 0.24, W * 0.05, 0, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke(); ctx.restore(); }
  if (cfg.spark) sparkles(ctx, W, H, cfg.spark, cfg.sparkCol || '#FFFFFF', 21);
  plaque(ctx, bx, H * (cfg.py || 0.93), W * 0.34, H * 0.042, o.name, cfg.pl || ['#FFFFFF', '#F6E9EE'], cfg.pc || '#C9626E');
}
Object.assign(FIGURES, {
  fig_gummy: (ctx, W, H, o) => stand(ctx, W, H, o, 'gummy', { bg: ['#FDEFF6', '#F6D4E6'], base: 'mirror', c1: 'rgba(246,183,210,.85)', spark: 8 }),
  fig_ice: (ctx, W, H, o) => stand(ctx, W, H, o, 'ice', { bg: ['#E6F2FC', '#C2DAF0'], base: 'snow', spark: 18, sh: 'rgba(70,110,160,.3)', pl: ['#FFFFFF', '#E3F0FC'], pc: '#3E78B8' }),
  fig_bubble: (ctx, W, H, o) => stand(ctx, W, H, o, 'bubble', { bg: ['#F1F4FD', '#E2E3F7'], base: 'mirror', c1: 'rgba(200,210,245,.85)', spark: 10 }),
  fig_holo: (ctx, W, H, o) => stand(ctx, W, H, o, 'holo', { bg: ['#F5EEFC', '#E3D6F5'], base: 'pedestal', c1: '#D9C9F2', c2: '#F6F1FC', rim: '#C9E4F5', spark: 10, sparkCol: '#E8F8FF' }),
  fig_pearl: (ctx, W, H, o) => stand(ctx, W, H, o, 'pearl', { bg: ['#F7F3F7', '#E9E1EA'], base: 'cushion', c1: '#F6D3DC', c2: '#FFFFFF', spark: 6, pl: ['#FFFFFF', '#F3EEF5'], pc: '#8F7A9A' }),
  fig_silver: (ctx, W, H, o) => stand(ctx, W, H, o, 'silver', { bg: ['#EEF0F5', '#D5D9E3'], base: 'pedestal', c1: '#A8AEBC', c2: '#EEF0F5', rim: '#FFFFFF', spark: 8, pl: ['#F2F4F8', '#B5BAC6'], pc: '#3A3C46', sh: 'rgba(40,50,70,.35)' }),
  fig_rosegold: (ctx, W, H, o) => stand(ctx, W, H, o, 'rosegold', { bg: ['#FBEEEA', '#EED4CC'], base: 'pedestal', c1: '#DCA190', c2: '#FBE6DE', rim: '#F6D3C6', spark: 8, sparkCol: '#FFE9DE', pl: ['#F6D3C6', '#C98877'], pc: '#5A2E2A' }),
  fig_terracotta: (ctx, W, H, o) => stand(ctx, W, H, o, 'terracotta', { bg: ['#FBF0E6', '#EBD6C2'], base: 'pedestal', c1: '#C9825E', c2: '#E9B898', pl: ['#E9B898', '#B9704C'], pc: '#4A2010' }),
  fig_snow: (ctx, W, H, o) => stand(ctx, W, H, o, 'snow', { bg: ['#E9F1FA', '#D3E1F0'], base: 'snow', spark: 22, sh: 'rgba(90,120,170,.25)', pl: ['#FFFFFF', '#E3EDF8'], pc: '#5A7BA8' }),
  fig_cotton: (ctx, W, H, o) => stand(ctx, W, H, o, 'cotton', { bg: ['#EAF2FB', '#D7E6F5'], base: 'cloud', lift: -0.02, spark: 6, pl: ['#FFFFFF', '#EAF2FB'], pc: '#7FA8CC' }),
  fig_amigurumi: (ctx, W, H, o) => stand(ctx, W, H, o, 'amigurumi', { bg: ['#FDF4EC', '#F2DFCF'], base: 'nest', lift: -0.02, pl: ['#FFFFFF', '#F6E9DD'], pc: '#B9704C' }),
  fig_felt: (ctx, W, H, o) => stand(ctx, W, H, o, 'felt', { bg: ['#F3F7EE', '#DCE8D3'], base: 'cushion', c1: '#BFE3C8', c2: '#FFFFFF', lift: -0.02, pl: ['#FFFFFF', '#EAF4E5'], pc: '#5E9A6A' }),
  fig_paper: (ctx, W, H, o) => stand(ctx, W, H, o, 'paper', { bg: ['#FFF9F0', '#F3E6D3'], base: 'gift', c1: '#C9E4F5', c2: '#B5DAF2', by: 0.8, pl: ['#FFFFFF', '#F6EEE2'], pc: '#7A6A5A' }),
  fig_cookie2: (ctx, W, H, o) => stand(ctx, W, H, o, 'sugarcookie', { bg: ['#FFF3F6', '#F6DCE4'], base: 'gift', c1: '#F6B7C0', c2: '#F29AAE', by: 0.8, spark: 6, pl: ['#FFFFFF', '#FDEAF0'], pc: '#C9626E' }),
  fig_cake: (ctx, W, H, o) => stand(ctx, W, H, o, 'marzipan', { bg: ['#FFF4EE', '#F6DED3'], base: 'cake', by: 0.74, lift: 0.0, fw: 0.5, spark: 8, py: 0.95, pl: ['#FFFFFF', '#FDE6EC'], pc: '#C9626E' }),
  fig_musicbox: (ctx, W, H, o) => stand(ctx, W, H, o, 'porcelain', { bg: ['#FBF0F4', '#EFD9E2'], base: 'musicbox', by: 0.74, lift: 0.0, fw: 0.5, spark: 10, sparkCol: '#FFE9A8', py: 0.95, pl: ['#FFE9A8', '#E2BE6E'], pc: '#6E4E1E' })
});

export const FIGURE_IDS = Object.keys(FIGURES);
