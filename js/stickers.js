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
  if (o.ears === 'round') { const es = o.earScale || 1; for (const sx of [-1, 1]) { circle(ctx, sx * hr * (0.72 + 0.08 * es), hy - hr * (0.66 + 0.08 * es), hr * 0.33 * es, ec); circle(ctx, sx * hr * (0.72 + 0.08 * es), hy - hr * (0.66 + 0.08 * es), hr * 0.18 * es, ei); } }
  if (o.ears === 'side') for (const sx of [-1, 1]) { circle(ctx, sx * hr * 0.98, hy + hr * 0.05, hr * 0.27, ec); circle(ctx, sx * hr * 0.98, hy + hr * 0.05, hr * 0.15, ei); }
  if (o.maneRing) { ctx.fillStyle = o.maneRing; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr = hr * (i % 2 ? 1.3 : 1.45); ctx.lineTo(Math.cos(a) * rr, hy + Math.sin(a) * rr); } ctx.fill(); }
  if (o.ossicones) for (const sx of [-1, 1]) { ctx.strokeStyle = o.color; ctx.lineWidth = hr * 0.12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx * hr * 0.3, hy - hr * 0.7); ctx.lineTo(sx * hr * 0.38, hy - hr * 1.2); ctx.stroke(); circle(ctx, sx * hr * 0.38, hy - hr * 1.22, hr * 0.12, '#B98F73'); }
  if (o.hornsSmall) for (const sx of [-1, 1]) { ctx.fillStyle = '#F4E3C8'; ctx.beginPath(); ctx.moveTo(sx * hr * 0.35, hy - hr * 0.78); ctx.quadraticCurveTo(sx * hr * 0.6, hy - hr * 1.25, sx * hr * 0.72, hy - hr * 1.0); ctx.lineTo(sx * hr * 0.55, hy - hr * 0.7); ctx.fill(); }
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
  if (o.spots) { const r0 = (() => { let q = 7; return () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296); })(); ctx.save(); ctx.beginPath(); ctx.arc(0, hy, hr, 0, 7); ctx.clip(); for (let i = 0; i < 7; i++) { const a = r0() * 6.28, d = 0.45 + r0() * 0.45; ell(ctx, Math.cos(a) * hr * d, hy + Math.sin(a) * hr * d * 0.9 - hr * 0.15, hr * (0.1 + r0() * 0.1), hr * (0.08 + r0() * 0.08), o.spots, r0()); } ctx.restore(); }
  if (o.stripes) { ctx.save(); ctx.beginPath(); ctx.arc(0, hy, hr, 0, 7); ctx.clip(); ctx.strokeStyle = o.stripes; ctx.lineWidth = hr * 0.09; ctx.lineCap = 'round'; for (const [x1, y1, x2, y2] of [[-0.15, -0.95, -0.08, -0.65], [0.15, -0.95, 0.08, -0.65], [0, -1, 0, -0.7], [-1, -0.2, -0.7, -0.12], [-1, 0.05, -0.72, 0.05], [1, -0.2, 0.7, -0.12], [1, 0.05, 0.72, 0.05]]) { ctx.beginPath(); ctx.moveTo(x1 * hr, hy + y1 * hr); ctx.lineTo(x2 * hr, hy + y2 * hr); ctx.stroke(); } ctx.restore(); }
  if (o.mask) { ctx.fillStyle = o.mask; ctx.beginPath(); ctx.ellipse(-hr * 0.38, hy - hr * 0.02, hr * 0.32, hr * 0.2, -0.25, 0, 7); ctx.ellipse(hr * 0.38, hy - hr * 0.02, hr * 0.32, hr * 0.2, 0.25, 0, 7); ctx.fill(); }
  if (o.face) { ctx.fillStyle = o.face; ctx.beginPath(); ctx.ellipse(0, hy + hr * 0.12, hr * 0.78, hr * 0.62, 0, 0, 7); ctx.fill(); }
  if (o.horn) { ctx.fillStyle = '#F8D98A'; ctx.beginPath(); ctx.moveTo(-hr * 0.13, hy - hr * 0.82); ctx.lineTo(0, hy - hr * 1.55); ctx.lineTo(hr * 0.13, hy - hr * 0.82); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.01; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-hr * 0.12 * (1 - k / 4.5), hy - hr * (0.82 + k * 0.17)); ctx.lineTo(hr * 0.12 * (1 - k / 4.5), hy - hr * (0.9 + k * 0.17)); ctx.stroke(); } }
  // обличчя
  eye(ctx, -hr * 0.36, hy - hr * 0.02, hr * 0.12); eye(ctx, hr * 0.36, hy - hr * 0.02, hr * 0.12);
  cheeks(ctx, hr * 0.58, hy + hr * 0.3, hr * 0.13);
  if (o.puffCheeks) for (const sx of [-1, 1]) circle(ctx, sx * hr * 0.55, hy + hr * 0.35, hr * 0.28, o.puffCheeks);
  if (o.nose === 'koala') { ell(ctx, 0, hy + hr * 0.22, hr * 0.17, hr * 0.22, '#5E4F55'); smile(ctx, hy + hr * 0.5, hr * 0.1, s * 0.012); }
  else if (o.nose === 'snout') { ell(ctx, 0, hy + hr * 0.32, hr * 0.26, hr * 0.18, '#F4A6B0'); circle(ctx, -hr * 0.08, hy + hr * 0.32, hr * 0.045, '#C46B7A'); circle(ctx, hr * 0.08, hy + hr * 0.32, hr * 0.045, '#C46B7A'); }
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
  if (o.pengFace) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.15, r * 0.34, r * 0.4, 0.2, 0, 7); ctx.ellipse(r * 0.3, -r * 0.15, r * 0.34, r * 0.4, -0.2, 0, 7); ctx.fill(); }
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
  whale: (c, s) => whale(c, s),
  // нові звірятка
  koala: (c, s) => critter(c, s, { color: '#C7C9D3', ears: 'round', earScale: 1.35, earInner: '#F2E6EE', nose: 'koala', belly: '#ECECF2' }),
  monkey: (c, s) => critter(c, s, { color: '#B98F73', ears: 'side', earInner: '#F6D9C4', face: '#F6D9C4', tail: 'long', belly: '#F6D9C4' }),
  lion: (c, s) => critter(c, s, { color: '#F8D48F', maneRing: '#E9A866', ears: 'round', earInner: '#F6E0B8', muzzle: '#FFF3DC', tail: 'long', belly: '#FFF3DC' }),
  tiger: (c, s) => critter(c, s, { color: '#F7B77A', ears: 'round', earInner: '#FFF1E0', stripes: '#7A5446', muzzle: '#FFF6EE', belly: '#FFF6EE', tail: 'long' }),
  giraffe: (c, s) => critter(c, s, { color: '#F8DC93', ossicones: true, ears: 'side', earInner: '#F6C9A6', spots: '#E3A86E', muzzle: '#F6E3BC', belly: '#FFF3D6' }),
  raccoon: (c, s) => critter(c, s, { color: '#BFB8C2', ears: 'cat', earInner: '#E7DCE6', mask: '#6F6470', muzzle: '#FFFFFF', tail: 'fluff', tailColor: '#8F8592', belly: '#E9E4EC' }),
  penguin: (c, s) => birdy(c, s, { color: '#6D7A99', wing: '#5B6785', belly: '#FFFFFF', beak: '#F6B25E', pengFace: true }),
  deer: (c, s) => critter(c, s, { color: '#D9A47E', ears: 'cat', earInner: '#F6D9C4', spots: '#FFF1E0', muzzle: '#FBE7D6', belly: '#FBE7D6', tail: 'fluff', tailColor: '#FFF1E0' }),
  mouse: (c, s) => critter(c, s, { color: '#D7D2DC', ears: 'round', earScale: 1.55, earInner: '#F7C4D0', nose: '#F29AA8', tail: 'long', belly: '#F1EEF4' }),
  hamster: (c, s) => critter(c, s, { color: '#F6C79B', ears: 'round', earScale: 0.7, earInner: '#F7C4C4', puffCheeks: '#FFF3E6', belly: '#FFF3E6' }),
  cow: (c, s) => critter(c, s, { color: '#FFFFFF', ears: 'side', earColor: '#FFFFFF', earInner: '#F7C4C4', hornsSmall: true, spots: '#6F6470', nose: 'snout', belly: '#FFFFFF', tail: 'long' }),
  sloth: (c, s) => critter(c, s, { color: '#C9AE95', ears: 'none', face: '#F3E2D0', mask: '#8C6A5E', belly: '#E7D3BE' }),
  squirrel: (c, s) => critter(c, s, { color: '#E9A06E', ears: 'cat', earInner: '#FBD3B4', tail: 'fox', muzzle: '#FFF1E4', belly: '#FFF1E4' }),
  polarbear: (c, s) => critter(c, s, { color: '#FFFFFF', ears: 'round', earInner: '#EFE7EC', muzzle: '#F6F1F4', belly: '#F6F1F4' }),
  dino: (c, s) => dino(c, s),
  turtle: (c, s) => turtle(c, s),
  octopus: (c, s) => octopus(c, s),
  seal: (c, s) => seal(c, s),
  // кольорові варіанти
  kitten_grey: (c, s) => critter(c, s, { color: '#C9C6D1', ears: 'cat', tail: 'long', muzzle: '#F4F2F7', belly: '#F4F2F7' }),
  kitten_ginger: (c, s) => critter(c, s, { color: '#F6B77E', ears: 'cat', tail: 'long', stripes: '#E39A5E', muzzle: '#FFF3E6', belly: '#FFF3E6' }),
  kitten_black: (c, s) => critter(c, s, { color: '#6F6470', ears: 'cat', earInner: '#E8A9B6', tail: 'long', muzzle: '#8C8290', belly: '#8C8290', nose: '#F29AA8' }),
  puppy_dalmatian: (c, s) => critter(c, s, { color: '#FFFFFF', ears: 'floppy', earColor: '#6F6470', spots: '#6F6470', tail: 'fluff', muzzle: '#FFFFFF' }),
  puppy_choco: (c, s) => critter(c, s, { color: '#B98F73', ears: 'floppy', earColor: '#8C6A5E', tail: 'fluff', muzzle: '#E9CDB8' }),
  bunny_brown: (c, s) => critter(c, s, { color: '#D9B596', ears: 'bunny', earInner: '#F6D3C8', tail: 'fluff', tailColor: '#FFFFFF', belly: '#F6E7DA', nose: '#F29AA8' }),
  bunny_pink: (c, s) => critter(c, s, { color: '#FBD9E2', ears: 'bunny', earInner: '#F6B7C9', tail: 'fluff', tailColor: '#FFFFFF', belly: '#FFF0F4', nose: '#F29AA8' }),
  bear_honey: (c, s) => critter(c, s, { color: '#F2C987', ears: 'round', earInner: '#FBE3B8', muzzle: '#FFF1D6', belly: '#FFF1D6' }),
  bear_pink: (c, s) => critter(c, s, { color: '#F6C2CC', ears: 'round', earInner: '#FDE1E7', muzzle: '#FFF0F3', belly: '#FFF0F3' }),
  bear_blue: (c, s) => critter(c, s, { color: '#BCD8EE', ears: 'round', earInner: '#E3F0FA', muzzle: '#F2F8FD', belly: '#F2F8FD' }),
  unicorn_pink: (c, s) => critter(c, s, { color: '#FBDCE6', ears: 'cat', earInner: '#F6B7C9', horn: true, mane: true, tail: 'fluff', tailColor: '#C9E4F5', belly: '#FFF2F6' }),
  chick_blue: (c, s) => birdy(c, s, { color: '#CFE7F7', wing: '#B5DAF2', tuft: true }),
  chick_pink: (c, s) => birdy(c, s, { color: '#FBD9E2', wing: '#F6C2D0', tuft: true }),
  owl_brown: (c, s) => birdy(c, s, { color: '#D6B79C', wing: '#C49F80', owl: true, belly: 'rgba(255,246,238,.8)' }),
  fox_arctic: (c, s) => critter(c, s, { color: '#F4F6FA', ears: 'fox', earInner: '#E3E9F2', patches: 'fox', tail: 'fox', paw: '#C9CEDF' }),
  panda_red: (c, s) => critter(c, s, { color: '#E9906A', ears: 'round', earColor: '#E9906A', earInner: '#FFF1E4', face: '#F6C5A6', mask: '#FFFFFF', paw: '#7A5446', belly: '#B9705A', tail: 'fox' }),
  elephant_pink: (c, s) => critter(c, s, { color: '#F6CAD6', ears: 'elephant', earInner: '#FBE3EA', nose: 'trunk', belly: '#FBE3EA' }),
  lamb_black: (c, s) => critter(c, s, { color: '#F6F0EA', ears: 'lamb', face: '#8C8290', belly: '#FFFFFF', paw: '#6F6470' }),
  frog_pink: (c, s) => frog(c, s, '#F9CFD8'),
};
export const ANIMAL_IDS = Object.keys(ANIMALS);

