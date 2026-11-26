// เครื่องพิมพ์ดีด · ช่องท้ายสุดของหน้าวันนี้ (บลูขอ 26 พ.ย. 2569)
// คำถามวันนี้อยู่บนสุด (ตอบ/เปลี่ยนข้อ ไม่บังคับ) · กระดาษดันขึ้นตามบรรทัด · พิมพ์ออกมา → ป๊อปอัป เก็บใส่แฟ้ม / แก้ไข
import { getData, update } from '../store.js';
import { DAYS_SHORT, MONTHS_SHORT, todayKey, fromKey, be } from '../lib/date-th.js';
import { QUESTIONS, qIndex, toHtml, fromEl, isBlank } from '../lib/journal.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC_ANS = ic('<path d="M4 20 H8 L18.5 9.5 L14.5 5.5 L4 16 Z"/><path d="M13 7 L17 11"/>'); // ดินสอ = ตอบ
const IC_NEXT = ic('<path d="M20 12 A8 8 0 1 1 17.7 6.3"/><path d="M20 4 V8.5 H15.5"/>'); // วนลูกศร = เปลี่ยนข้อ
let off = 0, draft = null, draftDay = null, editing = false; // ร่างที่ยังไม่เก็บ อยู่รอดตอนหน้าวาดใหม่

export const paperNo = (d, k) => Object.keys(d.journal || {}).filter(x => x <= k).length + (d.journal?.[k] ? 0 : 1);
export const paperHead = (d, k) => { const t = fromKey(k); return `<div class="tw-hd"><span>${DAYS_SHORT[t.getDay()]} ${t.getDate()} ${MONTHS_SHORT[t.getMonth()]} ${be(t.getFullYear())}</span><span>no.${String(paperNo(d, k)).padStart(3, '0')}</span></div>`; };

function machine() {
  const keys = [10, 9, 8].map(n => `<div class="tw-r">${'<span class="tw-k"></span>'.repeat(n)}</div>`).join('');
  return `<div class="tw-m" aria-hidden="true"><div class="tw-platen"><span class="tw-knob l"></span><span class="tw-knob r"></span></div>
    <div class="tw-bail"><i style="left:22%"></i><i style="right:22%"></i></div>
    <div class="tw-body"><div class="tw-basket"></div><div class="tw-slug"></div><div class="tw-brand">JOURNAL</div>
      <div class="tw-kb">${keys}<div class="tw-space"></div></div></div></div>`;
}

