// Милі звірятка та додаткові наліпки — векторне малювання на canvas.
// Кожна функція малює фігуру з центром у (0,0), розміром ~s.

const INK = '#5E4343', BLUSH = 'rgba(245,150,150,.55)';

function eye(ctx, x, y, r) {
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.35, r * 0.32, 0, 7); ctx.fill();
}
function cheeks(ctx, x, y, r) { ctx.fillStyle = BLUSH; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * x, y, r, r * 0.65, 0, 0, 7); ctx.fill(); } }
function smile(ctx, y, w, lw) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(-w / 2, y + w * 0.7, 0, y); ctx.quadraticCurveTo(w / 2, y + w * 0.7, w, y); ctx.stroke(); }
function circle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function ell(ctx, x, y, rx, ry, c, rot = 0) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); ctx.fill(); }
function soft(ctx, s) { ctx.shadowColor = 'rgba(120,80,70,.22)'; ctx.shadowBlur = s * 0.06; ctx.shadowOffsetY = s * 0.03; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; }

// Універсальний «сидячий» звірок: тіло, голова, вушка, мордочка
function critter(ctx, s, o) {
  const c = o.color, belly = o.belly || '#FFF6EE', hy = -s * 0.12, hr = s * 0.34;
  ctx.save(); soft(ctx, s);
  // хвостик
  if (o.tail === 'fluff') ell(ctx, s * 0.3, s * 0.32, s * 0.12, s * 0.1, o.tailColor || c);
  if (o.tail === 'long') { ctx.strokeStyle = c; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.22, s * 0.36); ctx.quadraticCurveTo(s * 0.5, s * 0.3, s * 0.42, s * 0.05); ctx.stroke(); }
  if (o.tail === 'fox') { ctx.save(); ctx.translate(s * 0.32, s * 0.25); ctx.rotate(-0.6); ell(ctx, 0, 0, s * 0.12, s * 0.24, c); ell(ctx, 0, -s * 0.17, s * 0.07, s * 0.08, '#FFF6EE'); ctx.restore(); }
  if (o.tail === 'curl') { ctx.strokeStyle = c; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.arc(s * 0.32, s * 0.3, s * 0.05, 0, Math.PI * 1.6); ctx.stroke(); }
  // тіло
  ell(ctx, 0, s * 0.24, s * 0.28, s * 0.24, c);
  noShadow(ctx);
  ell(ctx, 0, s * 0.28, s * 0.17, s * 0.16, belly);
  // лапки
  ell(ctx, -s * 0.13, s * 0.45, s * 0.09, s * 0.055, o.paw || c); ell(ctx, s * 0.13, s * 0.45, s * 0.09, s * 0.055, o.paw || c);
  // вушка (позаду голови)
  const ec = o.earColor || c, ei = o.earInner || '#F7C4C4';
  if (o.ears === 'cat' || o.ears === 'fox') for (const sx of [-1, 1]) {
    ctx.fillStyle = ec; ctx.beginPath(); ctx.moveTo(sx * hr * 0.95, hy - hr * 0.2); ctx.lineTo(sx * hr * 0.75, hy - hr * 1.25); ctx.lineTo(sx * hr * 0.15, hy - hr * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ei; ctx.beginPath(); ctx.moveTo(sx * hr * 0.8, hy - hr * 0.4); ctx.lineTo(sx * hr * 0.72, hy - hr * 1.05); ctx.lineTo(sx * hr * 0.35, hy - hr * 0.78); ctx.closePath(); ctx.fill();
  }
  if (o.ears === 'bunny') for (const sx of [-1, 1]) { ell(ctx, sx * hr * 0.42, hy - hr * 1.25, hr * 0.24, hr * 0.7, ec, sx * 0.12); ell(ctx, sx * hr * 0.42, hy - hr * 1.22, hr * 0.12, hr * 0.5, ei, sx * 0.12); }
  if (o.ears === 'round') for (const sx of [-1, 1]) { circle(ctx, sx * hr * 0.78, hy - hr * 0.72, hr * 0.33, ec); circle(ctx, sx * hr * 0.78, hy - hr * 0.72, hr * 0.18, ei); }
  if (o.ears === 'elephant') for (const sx of [-1, 1]) { ell(ctx, sx * hr * 1.05, hy, hr * 0.55, hr * 0.7, ec); ell(ctx, sx * hr * 1.05, hy, hr * 0.35, hr * 0.5, ei); }
  // голова
  ctx.save(); soft(ctx, s); circle(ctx, 0, hy, hr, c); ctx.restore();
  if (o.ears === 'floppy') for (const sx of [-1, 1]) ell(ctx, sx * hr * 0.92, hy - hr * 0.05, hr * 0.26, hr * 0.55, ec, sx * -0.35);
  if (o.ears === 'pig') for (const sx of [-1, 1]) { ctx.fillStyle = ec; ctx.beginPath(); ctx.moveTo(sx * hr * 0.4, hy - hr * 0.85); ctx.lineTo(sx * hr * 0.95, hy - hr * 0.95); ctx.lineTo(sx * hr * 0.8, hy - hr * 0.4); ctx.closePath(); ctx.fill(); }
  if (o.ears === 'lamb') { for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.15); circle(ctx, Math.cos(a) * hr * 0.85, hy + Math.sin(a) * hr * 0.85, hr * 0.28, '#FFFFFF'); } for (const sx of [-1, 1]) ell(ctx, sx * hr * 1.0, hy - hr * 0.05, hr * 0.28, hr * 0.13, '#F2D6C8', sx * 0.4); }
  // плями та маски
  if (o.patches === 'panda') { for (const sx of [-1, 1]) ell(ctx, sx * hr * 0.38, hy - hr * 0.02, hr * 0.24, hr * 0.3, '#5E4F55', sx * -0.5); }
  if (o.patches === 'fox') { ctx.fillStyle = '#FFF6EE'; ctx.beginPath(); ctx.moveTo(-hr * 0.95, hy + hr * 0.05); ctx.quadraticCurveTo(-hr * 0.3, hy - hr * 0.05, 0, hy + hr * 0.25); ctx.quadraticCurveTo(hr * 0.3, hy - hr * 0.05, hr * 0.95, hy + hr * 0.05); ctx.quadraticCurveTo(hr * 0.6, hy + hr * 0.95, 0, hy + hr); ctx.quadraticCurveTo(-hr * 0.6, hy + hr * 0.95, -hr * 0.95, hy + hr * 0.05); ctx.fill(); }
  if (o.muzzle) ell(ctx, 0, hy + hr * 0.38, hr * 0.42, hr * 0.3, o.muzzle);
  if (o.mane) { const cols = ['#F7B9C9', '#FFE3A3', '#C9E4F5', '#D9C9F2']; for (let i = 0; i < 5; i++) circle(ctx, -hr * 0.5 + i * hr * 0.18, hy - hr * 0.88 + Math.abs(i - 2) * hr * 0.08, hr * 0.2, cols[i % 4]); }
  if (o.horn) { ctx.fillStyle = '#F8D98A'; ctx.beginPath(); ctx.moveTo(-hr * 0.13, hy - hr * 0.82); ctx.lineTo(0, hy - hr * 1.55); ctx.lineTo(hr * 0.13, hy - hr * 0.82); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.01; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-hr * 0.12 * (1 - k / 4.5), hy - hr * (0.82 + k * 0.17)); ctx.lineTo(hr * 0.12 * (1 - k / 4.5), hy - hr * (0.9 + k * 0.17)); ctx.stroke(); } }
  // обличчя
  eye(ctx, -hr * 0.36, hy - hr * 0.02, hr * 0.12); eye(ctx, hr * 0.36, hy - hr * 0.02, hr * 0.12);
  cheeks(ctx, hr * 0.58, hy + hr * 0.3, hr * 0.13);
  if (o.nose === 'snout') { ell(ctx, 0, hy + hr * 0.32, hr * 0.26, hr * 0.18, '#F4A6B0'); circle(ctx, -hr * 0.08, hy + hr * 0.32, hr * 0.045, '#C46B7A'); circle(ctx, hr * 0.08, hy + hr * 0.32, hr * 0.045, '#C46B7A'); }
  else if (o.nose === 'trunk') { ctx.strokeStyle = c; ctx.lineWidth = hr * 0.26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, hy + hr * 0.2); ctx.quadraticCurveTo(0, hy + hr * 0.75, hr * 0.32, hy + hr * 0.62); ctx.stroke(); }
  else { ell(ctx, 0, hy + hr * 0.25, hr * 0.08, hr * 0.06, o.nose || INK); smile(ctx, hy + hr * 0.36, hr * 0.12, s * 0.012); }
  if (o.spikes) { /* голки їжачка над головою */ }
  ctx.restore();
}

