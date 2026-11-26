// แยกด้าน → บันทึก · กองกระดาษ แผ่นบนสุด = ที่เลือก · ปัด/ลูกศรพลิกหน้า · ปฏิทินเล็ก จุด = วันที่มีบันทึก (บลูขอ 26 พ.ย. 2569)
import { getData, update } from '../store.js';
import { DAYS, MONTHS, fromKey, todayKey } from '../lib/date-th.js';
import { miniCalHtml } from '../ui/minical.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { toHtml, fromEl, isBlank } from '../lib/journal.js';
import { attachFlip } from '../lib/page-curl.js';
import { paperHead, renderTypewriter, bindTypewriter } from './typewriter.js';

const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const L = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6 L15.5 12 L9.5 18"/></svg>';

const st = { sel: null, view: null, tab: 'write' };
export const resetSideJournal = () => { st.sel = null; st.view = null; st.tab = 'write'; };
const keysOf = d => Object.keys(d.journal || {}).sort().reverse(); // ใหม่ → เก่า

const paper = (d, k, cls, attrs = '') => { const t = fromKey(k); return `<div class="jn-pp ${cls}"${attrs} aria-label="บันทึก${DAYS[t.getDay()]} ${t.getDate()} ${MONTHS[t.getMonth()]}">
  ${paperHead(d, k)}<div class="tw-ed tw-ro jn-txt">${toHtml(d.journal[k].text)}</div><span class="jn-shade"></span></div>`; };

export function renderSideJournal() {
  const d = getData(), keys = keysOf(d);
  if (!keys.includes(st.sel)) st.sel = keys[0] || null;
  if (!st.view) { const t = fromKey(st.sel || todayKey()); st.view = { y: t.getFullYear(), m: t.getMonth() }; }
  const seg = (id, t) => `<button type="button" class="seg-btn${st.tab === id ? ' on' : ''}" aria-pressed="${st.tab === id}" data-jn-tab="${id}">${t}</button>`;
  const head = `<button type="button" class="side-back" data-side-back>${BACK}${location.hash.split('/')[2] === 'today' ? 'วันนี้' : 'แยกด้าน'}</button><h1 class="h-page side-title">บันทึก</h1>
    <div class="seg" style="margin:0">${seg('write', 'เขียน')}${seg('file', `แฟ้ม${keys.length ? ` · ${keys.length}` : ''}`)}</div>`;
  if (st.tab === 'write') return `<div class="side">${head}${renderTypewriter()}</div>`;
  if (!keys.length) return `<div class="side">${head}<div class="ip-empty">ยังไม่มีบันทึก</div></div>`;
  const i = keys.indexOf(st.sel), older = keys[i + 1], newer = keys[i - 1];
  return `<div class="side">${head}
    <div class="jn-stack" data-jn-swipe>
      ${keys[i + 2] ? '<div class="jn-pp jn-b2"></div>' : ''}
      ${older ? paper(d, older, 'jn-under') : ''}
      ${paper(d, st.sel, 'jn-top', ' role="button" tabindex="0" data-jn-open')}
      ${newer ? paper(d, newer, 'jn-prev') : ''}
      <div class="jn-flapw" aria-hidden="true"><div class="jn-flap"></div></div>
    </div>
    <div class="jn-nav"><button type="button" class="cal-arrow" aria-label="แผ่นใหม่กว่า" data-jn-go="-1"${newer ? '' : ' disabled'}>${L}</button>
      <span>แผ่นที่ ${i + 1} จาก ${keys.length}</span>
      <button type="button" class="cal-arrow" aria-label="แผ่นเก่ากว่า" data-jn-go="1"${older ? '' : ' disabled'}>${R}</button></div>
    <div class="card jn-cal">${miniCalHtml(st.view, st.sel, d.settings.weekStart, new Set(keys))}</div>
  </div>`;
}

export function mountSideJournal(root, rerender) {
  bindTypewriter(root, rerender);
  const keysNow = () => keysOf(getData());
  const pick = k => { st.sel = k; const t = fromKey(k); st.view = { y: t.getFullYear(), m: t.getMonth() }; rerender(); };
  // พับมุมขวาล่างขึ้นตามนิ้ว (บลูขอ 26 พ.ย. 2569) · ตัวพลิกอยู่ใน lib/page-curl.js (ใช้ร่วมกับหนึ่งวันหนึ่งภาพ)
  const step = dir => { const k = keysNow(), i = k.indexOf(st.sel) + dir; return i >= 0 && i < k.length ? k[i] : null; };
  const { go } = attachFlip({ root, stackSel: '[data-jn-swipe]', topSel: '.jn-top', prevSel: '.jn-prev', flapSel: '.jn-flap',
    canGo: dir => !!step(dir), onGo: dir => pick(step(dir)) });
  root.addEventListener('click', e => {
    const tb = e.target.closest('[data-jn-tab]'); if (tb) { st.tab = tb.dataset.jnTab; rerender(); return; }
    const g = e.target.closest('[data-jn-go]'); if (g) return go(Number(g.dataset.jnGo));
    if (e.target.closest('[data-jn-open]')) { if (!root.dataset.flipNoClick) openJournalSheet(st.sel, rerender); return; }
    const nav = e.target.closest('[data-mc-nav]');
    if (nav) { const n = st.view.m + Number(nav.dataset.mcNav); st.view = { y: st.view.y + Math.floor(n / 12), m: (n + 12) % 12 }; rerender(); return; }
    const pk = e.target.closest('[data-mc-pick]')?.dataset.mcPick;
    if (pk && getData().journal?.[pk]) pick(pk);
  });
}

// แก้/ลบแผ่นของวันไหนก็ได้ · sheet เดียว ไม่ซ้อน
export function openJournalSheet(k, onSaved) {
  const d = getData(), old = d.journal?.[k]; if (!old) return;
  const t = fromKey(k);
  openSheet({
    title: `แก้บันทึก · ${t.getDate()} ${MONTHS[t.getMonth()]}`,
    body: () => `<div class="tw-pv jn-edit">${paperHead(d, k)}<div class="tw-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="บันทึก" data-jn-ed>${toHtml(old.text, true)}</div></div>
      <div class="btn-row" style="margin-top:16px"><button type="button" class="btn-secondary" data-jn-del>ลบ</button><button type="button" class="btn-primary" data-jn-save>บันทึก</button></div>`,
    mount(el, close) {
      el.addEventListener('beforeinput', e => {
        if (e.target.closest?.('[data-jn-ed]') && (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak')) { e.preventDefault(); document.execCommand('insertText', false, '\n'); }
      });
      el.addEventListener('paste', e => { if (e.target.closest?.('[data-jn-ed]')) { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); } });
      el.addEventListener('click', async e => {
        if (e.target.closest('[data-jn-del]')) {
          if (!await confirmDelete({ title: `ลบบันทึกวันที่ ${t.getDate()} ${MONTHS[t.getMonth()]}?` })) return;
          update(dd => { delete dd.journal[k]; }); close(); onSaved?.(); return;
        }
        if (!e.target.closest('[data-jn-save]')) return;
        const text = fromEl(el.querySelector('[data-jn-ed]'));
        if (isBlank(text)) { el.querySelector('[data-jn-ed]').focus(); return; }
        update(dd => { dd.journal[k] = { text, updatedAt: Date.now() }; }); close(); onSaved?.();
      });
    },
  });
}
