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
export const EFFECT_IDS = ['none', ...Object.keys(FX)];

export function applyEffect(ctx, name) {
  const fn = FX[name]; if (!fn) return;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  try { fn(ctx, W, H); } catch (e) { console.warn('effect', name, e); }
  ctx.restore();
}