function birdy(ctx, s, o) {
  const r = s * 0.36;
  ctx.save(); soft(ctx, s);
  if (o.tuft) { ctx.strokeStyle = o.color; ctx.lineWidth = s * 0.025; ctx.lineCap = 'round'; for (const a of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(0, -r * 0.95); ctx.quadraticCurveTo(Math.sin(a) * r * 0.3, -r * 1.25, Math.sin(a) * r * 0.45, -r * 1.3); ctx.stroke(); } }
  if (o.owl) for (const sx of [-1, 1]) { ctx.fillStyle = o.color; ctx.beginPath(); ctx.moveTo(sx * r * 0.45, -r * 0.75); ctx.lineTo(sx * r * 0.8, -r * 1.2); ctx.lineTo(sx * r * 0.9, -r * 0.55); ctx.closePath(); ctx.fill(); }
  ell(ctx, 0, 0, r, r * (o.owl ? 1.1 : 0.98), o.color);
  noShadow(ctx);
  for (const sx of [-1, 1]) ell(ctx, sx * r * 0.88, r * 0.15, r * 0.22, r * 0.42, o.wing || o.color, sx * 0.35);
  ell(ctx, 0, r * 0.38, r * 0.55, r * 0.48, o.belly || 'rgba(255,255,255,.55)');
  if (o.owl) { for (const sx of [-1, 1]) circle(ctx, sx * r * 0.38, -r * 0.2, r * 0.3, '#FFF6EE'); eye(ctx, -r * 0.38, -r * 0.2, r * 0.15); eye(ctx, r * 0.38, -r * 0.2, r * 0.15); }
  else { eye(ctx, -r * 0.34, -r * 0.18, r * 0.11); eye(ctx, r * 0.34, -r * 0.18, r * 0.11); }
  cheeks(ctx, r * 0.58, r * 0.08, r * 0.12);
  // дзьобик
  ctx.fillStyle = o.beak || '#F6B25E';
  if (o.duck) ell(ctx, 0, r * 0.05, r * 0.26, r * 0.12, o.beak || '#F6B25E');
  else { ctx.beginPath(); ctx.moveTo(-r * 0.12, -r * 0.02); ctx.lineTo(r * 0.12, -r * 0.02); ctx.lineTo(0, r * 0.16); ctx.closePath(); ctx.fill(); }
  // лапки
  ctx.strokeStyle = '#F6B25E'; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * r * 0.3, r * 0.95); ctx.lineTo(sx * r * 0.3, r * 1.15); ctx.moveTo(sx * r * 0.3, r * 1.15); ctx.lineTo(sx * r * 0.45, r * 1.2); ctx.moveTo(sx * r * 0.3, r * 1.15); ctx.lineTo(sx * r * 0.15, r * 1.2); ctx.stroke(); }
  if (o.shell) { ctx.fillStyle = '#FFF8EC'; ctx.beginPath(); ctx.moveTo(-r * 1.05, r * 0.35); for (let i = 0; i <= 8; i++) ctx.lineTo(-r * 1.05 + i * r * 0.2625, r * 0.35 + (i % 2 ? -r * 0.18 : 0)); ctx.lineTo(r * 1.05, r * 0.6); ctx.quadraticCurveTo(0, r * 1.5, -r * 1.05, r * 0.6); ctx.fill(); }
  ctx.restore();
}