function dino(ctx, s) {
  const g = '#B9E2B0'; ctx.save(); soft(ctx, s);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.35); ctx.quadraticCurveTo(s * 0.55, s * 0.4, s * 0.5, s * 0.15); ctx.quadraticCurveTo(s * 0.4, s * 0.3, s * 0.15, s * 0.2); ctx.fill();
  ell(ctx, 0, s * 0.22, s * 0.28, s * 0.24, g);
  ctx.fillStyle = '#F6B7C0'; for (let i = 0; i < 5; i++) { const a = Math.PI * (1.15 + i * 0.17); const x = Math.cos(a) * s * 0.36, y = -s * 0.12 + Math.sin(a) * s * 0.36; ctx.beginPath(); ctx.moveTo(x - s * 0.05, y + s * 0.03); ctx.lineTo(x + Math.cos(a) * s * 0.08, y + Math.sin(a) * s * 0.08); ctx.lineTo(x + s * 0.05, y + s * 0.03); ctx.fill(); }
  circle(ctx, 0, -s * 0.12, s * 0.33, g); noShadow(ctx);
  ell(ctx, 0, s * 0.27, s * 0.17, s * 0.15, '#E3F3DE');
  eye(ctx, -s * 0.12, -s * 0.14, s * 0.045); eye(ctx, s * 0.12, -s * 0.14, s * 0.045); cheeks(ctx, s * 0.2, -s * 0.02, s * 0.045); smile(ctx, -s * 0.01, s * 0.05, s * 0.012);
  for (const sx of [-1, 1]) ell(ctx, sx * s * 0.13, s * 0.45, s * 0.09, s * 0.055, '#A6D69A'); ctx.restore();
}
function turtle(ctx, s) {
  ctx.save(); soft(ctx, s);
  for (const [x, y] of [[-0.28, 0.3], [0.28, 0.3], [-0.22, 0.05], [0.22, 0.05]]) ell(ctx, s * x, s * y, s * 0.09, s * 0.06, '#BFE3B4');
  circle(ctx, -s * 0.42, s * 0.12, s * 0.14, '#BFE3B4');
  ctx.fillStyle = '#D9B98A'; ctx.beginPath(); ctx.ellipse(0, s * 0.15, s * 0.34, s * 0.25, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#C9A06E'; for (const [x, y, r] of [[0, 0.02, 0.09], [-0.17, 0.08, 0.06], [0.17, 0.08, 0.06]]) { ctx.beginPath(); ctx.arc(s * x, s * y, s * r, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#F4E3C8'; ctx.fillRect(-s * 0.34, s * 0.14, s * 0.68, s * 0.04);
  eye(ctx, -s * 0.46, s * 0.09, s * 0.03); cheeks(ctx, s * 0.4 - s * 0.8, s * 0.16, s * 0.03); ctx.restore();
}
function octopus(ctx, s) {
  const c = '#E8B9E0'; ctx.save(); soft(ctx, s);
  ctx.strokeStyle = c; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const x = -s * 0.25 + i * s * 0.1; ctx.beginPath(); ctx.moveTo(x, s * 0.1); ctx.quadraticCurveTo(x + (i % 2 ? s * 0.08 : -s * 0.08), s * 0.3, x + (i - 2.5) * s * 0.04, s * 0.42); ctx.stroke(); }
  ell(ctx, 0, -s * 0.05, s * 0.32, s * 0.3, c); noShadow(ctx);
  eye(ctx, -s * 0.11, -s * 0.03, s * 0.045); eye(ctx, s * 0.11, -s * 0.03, s * 0.045); cheeks(ctx, s * 0.2, s * 0.06, s * 0.045); smile(ctx, s * 0.06, s * 0.05, s * 0.012);
  for (const [x, y, r] of [[-0.12, -0.22, 0.03], [0.1, -0.25, 0.025], [0.2, -0.15, 0.02]]) circle(ctx, s * x, s * y, s * r, 'rgba(255,255,255,.6)'); ctx.restore();
}
function seal(ctx, s) {
  const c = '#C9D3DF'; ctx.save(); soft(ctx, s);
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.25); ctx.lineTo(s * 0.5, s * 0.15); ctx.lineTo(s * 0.48, s * 0.38); ctx.fill();
  ell(ctx, 0, s * 0.22, s * 0.36, s * 0.2, c); circle(ctx, -s * 0.15, -s * 0.02, s * 0.25, c); noShadow(ctx);
  ell(ctx, -s * 0.15, s * 0.06, s * 0.13, s * 0.09, '#EEF2F7');
  eye(ctx, -s * 0.24, -s * 0.06, s * 0.04); eye(ctx, -s * 0.06, -s * 0.06, s * 0.04); circle(ctx, -s * 0.15, s * 0.03, s * 0.025, '#5E4F55');
  cheeks(ctx, s * 0.12 - s * 0.15 + 0.0001, s * 0.06, s * 0.03);
  ctx.strokeStyle = 'rgba(94,79,85,.4)'; ctx.lineWidth = s * 0.006; for (const sx of [-1, 1]) for (const k of [0, 1]) { ctx.beginPath(); ctx.moveTo(-s * 0.15 + sx * s * 0.06, s * 0.05 + k * s * 0.02); ctx.lineTo(-s * 0.15 + sx * s * 0.17, s * 0.03 + k * s * 0.03); ctx.stroke(); }
  ell(ctx, s * 0.05, s * 0.36, s * 0.08, s * 0.04, '#B3C0CF'); ctx.restore();
}

