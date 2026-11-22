// Ефекти для всього кадру: голограма, голо-проектор, мрія, іскорки, ретро, ч/б, пастель, зоряна рамка.
// Працюють піксельно + через режими накладання, тож однаково виглядають на iPhone, Android і ПК.

function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function blurCopy(src, k = 10) {
  const w = Math.max(1, Math.round(src.width / k)), h = Math.max(1, Math.round(src.height / k));
  const a = document.createElement('canvas'); a.width = w; a.height = h;
  const ax = a.getContext('2d'); ax.imageSmoothingQuality = 'high'; ax.drawImage(src, 0, 0, w, h);
  const b = document.createElement('canvas'); b.width = src.width; b.height = src.height;
  const bx = b.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(a, 0, 0, src.width, src.height);
  return b;
}
function snapshot(cv) { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; }
function sparkle4(ctx, x, y, r, col = '#fff') {
  ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = r * 1.5; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.18 : r, a = i * Math.PI / 4; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function vignette(ctx, W, H, col, strength) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col.replace('A', strength));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function pixels(ctx, W, H, fn) { const im = ctx.getImageData(0, 0, W, H); fn(im.data, W, H); ctx.putImageData(im, 0, 0); }
function scanlines(ctx, W, H, gap, a1, a2) {
  for (let y = 0; y < H; y += gap) { ctx.fillStyle = `rgba(255,255,255,${a1})`; ctx.fillRect(0, y, W, Math.max(1, gap / 4)); ctx.fillStyle = `rgba(0,0,40,${a2})`; ctx.fillRect(0, y + gap / 2, W, Math.max(1, gap / 4)); }
}