export const ANIMALS = {
  kitten: (c, s) => critter(c, s, { color: '#F6D2B4', ears: 'cat', tail: 'long', belly: '#FFF6EE', muzzle: '#FFF6EE' }),
  puppy: (c, s) => critter(c, s, { color: '#E9C9A5', ears: 'floppy', earColor: '#C9A07D', tail: 'fluff', muzzle: '#FFF3E6' }),
  chick: (c, s) => birdy(c, s, { color: '#FFE38A', wing: '#FFD966', tuft: true, belly: 'rgba(255,250,220,.7)' }),
  hatchling: (c, s) => birdy(c, s, { color: '#FFE38A', wing: '#FFD966', tuft: true, shell: true }),
  duckling: (c, s) => birdy(c, s, { color: '#FFF0A8', wing: '#FFE47A', duck: true, beak: '#F7A35C' }),
  bunny: (c, s) => critter(c, s, { color: '#FFFFFF', ears: 'bunny', earInner: '#F9C9D1', tail: 'fluff', belly: '#FDF0F2', nose: '#F29AA8' }),
  bear: (c, s) => critter(c, s, { color: '#D4A988', ears: 'round', earInner: '#F2D3BC', muzzle: '#F4DDC9', belly: '#F2D3BC' }),
  panda: (c, s) => critter(c, s, { color: '#FFFFFF', ears: 'round', earColor: '#5E4F55', earInner: '#5E4F55', patches: 'panda', paw: '#5E4F55', belly: '#FFFFFF' }),
  fox: (c, s) => critter(c, s, { color: '#F4B183', ears: 'fox', earInner: '#FFF1E4', patches: 'fox', tail: 'fox', paw: '#8C6A5E' }),
  owl: (c, s) => birdy(c, s, { color: '#C9B3D9', wing: '#B79CCB', owl: true, belly: 'rgba(255,246,238,.75)', beak: '#F6B25E' }),
  bird: (c, s) => birdy(c, s, { color: '#B9DDF2', wing: '#9CCBE8', belly: 'rgba(255,255,255,.7)', beak: '#F6B25E', tuft: false }),
  lamb: (c, s) => critter(c, s, { color: '#FFF8F0', ears: 'lamb', belly: '#FFFFFF', paw: '#E8CFC0' }),
  piglet: (c, s) => critter(c, s, { color: '#F9C9CF', ears: 'pig', earColor: '#F4AEB8', nose: 'snout', tail: 'curl', belly: '#FDE1E4' }),
  elephant: (c, s) => critter(c, s, { color: '#C9CEDF', ears: 'elephant', earInner: '#F2C9D4', nose: 'trunk', belly: '#DDE1EC' }),
  unicorn: (c, s) => critter(c, s, { color: '#FFFFFF', ears: 'cat', earInner: '#F9D3DD', horn: true, mane: true, tail: 'fluff', tailColor: '#F7B9C9', belly: '#FDF2F6' }),
  frog: (c, s) => frog(c, s),
  hedgehog: (c, s) => hedgehog(c, s),
  whale: (c, s) => whale(c, s)
};
export const ANIMAL_IDS = Object.keys(ANIMALS);

