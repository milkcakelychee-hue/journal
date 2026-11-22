// เก็บข้อมูลในเครื่องด้วย IndexedDB
// - ข้อมูลทั้งหมดเป็น JSON ก้อนเดียว (key "data" ใน store "kv") → ซิงก์ง่าย
// - ภาพ "หนึ่งวันหนึ่งภาพ" เก็บเป็น Blob แยกใน store "photos" (key = วันที่)
import { createDefaultData } from './defaults.js';

const DB_NAME = 'journal';
let dbp;
function db() {
  dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('kv');
      r.result.createObjectStore('photos');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function tx(store, mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  });
}

let data = null;
const listeners = new Set();

export async function loadData() {
  const saved = await tx('kv', 'readonly', s => s.get('data'));
  // เติมช่องที่เพิ่มใหม่ภายหลังจากค่าเริ่มต้น โดยไม่ทับของเดิม
  const base = createDefaultData();
  data = saved ? { ...base, ...saved, settings: { ...base.settings, ...saved.settings } } : base;
  // เติมแถบสีให้หมวดที่สร้างก่อนมีช่อง accent
  for (const c of data.categories) if (!c.accent) c.accent = base.categories.find(b => b.name === c.name)?.accent || c.fg;
  if (!saved) await persist();
  return data;
}

export const getData = () => data;

let saveTimer;
function persist() { return tx('kv', 'readwrite', s => s.put(data, 'data')); }

// แก้ข้อมูล: update(d => { d.todos.push(...) })
export function update(fn) {
  fn(data);
  data.updatedAt = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 150);
  listeners.forEach(l => l(data));
}
export const subscribe = l => (listeners.add(l), () => listeners.delete(l));

// แทนที่ข้อมูลทั้งหมด (ใช้ตอนรับข้อมูลจากรหัสซิงก์)
export async function replaceData(next) {
  data = next;
  await persist();
  listeners.forEach(l => l(data));
}

// บันทึกทันที เช่น ก่อนปิดแอป
export const flush = () => { clearTimeout(saveTimer); return persist(); };
addEventListener('pagehide', () => { flush(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

// ภาพ
export const putPhoto = (date, blob) => tx('photos', 'readwrite', s => s.put(blob, date));
export const getPhoto = date => tx('photos', 'readonly', s => s.get(date));
export const deletePhoto = date => tx('photos', 'readwrite', s => s.delete(date));

// ขอให้ Safari ไม่ลบข้อมูลเองเมื่อพื้นที่ใกล้เต็ม
navigator.storage?.persist?.().catch(() => {});
