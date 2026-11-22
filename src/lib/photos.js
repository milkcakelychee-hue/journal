// ภาพ "หนึ่งวันหนึ่งภาพ": ย่อภาพก่อนเก็บ · แคช object URL ไว้ในหน่วยความจำ
import { getPhoto, putPhoto, deletePhoto } from '../store.js';

const urls = new Map(), loading = new Set();
// คืน URL ถ้าโหลดแล้ว · ถ้ายัง: เริ่มโหลดแล้วเรียก onReady เมื่อเสร็จ
export function photoURL(date, onReady) {
  if (urls.has(date)) return urls.get(date);
  if (!loading.has(date)) {
    loading.add(date);
    getPhoto(date).then(b => { loading.delete(date); if (b) { urls.set(date, URL.createObjectURL(b)); onReady?.(); } }).catch(() => loading.delete(date));
  }
  return null;
}

// ย่อด้านยาวสุดไม่เกิน 1600px · JPEG
export async function shrink(file, max = 1600) {
  const bmp = await createImageBitmap(file).catch(() => null);
  let w, h, src = bmp;
  if (!bmp) { src = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
  w = src.width; h = src.height;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
}

export async function savePhoto(date, blob) {
  await putPhoto(date, blob);
  if (urls.has(date)) URL.revokeObjectURL(urls.get(date));
  urls.set(date, URL.createObjectURL(blob));
}
export async function removePhoto(date) {
  await deletePhoto(date);
  if (urls.has(date)) URL.revokeObjectURL(urls.get(date));
  urls.delete(date);
}
