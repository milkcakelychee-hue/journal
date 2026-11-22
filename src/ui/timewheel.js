// ตัวเลือกเวลาแบบเลื่อน 24 ชั่วโมง (ชั่วโมง 00–23 · นาที 00–59)
const pad = n => String(n).padStart(2, '0');
const ITEM = 36;
const col = (name, n) => `<div class="tw-col" data-tw="${name}">
  <div class="tw-pad"></div>${Array.from({ length: n }, (_, i) => `<div class="tw-item">${pad(i)}</div>`).join('')}<div class="tw-pad"></div></div>`;

export const timeWheelHtml = (clearLabel = 'ไม่ตั้งเวลา') => `<div class="tw">
  <div class="tw-wheel"><div class="tw-band"></div>${col('h', 24)}<span class="tw-colon">:</span>${col('m', 60)}</div>
  <button type="button" class="tw-clear" data-tw-clear>${clearLabel}</button></div>`;

// ตั้งตำแหน่งเริ่มต้น และเรียก onChange('HH:MM') ทุกครั้งที่หยุดเลื่อน
export function mountTimeWheel(root, value, onChange) {
  const h = root.querySelector('[data-tw="h"]'), m = root.querySelector('[data-tw="m"]');
  if (!h) return;
  const [hh, mm] = (value || '00:00').split(':').map(Number);
  h.scrollTop = hh * ITEM; m.scrollTop = mm * ITEM;
  const read = () => `${pad(Math.round(h.scrollTop / ITEM))}:${pad(Math.min(59, Math.round(m.scrollTop / ITEM)))}`;
  let t;
  const onScroll = () => { clearTimeout(t); t = setTimeout(() => onChange(read()), 120); };
  h.addEventListener('scroll', onScroll); m.addEventListener('scroll', onScroll);
}
