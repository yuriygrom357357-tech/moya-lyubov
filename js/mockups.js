import { FIGURES } from './figures.js';
// «Де фото»: фото малюка у різних місцях — на столі, по ТБ, на обкладинці, у хмаринці, 3D-сердечко, статуетка тощо.
// Кожна функція малює сцену W×H (формат 4:5) і вставляє зображення. Усі розміри — у частках W, тож працює і для мініатюр.

const rnd = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
function cover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}
function contain(ctx, img, cx, cy, maxW, maxH) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; const k = Math.min(maxW / iw, maxH / ih);
  ctx.drawImage(img, cx - iw * k / 2, cy - ih * k / 2, iw * k, ih * k); return { w: iw * k, h: ih * k };
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function vg(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function shadow(ctx, b, oy = 0, c = 'rgba(80,50,40,.28)') { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.shadowOffsetY = oy; }
function noSh(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
function heartP(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s * 0.95, y - s * 0.25, x - s * 0.5, y - s * 0.95, x, y - s * 0.45); ctx.bezierCurveTo(x + s * 0.5, y - s * 0.95, x + s * 0.95, y - s * 0.25, x, y + s * 0.35); ctx.closePath(); }
function bokeh(ctx, W, H, n, cols, seed, a = 0.4) { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, R = W * (0.03 + r() * 0.08); const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, cols[i % cols.length].replace('A', a)); g.addColorStop(1, cols[i % cols.length].replace('A', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); } }
function wall(ctx, W, H, c1, c2, floorY, f1, f2) {
  ctx.fillStyle = vg(ctx, 0, 0, 0, floorY, [[0, c1], [1, c2]]); ctx.fillRect(0, 0, W, floorY);
  ctx.fillStyle = vg(ctx, 0, floorY, 0, H, [[0, f1], [1, f2]]); ctx.fillRect(0, floorY, W, H - floorY);
  const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W * 0.8); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function plant(ctx, x, y, s) {
  ctx.fillStyle = '#E9C9B4'; ctx.beginPath(); ctx.moveTo(x - s * 0.35, y - s * 0.55); ctx.lineTo(x + s * 0.35, y - s * 0.55); ctx.lineTo(x + s * 0.26, y); ctx.lineTo(x - s * 0.26, y); ctx.fill();
  const r = rnd(9); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28; ctx.save(); ctx.translate(x, y - s * 0.55); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = i % 2 ? '#A9CB9A' : '#BFDCAF'; ctx.beginPath(); ctx.ellipse(0, -s * (0.45 + r() * 0.25), s * 0.11, s * (0.32 + r() * 0.15), 0, 0, 7); ctx.fill(); ctx.restore(); }
}
function flowersVase(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(220,235,245,.85)'; rr(ctx, x - s * 0.18, y - s * 0.5, s * 0.36, s * 0.5, s * 0.12); ctx.fill();
  ctx.strokeStyle = '#A9CB9A'; ctx.lineWidth = s * 0.03; for (const dx of [-0.12, 0, 0.12]) { ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x + dx * s * 2.2, y - s * 1.0); ctx.stroke(); }
  for (const [dx, dy, c] of [[-0.26, -1.02, '#F6B7C0'], [0, -1.12, '#FFE3A3'], [0.26, -1.02, '#F29AA0']]) { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * s + Math.cos(a) * s * 0.07, y + dy * s + Math.sin(a) * s * 0.07, s * 0.065, 0, 7); ctx.fill(); } ctx.fillStyle = '#FFF4D0'; ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, s * 0.05, 0, 7); ctx.fill(); }
}
function photoFrame(ctx, img, x, y, w, h, frameCol = '#FFFFFF', mat = 0.09, depth = 0.04) {
  ctx.save(); shadow(ctx, w * 0.08, w * 0.04);
  ctx.fillStyle = frameCol; rr(ctx, x, y, w, h, w * 0.02); ctx.fill(); noSh(ctx);
  const fw = w * depth; ctx.fillStyle = '#FFFDF9'; ctx.fillRect(x + fw, y + fw, w - fw * 2, h - fw * 2);
  const m = w * mat; cover(ctx, img, x + m, y + m, w - m * 2, h - m * 2);
  ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = w * 0.005; ctx.strokeRect(x + m, y + m, w - m * 2, h - m * 2);
  const g = vg(ctx, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.28)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillStyle = g; ctx.fillRect(x + m, y + m, w - m * 2, h - m * 2);
  ctx.restore();
}

