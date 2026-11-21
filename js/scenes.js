// Сцени-фони, підкладки та прикраси — векторне малювання на canvas у ніжних тонах.
export const PALETTE = {
  cream: '#FFF8F0', blush: '#F9D9D6', rose: '#F2B8B5', roseDeep: '#E58F95',
  peach: '#FBD9C3', butter: '#FFF0C2', honey: '#F8D98A', sage: '#D9E8D2', sky: '#DCEBF5',
  lilac: '#E8DDF2', cocoa: '#6B4E4E', white: '#FFFFFF'
};
const P = PALETTE;

function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function vgrad(ctx, h, stops) { const g = ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function bokeh(ctx, w, h, n, colors, seed = 7, alpha = 0.35) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = (0.02 + r() * 0.07) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const c = colors[i % colors.length];
    g.addColorStop(0, hexA(c, alpha)); g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
  }
}
export function hexA(hex, a) {
  let h = hex.slice(1); if (h.length === 3) h = [...h].map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
function cloud(ctx, x, y, s, color = '#fff', alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 0.5 * s, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x + 0.55 * s, y - 0.45 * s, 0.6 * s, Math.PI, Math.PI * 1.9);
  ctx.arc(x + 1.25 * s, y - 0.2 * s, 0.5 * s, Math.PI * 1.25, Math.PI * 0.1);
  ctx.arc(x + 1.5 * s, y + 0.15 * s, 0.35 * s, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
export function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.95, y - s * 0.25, x - s * 0.5, y - s * 0.95, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.95, x + s * 0.95, y - s * 0.25, x, y + s * 0.35);
  ctx.closePath();
}
function star(ctx, x, y, r, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function flower(ctx, x, y, r, petal, center = P.honey, n = 6) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = petal;
  for (let i = 0; i < n; i++) { ctx.rotate(Math.PI * 2 / n); ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.38, r * 0.62, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = center; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, 7); ctx.fill(); ctx.restore();
}
function sunflower(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#F6C85F';
  for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.ellipse(0, -r * 0.75, r * 0.2, r * 0.48, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#8A5A3C'; ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.1, r * 0.2, 0, 7); ctx.fill();
  ctx.restore();
}
function leaf(ctx, x, y, len, ang, color = '#B9D3A8') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.3, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.3, 0, 0); ctx.fill(); ctx.restore();
}
function moon(ctx, x, y, r, color = '#FFE9A8') {
  // серп без «вирізання» полотна: дуга зовні + дуга всередині у зворотний бік
  ctx.save(); ctx.fillStyle = color; ctx.shadowColor = 'rgba(255,233,168,.55)'; ctx.shadowBlur = r * 0.5;
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.32, Math.PI * 1.68, false);
  ctx.arc(x + r * 0.42, y - r * 0.05, r * 0.82, Math.PI * 1.52, Math.PI * 0.48, true);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function ornamentRow(ctx, y, w, s, c1, c2) {
  // український геометричний орнамент (стилізований ромб-хрестик)
  const step = s * 2.2;
  for (let x = s; x < w; x += step) {
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x + s * 0.45, y); ctx.lineTo(x, y + s * 0.45); ctx.lineTo(x - s * 0.45, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c1; ctx.fillRect(x + s * 0.95, y - s * 0.12, step - s * 1.9, s * 0.24);
  }
}
function floorShadow(ctx, w, h, y) {
  const g = ctx.createRadialGradient(w / 2, y, 0, w / 2, y, w * 0.55);
  g.addColorStop(0, 'rgba(120,80,70,.18)'); g.addColorStop(1, 'rgba(120,80,70,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - w * 0.3, w, w * 0.6);
}

// --- Сцени ---
export const SCENES = {
  peach: { color: P.peach, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFF3E6'], [0.6, c], [1, '#F6C4A8']]); ctx.fillRect(0, 0, w, h);
    bokeh(ctx, w, h, 18, ['#fff', P.butter, P.rose], 3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, h * 0.72, w, h * 0.28);
  } },
  blush: { color: P.blush, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFF5F3'], [1, c]]); ctx.fillRect(0, 0, w, h);
    bokeh(ctx, w, h, 14, ['#fff', P.rose], 11, 0.4);
    const r = rand(5);
    for (let i = 0; i < 26; i++) { ctx.fillStyle = hexA(P.roseDeep, 0.18 + r() * 0.2); heartPath(ctx, r() * w, r() * h * 0.65, w * (0.02 + r() * 0.03)); ctx.fill(); }
  } },
  clouds: { color: P.sky, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, c], [0.7, '#FFF4EC'], [1, P.blush]]); ctx.fillRect(0, 0, w, h);
    cloud(ctx, w * 0.05, h * 0.18, w * 0.16, '#fff', 0.95); cloud(ctx, w * 0.6, h * 0.12, w * 0.12, '#fff', 0.9);
    cloud(ctx, w * 0.55, h * 0.4, w * 0.1, '#fff', 0.7); cloud(ctx, w * 0.0, h * 0.5, w * 0.09, '#fff', 0.6);
    star(ctx, w * 0.85, h * 0.3, w * 0.025, P.honey, 0.9); star(ctx, w * 0.2, h * 0.35, w * 0.018, P.honey, 0.8);
  } },
  night: { color: '#C9C2E6', draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#8F86B8'], [0.55, c], [1, '#F3D7DA']]); ctx.fillRect(0, 0, w, h);
    const r = rand(9);
    for (let i = 0; i < 60; i++) star(ctx, r() * w, r() * h * 0.6, w * (0.004 + r() * 0.01), '#FFF6D6', 0.5 + r() * 0.5);
    moon(ctx, w * 0.78, h * 0.13, w * 0.09);
    cloud(ctx, w * 0.02, h * 0.62, w * 0.14, '#fff', 0.55); cloud(ctx, w * 0.62, h * 0.66, w * 0.12, '#fff', 0.5);
  } },
  sunflowers: { color: P.butter, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#DCEBF5'], [0.45, '#FFF6DE'], [1, c]]); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,240,180,.7)'; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.12, w * 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#E9E2A6'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
    const r = rand(4);
    for (let i = 0; i < 14; i++) { const x = r() * w, y = h * (0.5 + r() * 0.12); ctx.strokeStyle = '#9DBB82'; ctx.lineWidth = w * 0.008; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, h); ctx.stroke(); leaf(ctx, x, y + w * 0.12, w * 0.07, -0.5); sunflower(ctx, x, y, w * (0.045 + r() * 0.03)); }
    ctx.fillStyle = 'rgba(255,248,230,.55)'; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  } },
  vyshyvanka: { color: P.cream, draw(ctx, w, h, c) {
    ctx.fillStyle = c; ctx.fillRect(0, 0, w, h);
    bokeh(ctx, w, h, 10, [P.blush, P.butter], 21, 0.5);
    const s = w * 0.022;
    for (const y of [s * 2, s * 4.6, h - s * 2, h - s * 4.6]) ornamentRow(ctx, y, w, s, '#D9737B', '#F2C14E');
  } },
  flowers: { color: P.blush, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFFaf5'], [1, c]]); ctx.fillRect(0, 0, w, h);
    const r = rand(13), cols = ['#F6B7B9', '#FBE3A1', '#fff', '#F3C6D9'];
    for (let i = 0; i < 36; i++) {
      const edge = i % 2 ? r() * h * 0.22 : h - r() * h * 0.22;
      const x = r() * w;
      leaf(ctx, x, edge, w * 0.06, r() * 6.28);
      flower(ctx, x + w * 0.02, edge, w * (0.03 + r() * 0.025), cols[i % 4]);
    }
  } },
  rainbow: { color: P.butter, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFF8EE'], [1, c]]); ctx.fillRect(0, 0, w, h);
    const cols = ['#F2B8B5', '#FBD9C3', '#FFF0C2', '#D9E8D2', '#DCEBF5'];
    const cx = w / 2, cy = h * 0.42, R = w * 0.46, band = w * 0.045;
    cols.forEach((col, i) => { ctx.strokeStyle = col; ctx.lineWidth = band; ctx.beginPath(); ctx.arc(cx, cy, R - i * band, Math.PI, 0); ctx.stroke(); });
    cloud(ctx, cx - R - w * 0.04, cy, w * 0.11); cloud(ctx, cx + R - w * 0.17, cy, w * 0.11);
  } },
  christmas: { color: '#F4E3DA', draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFF7F0'], [1, c]]); ctx.fillRect(0, 0, w, h);
    bokeh(ctx, w, h, 22, ['#F8D98A', '#F2B8B5', '#fff'], 17, 0.55);
    // гірлянда з вогниками
    ctx.strokeStyle = '#9DBB82'; ctx.lineWidth = w * 0.02; ctx.beginPath(); ctx.moveTo(0, h * 0.05);
    ctx.quadraticCurveTo(w / 2, h * 0.14, w, h * 0.05); ctx.stroke();
    for (let i = 1; i < 10; i++) { const t = i / 10, x = t * w, y = h * 0.05 + Math.sin(t * Math.PI) * h * 0.045; ctx.fillStyle = i % 2 ? '#F8D98A' : '#E58F95'; ctx.beginPath(); ctx.arc(x, y + w * 0.02, w * 0.014, 0, 7); ctx.fill(); }
    const r = rand(2); for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(r() * w, r() * h, w * (0.003 + r() * 0.006), 0, 7); ctx.fill(); }
  } },
  easter: { color: P.sage, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFF9EE'], [1, c]]); ctx.fillRect(0, 0, w, h);
    const r = rand(31), cols = ['#F2B8B5', '#FFF0C2', '#DCEBF5', '#E8DDF2'];
    for (let i = 0; i < 9; i++) {
      const x = w * (0.08 + i * 0.105), y = h * 0.9 + r() * h * 0.04, s = w * 0.045;
      ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.ellipse(x, y, s * 0.75, s, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = s * 0.15; ctx.beginPath(); ctx.moveTo(x - s * 0.7, y); ctx.quadraticCurveTo(x, y - s * 0.3, x + s * 0.7, y); ctx.stroke();
    }
    for (let i = 0; i < 18; i++) flower(ctx, r() * w, r() * h * 0.25, w * 0.02, i % 2 ? '#fff' : P.butter);
  } },
  sea: { color: P.sky, draw(ctx, w, h, c) {
    ctx.fillStyle = vgrad(ctx, h, [[0, '#FFF4EC'], [0.5, c], [1, '#BFDDEA']]); ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = hexA('#FFFFFF', 0.25 + k * 0.1); ctx.beginPath(); const y = h * (0.6 + k * 0.1); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += w / 8) ctx.quadraticCurveTo(x + w / 16, y - w * 0.03, x + w / 8, y);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    }
    star(ctx, w * 0.15, h * 0.92, w * 0.04, '#F6B7B9'); star(ctx, w * 0.86, h * 0.9, w * 0.03, '#F8D98A');
  } },
  plain: { color: P.blush, draw(ctx, w, h, c) {
    const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, h * 0.7);
    g.addColorStop(0, '#FFFDFB'); g.addColorStop(1, c); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } }
};
export const SCENE_IDS = Object.keys(SCENES);

