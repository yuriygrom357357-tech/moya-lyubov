// «Моя Любов» — ліцензія повної версії.
// Ключ підписаний секретним ключем продавця (Ed25519). У додатку лише ВІДКРИТИЙ ключ:
// перевірити підпис можна, а підробити новий ключ — ні.
import { db } from './db.js';

const PUBLIC_KEY = 'g4z+vV3+SCI8wwxZTEqOT0DKR50zQPG8EZMRQ9kqEuo=';
// Відкликані ключі (якщо ключ «злили» в інтернет — додаємо його номер сюди й оновлюємо сайт).
const REVOKED = [];

// Ціна й посилання на оплату. Коли підключите платіжну систему — вставте сюди посилання.
export const SHOP = {
  uk: { price: '199 ₴', url: 'https://yuriygrom357357-tech.github.io/apps/moya-lyubov.html' },
  other: { price: '199 UAH (~$5)', url: 'https://yuriygrom357357-tech.github.io/apps/moya-lyubov.html' },
  contact: 'm-music@ukr.net'
};

const b64d = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };

export function parseKey(raw) {
  if (!raw) return null;
  const key = String(raw).trim().replace(/\s+/g, '');
  const m = key.match(/^ML1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
  if (!m || !window.nacl) return null;
  try {
    const msg = b64d(m[1]), sig = b64d(m[2]);
    if (sig.length !== 64) return null;
    if (!window.nacl.sign.detached.verify(msg, sig, b64d(PUBLIC_KEY))) return null;
    const [id, name, date] = new TextDecoder().decode(msg).split('|');
    if (!id || REVOKED.includes(id)) return null;
    return { id, name: name || '', date: date || '', key };
  } catch { return null; }
}

let state = null;
export async function loadLicense() { state = parseKey(await db.setting('license')); return state; }
export function isPro() { return !!state; }
export function license() { return state; }
export async function activate(raw) {
  const l = parseKey(raw); if (!l) return null;
  await db.setting('license', l.key); state = l; return l;
}
export async function deactivate() { await db.setting('license', ''); state = null; }
export function shopFor(lang) { return lang === 'uk' ? SHOP.uk : SHOP.other; }

// Що відкрито в безкоштовній версії
export const FREE = { worlds: 6, scenes: 12, patterns: ['dots', 'hearts'], fun: 4, animals: 16, extras: 20, fx: 6, figs: 3, places: 4 };