// --- «Пластикова іграшка» з вирізаного малюка ---
export function toyify(src) {
  const W = src.naturalWidth || src.width, H = src.naturalHeight || src.height;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const sm = document.createElement('canvas'); sm.width = Math.max(1, W / 3 | 0); sm.height = Math.max(1, H / 3 | 0); sm.getContext('2d').drawImage(src, 0, 0, sm.width, sm.height);
  x.imageSmoothingQuality = 'high'; x.drawImage(sm, 0, 0, W, H);
  const im = x.getImageData(0, 0, W, H), d = im.data, a0 = src.getContext ? null : null;
  const o = document.createElement('canvas'); o.width = W; o.height = H; const ox = o.getContext('2d'); ox.drawImage(src, 0, 0); const od = ox.getImageData(0, 0, W, H).data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2]; const l = r * 0.3 + g * 0.59 + b * 0.11;
    r = l + (r - l) * 1.35; g = l + (g - l) * 1.35; b = l + (b - l) * 1.35;
    const q = 42; d[i] = Math.round(r / q) * q * 0.88 + 30; d[i + 1] = Math.round(g / q) * q * 0.88 + 28; d[i + 2] = Math.round(b / q) * q * 0.88 + 30;
    d[i + 3] = od[i + 3] > 40 ? 255 : 0;
  }
  x.putImageData(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  let g = x.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  g = x.createLinearGradient(0, H * 0.4, W * 0.5, H); g.addColorStop(0, 'rgba(120,70,90,0)'); g.addColorStop(1, 'rgba(120,70,90,.35)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const r0 = rnd(5); x.filter = 'none';
  for (let i = 0; i < 7; i++) { x.save(); x.translate(W * (0.2 + r0() * 0.5), H * (0.1 + r0() * 0.6)); x.rotate(-0.6); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(0, 0, W * (0.02 + r0() * 0.03), W * 0.008, 0, 0, 7); x.fill(); x.restore(); }
  x.globalCompositeOperation = 'source-over';
  // контур
  const out = document.createElement('canvas'); const p = Math.round(Math.max(W, H) * 0.02); out.width = W + p * 2; out.height = H + p * 2; const oc = out.getContext('2d');
  for (let k = 0; k < 16; k++) { const t = k / 16 * Math.PI * 2; oc.drawImage(c, p + Math.cos(t) * p * 0.6, p + Math.sin(t) * p * 0.6); }
  oc.globalCompositeOperation = 'source-in'; oc.fillStyle = '#FFF4EE'; oc.fillRect(0, 0, out.width, out.height); oc.globalCompositeOperation = 'source-over'; oc.drawImage(c, p, p);
  return out;
}

export const MOCKUPS = {
  table(ctx, W, H, o) {
    wall(ctx, W, H, '#FBE9E4', '#F6DCD3', H * 0.7, '#E2C3A8', '#CFA98B');
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < W; x += W * 0.08) ctx.fillRect(x, 0, W * 0.035, H * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(0, H * 0.7, W, H * 0.012);
    const fw = W * 0.46, fh = fw * 1.25; photoFrame(ctx, o.img, W * 0.32, H * 0.7 - fh + W * 0.01, fw, fh, '#F7EDE4', 0.08, 0.035);
    ctx.fillStyle = 'rgba(80,50,40,.18)'; ctx.beginPath(); ctx.ellipse(W * 0.55, H * 0.71, fw * 0.55, W * 0.02, 0, 0, 7); ctx.fill();
    flowersVase(ctx, W * 0.17, H * 0.7, W * 0.3); plant(ctx, W * 0.9, H * 0.7, W * 0.22);
  },
  nightstand(ctx, W, H, o) {
    wall(ctx, W, H, '#EFE6F8', '#E3D7F0', H * 0.86, '#D9C3B4', '#C9AE9C');
    const g = ctx.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, W * 0.6); g.addColorStop(0, 'rgba(255,225,170,.6)'); g.addColorStop(1, 'rgba(255,225,170,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F6EFE8'; rr(ctx, W * 0.08, H * 0.58, W * 0.84, H * 0.3, W * 0.02); ctx.fill();
    ctx.fillStyle = '#EDE2D8'; ctx.fillRect(W * 0.06, H * 0.56, W * 0.88, H * 0.035);
    ctx.strokeStyle = '#DCCBBE'; ctx.lineWidth = W * 0.004; ctx.strokeRect(W * 0.14, H * 0.64, W * 0.72, H * 0.09); circle(ctx, W * 0.5, H * 0.685, W * 0.012, '#C9AE9C');
    ctx.fillStyle = '#E9D9C8'; ctx.fillRect(W * 0.2, H * 0.36, W * 0.03, H * 0.2); ctx.fillStyle = '#FFF2D6'; ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.37); ctx.lineTo(W * 0.33, H * 0.37); ctx.lineTo(W * 0.29, H * 0.22); ctx.lineTo(W * 0.14, H * 0.22); ctx.fill();
    ctx.fillStyle = '#D9C9F2'; ctx.fillRect(W * 0.13, H * 0.52, W * 0.18, H * 0.04); ctx.fillStyle = '#F6B7C0'; ctx.fillRect(W * 0.15, H * 0.49, W * 0.15, H * 0.03);
    const fw = W * 0.4, fh = fw * 1.25; photoFrame(ctx, o.img, W * 0.47, H * 0.56 - fh, fw, fh, '#FFFFFF', 0.085, 0.03);
  },
  tv(ctx, W, H, o) {
    wall(ctx, W, H, '#E5F0EA', '#D7E8DE', H * 0.8, '#E4CDB8', '#D2B59C');
    ctx.fillStyle = '#F2E7DC'; rr(ctx, W * 0.1, H * 0.68, W * 0.8, H * 0.12, W * 0.015); ctx.fill(); ctx.fillStyle = '#E3D3C4'; ctx.fillRect(W * 0.14, H * 0.72, W * 0.72, H * 0.006);
    const tw = W * 0.84, th = tw * 0.62, tx = W * 0.08, ty = H * 0.17;
    ctx.save(); shadow(ctx, W * 0.05, W * 0.02); ctx.fillStyle = '#2B2B33'; rr(ctx, tx, ty, tw, th, W * 0.02); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2B2B33'; ctx.fillRect(W * 0.46, ty + th, W * 0.08, H * 0.04); ctx.fillRect(W * 0.38, ty + th + H * 0.04, W * 0.24, H * 0.012);
    const b = W * 0.018; cover(ctx, o.img, tx + b, ty + b, tw - b * 2, th - b * 2);
    ctx.fillStyle = vg(ctx, tx, ty, tx + tw, ty + th, [[0, 'rgba(255,255,255,.18)'], [0.35, 'rgba(255,255,255,.05)'], [0.36, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(tx + b, ty + b, tw - b * 2, th - b * 2);
    ctx.fillStyle = '#E58F95'; rr(ctx, tx + b * 2, ty + th - b * 5.5, W * 0.12, W * 0.04, W * 0.01); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 ${W * 0.022}px Comfortaa, sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText('● LIVE', tx + b * 2.6, ty + th - b * 5.5 + W * 0.02);
    if (o.name) { ctx.fillStyle = 'rgba(255,255,255,.88)'; rr(ctx, tx + b * 2 + W * 0.13, ty + th - b * 5.5, W * 0.4, W * 0.04, W * 0.01); ctx.fill(); ctx.fillStyle = '#5E4343'; ctx.fillText(o.name, tx + b * 2 + W * 0.14, ty + th - b * 5.5 + W * 0.02); }
    plant(ctx, W * 0.9, H * 0.68, W * 0.2); flowersVase(ctx, W * 0.16, H * 0.68, W * 0.18);
  },
  magazine(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, W, H, [[0, '#FDEFEA'], [1, '#F6DCD3']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.035); const mw = W * 0.78, mh = mw * 1.3; ctx.translate(-mw / 2, -mh / 2);
    shadow(ctx, W * 0.05, W * 0.025); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, mw, mh); noSh(ctx);
    cover(ctx, o.img, 0, 0, mw, mh);
    ctx.fillStyle = vg(ctx, 0, 0, 0, mh * 0.3, [[0, 'rgba(255,255,255,.65)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, mw, mh * 0.3);
    ctx.fillStyle = vg(ctx, 0, mh * 0.6, 0, mh, [[0, 'rgba(94,67,67,0)'], [1, 'rgba(94,67,67,.55)']]); ctx.fillRect(0, mh * 0.6, mw, mh * 0.4);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#E07F88';
    const title = (o.t('appName') || '').toUpperCase(); let fs = mw * 0.16; ctx.font = `700 ${fs}px "Great Vibes", Lobster, Comfortaa, sans-serif`; const tw = ctx.measureText(title).width; if (tw > mw * 0.9) { fs *= mw * 0.9 / tw; ctx.font = `700 ${fs}px Lobster, Comfortaa, sans-serif`; }
    ctx.lineWidth = mw * 0.012; ctx.strokeStyle = '#fff'; ctx.strokeText(title, mw / 2, mh * 0.13); ctx.fillText(title, mw / 2, mh * 0.13);
    ctx.font = `700 ${mw * 0.03}px Comfortaa, sans-serif`; ctx.fillStyle = '#5E4343'; ctx.fillText(o.issue || '', mw / 2, mh * 0.17);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `700 ${mw * 0.04}px Comfortaa, sans-serif`;
    ctx.fillText(o.t('magLine1'), mw * 0.06, mh * 0.78);
    let nfs = mw * 0.11; ctx.font = `400 ${nfs}px "Marck Script", Comfortaa, sans-serif`; const nw = ctx.measureText(o.name || '').width; if (nw > mw * 0.88) { nfs *= mw * 0.88 / nw; ctx.font = `400 ${nfs}px "Marck Script", Comfortaa, sans-serif`; } ctx.fillText(o.name || '', mw * 0.06, mh * 0.87);
    ctx.font = `700 ${mw * 0.03}px Comfortaa, sans-serif`; ctx.fillText(o.t('magLine2'), mw * 0.06, mh * 0.93);
    ctx.fillStyle = '#fff'; ctx.fillRect(mw * 0.8, mh * 0.88, mw * 0.14, mh * 0.08); ctx.fillStyle = '#333'; const r = rnd(3); for (let x = 0; x < mw * 0.12; x += mw * 0.006) ctx.fillRect(mw * 0.81 + x, mh * 0.89, mw * (0.002 + r() * 0.003), mh * 0.05);
    ctx.restore();
  },
  cloud(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#A9CDEB'], [0.6, '#DCEBF5'], [1, '#FDE9E4']]); ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.85, H * 0.12, 0, W * 0.85, H * 0.12, W * 0.35); sun.addColorStop(0, 'rgba(255,245,200,.95)'); sun.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    const blobs = [[0.5, 0.48, 0.3], [0.3, 0.55, 0.2], [0.7, 0.55, 0.21], [0.4, 0.38, 0.2], [0.62, 0.38, 0.19], [0.5, 0.62, 0.2], [0.2, 0.62, 0.13], [0.8, 0.62, 0.14]];
    const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d'); mx.fillStyle = '#000'; for (const [x, y, r] of blobs) { mx.beginPath(); mx.arc(W * x, H * y, W * r, 0, 7); mx.fill(); }
    const ph = document.createElement('canvas'); ph.width = W; ph.height = H; const px = ph.getContext('2d'); cover(px, o.img, W * 0.08, H * 0.2, W * 0.84, H * 0.6);
    px.globalCompositeOperation = 'destination-in'; px.drawImage(m, 0, 0);
    ctx.save(); shadow(ctx, W * 0.06, W * 0.02, 'rgba(120,150,190,.35)');
    ctx.fillStyle = '#fff'; for (const [x, y, r] of blobs) { ctx.beginPath(); ctx.arc(W * x, H * y, W * r * 1.06, 0, 7); ctx.fill(); } ctx.restore();
    ctx.drawImage(ph, 0, 0);
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff'; for (const [x, y, r] of [[0.16, 0.66, 0.08], [0.84, 0.66, 0.08], [0.5, 0.74, 0.1], [0.32, 0.72, 0.07], [0.68, 0.72, 0.07]]) { ctx.beginPath(); ctx.arc(W * x, H * y, W * r, 0, 7); ctx.fill(); } ctx.restore();
    for (const [x, y, s] of [[0.15, 0.15, 0.08], [0.3, 0.88, 0.06], [0.75, 0.86, 0.07]]) { ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W * x, H * y, W * s, 0, 7); ctx.arc(W * (x + s), H * y - W * s * 0.3, W * s * 0.8, 0, 7); ctx.arc(W * (x + s * 1.8), H * y, W * s * 0.7, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = '#8C7A90'; ctx.lineWidth = W * 0.004; for (const [x, y] of [[0.22, 0.25], [0.28, 0.22]]) { ctx.beginPath(); ctx.moveTo(W * x - W * 0.02, H * y); ctx.quadraticCurveTo(W * x, H * y - W * 0.015, W * x + W * 0.02, H * y); ctx.stroke(); }
  },
  heart3d(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#FDE9EC'], [1, '#F9D3D9']]); ctx.fillRect(0, 0, W, H);
    bokeh(ctx, W, H, 16, ['rgba(255,255,255,A)', 'rgba(246,183,192,A)'], 7, 0.6);
    const cx = W / 2, cy = H * 0.5, s = W * 0.82, depth = W * 0.05;
    ctx.save(); ctx.fillStyle = 'rgba(160,80,90,.25)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.86, W * 0.33, W * 0.04, 0, 0, 7); ctx.fill(); ctx.restore();
    for (let k = depth; k > 0; k -= Math.max(1, W / 540)) { heartP(ctx, cx + k * 0.35, cy + k, s); ctx.fillStyle = k > depth * 0.85 ? '#C9626E' : '#E07F88'; ctx.fill(); }
    ctx.save(); heartP(ctx, cx, cy, s); ctx.clip(); ctx.fillStyle = '#FDE9EC'; ctx.fillRect(0, 0, W, H); cover(ctx, o.img, cx - s * 0.62, cy - s * 0.6, s * 1.24, s * 1.0);
    const gl = ctx.createRadialGradient(cx - s * 0.25, cy - s * 0.45, 0, cx - s * 0.25, cy - s * 0.45, s * 0.6); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    heartP(ctx, cx, cy, s); ctx.lineWidth = W * 0.014; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.8; ctx.strokeStyle = '#fff'; ctx.lineWidth = W * 0.012; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx - s * 0.27, cy - s * 0.4, s * 0.16, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke(); ctx.restore();
  },
  fridge(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, W, 0, [[0, '#E3F1EA'], [0.5, '#F0F8F4'], [1, '#DCEDE4']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(0, H * 0.18, W, H * 0.008); ctx.fillStyle = '#C9D9D0'; rr(ctx, W * 0.9, H * 0.28, W * 0.03, H * 0.3, W * 0.015); ctx.fill();
    ctx.save(); ctx.translate(W * 0.47, H * 0.53); ctx.rotate(-0.06); const pw = W * 0.64, ph = pw * 1.2; shadow(ctx, W * 0.03, W * 0.015);
    ctx.fillStyle = '#FFFDF9'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph); noSh(ctx); const m = pw * 0.06; cover(ctx, o.img, -pw / 2 + m, -ph / 2 + m, pw - m * 2, ph - m * 4.2);
    ctx.fillStyle = '#5E4343'; ctx.font = `400 ${pw * 0.08}px "Marck Script", Comfortaa, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.name ? `${o.name} 💗` : '💗', 0, ph / 2 - m * 1.6);
    ctx.restore();
    const mag = (x, y, c) => { ctx.save(); shadow(ctx, W * 0.012, W * 0.006); heartP(ctx, W * x, H * y, W * 0.09); ctx.fillStyle = c; ctx.fill(); ctx.restore(); };
    mag(0.47, 0.17, '#E07F88'); mag(0.12, 0.86, '#F8D98A'); mag(0.85, 0.12, '#A9CDEB');
    ctx.save(); ctx.translate(W * 0.15, H * 0.2); ctx.rotate(0.12); shadow(ctx, W * 0.02, W * 0.01); ctx.fillStyle = '#FFF6D9'; ctx.fillRect(-W * 0.1, -W * 0.08, W * 0.2, W * 0.16); noSh(ctx); ctx.strokeStyle = '#F29AA0'; ctx.lineWidth = W * 0.006; ctx.beginPath(); ctx.arc(-W * 0.03, 0, W * 0.035, 0, 7); ctx.stroke(); ctx.strokeStyle = '#A9CB9A'; ctx.beginPath(); ctx.moveTo(-W * 0.08, W * 0.05); ctx.lineTo(W * 0.08, W * 0.05); ctx.stroke(); ctx.fillStyle = '#F8D98A'; ctx.beginPath(); ctx.arc(W * 0.05, -W * 0.04, W * 0.02, 0, 7); ctx.fill(); ctx.restore();
  },
  mug(ctx, W, H, o) {
    wall(ctx, W, H, '#FDF1E6', '#F9E4D2', H * 0.66, '#E8CDB4', '#D9B595');
    const cx = W * 0.47, top = H * 0.32, mw = W * 0.5, mh = H * 0.4, e = mw * 0.12;
    ctx.fillStyle = 'rgba(80,50,40,.2)'; ctx.beginPath(); ctx.ellipse(cx + W * 0.03, top + mh + e * 0.5, mw * 0.62, e * 0.7, 0, 0, 7); ctx.fill();
    ctx.lineWidth = W * 0.045; ctx.strokeStyle = '#F4EEEA'; ctx.beginPath(); ctx.ellipse(cx + mw / 2, top + mh * 0.45, mw * 0.2, mh * 0.25, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#FBF8F5'; ctx.beginPath(); ctx.moveTo(cx - mw / 2, top); ctx.lineTo(cx - mw / 2, top + mh); ctx.ellipse(cx, top + mh, mw / 2, e, 0, Math.PI, 0, true); ctx.lineTo(cx + mw / 2, top); ctx.closePath(); ctx.fill();
    const iw = o.img.naturalWidth || o.img.width, ih = o.img.naturalHeight || o.img.height; const pw = mw * 0.86, phh = mh * 0.72, slices = 60;
    const k = Math.max(pw * 1.3 / iw, phh / ih), sw = pw * 1.3 / k, sh = phh / k, sx0 = (iw - sw) / 2, sy0 = (ih - sh) / 2;
    for (let i = 0; i < slices; i++) { const t0 = i / slices, t1 = (i + 1) / slices; const a0 = (t0 - 0.5) * Math.PI * 0.8, a1 = (t1 - 0.5) * Math.PI * 0.8; const x0 = cx + Math.sin(a0) * mw / 2 * 0.92, x1 = cx + Math.sin(a1) * mw / 2 * 0.92; ctx.drawImage(o.img, sx0 + t0 * sw, sy0, sw / slices + 1, sh, x0, top + mh * 0.16, Math.max(1, x1 - x0 + 0.6), phh); }
    ctx.fillStyle = vg(ctx, cx - mw / 2, 0, cx + mw / 2, 0, [[0, 'rgba(120,90,80,.28)'], [0.25, 'rgba(255,255,255,.15)'], [0.4, 'rgba(255,255,255,0)'], [0.8, 'rgba(120,90,80,.05)'], [1, 'rgba(120,90,80,.3)']]); ctx.fillRect(cx - mw / 2, top, mw, mh);
    ctx.fillStyle = '#EFE6E0'; ctx.beginPath(); ctx.ellipse(cx, top, mw / 2, e, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#C9A68A'; ctx.beginPath(); ctx.ellipse(cx, top + e * 0.15, mw / 2 * 0.9, e * 0.75, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = W * 0.008; ctx.lineCap = 'round'; for (const dx of [-0.06, 0.04]) { ctx.beginPath(); ctx.moveTo(cx + W * dx, top - H * 0.02); ctx.bezierCurveTo(cx + W * dx - W * 0.03, top - H * 0.07, cx + W * dx + W * 0.03, top - H * 0.1, cx + W * dx, top - H * 0.15); ctx.stroke(); }
    plant(ctx, W * 0.88, H * 0.66, W * 0.2);
  },
  snowglobe(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#E3EAF7'], [1, '#C9D5EC']]); ctx.fillRect(0, 0, W, H); bokeh(ctx, W, H, 14, ['rgba(255,255,255,A)'], 3, 0.7);
    const cx = W / 2, cy = H * 0.42, R = W * 0.36;
    ctx.fillStyle = 'rgba(70,80,120,.2)'; ctx.beginPath(); ctx.ellipse(cx, H * 0.86, W * 0.32, W * 0.04, 0, 0, 7); ctx.fill();
    ctx.fillStyle = vg(ctx, cx - R, 0, cx + R, 0, [[0, '#C99B76'], [0.5, '#E8C3A0'], [1, '#B98762']]); ctx.beginPath(); ctx.moveTo(cx - R * 0.8, cy + R * 0.82); ctx.lineTo(cx + R * 0.8, cy + R * 0.82); ctx.lineTo(cx + R * 0.95, H * 0.85); ctx.lineTo(cx - R * 0.95, H * 0.85); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F8D98A'; ctx.fillRect(cx - R * 0.88, cy + R * 0.95, R * 1.76, W * 0.012);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip(); cover(ctx, o.img, cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.92, R, R * 0.25, 0, 0, 7); ctx.fill();
    const r = rnd(8); for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,255,${0.6 + r() * 0.4})`; ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * R * 2, cy + (r() - 0.5) * R * 2, W * (0.003 + r() * 0.006), 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = W * 0.008; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.lineWidth = W * 0.02; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.85, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke(); ctx.lineWidth = W * 0.01; ctx.beginPath(); ctx.arc(cx, cy, R * 0.85, Math.PI * 1.48, Math.PI * 1.55); ctx.stroke();
    if (o.name) { ctx.fillStyle = '#7A5A2E'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 ${W * 0.045}px "Marck Script", Comfortaa, sans-serif`; ctx.fillText(o.name, cx, H * 0.79); }
  },
  billboard(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#FBD3C3'], [0.55, '#FDE9DC'], [1, '#F6E3D6']]); ctx.fillRect(0, 0, W, H);
    const r = rnd(12); for (let i = 0; i < 12; i++) { const bw = W * (0.06 + r() * 0.08), bh = H * (0.2 + r() * 0.35), x = i * W * 0.09 - W * 0.02; ctx.fillStyle = ['#E9CFD8', '#DCC8E3', '#D7DDEE', '#E8D7CF'][i % 4]; ctx.fillRect(x, H * 0.95 - bh, bw, bh); ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let y = H * 0.95 - bh + W * 0.02; y < H * 0.92; y += W * 0.04) for (let xx = x + W * 0.012; xx < x + bw - W * 0.02; xx += W * 0.03) ctx.fillRect(xx, y, W * 0.012, W * 0.018); }
    const bx = W * 0.08, by = H * 0.12, bw = W * 0.84, bh = bw * 0.62;
    ctx.fillStyle = '#9A8C96'; ctx.fillRect(W * 0.3, by + bh, W * 0.03, H * 0.5); ctx.fillRect(W * 0.67, by + bh, W * 0.03, H * 0.5);
    ctx.save(); shadow(ctx, W * 0.04, W * 0.02); ctx.fillStyle = '#5E5560'; ctx.fillRect(bx - W * 0.015, by - W * 0.015, bw + W * 0.03, bh + W * 0.03); ctx.restore();
    cover(ctx, o.img, bx, by, bw, bh);
    if (o.name) { ctx.fillStyle = 'rgba(255,255,255,.88)'; rr(ctx, bx + bw * 0.05, by + bh * 0.78, bw * 0.5, bh * 0.15, bh * 0.04); ctx.fill(); ctx.fillStyle = '#E07F88'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${bh * 0.09}px Lobster, Comfortaa, sans-serif`; ctx.fillText(o.name + ' 💗', bx + bw * 0.08, by + bh * 0.855); }
    for (let i = 0; i < 4; i++) { const lx = bx + bw * (0.12 + i * 0.25); ctx.fillStyle = '#5E5560'; ctx.fillRect(lx, by - W * 0.05, W * 0.008, W * 0.035); ctx.fillRect(lx - W * 0.01, by - W * 0.06, W * 0.03, W * 0.012); const g = ctx.createLinearGradient(0, by - W * 0.05, 0, by + bh * 0.4); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, by - W * 0.05); ctx.lineTo(lx + W * 0.1, by + bh * 0.4); ctx.lineTo(lx - W * 0.1, by + bh * 0.4); ctx.fill(); }
  },
  phone(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, W, H, [[0, '#FDE4E6'], [1, '#FFF0C9']]); ctx.fillRect(0, 0, W, H); bokeh(ctx, W, H, 12, ['rgba(255,255,255,A)'], 21, 0.7);
    const ph = H * 0.86, pw = ph * 0.49, px = (W - pw) / 2, py = (H - ph) / 2, rad = pw * 0.15;
    ctx.save(); shadow(ctx, W * 0.06, W * 0.03); ctx.fillStyle = '#2B2B33'; rr(ctx, px, py, pw, ph, rad); ctx.fill(); ctx.restore();
    const b = pw * 0.04; ctx.save(); rr(ctx, px + b, py + b, pw - b * 2, ph - b * 2, rad * 0.8); ctx.clip(); cover(ctx, o.img, px + b, py + b, pw - b * 2, ph - b * 2);
    ctx.fillStyle = vg(ctx, 0, py, 0, py + ph * 0.3, [[0, 'rgba(0,0,0,.25)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(px, py, pw, ph * 0.3);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = `600 ${pw * 0.06}px -apple-system, Comfortaa, sans-serif`; ctx.fillText(o.date || '', W / 2, py + ph * 0.1);
    ctx.font = `700 ${pw * 0.24}px -apple-system, "SF Pro Rounded", Comfortaa, sans-serif`; ctx.fillText('9:41', W / 2, py + ph * 0.24);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(px + pw * 0.18, py + ph * 0.9, pw * 0.07, 0, 7); ctx.arc(px + pw * 0.82, py + ph * 0.9, pw * 0.07, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - pw * 0.17, py + ph * 0.965, pw * 0.34, ph * 0.006);
    ctx.restore(); ctx.fillStyle = '#111'; rr(ctx, W / 2 - pw * 0.15, py + b * 1.6, pw * 0.3, pw * 0.08, pw * 0.04); ctx.fill();
  },
  gallery(ctx, W, H, o) {
    wall(ctx, W, H, '#F6EFEA', '#EEE3DC', H * 0.84, '#D9C6B8', '#C9B2A2');
    const spot = ctx.createRadialGradient(W / 2, H * 0.08, 0, W / 2, H * 0.4, W * 0.6); spot.addColorStop(0, 'rgba(255,240,210,.85)'); spot.addColorStop(1, 'rgba(255,240,210,0)'); ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5E5560'; ctx.fillRect(W * 0.46, 0, W * 0.08, H * 0.02); ctx.fillRect(W * 0.49, H * 0.02, W * 0.02, H * 0.05);
    const fw = W * 0.56, fh = fw * 1.25, fx = (W - fw) / 2, fy = H * 0.12, fr = fw * 0.07;
    ctx.save(); shadow(ctx, W * 0.05, W * 0.025); ctx.fillStyle = vg(ctx, fx, fy, fx + fw, fy + fh, [[0, '#F5D788'], [0.5, '#D9A84E'], [1, '#F2CF7C']]); ctx.fillRect(fx, fy, fw, fh); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = fr * 0.15; ctx.strokeRect(fx + fr * 0.3, fy + fr * 0.3, fw - fr * 0.6, fh - fr * 0.6);
    ctx.strokeStyle = 'rgba(140,100,40,.4)'; ctx.strokeRect(fx + fr * 0.75, fy + fr * 0.75, fw - fr * 1.5, fh - fr * 1.5);
    cover(ctx, o.img, fx + fr, fy + fr, fw - fr * 2, fh - fr * 2);
    ctx.fillStyle = '#FBF8F3'; rr(ctx, W / 2 - W * 0.12, fy + fh + H * 0.04, W * 0.24, H * 0.06, W * 0.006); ctx.fill(); ctx.strokeStyle = '#E3D6C9'; ctx.stroke();
    ctx.fillStyle = '#5E4343'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${W * 0.022}px Comfortaa, sans-serif`; ctx.fillText(o.name || '', W / 2, fy + fh + H * 0.06); ctx.font = `400 ${W * 0.016}px Comfortaa, sans-serif`; ctx.fillText(o.year || '', W / 2, fy + fh + H * 0.085);
    ctx.strokeStyle = '#C9B2A2'; ctx.lineWidth = W * 0.006; ctx.beginPath(); ctx.moveTo(W * 0.15, H * 0.93); ctx.lineTo(W * 0.85, H * 0.93); ctx.stroke(); ctx.fillStyle = '#B79C8A'; for (const x of [0.2, 0.8]) ctx.fillRect(W * x, H * 0.85, W * 0.012, H * 0.08); ctx.fillStyle = '#D6BFAF'; rr(ctx, W * 0.15, H * 0.82, W * 0.7, H * 0.035, W * 0.01); ctx.fill();
  },
  locket(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#F6E9F0'], [1, '#EBD7E2']]); ctx.fillRect(0, 0, W, H);
    const r = rnd(4); ctx.strokeStyle = '#E2BE6E'; ctx.lineWidth = W * 0.008; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(W * (0.05 + i * 0.9), 0); ctx.quadraticCurveTo(W * 0.5, H * (0.32 - i * 0.02), W * 0.5, H * 0.2); ctx.stroke(); }
    const cx = W / 2, cy = H * 0.56, s = W * 0.7;
    ctx.save(); shadow(ctx, W * 0.05, W * 0.03, 'rgba(120,80,40,.35)'); heartP(ctx, cx, cy, s * 1.08); ctx.fillStyle = vg(ctx, cx - s, cy - s, cx + s, cy + s, [[0, '#FFE9A8'], [0.45, '#E2BE6E'], [1, '#C99A3E']]); ctx.fill(); ctx.restore();
    ctx.save(); heartP(ctx, cx, cy, s * 0.92); ctx.clip(); cover(ctx, o.img, cx - s * 0.46, cy - s * 0.48, s * 0.92, s * 0.85); const g = ctx.createRadialGradient(cx - s * 0.2, cy - s * 0.35, 0, cx - s * 0.2, cy - s * 0.35, s * 0.5); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    heartP(ctx, cx, cy, s * 0.92); ctx.lineWidth = W * 0.008; ctx.strokeStyle = '#FFF2C6'; ctx.stroke();
    ctx.fillStyle = '#E2BE6E'; ctx.beginPath(); ctx.arc(cx, cy - s * 0.47, W * 0.025, 0, 7); ctx.fill(); ctx.fillStyle = '#FFF2C6'; ctx.beginPath(); ctx.arc(cx, cy - s * 0.47, W * 0.012, 0, 7); ctx.fill();
  },
  pillow(ctx, W, H, o) {
    wall(ctx, W, H, '#EAF2F8', '#DCE8F2', H * 0.72, '#F3E3EA', '#E8D0DA');
    ctx.fillStyle = '#F6C2CC'; rr(ctx, 0, H * 0.62, W, H * 0.4, W * 0.04); ctx.fill();
    const cx = W / 2, cy = H * 0.5, pw = W * 0.7, ph = W * 0.7;
    const path = () => { ctx.beginPath(); ctx.moveTo(cx - pw / 2, cy - ph / 2); ctx.quadraticCurveTo(cx, cy - ph / 2 + ph * 0.06, cx + pw / 2, cy - ph / 2); ctx.quadraticCurveTo(cx + pw / 2 - pw * 0.06, cy, cx + pw / 2, cy + ph / 2); ctx.quadraticCurveTo(cx, cy + ph / 2 - ph * 0.06, cx - pw / 2, cy + ph / 2); ctx.quadraticCurveTo(cx - pw / 2 + pw * 0.06, cy, cx - pw / 2, cy - ph / 2); ctx.closePath(); };
    ctx.save(); shadow(ctx, W * 0.05, W * 0.03); path(); ctx.fillStyle = '#FFFDF9'; ctx.fill(); ctx.restore();
    ctx.save(); path(); ctx.clip(); cover(ctx, o.img, cx - pw * 0.42, cy - ph * 0.42, pw * 0.84, ph * 0.84);
    const g = ctx.createRadialGradient(cx - pw * 0.15, cy - ph * 0.2, 0, cx, cy, pw * 0.75); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,80,90,.3)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    path(); ctx.lineWidth = W * 0.012; ctx.strokeStyle = '#F6DCE2'; ctx.stroke();
  },
  puzzle(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, 0, H, [[0, '#E9D9C8'], [1, '#D9C3AE']]); ctx.fillRect(0, 0, W, H);
    const pw = W * 0.82, ph = pw * 1.18, px = (W - pw) / 2, py = H * 0.07, cols = 4, rows = 5, cw = pw / cols, ch = ph / rows;
    ctx.save(); shadow(ctx, W * 0.03, W * 0.012); ctx.fillStyle = '#fff'; ctx.fillRect(px, py, pw, ph); ctx.restore(); cover(ctx, o.img, px, py, pw, ph);
    ctx.strokeStyle = 'rgba(80,60,50,.35)'; ctx.lineWidth = W * 0.003;
    for (let i = 1; i < cols; i++) { ctx.beginPath(); for (let j = 0; j < rows; j++) { const x = px + i * cw, y0 = py + j * ch; ctx.moveTo(x, y0); ctx.lineTo(x, y0 + ch * 0.38); ctx.arc(x + (j % 2 ? cw * 0.08 : -cw * 0.08), y0 + ch / 2, ch * 0.12, -Math.PI / 2, Math.PI / 2, j % 2 === 0); ctx.lineTo(x, y0 + ch); } ctx.stroke(); }
    for (let j = 1; j < rows; j++) { ctx.beginPath(); for (let i = 0; i < cols; i++) { const y = py + j * ch, x0 = px + i * cw; ctx.moveTo(x0, y); ctx.lineTo(x0 + cw * 0.38, y); ctx.arc(x0 + cw / 2, y + (i % 2 ? ch * 0.07 : -ch * 0.07), cw * 0.12, Math.PI, 0, i % 2 === 0); ctx.lineTo(x0 + cw, y); } ctx.stroke(); }
    const sx = px + cw * 2, sy = py + ch * 3; const piece = document.createElement('canvas'); piece.width = cw; piece.height = ch; piece.getContext('2d').drawImage(ctx.canvas, sx, sy, cw, ch, 0, 0, cw, ch);
    ctx.fillStyle = 'rgba(60,40,30,.55)'; ctx.fillRect(sx, sy, cw, ch);
    ctx.save(); ctx.translate(px + pw * 0.8, py + ph + H * 0.035); ctx.rotate(0.25); shadow(ctx, W * 0.03, W * 0.02); ctx.drawImage(piece, -cw / 2, -ch / 2); ctx.restore();
  },
  stamp(ctx, W, H, o) {
    ctx.fillStyle = '#FBF5EC'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#F29AA0'; ctx.lineWidth = W * 0.02; for (let x = -W; x < W * 2; x += W * 0.08) { ctx.strokeStyle = (x / (W * 0.08)) % 2 ? '#A9CDEB' : '#F29AA0'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W * 0.06, W * 0.06); ctx.stroke(); }
    ctx.fillStyle = 'rgba(94,67,67,.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(W * 0.08, H * (0.72 + i * 0.05), W * (0.45 - i * 0.05), H * 0.006);
    const sw = W * 0.56, sh = sw * 1.2, sx = W * 0.36, sy = H * 0.12;
    ctx.save(); ctx.translate(sx + sw / 2, sy + sh / 2); ctx.rotate(0.05); ctx.translate(-sw / 2, -sh / 2); shadow(ctx, W * 0.02, W * 0.01);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); const tooth = sw / 22; ctx.rect(0, 0, sw, sh); ctx.fill(); noSh(ctx);
    ctx.fillStyle = '#FBF5EC'; for (let x = 0; x <= sw; x += tooth * 1.5) { for (const y of [0, sh]) { ctx.beginPath(); ctx.arc(x, y, tooth * 0.45, 0, 7); ctx.fill(); } } for (let y = 0; y <= sh; y += tooth * 1.5) { for (const x of [0, sw]) { ctx.beginPath(); ctx.arc(x, y, tooth * 0.45, 0, 7); ctx.fill(); } }
    const m = sw * 0.08; cover(ctx, o.img, m, m, sw - m * 2, sh - m * 3.2);
    ctx.fillStyle = '#E07F88'; ctx.font = `700 ${sw * 0.1}px Lobster, Comfortaa, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('1 💗', m, sh - m * 1.3); ctx.textAlign = 'right'; ctx.font = `700 ${sw * 0.05}px Comfortaa, sans-serif`; ctx.fillStyle = '#5E4343'; ctx.fillText(o.t('appName'), sw - m, sh - m * 1.3);
    ctx.restore();
    ctx.strokeStyle = 'rgba(94,67,67,.45)'; ctx.lineWidth = W * 0.006; ctx.beginPath(); ctx.arc(W * 0.35, H * 0.25, W * 0.11, 0, 7); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(W * 0.42, H * (0.2 + i * 0.03)); ctx.bezierCurveTo(W * 0.5, H * (0.18 + i * 0.03), W * 0.55, H * (0.23 + i * 0.03), W * 0.62, H * (0.21 + i * 0.03)); ctx.stroke(); }
  },
  book(ctx, W, H, o) {
    ctx.fillStyle = vg(ctx, 0, 0, W, H, [[0, '#EFE6F8'], [1, '#FDE4E6']]); ctx.fillRect(0, 0, W, H); bokeh(ctx, W, H, 12, ['rgba(255,255,255,A)', 'rgba(248,217,138,A)'], 15, 0.6);
    const bw = W * 0.72, bh = bw * 1.25, bx = (W - bw) / 2 + W * 0.02, by = (H - bh) / 2;
    ctx.save(); shadow(ctx, W * 0.05, W * 0.03); ctx.fillStyle = '#F7F1E8'; ctx.fillRect(bx + W * 0.015, by + W * 0.02, bw, bh); ctx.restore();
    ctx.fillStyle = '#F7F1E8'; for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#EFE6DA' : '#F9F4EC'; ctx.fillRect(bx + bw, by + W * 0.004 * k + W * 0.008, W * 0.016, bh - W * 0.01); }
    ctx.fillStyle = '#C9A8D9'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = '#B48FC9'; ctx.fillRect(bx, by, bw * 0.06, bh);
    ctx.strokeStyle = '#F8D98A'; ctx.lineWidth = W * 0.006; ctx.strokeRect(bx + bw * 0.1, by + bw * 0.04, bw * 0.84, bh - bw * 0.08);
    const iw = bw * 0.66, ih = iw * 1.05, ix = bx + bw * 0.2, iy = by + bh * 0.25;
    ctx.save(); ctx.beginPath(); ctx.ellipse(ix + iw / 2, iy + ih / 2, iw / 2, ih / 2, 0, 0, 7); ctx.clip(); cover(ctx, o.img, ix, iy, iw, ih); ctx.restore();
    ctx.strokeStyle = '#FFE9A8'; ctx.lineWidth = W * 0.01; ctx.beginPath(); ctx.ellipse(ix + iw / 2, iy + ih / 2, iw / 2, ih / 2, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const title = o.tale || ''; const words = title.split(' '); let lines = [], cur = ''; for (const w of words) { if ((cur + ' ' + w).trim().length > 16 && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) lines.push(cur);
    ctx.font = `700 ${bw * 0.075}px Lobster, Comfortaa, sans-serif`; lines.slice(0, 3).forEach((l, i) => { ctx.lineWidth = W * 0.008; ctx.strokeStyle = '#9E79B5'; ctx.strokeText(l, bx + bw * 0.53, by + bh * 0.1 + i * bw * 0.085); ctx.fillText(l, bx + bw * 0.53, by + bh * 0.1 + i * bw * 0.085); });
    const r = rnd(2); for (let i = 0; i < 10; i++) { ctx.fillStyle = '#FFE9A8'; ctx.beginPath(); const x = bx + bw * (0.15 + r() * 0.75), y = by + bh * (0.82 + r() * 0.12), s = W * (0.008 + r() * 0.01); for (let k = 0; k < 10; k++) { const rr2 = k % 2 ? s * 0.45 : s, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.fill(); }
  }
};
function circle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
Object.assign(MOCKUPS, FIGURES);
export const MOCKUP_IDS = Object.keys(MOCKUPS);

export function renderMockup(id, W, H, o) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  ctx.save(); MOCKUPS[id](ctx, W, H, o); ctx.restore();
  return c;
}