// --- Підкладки під малюка ---
export const PROPS = {
  none: { draw() {} },
  blanket: { draw(ctx, w, h) {
    const y = h * 0.72, rw = w * 0.42; floorShadow(ctx, w, h, y + rw * 0.25);
    ctx.fillStyle = '#FFFDF9';
    const r = rand(8);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, wob = 1 + (r() - 0.5) * 0.08; ctx.lineTo(w / 2 + Math.cos(a) * rw * wob, y + Math.sin(a) * rw * 0.32 * wob); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,215,205,.6)'; ctx.lineWidth = w * 0.004;
    for (let i = 0; i < 50; i++) { const a = r() * 6.28, d = r(); ctx.beginPath(); const x = w / 2 + Math.cos(a) * rw * d, yy = y + Math.sin(a) * rw * 0.3 * d; ctx.moveTo(x, yy); ctx.lineTo(x + w * 0.015, yy + w * 0.006); ctx.stroke(); }
  } },
  basket: { draw(ctx, w, h) {
    const y = h * 0.74, rw = w * 0.4; floorShadow(ctx, w, h, y + rw * 0.35);
    ctx.fillStyle = '#D7A97E'; ctx.beginPath(); ctx.ellipse(w / 2, y, rw, rw * 0.32, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#C0915F'; ctx.lineWidth = w * 0.008;
    for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.ellipse(w / 2, y + k * w * 0.012, rw * (1 - k * 0.02), rw * 0.32, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
    ctx.fillStyle = '#FFF6EE'; ctx.beginPath(); ctx.ellipse(w / 2, y - rw * 0.06, rw * 0.88, rw * 0.22, 0, 0, 7); ctx.fill();
    ctx.fillStyle = hexA(P.rose, 0.55); ctx.beginPath(); ctx.ellipse(w / 2 + rw * 0.2, y - rw * 0.08, rw * 0.5, rw * 0.13, 0.1, 0, 7); ctx.fill();
  } },
  cloud: { draw(ctx, w, h) {
    floorShadow(ctx, w, h, h * 0.82);
    cloud(ctx, w * 0.12, h * 0.75, w * 0.26, '#FFFFFF');
  } },
  moon: { draw(ctx, w, h) {
    floorShadow(ctx, w, h, h * 0.86);
    ctx.save(); ctx.translate(w / 2, h * 0.66); ctx.rotate(-0.35);
    ctx.fillStyle = '#FFE9A8'; ctx.beginPath(); ctx.arc(0, 0, w * 0.4, Math.PI * 0.15, Math.PI * 0.85); ctx.arc(0, -w * 0.12, w * 0.33, Math.PI * 0.8, Math.PI * 0.2, true); ctx.closePath(); ctx.fill(); ctx.restore();
  } },
  heart: { draw(ctx, w, h) {
    floorShadow(ctx, w, h, h * 0.86);
    ctx.fillStyle = hexA(P.rose, 0.9); heartPath(ctx, w / 2, h * 0.7, w * 0.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; heartPath(ctx, w / 2 - w * 0.08, h * 0.66, w * 0.22); ctx.fill();
  } }
};
export const PROP_IDS = Object.keys(PROPS);

// --- Прикраси ---
export const DECOR = {
  heart: (ctx, s, c = P.roseDeep) => { ctx.fillStyle = c; heartPath(ctx, 0, s * 0.1, s); ctx.fill(); },
  star: (ctx, s, c = P.honey) => star(ctx, 0, 0, s * 0.5, c),
  cloud: (ctx, s) => { ctx.save(); ctx.shadowColor = 'rgba(150,120,140,.35)'; ctx.shadowBlur = s * 0.08; ctx.shadowOffsetY = s * 0.03; cloud(ctx, -s * 0.52, s * 0.14, s * 0.36, '#FFFFFF'); ctx.restore(); ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = '#D9CFE6'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.arc(-s * 0.1, s * 0.05, s * 0.16, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); ctx.restore(); },
  moon: (ctx, s) => moon(ctx, 0, 0, s * 0.45),
  flower: (ctx, s) => flower(ctx, 0, 0, s * 0.5, '#F6B7B9'),
  sunflower: (ctx, s) => sunflower(ctx, 0, 0, s * 0.45),
  balloon: (ctx, s, c = P.rose) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -s * 0.15, s * 0.32, s * 0.4, 0, 0, 7); ctx.fill(); ctx.strokeStyle = P.cocoa; ctx.lineWidth = s * 0.015; ctx.beginPath(); ctx.moveTo(0, s * 0.25); ctx.quadraticCurveTo(s * 0.08, s * 0.4, 0, s * 0.55); ctx.stroke(); },
  crown: (ctx, s) => { ctx.fillStyle = P.honey; ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 0.25); ctx.lineTo(-s * 0.45, -s * 0.2); ctx.lineTo(-s * 0.22, s * 0.02); ctx.lineTo(0, -s * 0.3); ctx.lineTo(s * 0.22, s * 0.02); ctx.lineTo(s * 0.45, -s * 0.2); ctx.lineTo(s * 0.45, s * 0.25); ctx.closePath(); ctx.fill(); },
  bow: (ctx, s) => { ctx.fillStyle = P.roseDeep; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s * 0.5, -s * 0.4, -s * 0.5, 0); ctx.quadraticCurveTo(-s * 0.5, s * 0.4, 0, 0); ctx.quadraticCurveTo(s * 0.5, -s * 0.4, s * 0.5, 0); ctx.quadraticCurveTo(s * 0.5, s * 0.4, 0, 0); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, s * 0.09, 0, 7); ctx.fill(); },
  sparkle: (ctx, s) => { ctx.shadowColor = 'rgba(243,203,107,.8)'; ctx.shadowBlur = s * 0.1; ctx.fillStyle = '#F8D98A'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.08 : s * 0.5, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
};
export const DECOR_IDS = Object.keys(DECOR);
export const EMOJI = ['💗', '🍼', '🧸', '🎀', '🌸', '⭐', '🌙', '☁️', '🐣', '🦋', '🍓', '🎈', '👶', '🌻', '💛', '🐻'];
