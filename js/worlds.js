// Казкові світи (шаблони в один дотик) і книжка-казка з 4 сторінок.
import { makeDecorLayer, makeTextLayer, newDoc, fitWidth, layerSize } from './editor.js';

// a — наліпка: [назва, x, y, масштаб, поворот°]; координати у частках кадру
export const WORLDS = {
  stars: { scene: 'space', prop: 'moon', effect: 'sparkle', font: 'festive', style: 'glow', color: '#FFFFFF', a: [['rocket', 0.8, 0.27, 1.1, 0], ['planet', 0.18, 0.22, 0.9, 0], ['stars', 0.85, 0.62, 0.8, 0], ['owl', 0.16, 0.63, 0.75, -6]] },
  clouds: { scene: 'clouds', prop: 'cloud', effect: 'none', font: 'festive', style: 'outline', color: '#E07F88', a: [['rainbow', 0.5, 0.25, 1.7, 0], ['bird', 0.18, 0.4, 0.7, -8], ['balloons', 0.84, 0.46, 0.9, 6], ['sparkle', 0.3, 0.15, 0.5, 0]] },
  forest: { scene: 'forest', prop: 'blanket', effect: 'none', font: 'kids', style: 'ribbon', color: '#FFFFFF', a: [['fox', 0.17, 0.74, 0.85, 0], ['bunny', 0.84, 0.76, 0.8, 0], ['owl', 0.82, 0.33, 0.7, 6], ['mushroom', 0.1, 0.9, 0.6, 0], ['butterfly', 0.25, 0.36, 0.5, -15]] },
  sea: { scene: 'underwater', prop: 'none', effect: 'none', font: 'festive', style: 'outline', color: '#5B9FC4', a: [['whale', 0.73, 0.26, 1.2, 0], ['fish', 0.18, 0.4, 0.6, 0], ['fish', 0.86, 0.62, 0.5, 10], ['hearts', 0.2, 0.7, 0.5, 0]] },
  meadow: { scene: 'meadow', prop: 'blanket', effect: 'none', font: 'script', style: 'plate', color: '#6B4E4E', a: [['butterfly', 0.2, 0.32, 0.6, -12], ['bee', 0.82, 0.38, 0.55, 8], ['lamb', 0.16, 0.79, 0.75, 0], ['chick', 0.86, 0.82, 0.6, 0]] },
  winter: { scene: 'winter', prop: 'blanket', effect: 'none', font: 'festive', style: 'outline', color: '#7FA8CC', a: [['snowflake', 0.15, 0.2, 0.6, 0], ['snowflake', 0.85, 0.3, 0.45, 20], ['bear', 0.84, 0.77, 0.8, 0], ['bird', 0.16, 0.5, 0.6, -8]] },
  candy: { scene: 'candy', prop: 'heart', effect: 'sparkle', font: 'festive', style: 'outline', color: '#E07F88', a: [['cupcake', 0.15, 0.82, 0.7, 0], ['unicorn', 0.84, 0.76, 0.85, 0], ['balloons', 0.85, 0.3, 0.9, 6], ['gift', 0.16, 0.36, 0.6, -6]] },
  castle: { scene: 'castle', prop: 'cloud', effect: 'starframe', font: 'festive', style: 'glow', color: '#E07F88', a: [['crown', 0.5, 0.42, 0.5, 0], ['unicorn', 0.16, 0.79, 0.8, 0], ['wand', 0.85, 0.42, 0.7, 0]] },
  balloon: { scene: 'balloons', prop: 'cloud', effect: 'none', font: 'tall', style: 'outline', color: '#E07F88', a: [['hotair', 0.8, 0.22, 1.1, 0], ['hotair', 0.2, 0.36, 0.7, -6], ['bird', 0.6, 0.12, 0.45, 0]] },
  holo: { scene: 'space', prop: 'none', effect: 'holoproj', font: 'display', style: 'glow', color: '#E9FBFF', a: [['stars', 0.18, 0.2, 0.7, 0], ['stars', 0.84, 0.28, 0.6, 20]] }
};
export const WORLD_IDS = Object.keys(WORLDS);