const FX = {
  hologram(ctx, W, H) {
    const u = W / 1080;
    // 1) розшарування кольорів + насиченість і контраст
    pixels(ctx, W, H, (d) => {
      const src = new Uint8ClampedArray(d), dx = Math.max(2, Math.round(8 * u)) * 4;
      for (let i = 0; i < d.length; i += 4) {
        let r = src[i + dx] ?? src[i], g = src[i + 1], b = src[i - dx + 2] ?? src[i + 2];
        const l = r * 0.3 + g * 0.59 + b * 0.11;
        r = l + (r - l) * 1.45; g = l + (g - l) * 1.45; b = l + (b - l) * 1.45;
        d[i] = (r - 128) * 1.12 + 120; d[i + 1] = (g - 128) * 1.12 + 120; d[i + 2] = (b - 128) * 1.12 + 128;
      }
    });
    ctx.save();
    // 2) райдужна плівка смугами
    let g = ctx.createLinearGradient(0, 0, W, H);
    const cols = ['#FF5FC8', '#4FD8FF', '#FFE45C', '#A56BFF', '#4CFFC4', '#FF5FC8', '#4FD8FF'];
    cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.28; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.45; ctx.fillRect(0, 0, W, H);
    // 3) тонкий відблиск
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.28;
    g = ctx.createLinearGradient(0, H * 0.15, W, H * 0.55); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(0.6, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // 4) сканлінії, рамка-сяйво та іскри
    scanlines(ctx, W, H, Math.max(4, Math.round(6 * u)), 0.05, 0.05);
    ctx.save(); ctx.strokeStyle = 'rgba(160,240,255,.8)'; ctx.lineWidth = 6 * u; ctx.shadowColor = '#7FE6FF'; ctx.shadowBlur = 30 * u; ctx.strokeRect(14 * u, 14 * u, W - 28 * u, H - 28 * u); ctx.restore();
    const r = rand(7); for (let i = 0; i < 16; i++) sparkle4(ctx, r() * W, r() * H, (10 + r() * 24) * u, i % 3 ? '#FFFFFF' : '#C9F4FF');
  },
  holoproj(ctx, W, H) {
    const u = W / 1080;
    // монохромна блакитна проєкція
    pixels(ctx, W, H, (d, w) => {
      const r = rand(3), glitch = new Set(); for (let k = 0; k < 9; k++) { const y0 = Math.floor(r() * H); const hh = Math.floor((4 + r() * 18) * u); for (let y = y0; y < y0 + hh; y++) glitch.add(y); }
      const src = new Uint8ClampedArray(d);
      for (let y = 0; y < H; y++) {
        const shift = glitch.has(y) ? Math.round((r() - 0.5) * 40 * u) : 0;
        for (let x = 0; x < w; x++) {
          const sx = Math.min(w - 1, Math.max(0, x + shift)), si = (y * w + sx) * 4, i = (y * w + x) * 4;
          const l = (src[si] * 0.3 + src[si + 1] * 0.59 + src[si + 2] * 0.11) / 255;
          const t = Math.pow(l, 1.15);
          d[i] = 8 + t * 150; d[i + 1] = 30 + t * 215; d[i + 2] = 70 + t * 185;
        }
      }
    });
    ctx.save();
    // затемнення країв
    vignette(ctx, W, H, 'rgba(4,10,30,A)', 0.85);
    // світловий конус від проектора
    ctx.globalCompositeOperation = 'screen';
    const by = H * 0.93, g = ctx.createLinearGradient(0, by, 0, H * 0.1);
    g.addColorStop(0, 'rgba(90,220,255,.55)'); g.addColorStop(1, 'rgba(90,220,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W * 0.38, by); ctx.lineTo(W * 0.62, by); ctx.lineTo(W * 0.98, H * 0.08); ctx.lineTo(W * 0.02, H * 0.08); ctx.closePath(); ctx.fill();
    const rg = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, W * 0.6); rg.addColorStop(0, 'rgba(120,230,255,.25)'); rg.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    scanlines(ctx, W, H, Math.max(4, Math.round(5 * u)), 0.1, 0.12);
    // проектор
    ctx.save();
    ctx.fillStyle = '#1B2236'; ctx.beginPath(); ctx.ellipse(W / 2, by + 26 * u, W * 0.22, 40 * u, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2C3550'; ctx.beginPath(); ctx.ellipse(W / 2, by + 6 * u, W * 0.2, 30 * u, 0, 0, 7); ctx.fill();
    ctx.shadowColor = '#7FE6FF'; ctx.shadowBlur = 40 * u; ctx.fillStyle = '#9BEFFF';
    ctx.beginPath(); ctx.ellipse(W / 2, by, W * 0.13, 16 * u, 0, 0, 7); ctx.fill();
    ctx.restore();
    const r = rand(11); for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(160,240,255,${0.3 + r() * 0.6})`; ctx.fillRect(W * (0.25 + r() * 0.5), H * (0.2 + r() * 0.7), 3 * u, 3 * u); }
  },
  dream(ctx, W, H) {
    const b = blurCopy(snapshot(ctx.canvas), 14);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.28; ctx.drawImage(b, 0, 0);
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#FFD6C9'; ctx.fillRect(0, 0, W, H); ctx.restore();
    vignette(ctx, W, H, 'rgba(255,225,232,A)', 0.4);
  },
  sparkle(ctx, W, H) {
    const u = W / 1080, r = rand(19);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, rr = (20 + r() * 70) * u; const g = ctx.createRadialGradient(x, y, 0, x, y, rr); const c = ['255,214,230', '255,240,190', '220,240,255'][i % 3]; g.addColorStop(0, `rgba(${c},.55)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
    const lk = ctx.createLinearGradient(0, 0, W * 0.6, H * 0.3); lk.addColorStop(0, 'rgba(255,200,170,.55)'); lk.addColorStop(1, 'rgba(255,200,170,0)'); ctx.fillStyle = lk; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    for (let i = 0; i < 38; i++) sparkle4(ctx, r() * W, r() * H, (6 + r() * 20) * u, i % 4 ? '#FFFFFF' : '#FFE9A8');
  },
  vintage(ctx, W, H) {
    pixels(ctx, W, H, (d) => { const r = rand(5); for (let i = 0; i < d.length; i += 4) { const R = d[i], G = d[i + 1], B = d[i + 2]; let nr = R * 0.39 + G * 0.77 + B * 0.19, ng = R * 0.35 + G * 0.69 + B * 0.17, nb = R * 0.27 + G * 0.53 + B * 0.13; const n = (r() - 0.5) * 18; d[i] = nr * 0.75 + R * 0.25 * 0.9 + 18 + n; d[i + 1] = ng * 0.75 + G * 0.25 * 0.9 + 12 + n; d[i + 2] = nb * 0.75 + B * 0.25 * 0.9 + 6 + n; } });
    vignette(ctx, W, H, 'rgba(80,50,30,A)', 0.45);
  },
  bw(ctx, W, H) {
    pixels(ctx, W, H, (d) => { for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; const v = 22 + l * 0.9; d[i] = v + 6; d[i + 1] = v + 2; d[i + 2] = v; } });
    vignette(ctx, W, H, 'rgba(0,0,0,A)', 0.25);
  },
  pastel(ctx, W, H) {
    pixels(ctx, W, H, (d) => { for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; for (let k = 0; k < 3; k++) d[i + k] = (d[i + k] * 0.7 + l * 0.3) * 0.82 + 255 * 0.18; d[i] += 6; d[i + 2] += 2; } });
  },
  starframe(ctx, W, H) {
    const u = W / 1080, m = 34 * u;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 10 * u; ctx.shadowColor = 'rgba(243,203,107,.9)'; ctx.shadowBlur = 24 * u;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(m, m, W - m * 2, H - m * 2, 40 * u) : ctx.rect(m, m, W - m * 2, H - m * 2); ctx.stroke(); ctx.restore();
    const r = rand(29), per = 2 * (W + H), n = 46;
    for (let i = 0; i < n; i++) {
      let p = (i / n) * per, x, y; if (p < W) { x = p; y = m; } else if ((p -= W) < H) { x = W - m; y = p; } else if ((p -= H) < W) { x = W - p; y = H - m; } else { p -= W; x = m; y = H - p; }
      const rr = (8 + r() * 16) * u, col = ['#FFE9A8', '#FFFFFF', '#FFC9D8'][i % 3];
      ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = rr; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const q = k % 2 ? rr * 0.45 : rr, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
      ctx.fill(); ctx.restore();
    }
  }
};