function frog(ctx, s) {
  const g = '#BFE3B4', hr = s * 0.36, hy = -s * 0.05;
  ctx.save(); soft(ctx, s);
  ell(ctx, 0, s * 0.27, s * 0.3, s * 0.21, g);
  for (const sx of [-1, 1]) circle(ctx, sx * hr * 0.55, hy - hr * 0.72, hr * 0.32, g);
  ell(ctx, 0, hy, hr * 1.1, hr * 0.8, g); noShadow(ctx);
  ell(ctx, 0, s * 0.31, s * 0.18, s * 0.13, '#E8F5E1');
  for (const sx of [-1, 1]) { circle(ctx, sx * hr * 0.55, hy - hr * 0.72, hr * 0.22, '#fff'); eye(ctx, sx * hr * 0.55, hy - hr * 0.7, hr * 0.12); }
  cheeks(ctx, hr * 0.65, hy + hr * 0.15, hr * 0.14); smile(ctx, hy + hr * 0.2, hr * 0.35, s * 0.014);
  for (const sx of [-1, 1]) ell(ctx, sx * s * 0.16, s * 0.47, s * 0.1, s * 0.05, '#A9D69C');
  ctx.restore();
}
function hedgehog(ctx, s) {
  ctx.save(); soft(ctx, s);
  ctx.fillStyle = '#B98F73'; ctx.beginPath();
  for (let i = 0; i <= 18; i++) { const a = Math.PI * (0.95 + i / 18 * 1.1), rr = i % 2 ? s * 0.36 : s * 0.46; ctx.lineTo(Math.cos(a) * rr + s * 0.05, Math.sin(a) * rr + s * 0.12); }
  ctx.closePath(); ctx.fill();
  ell(ctx, s * 0.05, s * 0.2, s * 0.38, s * 0.24, '#B98F73'); noShadow(ctx);
  ctx.fillStyle = '#F6DEC8'; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.05); ctx.quadraticCurveTo(-s * 0.48, s * 0.05, -s * 0.5, s * 0.22); ctx.quadraticCurveTo(-s * 0.3, s * 0.42, s * 0.05, s * 0.38); ctx.quadraticCurveTo(s * 0.1, s * 0.1, -s * 0.05, -s * 0.05); ctx.fill();
  circle(ctx, -s * 0.5, s * 0.2, s * 0.04, INK);
  eye(ctx, -s * 0.22, s * 0.1, s * 0.04); cheeks(ctx, -s * 0.13, s * 0.22, s * 0.04);
  for (const x of [-0.15, 0.2]) ell(ctx, s * x, s * 0.43, s * 0.07, s * 0.04, '#E8C9B0');
  ctx.restore();
}
function whale(ctx, s) {
  const c = '#A9D3EE';
  ctx.save(); soft(ctx, s);
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(s * 0.35, s * 0.05); ctx.quadraticCurveTo(s * 0.55, -s * 0.15, s * 0.52, -s * 0.28); ctx.quadraticCurveTo(s * 0.42, -s * 0.12, s * 0.3, -s * 0.05); ctx.fill();
  ell(ctx, -s * 0.05, s * 0.08, s * 0.42, s * 0.3, c); noShadow(ctx);
  ctx.fillStyle = '#E6F3FB'; ctx.beginPath(); ctx.ellipse(-s * 0.08, s * 0.2, s * 0.32, s * 0.16, 0, 0, Math.PI); ctx.fill();
  eye(ctx, -s * 0.22, s * 0.02, s * 0.045); cheeks(ctx, s * -0.02, s * 0.12, s * 0.05);
  ctx.save(); ctx.translate(-s * 0.3, 0); smile(ctx, s * 0.12, s * 0.04, s * 0.012); ctx.restore();
  ctx.strokeStyle = '#A9D3EE'; ctx.lineWidth = s * 0.025; ctx.lineCap = 'round';
  for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.22); ctx.quadraticCurveTo(-s * 0.05 + a * s * 0.08, -s * 0.36, -s * 0.05 + a * s * 0.2, -s * 0.42); ctx.stroke(); }
  for (const [x, y, r] of [[-0.25, -0.45, 0.025], [0.18, -0.48, 0.02]]) circle(ctx, s * x, s * y, s * r, '#D6ECF8');
  ctx.restore();
}