export function applyWorld(doc, id, caption) {
  const w = WORLDS[id]; if (!w) return;
  doc.layers = doc.layers.filter(l => !l.world);
  doc.scene = w.scene; doc.prop = w.prop; doc.sceneColor = null; doc.effect = w.effect;
  const photos = doc.layers.filter(l => l.type === 'photo');
  if (photos.length === 1) { const p = photos[0]; p.x = doc.w / 2; p.y = doc.h * 0.6; }
  for (const [name, x, y, s, r] of w.a) {
    const l = makeDecorLayer(doc, name); Object.assign(l, { x: doc.w * x, y: doc.h * y, s, r: r * Math.PI / 180, world: true });
    doc.layers.push(l);
  }
  if (caption) {
    const hasMile = doc.layers.some(l => l.type === 'milestone' && l.y < doc.h * 0.35);
    const t = makeTextLayer(doc, caption, w.font);
    Object.assign(t, { style: w.style, color: w.color, colorSet: w.style === 'ribbon' ? false : true, size: 96, y: hasMile ? doc.h * 0.8 : doc.h * 0.11, world: true });
    fitWidth(t, doc, 0.88); doc.layers.push(t);
  }
}

// Книжка-казка: 4 сторінки з тим самим фото малюка
export const TALE = [
  { world: 'clouds', baby: [0.5, 0.62, 0.9] },
  { world: 'stars', baby: [0.5, 0.6, 0.85] },
  { world: 'forest', baby: [0.5, 0.63, 0.85] },
  { scene: 'blush', prop: 'heart', effect: 'dream', a: [['hearts', 0.2, 0.25, 0.8, 0], ['hearts', 0.82, 0.33, 0.6, 10], ['bear', 0.16, 0.8, 0.7, 0], ['bunny', 0.86, 0.8, 0.7, 0]], baby: [0.5, 0.62, 0.9] }
];
export function buildTalePages(photoLayer, texts, title) {
  return TALE.map((pg, i) => {
    const doc = newDoc('9:16');
    if (pg.world) applyWorld(doc, pg.world, null);
    else { doc.scene = pg.scene; doc.prop = pg.prop; doc.effect = pg.effect; for (const [n, x, y, s, r] of pg.a) doc.layers.push(Object.assign(makeDecorLayer(doc, n), { x: doc.w * x, y: doc.h * y, s, r: r * Math.PI / 180 })); }
    if (doc.effect === 'holoproj' || doc.effect === 'starframe') doc.effect = 'none';
    const b = JSON.parse(JSON.stringify(photoLayer));
    const [bx, by, k] = pg.baby; const { h } = layerSize(b);
    Object.assign(b, { id: 'tale' + i, x: doc.w * bx, y: doc.h * by, r: 0, s: (doc.h * 0.36 * k) / h });
    if (!b.cut) b.frame = b.frame === 'none' ? 'soft' : b.frame;
    doc.layers.unshift(b);
    const tx = makeTextLayer(doc, wrap(texts[i], 24), 'kids'); Object.assign(tx, { style: 'plate', size: 66, color: '#6B4E4E', y: doc.h * 0.13 });
    fitWidth(tx, doc, 0.9); doc.layers.push(tx);
    const tt = makeTextLayer(doc, `${title} · ${i + 1}/4`, 'script'); Object.assign(tt, { size: 48, color: '#8C5A5A', style: 'outline', y: doc.h * 0.95 });
    fitWidth(tt, doc, 0.8); doc.layers.push(tt);
    return doc;
  });
}

export function wrap(str, max = 24) {
  if (!/\s/.test(str.trim()) && str.length > max / 2) { const n = Math.ceil(max / 2); return str.match(new RegExp('.{1,' + n + '}', 'gu')).join('\n'); }
  const words = String(str).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur); return lines.join('\n');
}