// Кубики з буквами (для імені дитини)
const BLOCK_COLS = ['#F6B7C0', '#FFE3A3', '#C9E4F5', '#CDEBD3', '#D9C9F2', '#FBD9C3'];
export function drawBlock(ctx, s, ch, i = 0) {
  const c = BLOCK_COLS[i % BLOCK_COLS.length], d = s * 0.12, w = s * 0.62;
  ctx.save(); soft(ctx, s);
  ctx.fillStyle = shadeHex(c, -22); ctx.beginPath(); ctx.moveTo(-w / 2, -w / 2); ctx.lineTo(-w / 2 + d, -w / 2 - d); ctx.lineTo(w / 2 + d, -w / 2 - d); ctx.lineTo(w / 2 + d, w / 2 - d); ctx.lineTo(w / 2, w / 2); ctx.lineTo(-w / 2, w / 2); ctx.closePath(); ctx.fill();
  noShadow(ctx);
  ctx.fillStyle = shadeHex(c, 18); ctx.beginPath(); ctx.moveTo(-w / 2, -w / 2); ctx.lineTo(-w / 2 + d, -w / 2 - d); ctx.lineTo(w / 2 + d, -w / 2 - d); ctx.lineTo(w / 2, -w / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -w / 2, w, w, w * 0.1) : ctx.rect(-w / 2, -w / 2, w, w); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = s * 0.018; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2 + s * 0.04, -w / 2 + s * 0.04, w - s * 0.08, w - s * 0.08, w * 0.08) : ctx.rect(-w / 2 + s * 0.04, -w / 2 + s * 0.04, w - s * 0.08, w - s * 0.08); ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; ctx.font = `700 ${s * 0.42}px "Comfortaa", "Hiragino Maru Gothic ProN", "PingFang SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = s * 0.03; ctx.strokeStyle = shadeHex(c, -45); ctx.strokeText(ch, 0, s * 0.02); ctx.fillText(ch, 0, s * 0.02);
  ctx.restore();
}
function shadeHex(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, v + amt)); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; }

function frog(ctx, s, col) {
  const g = col || '#BFE3B4', hr = s * 0.36, hy = -s * 0.05;
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

Object.assign(EXTRA, {
  sun: (c, s) => { c.save(); c.strokeStyle = '#F8D98A'; c.lineWidth = s * 0.05; c.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3); c.lineTo(Math.cos(a) * s * 0.44, Math.sin(a) * s * 0.44); c.stroke(); } c.restore(); circle(c, 0, 0, s * 0.25, '#FFE38A'); eye(c, -s * 0.08, -s * 0.03, s * 0.03); eye(c, s * 0.08, -s * 0.03, s * 0.03); cheeks(c, s * 0.14, s * 0.06, s * 0.035); smile(c, s * 0.06, s * 0.05, s * 0.012); },
  umbrella: (c, s) => { c.strokeStyle = '#B98C7A'; c.lineWidth = s * 0.025; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -s * 0.1); c.lineTo(0, s * 0.32); c.arc(-s * 0.06, s * 0.32, s * 0.06, 0, Math.PI); c.stroke(); ['#F6B7C0', '#FFE3A3', '#C9E4F5', '#F6B7C0'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, -s * 0.38); c.arc(0, -s * 0.05, s * 0.36, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); c.closePath(); c.fill(); }); },
  kite: (c, s) => { c.fillStyle = '#F6B7C0'; c.beginPath(); c.moveTo(0, -s * 0.38); c.lineTo(s * 0.24, -s * 0.05); c.lineTo(0, s * 0.18); c.lineTo(-s * 0.24, -s * 0.05); c.closePath(); c.fill(); c.fillStyle = '#FFE3A3'; c.beginPath(); c.moveTo(0, -s * 0.38); c.lineTo(s * 0.24, -s * 0.05); c.lineTo(0, -s * 0.05); c.fill(); c.strokeStyle = '#B98C7A'; c.lineWidth = s * 0.01; c.beginPath(); c.moveTo(0, s * 0.18); c.bezierCurveTo(s * 0.1, s * 0.28, -s * 0.1, s * 0.36, s * 0.05, s * 0.46); c.stroke(); for (const [x, y] of [[0.04, 0.28], [-0.02, 0.37]]) ell(c, s * x, s * y, s * 0.04, s * 0.02, '#C9E4F5', 0.5); },
  duck_toy: (c, s) => { ell(c, -s * 0.02, s * 0.15, s * 0.36, s * 0.22, '#FFE38A'); circle(c, s * 0.12, -s * 0.12, s * 0.18, '#FFE38A'); ell(c, s * 0.3, -s * 0.08, s * 0.1, s * 0.05, '#F7A35C'); eye(c, s * 0.14, -s * 0.16, s * 0.035); cheeks(c, s * 0.0 + 0.001, -s * 0.04, s * 0.03); ell(c, -s * 0.1, s * 0.1, s * 0.15, s * 0.08, '#FFD966', -0.3); },
  ball: (c, s) => { circle(c, 0, 0, s * 0.32, '#FFFFFF'); c.save(); c.beginPath(); c.arc(0, 0, s * 0.32, 0, 7); c.clip(); ['#F6B7C0', '#FFE3A3', '#C9E4F5'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s * 0.4, i * 2.1 - 0.4, i * 2.1 + 0.6); c.fill(); }); c.restore(); circle(c, -s * 0.1, -s * 0.12, s * 0.06, 'rgba(255,255,255,.7)'); },
  stroller: (c, s) => { c.fillStyle = '#F6B7C0'; c.beginPath(); c.moveTo(-s * 0.32, -s * 0.05); c.lineTo(s * 0.25, -s * 0.05); c.quadraticCurveTo(s * 0.25, s * 0.22, 0, s * 0.22); c.lineTo(-s * 0.2, s * 0.22); c.quadraticCurveTo(-s * 0.32, s * 0.2, -s * 0.32, -s * 0.05); c.fill(); c.fillStyle = '#FBD0D5'; c.beginPath(); c.moveTo(-s * 0.32, -s * 0.05); c.arc(-s * 0.05, -s * 0.05, s * 0.27, Math.PI, Math.PI * 1.55); c.lineTo(-s * 0.05, -s * 0.05); c.fill(); c.strokeStyle = '#B98C7A'; c.lineWidth = s * 0.02; c.beginPath(); c.moveTo(s * 0.25, -s * 0.02); c.lineTo(s * 0.4, -s * 0.25); c.stroke(); for (const x of [-0.18, 0.12]) { circle(c, s * x, s * 0.33, s * 0.08, '#8C7A7A'); circle(c, s * x, s * 0.33, s * 0.035, '#E6DCDC'); } },
  onesie: (c, s) => { c.fillStyle = '#C9E4F5'; c.beginPath(); c.moveTo(-s * 0.12, -s * 0.36); c.quadraticCurveTo(0, -s * 0.26, s * 0.12, -s * 0.36); c.lineTo(s * 0.36, -s * 0.24); c.lineTo(s * 0.28, -s * 0.08); c.lineTo(s * 0.2, -s * 0.12); c.lineTo(s * 0.2, s * 0.18); c.quadraticCurveTo(s * 0.22, s * 0.38, s * 0.06, s * 0.38); c.lineTo(-s * 0.06, s * 0.38); c.quadraticCurveTo(-s * 0.22, s * 0.38, -s * 0.2, s * 0.18); c.lineTo(-s * 0.2, -s * 0.12); c.lineTo(-s * 0.28, -s * 0.08); c.lineTo(-s * 0.36, -s * 0.24); c.closePath(); c.fill(); c.fillStyle = '#F29AA0'; c.beginPath(); c.moveTo(0, s * 0.08); c.bezierCurveTo(-s * 0.12, -s * 0.02, -s * 0.06, -s * 0.12, 0, -s * 0.05); c.bezierCurveTo(s * 0.06, -s * 0.12, s * 0.12, -s * 0.02, 0, s * 0.08); c.fill(); },
  socks: (c, s) => { for (const [dx, col] of [[-0.13, '#F6B7C0'], [0.13, '#FFE3A3']]) { c.save(); c.translate(s * dx, 0); c.fillStyle = col; c.beginPath(); c.moveTo(-s * 0.08, -s * 0.3); c.lineTo(s * 0.08, -s * 0.3); c.lineTo(s * 0.08, s * 0.12); c.quadraticCurveTo(s * 0.08, s * 0.3, -s * 0.08, s * 0.3); c.quadraticCurveTo(-s * 0.2, s * 0.3, -s * 0.18, s * 0.2); c.quadraticCurveTo(-s * 0.08, s * 0.16, -s * 0.08, s * 0.08); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-s * 0.08, -s * 0.3, s * 0.16, s * 0.06); c.restore(); } },
  footprints: (c, s) => { for (const [dx, dy, rot] of [[-0.12, 0.08, -0.15], [0.12, -0.12, 0.15]]) { c.save(); c.translate(s * dx, s * dy); c.rotate(rot); ell(c, 0, 0, s * 0.08, s * 0.14, '#F29AA0'); for (let k = 0; k < 5; k++) circle(c, -s * 0.06 + k * s * 0.03, -s * 0.17 - Math.sin(k / 4 * Math.PI) * s * 0.02, s * (0.025 - k * 0.002), '#F29AA0'); c.restore(); } },
  bonnet: (c, s) => { c.fillStyle = '#FBD9E2'; c.beginPath(); c.arc(0, s * 0.05, s * 0.32, Math.PI, 0); c.closePath(); c.fill(); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 9; i++) circle(c, -s * 0.32 + i * s * 0.08, s * 0.06, s * 0.04, '#FFFFFF'); c.strokeStyle = '#F6B7C0'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(-s * 0.28, s * 0.08); c.quadraticCurveTo(-s * 0.3, s * 0.3, -s * 0.18, s * 0.38); c.moveTo(s * 0.28, s * 0.08); c.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.18, s * 0.38); c.stroke(); },
  bouquet: (c, s) => { c.fillStyle = '#CDEBD3'; c.beginPath(); c.moveTo(-s * 0.15, s * 0.05); c.lineTo(s * 0.15, s * 0.05); c.lineTo(s * 0.04, s * 0.42); c.lineTo(-s * 0.04, s * 0.42); c.fill(); for (const [x, y, col] of [[-0.14, -0.08, '#F6B7C0'], [0.14, -0.08, '#FFE3A3'], [0, -0.2, '#F29AA0'], [0, 0.0, '#D9C9F2']]) { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; circle(c, s * x + Math.cos(a) * s * 0.06, s * y + Math.sin(a) * s * 0.06, s * 0.05, col); } circle(c, s * x, s * y, s * 0.04, '#FFF4D0'); } ell(c, 0, s * 0.12, s * 0.07, s * 0.04, '#F6B7C0'); },
  tulip: (c, s) => { c.strokeStyle = '#9FD3A8'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(0, -s * 0.05); c.lineTo(0, s * 0.4); c.stroke(); ell(c, s * 0.1, s * 0.2, s * 0.06, s * 0.15, '#B7E0B0', 0.5); c.fillStyle = '#F6B7C0'; c.beginPath(); c.moveTo(-s * 0.15, -s * 0.3); c.lineTo(-s * 0.07, -s * 0.18); c.lineTo(0, -s * 0.32); c.lineTo(s * 0.07, -s * 0.18); c.lineTo(s * 0.15, -s * 0.3); c.quadraticCurveTo(s * 0.17, -s * 0.02, 0, -s * 0.02); c.quadraticCurveTo(-s * 0.17, -s * 0.02, -s * 0.15, -s * 0.3); c.fill(); },
  daisy: (c, s) => { for (let k = 0; k < 12; k++) { c.save(); c.rotate(k * Math.PI / 6); ell(c, 0, -s * 0.2, s * 0.06, s * 0.15, '#FFFFFF'); c.restore(); } circle(c, 0, 0, s * 0.1, '#FFD966'); },
  clover: (c, s) => { c.strokeStyle = '#9FD3A8'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.05, s * 0.25, s * 0.15, s * 0.4); c.stroke(); for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2 + Math.PI / 4); c.fillStyle = '#B7E0B0'; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s * 0.2, -s * 0.12, -s * 0.12, -s * 0.3, 0, -s * 0.18); c.bezierCurveTo(s * 0.12, -s * 0.3, s * 0.2, -s * 0.12, 0, 0); c.fill(); c.restore(); } },
  strawberry: (c, s) => { c.fillStyle = '#F29AA0'; c.beginPath(); c.moveTo(-s * 0.25, -s * 0.12); c.quadraticCurveTo(0, -s * 0.22, s * 0.25, -s * 0.12); c.quadraticCurveTo(s * 0.25, s * 0.2, 0, s * 0.36); c.quadraticCurveTo(-s * 0.25, s * 0.2, -s * 0.25, -s * 0.12); c.fill(); for (const [x, y] of [[-0.1, 0], [0.1, 0], [0, 0.1], [-0.05, 0.2], [0.07, 0.2], [0, -0.05]]) ell(c, s * x, s * y, s * 0.015, s * 0.025, '#FFF4D0'); c.fillStyle = '#9FD3A8'; for (let k = 0; k < 5; k++) { c.save(); c.translate(0, -s * 0.15); c.rotate(-0.9 + k * 0.45); ell(c, 0, -s * 0.07, s * 0.035, s * 0.08, '#9FD3A8'); c.restore(); } },
  cherry: (c, s) => { c.strokeStyle = '#9FD3A8'; c.lineWidth = s * 0.025; c.beginPath(); c.moveTo(-s * 0.13, s * 0.12); c.quadraticCurveTo(-s * 0.05, -s * 0.2, s * 0.05, -s * 0.32); c.moveTo(s * 0.15, s * 0.1); c.quadraticCurveTo(s * 0.1, -s * 0.15, s * 0.05, -s * 0.32); c.stroke(); ell(c, s * 0.12, -s * 0.3, s * 0.1, s * 0.05, '#B7E0B0', 0.4); circle(c, -s * 0.14, s * 0.2, s * 0.13, '#F29AA0'); circle(c, s * 0.16, s * 0.18, s * 0.13, '#F6B7C0'); circle(c, -s * 0.18, s * 0.15, s * 0.03, 'rgba(255,255,255,.7)'); },
  icecream: (c, s) => { c.fillStyle = '#F6C8A8'; c.beginPath(); c.moveTo(-s * 0.16, 0); c.lineTo(s * 0.16, 0); c.lineTo(0, s * 0.42); c.closePath(); c.fill(); c.strokeStyle = 'rgba(200,150,110,.5)'; c.lineWidth = s * 0.01; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-s * 0.16 + k * s * 0.06, 0); c.lineTo(-s * 0.05 + k * s * 0.03, s * 0.3); c.stroke(); } circle(c, -s * 0.08, -s * 0.06, s * 0.13, '#FDE1E7'); circle(c, s * 0.08, -s * 0.06, s * 0.13, '#CDEBD3'); circle(c, 0, -s * 0.2, s * 0.13, '#FFE3A3'); circle(c, 0, -s * 0.34, s * 0.04, '#E58F95'); },
  lollipop: (c, s) => { c.fillStyle = '#FFFFFF'; c.fillRect(-s * 0.02, 0, s * 0.04, s * 0.42); circle(c, 0, -s * 0.12, s * 0.24, '#F6B7C0'); c.strokeStyle = '#FFFFFF'; c.lineWidth = s * 0.04; c.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = a * s * 0.017; c.lineTo(Math.cos(a) * r, -s * 0.12 + Math.sin(a) * r); } c.stroke(); },
  donut: (c, s) => { circle(c, 0, 0, s * 0.32, '#F6C8A8'); c.fillStyle = '#F6B7C0'; c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = s * (0.27 + (i % 2) * 0.02); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); circle(c, 0, 0, s * 0.1, 'rgba(0,0,0,0)'); c.save(); c.globalCompositeOperation = 'source-over'; const cols = ['#FFFFFF', '#FFE3A3', '#C9E4F5', '#CDEBD3']; for (let i = 0; i < 14; i++) { const a = i * 0.45, r = s * (0.16 + (i % 3) * 0.035); c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r); c.rotate(a * 2); c.fillStyle = cols[i % 4]; c.fillRect(-s * 0.02, -s * 0.006, s * 0.04, s * 0.012); c.restore(); } c.restore(); circle(c, 0, 0, s * 0.1, '#FFF8F0'); },
  macaron: (c, s) => { ell(c, 0, -s * 0.1, s * 0.3, s * 0.13, '#D9C9F2'); c.fillStyle = '#FFF8F0'; c.fillRect(-s * 0.28, -s * 0.04, s * 0.56, s * 0.08); ell(c, 0, s * 0.1, s * 0.3, s * 0.13, '#D9C9F2'); ell(c, -s * 0.1, -s * 0.15, s * 0.08, s * 0.03, 'rgba(255,255,255,.5)'); },
  notes: (c, s) => { c.fillStyle = '#E58F95'; c.strokeStyle = '#E58F95'; c.lineWidth = s * 0.03; for (const [x, y] of [[-0.18, 0.2], [0.14, 0.1]]) { ell(c, s * x, s * y, s * 0.08, s * 0.06, '#E58F95', -0.4); c.beginPath(); c.moveTo(s * x + s * 0.07, s * y); c.lineTo(s * x + s * 0.07, s * y - s * 0.38); c.stroke(); } c.beginPath(); c.moveTo(-s * 0.04, -s * 0.18); c.lineTo(s * 0.21, -s * 0.28); c.lineTo(s * 0.21, -s * 0.2); c.lineTo(-s * 0.04, -s * 0.1); c.fill(); },
  letter: (c, s) => { c.fillStyle = '#FFF8F0'; c.fillRect(-s * 0.34, -s * 0.22, s * 0.68, s * 0.44); c.strokeStyle = '#F2B8B5'; c.lineWidth = s * 0.02; c.strokeRect(-s * 0.34, -s * 0.22, s * 0.68, s * 0.44); c.beginPath(); c.moveTo(-s * 0.34, -s * 0.22); c.lineTo(0, s * 0.05); c.lineTo(s * 0.34, -s * 0.22); c.stroke(); c.fillStyle = '#E58F95'; c.beginPath(); c.moveTo(0, s * 0.1); c.bezierCurveTo(-s * 0.1, 0, -s * 0.05, -s * 0.08, 0, -s * 0.02); c.bezierCurveTo(s * 0.05, -s * 0.08, s * 0.1, 0, 0, s * 0.1); c.fill(); },
  moonstar: (c, s) => { c.fillStyle = '#FFE9A8'; c.beginPath(); c.arc(0, 0, s * 0.3, Math.PI * 0.32, Math.PI * 1.68); c.arc(s * 0.13, -s * 0.02, s * 0.25, Math.PI * 1.52, Math.PI * 0.48, true); c.fill(); c.fillStyle = '#F8D98A'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.04 : s * 0.1, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(s * 0.2 + Math.cos(a) * r, -s * 0.18 + Math.sin(a) * r); } c.fill(); },
  crib_mobile: (c, s) => { c.strokeStyle = '#B98C7A'; c.lineWidth = s * 0.015; c.beginPath(); c.moveTo(0, -s * 0.42); c.lineTo(0, -s * 0.3); c.moveTo(-s * 0.32, -s * 0.22); c.quadraticCurveTo(0, -s * 0.36, s * 0.32, -s * 0.22); c.stroke(); [[-0.3, '#FFE38A', 'star'], [0, '#F6B7C0', 'heart'], [0.3, '#C9E4F5', 'moon']].forEach(([x, col, k]) => { c.beginPath(); c.moveTo(s * x, -s * 0.24); c.lineTo(s * x, s * 0.05); c.stroke(); c.fillStyle = col; if (k === 'heart') { c.beginPath(); c.moveTo(s * x, s * 0.22); c.bezierCurveTo(s * x - s * 0.12, s * 0.12, s * x - s * 0.07, s * 0.02, s * x, s * 0.08); c.bezierCurveTo(s * x + s * 0.07, s * 0.02, s * x + s * 0.12, s * 0.12, s * x, s * 0.22); c.fill(); } else circle(c, s * x, s * 0.12, s * 0.07, col); }); },
  rainbow_heart: (c, s) => { ['#F2B8B5', '#FBD9C3', '#FFF0C2', '#D9E8D2', '#DCEBF5', '#E8DDF2'].forEach((col, i) => { const k = s * (0.42 - i * 0.055); c.fillStyle = col; c.beginPath(); c.moveTo(0, k * 0.35 + s * 0.05); c.bezierCurveTo(-k * 0.95, -k * 0.25 + s * 0.05, -k * 0.5, -k * 0.95 + s * 0.05, 0, -k * 0.45 + s * 0.05); c.bezierCurveTo(k * 0.5, -k * 0.95 + s * 0.05, k * 0.95, -k * 0.25 + s * 0.05, 0, k * 0.35 + s * 0.05); c.fill(); }); },
  pearl: (c, s) => { for (let i = 0; i < 13; i++) { const a = Math.PI * (0.1 + i * 0.065); circle(c, Math.cos(a) * s * 0.4, -s * 0.15 + Math.sin(a) * s * 0.4, s * 0.04, '#FFFFFF'); circle(c, Math.cos(a) * s * 0.4 - s * 0.012, -s * 0.15 + Math.sin(a) * s * 0.4 - s * 0.012, s * 0.012, '#F3E9F7'); } },
  crown_pink: (c, s) => { c.fillStyle = '#F6B7C0'; c.beginPath(); c.moveTo(-s * 0.4, s * 0.2); c.lineTo(-s * 0.4, -s * 0.18); c.lineTo(-s * 0.2, s * 0.0); c.lineTo(0, -s * 0.28); c.lineTo(s * 0.2, s * 0.0); c.lineTo(s * 0.4, -s * 0.18); c.lineTo(s * 0.4, s * 0.2); c.closePath(); c.fill(); for (const x of [-0.4, 0, 0.4]) circle(c, s * x, x === 0 ? -s * 0.3 : -s * 0.2, s * 0.05, '#FFE3A3'); for (const x of [-0.2, 0, 0.2]) circle(c, s * x, s * 0.1, s * 0.04, '#C9E4F5'); }
});

export const EXTRA_IDS = Object.keys(EXTRA);

// Єдиний вхід для малювання будь-якої наліпки за назвою
export function drawSticker(ctx, name, s) {
  if (ANIMALS[name]) return ANIMALS[name](ctx, s);
  if (EXTRA[name]) return EXTRA[name](ctx, s);
  return false;
}
