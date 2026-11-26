// ดูแบบสไลด์รายวัน · บอร์ด Side-PhotoSlide · ตัวสลับ สไลด์ | ปฏิทิน · ‹ › ปัดดูวันอื่น (เฉพาะวันที่มีภาพในเดือนนั้น)
import { getData } from '../store.js';
import { MONTHS, fromKey } from '../lib/date-th.js';
import { photoURL, posStyle } from '../lib/photos.js';
import { attachFlip, WHITE_BACK } from '../lib/page-curl.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DAY_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const ic = p => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const X = ic('<path d="M6.5 6.5 L17.5 17.5"/><path d="M17.5 6.5 L6.5 17.5"/>'), L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');

// onCalendar(y, m) = กด "ปฏิทิน" → ไปมุมมองเดือนนั้น
export function openPhotoSlide(y, m, startKey, onCalendar) {
  const pre = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const keys = Object.keys(getData().photos).filter(k => k.startsWith(pre)).sort();
  if (!keys.length) return;
  let i = Math.max(0, keys.indexOf(startKey));
  const el = document.createElement('div');
  el.className = 'ps-back'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'ดูแบบสไลด์');
  // แสตมป์ 1 แผ่น · พลิกแบบพับมุมเหมือนบันทึก (บลูขอ 27 พ.ย. 2569)
  const frame = (k, cls, attrs = '') => { const u = photoURL(k, render); return `<div class="sl-frame ${cls}"${attrs}><span class="stamp"></span>${u ? `<img src="${u}" alt=""${posStyle(k)}>` : ''}</div>`; };
  const render = () => {
    const k = keys[i], dt = fromKey(k), u = photoURL(k, render), note = getData().photos[k]?.note || '';
    const a = Math.max(0, Math.min(i - 3, keys.length - 8)), dots = keys.slice(a, a + 8).map((_, j) => `<i class="${a + j === i ? 'on' : ''}"></i>`).join('');
    el.innerHTML = `<div class="sl">
      <div class="sl-top"><button type="button" class="sl-x" aria-label="ปิด" data-sl-close>${X}</button><span>${MONTHS[m]} ${y + 543} · ${i + 1} / ${keys.length}</span><span style="width:44px"></span></div>
      <div class="seg" style="margin-top:8px"><button type="button" class="seg-btn on" aria-pressed="true">สไลด์</button><button type="button" class="seg-btn" aria-pressed="false" data-sl-cal>ปฏิทิน</button></div>
      <div class="sl-day"><div class="sl-n">${dt.getDate()}</div><div class="sl-w">${DAY_FULL[dt.getDay()]}</div></div>
      <div class="sl-stack" data-sl-swipe>
        ${keys[i + 1] ? frame(keys[i + 1], 'sl-under') : ''}
        ${frame(k, 'sl-cur', ` role="img" aria-label="ภาพ${DAY_FULL[dt.getDay()]}ที่ ${dt.getDate()} ${MONTHS[m]}"`)}
        ${i ? frame(keys[i - 1], 'sl-prev') : ''}
        <div class="jn-flapw" aria-hidden="true"><div class="jn-flap"></div></div></div>
      ${note ? `<div class="sl-note">${esc(note)}</div>` : ''}
      <div class="sl-nav"><button type="button" class="sl-arrow" aria-label="วันก่อน" data-sl-go="-1"${i ? '' : ' disabled'}>${L}</button><span class="sl-dots">${dots}</span><button type="button" class="sl-arrow" aria-label="วันถัดไป" data-sl-go="1"${i < keys.length - 1 ? '' : ' disabled'}>${R}</button></div>
      <div class="sl-hint">ลากมุมขวาล่างขึ้นเพื่อดูวันถัดไป · ลากลงเพื่อย้อนกลับ</div></div>`;
  };
  const ok = n => i + n >= 0 && i + n < keys.length;
  const { go } = attachFlip({ root: el, stackSel: '[data-sl-swipe]', topSel: '.sl-cur', prevSel: '.sl-prev', flapSel: '.jn-flap', bg: WHITE_BACK,
    canGo: ok, onGo: n => { i += n; render(); } });
  const close = () => { el.remove(); document.body.classList.remove('sh-open'); };
  el.addEventListener('click', e => {
    if (e.target.closest('[data-sl-close]')) close();
    else if (e.target.closest('[data-sl-cal]')) { close(); onCalendar?.(y, m, keys[i]); }
    else { const b = e.target.closest('[data-sl-go]'); if (b) go(Number(b.dataset.slGo)); }
  });
  render();
  document.body.appendChild(el); document.body.classList.add('sh-open');
}
