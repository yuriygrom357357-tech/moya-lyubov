// Вирізання фону (на пристрої) та ШІ-фотосесія (Gemini, ключ користувача).
let bgMod = null;
const BG_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

export async function downscale(blob, max = 2000, type = 'image/jpeg', q = 0.9) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const out = await new Promise(r => c.toBlob(r, type, q));
  return { blob: out, w: c.width, h: c.height };
}

// Обрізає прозорі краї після вирізання — малюк одразу займає всю рамку шару
export async function trimTransparent(blob) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
  const x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let t = c.height, l = c.width, r = 0, b = 0;
  for (let y = 0; y < c.height; y += 2) for (let xx = 0; xx < c.width; xx += 2) if (d[(y * c.width + xx) * 4 + 3] > 20) { if (y < t) t = y; if (y > b) b = y; if (xx < l) l = xx; if (xx > r) r = xx; }
  if (r <= l || b <= t) return { blob, w: c.width, h: c.height };
  const w = r - l + 1, h = b - t + 1, o = document.createElement('canvas'); o.width = w; o.height = h;
  o.getContext('2d').drawImage(c, l, t, w, h, 0, 0, w, h);
  return { blob: await new Promise(res => o.toBlob(res, 'image/png')), w, h };
}

export async function removeBackground(blob, onProgress) {
  if (!bgMod) bgMod = await import(BG_URL);
  const small = (await downscale(blob, 1400)).blob;
  const out = await bgMod.removeBackground(small, {
    output: { format: 'image/png' },
    progress: (key, cur, total) => onProgress && total && onProgress(Math.round(cur / total * 100))
  });
  return trimTransparent(out);
}

// --- ШІ-фотосесія ---
export const AI_THEMES = {
  studio: 'a classic professional newborn studio photoshoot on a soft cream backdrop, the baby lying on a fluffy white fur blanket, a few dried pampas flowers',
  basket: 'the baby sleeping peacefully in a woven wicker basket with a knitted blush-pink blanket and a tiny knitted bonnet',
  flowers: 'the baby wearing a delicate crown of pastel pink and butter-yellow roses, surrounded by soft flower petals',
  sunflowers: 'the baby lying among warm golden sunflowers in a soft field at sunset, light summer outfit',
  cloud: 'the baby sleeping on a big fluffy white cloud in a soft pastel sky with tiny golden stars',
  moon: 'the baby sleeping curled up on a soft golden crescent moon, dreamy night sky with gentle stars, cozy knitted outfit',
  vyshyvanka: 'the baby wearing a traditional Ukrainian embroidered shirt (vyshyvanka) with red and gold ornament, a small wreath of field flowers, warm rustic linen backdrop',
  christmas: 'a cozy Christmas scene, the baby in a soft knitted festive outfit, warm bokeh fairy lights, pine branches, a small wrapped gift',
  fairy: 'a magical fairy-tale forest clearing with soft glowing light, moss, tiny mushrooms and butterflies, the baby resting on a velvet leaf',
  chef: 'the baby dressed as a tiny chef with a small white chef hat, sitting in a cozy pastel kitchen setting with wooden spoons and flour',
  family: 'a tender, close family portrait: the parent from the second image gently holding and hugging the baby from the first image, soft warm studio light'
};
export const AI_THEME_IDS = Object.keys(AI_THEMES);

const b64 = blob => new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(blob); });

export async function aiPhotoshoot({ key, model, photo, second, theme, aspect = '9:16' }) {
  const p1 = (await downscale(photo, 1280)).blob;
  const parts = [{ text: buildPrompt(theme, !!second) }, { inline_data: { mime_type: 'image/jpeg', data: await b64(p1) } }];
  if (second) parts.push({ inline_data: { mime_type: 'image/jpeg', data: await b64((await downscale(second, 1280)).blob) } });
  const body = { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } } };
  const call = async b => {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(b)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const m = j.error?.message || ('HTTP ' + r.status); const e = new Error(m); e.billing = /limit: 0|free_tier|billing|RESOURCE_EXHAUSTED/i.test(m) || r.status === 429; throw e; }
    return j;
  };
  let j;
  try { j = await call(body); }
  catch (e) { if (/imageConfig|aspect/i.test(e.message)) { delete body.generationConfig.imageConfig; j = await call(body); } else throw e; }
  const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData || p.inline_data);
  if (!part) throw new Error(j.candidates?.[0]?.finishReason || j.promptFeedback?.blockReason || 'no image');
  const d = part.inlineData || part.inline_data;
  return await (await fetch(`data:${d.mimeType || d.mime_type};base64,${d.data}`)).blob();
}

export function buildPrompt(theme, hasSecond) {
  return [
    'Create a high-end professional baby photoshoot image using the attached photo of the baby' + (hasSecond ? ' (first image) and the adult (second image).' : '.'),
    'CRITICAL: keep the baby\'s face, facial features, skin tone, eye shape, hair and expression exactly the same — it must clearly be the same child.' + (hasSecond ? ' Keep the adult\'s face identical too.' : ''),
    'Scene: ' + (AI_THEMES[theme] || AI_THEMES.studio) + '.',
    'Style: soft warm natural light, tender pastel palette of warm pink, peach, cream and warm butter yellow, shallow depth of field, photorealistic, fine detail, gentle and cozy mood.',
    'The baby is safe, comfortable and naturally posed. No text, no letters, no numbers, no watermark, no logo.'
  ].join(' ');
}
