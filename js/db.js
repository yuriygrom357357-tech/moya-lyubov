// Сховище на пристрої (IndexedDB). Нічого не відправляється на сервер.
const DB_NAME = 'moya-lyubov';
const DB_VER = 1;
const STORES = ['kids', 'items', 'moments', 'blobs', 'letters', 'settings'];
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    Promise.resolve(fn(s)).then(v => (out = v));
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const db = {
  async all(store) { return tx(store, 'readonly', s => req(s.getAll())); },
  async get(store, id) { return tx(store, 'readonly', s => req(s.get(id))); },
  async put(store, obj) { await tx(store, 'readwrite', s => s.put(obj)); return obj; },
  async del(store, id) { return tx(store, 'readwrite', s => s.delete(id)); },
  async clear(store) { return tx(store, 'readwrite', s => s.clear()); },
  async putBlob(blob, id = uid()) { await this.put('blobs', { id, blob }); return id; },
  async getBlob(id) { const r = await this.get('blobs', id); return r ? r.blob : null; },
  async setting(key, val) {
    if (val === undefined) { const r = await this.get('settings', key); return r ? r.value : undefined; }
    return this.put('settings', { id: key, value: val });
  }
};

// Резервна копія: усе в один JSON-файл (фото — base64)
const b2d = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
export async function exportBackup() {
  const out = { app: 'moya-lyubov', v: 1, date: new Date().toISOString() };
  for (const s of STORES) {
    const rows = await db.all(s);
    if (s === 'blobs') out.blobs = await Promise.all(rows.map(async r => ({ id: r.id, data: await b2d(r.blob) })));
    else if (s === 'settings') out.settings = rows.filter(r => r.id !== 'aiKey');
    else out[s] = rows;
  }
  return new Blob([JSON.stringify(out)], { type: 'application/json' });
}
export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== 'moya-lyubov') throw new Error('Це не резервна копія «Моя любов»');
  for (const s of STORES) {
    if (!data[s]) continue;
    for (const row of data[s]) {
      if (s === 'blobs') { const blob = await (await fetch(row.data)).blob(); await db.put('blobs', { id: row.id, blob }); }
      else await db.put(s, row);
    }
  }
}
