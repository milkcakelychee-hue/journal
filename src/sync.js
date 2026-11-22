// ซิงก์ข้ามเครื่องด้วย "รหัสซิงก์" ผ่าน Supabase (ฟังก์ชันใน supabase/schema.sql)
// URL + publishable key เปิดเผยได้ (ไม่ใช่ secret) · ข้อมูลเข้าถึงได้เมื่อรู้รหัสซิงก์เท่านั้น
// กติกา: ข้อมูลที่แก้ล่าสุด (updatedAt) ชนะ · ภาพซิงก์แยกทีละวัน
import { getData, replaceData, subscribe, getPhoto } from './store.js';
import { savePhoto, removePhoto } from './lib/photos.js';

const URL0 = 'https://riudqjmefgsdyyumbepd.supabase.co';
const KEY = 'sb_publishable_RDdo7sP9ZHmAQVHyRXRjWw_dk-mCZlg';
const LS_LAST = 'jr-last-sync', LS_PH = 'jr-photo-sync';

async function rpc(fn, args) {
  const r = await fetch(`${URL0}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`sync ${fn} ${r.status}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ไม่มี 0 O 1 I
export function newCode() {
  const b = crypto.getRandomValues(new Uint8Array(8)), c = [...b].map(x => ABC[x % ABC.length]).join('');
  return `JRNL-${c.slice(0, 4)}-${c.slice(4)}`;
}
export const normCode = s => { const c = String(s).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^JRNL/, ''); return c.length === 8 ? `JRNL-${c.slice(0, 4)}-${c.slice(4)}` : null; };

const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch { return null; } };
export const lastSync = () => ls(LS_LAST);
const phMap = () => ls(LS_PH) || {};

const blobToB64 = b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
const b64ToBlob = s => fetch(s).then(r => r.blob());

let busy = false, applying = false;
const listeners = new Set();
export const onSync = l => (listeners.add(l), () => listeners.delete(l));
const emit = () => [...listeners].forEach(l => l());

async function pushPhotos(code, d) {
  const map = phMap();
  for (const [day, p] of Object.entries(d.photos || {})) {
    if (map[day] === p.updatedAt) continue;
    const b = await getPhoto(day); if (!b) continue;
    await rpc('photo_put', { p_code: code, p_day: day, p_img: await blobToB64(b) });
    map[day] = p.updatedAt;
  }
  for (const day of Object.keys(map)) if (!d.photos?.[day]) { await rpc('photo_del', { p_code: code, p_day: day }); delete map[day]; }
  ls(LS_PH, map);
}
async function pullPhotos(code, d) {
  const map = phMap();
  for (const [day, p] of Object.entries(d.photos || {})) {
    if (map[day] === p.updatedAt) continue;
    const img = await rpc('photo_get', { p_code: code, p_day: day });
    if (img) { await savePhoto(day, await b64ToBlob(img)); map[day] = p.updatedAt; }
  }
  for (const day of Object.keys(map)) if (!d.photos?.[day]) { await removePhoto(day); delete map[day]; }
  ls(LS_PH, map);
}

async function apply(remote, code) {
  applying = true;
  try { await replaceData({ ...remote, settings: { ...remote.settings, syncCode: code } }); } finally { applying = false; }
}

// ซิงก์: ดึงของบนเซิร์ฟเวอร์ ถ้าใหม่กว่าใช้ของเซิร์ฟเวอร์ ไม่งั้นส่งของเครื่องนี้ขึ้นไป
export async function syncNow() {
  const code = getData().settings.syncCode; if (!code || !navigator.onLine) return false;
  if (busy) return new Promise(res => { const off = onSync(() => { if (!busy) { off(); res(true); } }); });
  busy = true; emit();
  try {
    const [row] = await rpc('sync_get', { p_code: code }) || [];
    const local = getData();
    if (row && (row.data.updatedAt || 0) > (local.updatedAt || 0)) { await apply(row.data, code); await pullPhotos(code, row.data); }
    else if (!row || (row.data.updatedAt || 0) < (local.updatedAt || 0)) { await rpc('sync_put', { p_code: code, p_data: local }); await pushPhotos(code, local); }
    ls(LS_LAST, Date.now());
    return true;
  } catch (e) { console.warn('sync', e); return false; }
  finally { busy = false; emit(); }
}

// ใช้รหัสจากเครื่องอื่น → แทนที่ข้อมูลเครื่องนี้ · คืน false ถ้าไม่พบรหัส
export async function connectCode(code) {
  const [row] = await rpc('sync_get', { p_code: code }) || [];
  if (!row) return false;
  ls(LS_PH, {});
  await apply(row.data, code);
  await pullPhotos(code, row.data);
  ls(LS_LAST, Date.now()); emit();
  return true;
}

// เริ่มซิงก์ครั้งแรกด้วยรหัสใหม่ (ข้อมูลเครื่องนี้ขึ้นไปเก็บ)
export async function startSync(update) {
  update(d => { d.settings.syncCode = newCode(); });
  ls(LS_PH, {});
  return syncNow();
}

// ส่งขึ้นอัตโนมัติหลังแก้ข้อมูล 3 วินาที · กลับมาเปิดแอป = ซิงก์
let t;
subscribe(() => { if (applying || !getData()?.settings.syncCode) return; clearTimeout(t); t = setTimeout(syncNow, 3000); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
addEventListener('online', () => syncNow());