export function renderTypewriter() {
  const d = getData(), k = todayKey();
  if (draftDay !== k) { draft = null; draftDay = k; editing = false; }
  const text = draft ?? d.journal?.[k]?.text ?? '';
  // วันนี้พิมพ์แล้ว → เครื่องว่าง ไม่มีกระดาษ · กดแก้ไขค่อยเอาใบเดิมมาใส่
  if (d.journal?.[k] && !editing && draft == null) return `<section class="twr">
    <div class="tw-stage tw-empty" data-tw-stage><div class="tw-done"><span>วันนี้พิมพ์แล้ว</span><button type="button" class="btn-secondary" data-tw-edit>แก้ไข</button></div>${machine()}</div>
    <div class="tw-toast" data-tw-toast>เก็บไว้ในแฟ้มแล้ว</div></section>`;
  return `<section class="twr">
    <div class="tw-q"><small>คำถามวันนี้ · ไม่ต้องตอบก็ได้</small>
      <div class="tw-qr"><p data-tw-qt>${esc(QUESTIONS[qIndex(k, off)])}</p>
        <button type="button" class="tw-ib" aria-label="ตอบข้อนี้" data-tw-ans>${IC_ANS}</button><button type="button" class="tw-ib" aria-label="เปลี่ยนข้อ" data-tw-next>${IC_NEXT}</button></div></div>
    <div class="tw-stage" data-tw-stage>
      <div class="tw-paper" data-tw-paper>${paperHead(d, k)}
        <div class="tw-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="บันทึกวันนี้" data-ph="พิมพ์ได้เลย..." data-tw-ed>${toHtml(text, true)}</div></div>
      ${machine()}
    </div>
    <button type="button" class="btn-primary" data-tw-print>พิมพ์ออกมา</button>
    <div class="tw-toast" data-tw-toast>เก็บไว้ในแฟ้มแล้ว</div>
  </section>`;
}

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function bindTypewriter(root, onSaved) {
  const $ = s => root.querySelector(s);
  root.addEventListener('beforeinput', e => {
    if (!e.target.closest?.('[data-tw-ed]')) return;
    if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') { e.preventDefault(); document.execCommand('insertText', false, '\n'); }
  });
  root.addEventListener('paste', e => {
    if (!e.target.closest?.('[data-tw-ed]')) return;
    e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
  root.addEventListener('input', e => {
    const ed = e.target.closest?.('[data-tw-ed]'); if (!ed) return;
    draft = fromEl(ed); draftDay = todayKey();
    if (reduce()) return;
    const ks = root.querySelectorAll('.tw-k'), kk = ks[Math.random() * ks.length | 0];
    kk?.classList.add('dn'); setTimeout(() => kk?.classList.remove('dn'), 90);
    $('.tw-slug')?.animate([{ opacity: 1, transform: 'rotate(-70deg)' }, { opacity: 1, transform: 'rotate(0deg)' }, { opacity: 0, transform: 'rotate(-70deg)' }], { duration: 140 });
  });
  root.addEventListener('click', e => {
    if (e.target.closest('[data-tw-next]')) { off++; $('[data-tw-qt]').textContent = QUESTIONS[qIndex(todayKey(), off)]; return; }
    if (e.target.closest('[data-tw-ans]')) return answer($('[data-tw-ed]'));
    if (e.target.closest('[data-tw-print]')) return print(root, onSaved);
    if (e.target.closest('[data-tw-edit]')) {
      editing = true;
      const sec = e.target.closest('.twr'); sec.outerHTML = renderTypewriter();
      const pp = root.querySelector('[data-tw-paper]'); pp?.classList.add('feed'); setTimeout(() => pp?.classList.remove('feed'), 900);
    }
  });
}

// ตอบข้อนี้ → คำถามต่อบรรทัดล่างของที่พิมพ์ไว้ เคอร์เซอร์อยู่ใต้คำถาม
function answer(ed) {
  const ql = document.createElement('span');
  ql.className = 'tw-ql'; ql.contentEditable = 'false'; ql.textContent = QUESTIONS[qIndex(todayKey(), off)];
  const t = document.createTextNode('​');
  ed.append(ql, t); ed.focus();
  const r = document.createRange(); r.setStart(t, 1); r.collapse(true);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  draft = fromEl(ed); draftDay = todayKey();
  ql.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function print(root, onSaved) {
  const ed = root.querySelector('[data-tw-ed]'), text = fromEl(ed), k = todayKey();
  if (isBlank(text)) { ed.focus(); return; }
  ed.blur();
  const stage = root.querySelector('[data-tw-stage]');
  stage.classList.add('printing');
  setTimeout(() => showPop(root, text, k, onSaved), reduce() ? 150 : 2300);
}

function showPop(root, text, k, onSaved) {
  const d = getData(), pop = document.createElement('div');
  pop.className = 'tw-pop';
  pop.innerHTML = `<div class="tw-pop-in" role="dialog" aria-modal="true" aria-label="หน้ากระดาษที่พิมพ์">
    <div class="tw-pv">${paperHead(d, k)}<div class="tw-ed tw-ro">${toHtml(text)}</div></div>
    <div class="btn-row"><button type="button" class="btn-secondary" data-p-edit>แก้ไข</button><button type="button" class="btn-primary" data-p-keep>เก็บใส่แฟ้ม</button></div></div>`;
  document.body.append(pop);
  requestAnimationFrame(() => pop.classList.add('on'));
  const stage = root.querySelector('[data-tw-stage]');
  const close = () => { pop.classList.remove('on'); setTimeout(() => pop.remove(), 300); };
  pop.addEventListener('click', e => {
    if (e.target.closest('[data-p-edit]')) { close(); stage?.classList.remove('printing'); return; }
    if (!e.target.closest('[data-p-keep]')) return;
    update(dd => { dd.journal ||= {}; dd.journal[k] = { text, updatedAt: Date.now() }; });
    draft = null; editing = false; close();
    const toast = root.querySelector('[data-tw-toast]'); toast?.classList.add('on');
    setTimeout(() => onSaved?.(), 900);
  });
}