// --- Кольорові тонування (множники каналів + підйом + насиченість) ---
function grade(ctx, W, H, [mr, mg, mb], [ar, ag, ab], sat = 1, con = 1) {
  pixels(ctx, W, H, (d) => { for (let i = 0; i < d.length; i += 4) { let r = d[i], g = d[i + 1], b = d[i + 2]; const l = r * 0.3 + g * 0.59 + b * 0.11; r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; d[i] = ((r - 128) * con + 128) * mr + ar; d[i + 1] = ((g - 128) * con + 128) * mg + ag; d[i + 2] = ((b - 128) * con + 128) * mb + ab; } });
}
function overlayRain(ctx, W, H, seed, n, draw) { const r = rand(seed); for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(r() * W, r() * H); ctx.rotate((r() - 0.5) * 1.2); const k = 0.5 + r(); ctx.globalAlpha = 0.65 + r() * 0.35; draw(ctx, k * W / 1080, i); ctx.restore(); } }
function heart(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s * 0.95, -s * 0.25, -s * 0.5, -s * 0.95, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.5, -s * 0.95, s * 0.95, -s * 0.25, 0, s * 0.35); ctx.fill(); }
Object.assign(FX, {
  golden(ctx, W, H) { grade(ctx, W, H, [1.08, 1.0, 0.86], [14, 6, -4], 1.1, 1.04); const g = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W); g.addColorStop(0, 'rgba(255,200,120,.45)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); },
  rosegold(ctx, W, H) { grade(ctx, W, H, [1.06, 0.95, 0.95], [16, 4, 8], 0.9, 1.02); ctx.save(); ctx.globalCompositeOperation = 'soft-light'; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#F7C6C0'); g.addColorStop(1, '#E8B98A'); ctx.fillStyle = g; ctx.globalAlpha = 0.6; ctx.fillRect(0, 0, W, H); ctx.restore(); },
  mint(ctx, W, H) { grade(ctx, W, H, [0.95, 1.04, 1.0], [6, 14, 10], 0.85, 0.98); },
  lavender(ctx, W, H) { grade(ctx, W, H, [1.0, 0.95, 1.07], [10, 4, 18], 0.85, 0.98); },
  sunset(ctx, W, H) { grade(ctx, W, H, [1.1, 0.96, 0.9], [10, 0, 10], 1.15, 1.05); ctx.save(); ctx.globalCompositeOperation = 'overlay'; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FF9E7A'); g.addColorStop(0.5, '#F6B7C0'); g.addColorStop(1, '#C9A8FF'); ctx.globalAlpha = 0.45; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); },
  moonlight(ctx, W, H) { grade(ctx, W, H, [0.85, 0.92, 1.08], [0, 8, 22], 0.6, 1.05); vignette(ctx, W, H, 'rgba(20,30,70,A)', 0.55); const r = rand(31); for (let i = 0; i < 30; i++) sparkle4(ctx, r() * W, r() * H * 0.6, (4 + r() * 10) * W / 1080, '#E8F2FF'); },
  warm(ctx, W, H) { grade(ctx, W, H, [1.06, 1.01, 0.92], [8, 4, 0], 1.05, 1.0); },
  cool(ctx, W, H) { grade(ctx, W, H, [0.94, 1.0, 1.07], [0, 4, 10], 0.95, 1.0); },
  fade(ctx, W, H) { grade(ctx, W, H, [0.85, 0.85, 0.85], [38, 34, 36], 0.75, 0.9); },
  watercolor(ctx, W, H) {
    const b = blurCopy(snapshot(ctx.canvas), 5); ctx.drawImage(b, 0, 0);
    pixels(ctx, W, H, (d) => { for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 36) * 36 * 0.85 + 255 * 0.15; });
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; const r = rand(4); for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(200,180,170,${r() * 0.08})`; ctx.fillRect(r() * W, r() * H, 3, 3); } ctx.restore();
  },
  sketch(ctx, W, H) {
    pixels(ctx, W, H, (d, w) => { const src = new Uint8ClampedArray(d); const L = i => src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < w - 1; x++) { const i = (y * w + x) * 4; const gx = L(i + 4) - L(i - 4), gy = L(i + w * 4) - L(i - w * 4); const e = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 2.2); const v = 252 - e; d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 6; } });
  },
  comic(ctx, W, H) {
    const src = snapshot(ctx.canvas); const sx = src.getContext('2d').getImageData(0, 0, W, H).data;
    ctx.fillStyle = '#FFFDF6'; ctx.fillRect(0, 0, W, H); const step = Math.max(6, Math.round(W / 110));
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { const i = (Math.min(H - 1, y + step / 2 | 0) * W + Math.min(W - 1, x + step / 2 | 0)) * 4; const l = (sx[i] * 0.3 + sx[i + 1] * 0.59 + sx[i + 2] * 0.11) / 255; ctx.fillStyle = `rgb(${sx[i]},${sx[i + 1]},${sx[i + 2]})`; ctx.beginPath(); ctx.arc(x + step / 2, y + step / 2, step * 0.62 * (1.05 - l * 0.6), 0, 7); ctx.fill(); }
  },
  popart(ctx, W, H) { pixels(ctx, W, H, (d) => { const pal = [[246, 183, 192], [255, 227, 163], [169, 205, 235], [94, 67, 67]]; for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; const c = l > 190 ? pal[1] : l > 130 ? pal[0] : l > 70 ? pal[2] : pal[3]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } }); },
  pixel(ctx, W, H) { const k = Math.max(8, Math.round(W / 64)); const a = document.createElement('canvas'); a.width = Math.ceil(W / k); a.height = Math.ceil(H / k); const ax = a.getContext('2d'); ax.drawImage(ctx.canvas, 0, 0, a.width, a.height); ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(a, 0, 0, W, H); ctx.restore(); },
  neon(ctx, W, H) {
    pixels(ctx, W, H, (d, w) => { const src = new Uint8ClampedArray(d); const L = i => src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < w - 1; x++) { const i = (y * w + x) * 4; const e = Math.min(1, Math.hypot(L(i + 4) - L(i - 4), L(i + w * 4) - L(i - w * 4)) / 60); const t = x / w; d[i] = 20 + e * (255 * (1 - t) + 120 * t); d[i + 1] = 12 + e * (90 + 140 * t); d[i + 2] = 40 + e * 255; } });
    const b = blurCopy(snapshot(ctx.canvas), 6); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(b, 0, 0); ctx.drawImage(b, 0, 0); ctx.restore();
  },
  hearts(ctx, W, H) { overlayRain(ctx, W, H, 41, 34, (c, k, i) => heart(c, (22 + (i % 4) * 9) * k, ['#F29AA0', '#F6B7C0', '#FFFFFF', '#FBD0D5'][i % 4])); },
  snow(ctx, W, H) { ctx.save(); ctx.fillStyle = 'rgba(230,240,255,.12)'; ctx.fillRect(0, 0, W, H); ctx.restore(); const r = rand(51); for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * H, rr = (2 + r() * 7) * W / 1080; ctx.fillStyle = `rgba(255,255,255,${0.6 + r() * 0.4})`; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); } },
  confetti(ctx, W, H) { overlayRain(ctx, W, H, 61, 90, (c, k, i) => { c.fillStyle = ['#F6B7C0', '#FFE3A3', '#C9E4F5', '#CDEBD3', '#D9C9F2'][i % 5]; if (i % 3) c.fillRect(-14 * k, -5 * k, 28 * k, 10 * k); else { c.beginPath(); c.arc(0, 0, 8 * k, 0, 7); c.fill(); } }); },
  lightleak(ctx, W, H) { ctx.save(); ctx.globalCompositeOperation = 'screen'; for (const [x, y, r, c] of [[0, 0.2, 0.9, '255,150,120'], [1, 0.75, 0.8, '255,210,140'], [0.6, 0, 0.5, '255,170,210']]) { const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * r); g.addColorStop(0, `rgba(${c},.65)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } ctx.restore(); },
  polaroid(ctx, W, H) {
    const src = snapshot(ctx.canvas); const m = W * 0.07, bottom = H * 0.16;
    ctx.fillStyle = '#FBF8F3'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 12; ctx.drawImage(src, 0, 0, W, H, m, m, W - m * 2, H - m - bottom); ctx.restore();
    grade.call(null, ctx, W, H, [1.03, 1.0, 0.95], [6, 4, 0], 0.95, 1);
  },
  prism(ctx, W, H) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5; const cols = ['#FF7AA8', '#FFC76B', '#FFF27A', '#7AF0B0', '#7AC8FF', '#B07AFF']; const bw = W * 0.06; cols.forEach((c, i) => { const g = ctx.createLinearGradient(0, 0, W, H); ctx.save(); ctx.translate(W * 0.15 + i * bw, 0); ctx.rotate(0.35); ctx.fillStyle = c; ctx.fillRect(0, -H * 0.2, bw, H * 1.5); ctx.restore(); }); ctx.restore(); }
});

export const EFFECT_IDS = ['none', ...Object.keys(FX)];

export function applyEffect(ctx, name) {
  const fn = FX[name]; if (!fn) return;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  try { fn(ctx, W, H); } catch (e) { console.warn('effect', name, e); }
  ctx.restore();
}