// --- Додаткові наліпки ---
export const EXTRA = {
  butterfly: (ctx, s) => { for (const sx of [-1, 1]) { ell(ctx, sx * s * 0.2, -s * 0.12, s * 0.2, s * 0.24, sx < 0 ? '#F6B7C9' : '#C9B3E8', sx * 0.4); ell(ctx, sx * s * 0.16, s * 0.18, s * 0.13, s * 0.15, '#FFE3A3', sx * -0.4); } ell(ctx, 0, 0, s * 0.045, s * 0.28, INK); ctx.strokeStyle = INK; ctx.lineWidth = s * 0.015; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -s * 0.26); ctx.quadraticCurveTo(sx * s * 0.1, -s * 0.42, sx * s * 0.14, -s * 0.42); ctx.stroke(); } },
  bee: (ctx, s) => { for (const sx of [-1, 1]) ell(ctx, sx * s * 0.12, -s * 0.22, s * 0.13, s * 0.18, 'rgba(220,240,255,.9)', sx * 0.5); ell(ctx, 0, 0, s * 0.32, s * 0.24, '#FFD966'); ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.32, s * 0.24, 0, 0, 7); ctx.clip(); ctx.fillStyle = INK; for (const x of [-0.08, 0.12]) ctx.fillRect(s * x, -s * 0.3, s * 0.08, s * 0.6); ctx.restore(); eye(ctx, -s * 0.2, -s * 0.03, s * 0.04); cheeks(ctx, s * 0.22, s * 0.08, s * 0.04); },
  fish: (ctx, s) => { ctx.fillStyle = '#F7B98A'; ctx.beginPath(); ctx.moveTo(s * 0.25, 0); ctx.lineTo(s * 0.48, -s * 0.18); ctx.lineTo(s * 0.48, s * 0.18); ctx.closePath(); ctx.fill(); ell(ctx, -s * 0.05, 0, s * 0.33, s * 0.22, '#FBD29E'); eye(ctx, -s * 0.2, -s * 0.04, s * 0.045); cheeks(ctx, s * 0.0, s * 0.08, s * 0.05); },
  mushroom: (ctx, s) => { ell(ctx, 0, s * 0.18, s * 0.13, s * 0.22, '#FFF4E6'); ctx.fillStyle = '#F29AA0'; ctx.beginPath(); ctx.ellipse(0, -s * 0.02, s * 0.4, s * 0.3, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); for (const [x, y, r] of [[-0.2, -0.12, 0.06], [0.05, -0.2, 0.05], [0.22, -0.08, 0.05]]) circle(ctx, s * x, s * y, s * r, '#fff'); },
  rainbow: (ctx, s) => { ['#F2B8B5', '#FBD9C3', '#FFF0C2', '#D9E8D2', '#DCEBF5'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(0, s * 0.15, s * (0.42 - i * 0.07), Math.PI, 0); ctx.stroke(); }); for (const sx of [-1, 1]) { circle(ctx, sx * s * 0.3, s * 0.17, s * 0.1, '#fff'); circle(ctx, sx * s * 0.4, s * 0.19, s * 0.08, '#fff'); } },
  gift: (ctx, s) => { ctx.fillStyle = '#F6B7C0'; ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.42); ctx.fillStyle = '#FBC9CF'; ctx.fillRect(-s * 0.34, -s * 0.2, s * 0.68, s * 0.14); ctx.fillStyle = '#FFE3A3'; ctx.fillRect(-s * 0.05, -s * 0.2, s * 0.1, s * 0.52); for (const sx of [-1, 1]) ell(ctx, sx * s * 0.11, -s * 0.27, s * 0.12, s * 0.07, '#FFE3A3', sx * 0.4); },
  planet: (ctx, s) => { circle(ctx, 0, 0, s * 0.26, '#C9B3E8'); ctx.strokeStyle = '#FFE3A3'; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.12, -0.3, 0, 7); ctx.stroke(); ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * 0.26, Math.PI * 1.15, Math.PI * 1.85); ctx.lineTo(0, 0); ctx.clip(); circle(ctx, 0, 0, s * 0.26, '#C9B3E8'); ctx.restore(); circle(ctx, -s * 0.08, -s * 0.08, s * 0.05, 'rgba(255,255,255,.5)'); },
  rocket: (ctx, s) => { ctx.save(); ctx.rotate(0.6); ctx.fillStyle = '#F7B98A'; ctx.beginPath(); ctx.moveTo(0, s * 0.42); ctx.lineTo(-s * 0.08, s * 0.28); ctx.lineTo(s * 0.08, s * 0.28); ctx.fill(); for (const sx of [-1, 1]) { ctx.fillStyle = '#F29AA0'; ctx.beginPath(); ctx.moveTo(sx * s * 0.12, s * 0.05); ctx.lineTo(sx * s * 0.24, s * 0.3); ctx.lineTo(sx * s * 0.1, s * 0.25); ctx.fill(); } ell(ctx, 0, 0, s * 0.14, s * 0.32, '#FFF8F0'); ctx.fillStyle = '#F29AA0'; ctx.beginPath(); ctx.ellipse(0, -s * 0.16, s * 0.14, s * 0.16, 0, Math.PI, 0); ctx.fill(); circle(ctx, 0, -s * 0.02, s * 0.07, '#A9D3EE'); circle(ctx, -s * 0.02, -s * 0.04, s * 0.025, '#fff'); ctx.restore(); },
  hotair: (ctx, s) => { ctx.strokeStyle = '#B98C7A'; ctx.lineWidth = s * 0.012; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * s * 0.2, s * 0.08); ctx.lineTo(sx * s * 0.08, s * 0.3); ctx.stroke(); } ctx.fillStyle = '#D7A97E'; ctx.fillRect(-s * 0.1, s * 0.3, s * 0.2, s * 0.13); ctx.save(); ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.3, 0, 7); ctx.clip(); ['#F6B7C0', '#FFE3A3', '#C9E4F5', '#F6B7C0', '#FFE3A3'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-s * 0.3 + i * s * 0.12, -s * 0.5, s * 0.12, s * 0.8); }); ctx.restore(); },
  cupcake: (ctx, s) => { ctx.fillStyle = '#F6C8A8'; ctx.beginPath(); ctx.moveTo(-s * 0.24, 0); ctx.lineTo(s * 0.24, 0); ctx.lineTo(s * 0.17, s * 0.35); ctx.lineTo(-s * 0.17, s * 0.35); ctx.fill(); for (const [x, y, r] of [[-0.16, -0.05, 0.12], [0.16, -0.05, 0.12], [0, -0.14, 0.15], [0, -0.28, 0.08]]) circle(ctx, s * x, s * y, s * r, '#FDE1E7'); circle(ctx, 0, -s * 0.38, s * 0.05, '#E58F95'); },
  pacifier: (ctx, s) => { ctx.strokeStyle = '#F2B8B5'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.13, 0, 7); ctx.stroke(); ell(ctx, 0, s * 0.02, s * 0.32, s * 0.12, '#F6C8D0'); ell(ctx, 0, s * 0.2, s * 0.1, s * 0.13, '#FFF0C2'); circle(ctx, 0, s * 0.02, s * 0.05, '#fff'); },
  bottle: (ctx, s) => { ell(ctx, 0, -s * 0.3, s * 0.08, s * 0.1, '#FFE3A3'); ctx.fillStyle = '#F6B7C0'; ctx.fillRect(-s * 0.15, -s * 0.22, s * 0.3, s * 0.08); ctx.fillStyle = 'rgba(220,240,255,.95)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-s * 0.14, -s * 0.14, s * 0.28, s * 0.52, s * 0.08) : ctx.rect(-s * 0.14, -s * 0.14, s * 0.28, s * 0.52); ctx.fill(); ctx.fillStyle = '#FFFDF7'; ctx.fillRect(-s * 0.12, s * 0.08, s * 0.24, s * 0.26); ctx.strokeStyle = '#C9D8E6'; ctx.lineWidth = s * 0.01; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 0.05, -s * 0.05 + i * s * 0.1); ctx.lineTo(s * 0.12, -s * 0.05 + i * s * 0.1); ctx.stroke(); } },
  rattle: (ctx, s) => { ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = '#FFE3A3'; ctx.fillRect(-s * 0.035, -s * 0.05, s * 0.07, s * 0.42); circle(ctx, 0, s * 0.4, s * 0.06, '#F6B7C0'); circle(ctx, 0, -s * 0.2, s * 0.2, '#F6B7C0'); circle(ctx, 0, -s * 0.2, s * 0.13, '#FDE1E7'); circle(ctx, -s * 0.05, -s * 0.25, s * 0.04, '#fff'); ctx.restore(); },
  snowflake: (ctx, s) => { ctx.strokeStyle = '#B9DDF2'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.4); ctx.moveTo(0, -s * 0.25); ctx.lineTo(-s * 0.08, -s * 0.33); ctx.moveTo(0, -s * 0.25); ctx.lineTo(s * 0.08, -s * 0.33); ctx.stroke(); ctx.restore(); } },
  leaf: (ctx, s) => { ctx.save(); ctx.rotate(-0.6); ell(ctx, 0, 0, s * 0.18, s * 0.38, '#F4B183'); ctx.strokeStyle = '#D98E5E'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(0, -s * 0.36); ctx.lineTo(0, s * 0.45); ctx.stroke(); ctx.restore(); },
  balloons: (ctx, s) => { const cols = ['#F6B7C0', '#FFE3A3', '#C9E4F5']; [[-0.15, -0.15], [0.15, -0.18], [0, -0.32]].forEach(([x, y], i) => { ctx.strokeStyle = '#B98C7A'; ctx.lineWidth = s * 0.01; ctx.beginPath(); ctx.moveTo(s * x, s * y + s * 0.15); ctx.lineTo(0, s * 0.42); ctx.stroke(); ell(ctx, s * x, s * y, s * 0.13, s * 0.16, cols[i]); circle(ctx, s * x - s * 0.04, s * y - s * 0.06, s * 0.03, 'rgba(255,255,255,.6)'); }); },
  wand: (ctx, s) => { ctx.save(); ctx.rotate(0.5); ctx.fillStyle = '#E8CFE0'; ctx.fillRect(-s * 0.025, -s * 0.1, s * 0.05, s * 0.5); ctx.restore(); ctx.fillStyle = '#F8D98A'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.08 : s * 0.18, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(-s * 0.08 + Math.cos(a) * r, -s * 0.2 + Math.sin(a) * r); } ctx.fill(); for (const [x, y] of [[0.15, -0.35], [-0.3, -0.05], [0.2, -0.05]]) circle(ctx, s * x, s * y, s * 0.025, '#fff'); },
  stars: (ctx, s) => { for (const [x, y, r] of [[0, 0, 0.2], [0.28, -0.22, 0.1], [-0.27, 0.2, 0.12], [0.25, 0.25, 0.07]]) { ctx.fillStyle = '#F8D98A'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * r * 0.45 : s * r, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(s * x + Math.cos(a) * rr, s * y + Math.sin(a) * rr); } ctx.fill(); } },
  hearts: (ctx, s) => { const h = (x, y, k, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + k * 0.35); ctx.bezierCurveTo(x - k * 0.95, y - k * 0.25, x - k * 0.5, y - k * 0.95, x, y - k * 0.45); ctx.bezierCurveTo(x + k * 0.5, y - k * 0.95, x + k * 0.95, y - k * 0.25, x, y + k * 0.35); ctx.fill(); }; h(0, s * 0.05, s * 0.4, '#F29AA0'); h(s * 0.28, -s * 0.22, s * 0.2, '#F6B7C0'); h(-s * 0.3, -s * 0.15, s * 0.16, '#FBD0D5'); },
  castle: (ctx, s) => { ctx.fillStyle = '#FDE1E7'; ctx.fillRect(-s * 0.3, -s * 0.05, s * 0.6, s * 0.42); for (const x of [-0.36, 0.24]) { ctx.fillStyle = '#FBD0D5'; ctx.fillRect(s * x, -s * 0.2, s * 0.12, s * 0.57); ctx.fillStyle = '#E58F95'; ctx.beginPath(); ctx.moveTo(s * x - s * 0.02, -s * 0.2); ctx.lineTo(s * x + s * 0.06, -s * 0.4); ctx.lineTo(s * x + s * 0.14, -s * 0.2); ctx.fill(); } ctx.fillStyle = '#E58F95'; ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.05); ctx.lineTo(0, -s * 0.3); ctx.lineTo(s * 0.12, -s * 0.05); ctx.fill(); ctx.fillStyle = '#C9A6A0'; ctx.beginPath(); ctx.arc(0, s * 0.28, s * 0.08, Math.PI, 0); ctx.fillRect(-s * 0.08, s * 0.28, s * 0.16, s * 0.09); ctx.fill(); }
};
export const EXTRA_IDS = Object.keys(EXTRA);

// Єдиний вхід для малювання будь-якої наліпки за назвою
export function drawSticker(ctx, name, s) {
  if (ANIMALS[name]) return ANIMALS[name](ctx, s);
  if (EXTRA[name]) return EXTRA[name](ctx, s);
  return false;
}
