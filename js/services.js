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
  figurine: 'the baby transformed into an adorable glossy 3D collectible vinyl toy figurine (like a hand-painted plastic designer toy), big head, smooth rounded shapes, soft pastel paint, standing on a small round pastel pedestal, clean studio background with soft lighting — keep the face clearly recognizable',
  clay: 'the baby recreated as a cute handmade clay / plasticine sculpture figurine with visible soft sculpting texture and fingerprints, pastel colors, sitting on a little clay cloud, soft studio light, stop-motion style — keep the face clearly recognizable',
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
  catch (e) { if (/imageConfig|aspect|Unknown name/i.test(e.message)) { delete body.generationConfig.imageConfig; j = await call(body); } else throw e; }
  const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData || p.inline_data);
  if (!part) throw new Error(j.candidates?.[0]?.finishReason || j.promptFeedback?.blockReason || 'no image');
  const d = part.inlineData || part.inline_data;
  return await (await fetch(`data:${d.mimeType || d.mime_type};base64,${d.data}`)).blob();
}

export function buildPrompt(theme, hasSecond, combined = false) {
  const who = !hasSecond ? '.' : combined ? ' (left half of the attached image) and the adult (right half of the attached image).' : ' (first image) and the adult (second image).';
  return [
    'Create a high-end professional baby photoshoot image using the attached photo of the baby' + who,
    'CRITICAL: keep the baby\'s face, facial features, skin tone, eye shape, hair and expression exactly the same — it must clearly be the same child.' + (hasSecond ? ' Keep the adult\'s face identical too.' : ''),
    'Scene: ' + (AI_THEMES[theme] || AI_THEMES.studio).replace('the second image', combined ? 'the right half' : 'the second image').replace('the first image', combined ? 'the left half' : 'the first image') + '.',
    'Style: soft warm natural light, tender pastel palette of warm pink, peach, cream and warm butter yellow, shallow depth of field, photorealistic, fine detail, gentle and cozy mood.',
    'The baby is safe, comfortable and naturally posed. No text, no letters, no numbers, no watermark, no logo.'
  ].join(' ');
}

// --- Безкоштовна автоматична генерація через Puter.js (користувач входить у свій безкоштовний акаунт Puter) ---
let puterP = null;
export function loadPuter() {
  if (window.puter) return Promise.resolve(window.puter);
  return puterP ||= new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = 'https://js.puter.com/v2/'; sc.async = true;
    sc.onload = () => res(window.puter); sc.onerror = () => { puterP = null; rej(new Error('Puter.js')); };
    document.head.appendChild(sc);
  });
}
async function sideBySide(a, b) {
  const [ia, ib] = await Promise.all([createImageBitmap(a), createImageBitmap(b)]);
  const H = 900, wa = Math.round(ia.width * H / ia.height), wb = Math.round(ib.width * H / ib.height);
  const c = document.createElement('canvas'); c.width = wa + wb; c.height = H; const x = c.getContext('2d');
  x.drawImage(ia, 0, 0, wa, H); x.drawImage(ib, wa, 0, wb, H);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
}
async function imgToBlob(img) {
  if (img instanceof Blob) return img;
  const src = img?.src || (typeof img === 'string' ? img : '');
  if (!src) throw new Error('no image');
  if (!img.complete && img.decode) { try { await img.decode(); } catch {} }
  try { const r = await fetch(src); if (r.ok) return await r.blob(); } catch {}
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0); return new Promise(r => c.toBlob(r, 'image/png'));
}
const errText = e => e?.message || e?.error?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
export const PUTER_MODELS = ['google/gemini-2.5-flash-image', 'gemini-2.5-flash-image-preview', 'google/gemini-3.1-flash-lite-image'];
export async function puterPhotoshoot({ photo, second, theme }) {
  const p = await loadPuter();
  const input = second ? await sideBySide(photo, second) : (await downscale(photo, 1024)).blob;
  const data = await b64(input);
  const prompt = buildPrompt(theme, !!second, true);
  let last;
  for (const model of PUTER_MODELS) {
    try {
      const img = await p.ai.txt2img(prompt, { model, input_image: data, input_image_mime_type: 'image/jpeg' });
      return await imgToBlob(img);
    } catch (e) { last = e; const m = errText(e); if (/insufficient|funds|credit|limit|quota|cancel|denied|auth/i.test(m)) break; }
  }
  const err = new Error(errText(last)); err.puter = true; throw err;
}
