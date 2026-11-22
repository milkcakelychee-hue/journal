// ตั้งค่า · หน้าหลัก (บอร์ด Set-Main)
import { getData, update } from '../store.js';
import { openSheet } from '../ui/sheet.js';
import { openPeriodSetSheet } from './period-set-sheet.js';
import { renderSetMood, mountSetMood } from './set-mood.js';
import { CHANGELOG } from '../changelog.js';
import { renderSetCat, mountSetCat } from './set-cat.js';
import { renderSetSync, mountSetSync } from './set-sync.js';

const SUBS = { mood: [renderSetMood, mountSetMood], cat: [renderSetCat, mountSetCat], sync: [renderSetSync, mountSetSync] };
const sub = () => SUBS[location.hash.split('/')[1]];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const G = '#A3A3A9';
const I = p => `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">${p}</svg>`;
const ICON = {
  name: I(`<circle cx="24" cy="24" r="16" fill="${G}"/>`),
  mood: '<span class="st-ball"></span>',
  cat: I(`<rect x="6" y="6" width="16" height="16" rx="3.5" fill="${G}"/><rect x="26" y="6" width="16" height="16" rx="3.5" fill="${G}"/><rect x="6" y="26" width="16" height="16" rx="3.5" fill="${G}"/><rect x="26" y="26" width="16" height="16" rx="3.5" fill="${G}"/>`),
  people: I(`<circle cx="24" cy="15" r="8" fill="${G}"/><path d="M8 42 A16 16 0 0 1 40 42 Z" fill="${G}"/>`),
  places: I(`<circle cx="24" cy="18" r="12" fill="${G}"/><path d="M13.5 24 L34.5 24 L24 43 Z" fill="${G}"/>`),
  drugcat: I(`<rect x="6" y="16" width="36" height="16" rx="8" fill="${G}"/>`),
  period: I(`<circle cx="24" cy="24" r="16" fill="none" stroke="${G}" stroke-width="6"/>`),
  week: I(`<rect x="8" y="10" width="32" height="30" rx="6" fill="${G}"/>`),
  imp: I(`<rect x="9" y="11" width="30" height="30" rx="3" fill="${G}" transform="rotate(-6 24 26)"/>`),
  sync: I(`<path d="M10 20 A14 14 0 0 1 36 16" fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round"/><path d="M38 28 A14 14 0 0 1 12 32" fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round"/><path d="M30 10 L37 16 L30 20 Z" fill="${G}"/><path d="M18 38 L11 32 L18 28 Z" fill="${G}"/>`),
  ver: I(`<circle cx="24" cy="24" r="17" fill="${G}"/><rect x="21.5" y="21" width="5" height="13" rx="2.5" fill="#F3F3F5"/><circle cx="24" cy="15" r="3" fill="#F3F3F5"/>`),
  intro: I(`<rect x="9" y="7" width="30" height="34" rx="5" fill="${G}"/><rect x="15" y="15" width="18" height="4" rx="2" fill="#F3F3F5"/><rect x="15" y="23" width="18" height="4" rx="2" fill="#F3F3F5"/><rect x="15" y="31" width="11" height="4" rx="2" fill="#F3F3F5"/>`),
};
const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6 L15.5 12 L9.5 18"/></svg>';
const MINUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 12 H18"/></svg>';
const PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 6 V18"/><path d="M6 12 H18"/></svg>';
const VER = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.4.0';

const row = (id, label, value = '') => `<button type="button" class="st-row" data-st="${id}"><span class="st-ic">${ICON[id]}</span><span class="st-l">${label}</span><span class="st-v">${value}</span><span class="st-ch">${CHEV}</span></button>`;
const group = (title, rows) => `<div class="st-gt">${title}</div><div class="card st-card">${rows}</div>`;

export function renderSettings() {
  if (sub()) return sub()[0]();
  const d = getData(), s = d.settings;
  const sync = s.syncCode ? '<span class="st-sync"><i style="background:#5BAE6A"></i>เชื่อมต่อแล้ว</span>' : '<span class="st-sync"><i style="background:#C2C2C7"></i>ยังไม่เชื่อมต่อ</span>';
  return `<div class="today st">
    <div style="height:52px;display:flex;align-items:center"><h1 class="h-page">ตั้งค่า</h1></div>
    ${group('ส่วนตัว', row('name', 'ชื่อที่ใช้ทักทาย', esc(s.name || '')))}
    ${group('สิ่งที่บันทึก', row('mood', 'อารมณ์', `${d.moods.length} อารมณ์`) + row('cat', 'หมวดกิจกรรม', `${d.categories.length} หมวด`))}
    ${group('สุขภาพ', row('period', 'รอบเดือน', `${s.periodDefaultCycle} วัน · มา ${s.periodDefaultLen} วัน`))}
    ${group('การแสดงผล', row('week', 'วันแรกของสัปดาห์', s.weekStart === 0 ? 'อาทิตย์' : 'จันทร์') + row('imp', 'วันสำคัญในหน้าวันนี้', `ล่วงหน้า ${s.importantDaysAhead} วัน`))}
    ${group('ข้อมูล', row('sync', 'ซิงก์ข้อมูล', sync))}
    ${group('เกี่ยวกับ', row('ver', 'เวอร์ชันแอป', esc(VER)) + row('intro', 'แนะนำแอป'))}
  </div>`;
}

function nameSheet(done) {
  let v = getData().settings.name || '';
  openSheet({
    title: 'ชื่อที่ใช้ทักทาย',
    body: () => `<input type="text" class="ea-input" maxlength="30" aria-label="ชื่อที่ใช้ทักทาย" value="${esc(v)}" data-st-name><button type="button" class="btn-primary" style="margin-top:20px" data-st-save>บันทึก</button>`,
    mount(el, close) {
      el.addEventListener('input', e => { if (e.target.matches('[data-st-name]')) v = e.target.value; });
      el.addEventListener('click', e => { if (e.target.closest('[data-st-save]')) { update(d => { d.settings.name = v.trim(); }); close(); done(); } });
    },
  });
}

function weekSheet(done) {
  let v = getData().settings.weekStart;
  const btn = (n, l) => `<button type="button" class="seg-btn${v === n ? ' on' : ''}" aria-pressed="${v === n}" data-st-wk="${n}">${l}</button>`;
  openSheet({
    title: 'วันแรกของสัปดาห์',
    body: () => `<div class="seg" style="margin:0">${btn(1, 'จันทร์')}${btn(0, 'อาทิตย์')}</div><button type="button" class="btn-primary" style="margin-top:20px" data-st-save>บันทึก</button>`,
    mount(el, close, render) {
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-st-wk]'); if (b) { v = Number(b.dataset.stWk); render(); return; }
        if (e.target.closest('[data-st-save]')) { update(d => { d.settings.weekStart = v; }); close(); done(); }
      });
    },
  });
}

// วันสำคัญล่วงหน้า n วัน · ช่องพิมพ์ได้ + ปุ่ม ลด/เพิ่ม (1–60)
function impSheet(done) {
  let v = getData().settings.importantDaysAhead;
  const clamp = n => Math.min(60, Math.max(1, n));
  openSheet({
    title: 'วันสำคัญในหน้าวันนี้',
    body: () => `<div class="ps-row"><span class="ps-l">ล่วงหน้า</span><span class="ps-ctl">
        <button type="button" class="ps-btn" aria-label="ลด" data-st-step="-1">${MINUS}</button>
        <label class="ps-num"><input type="text" inputmode="numeric" pattern="[0-9]*" aria-label="ล่วงหน้ากี่วัน" value="${v}" data-st-num><span>วัน</span></label>
        <button type="button" class="ps-btn" aria-label="เพิ่ม" data-st-step="1">${PLUS}</button></span></div>
      <button type="button" class="btn-primary" style="margin-top:20px" data-st-save>บันทึก</button>`,
    mount(el, close) {
      const inp = () => el.querySelector('[data-st-num]');
      const commit = () => { const n = parseInt(inp().value, 10); v = clamp(isNaN(n) ? v : n); inp().value = v; };
      el.addEventListener('input', e => { if (e.target.matches('[data-st-num]')) e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2); });
      el.addEventListener('focusout', e => { if (e.target.matches('[data-st-num]')) commit(); });
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-st-step]'); if (b) { commit(); v = clamp(v + Number(b.dataset.stStep)); inp().value = v; return; }
        if (e.target.closest('[data-st-save]')) { commit(); update(d => { d.settings.importantDaysAhead = v; }); close(); done(); }
      });
    },
  });
}

// มีอะไรใหม่ · บอร์ด Set-Version
function versionSheet() {
  const html = CHANGELOG.map((c, i) => `<div class="vs-item"><div class="vs-h"><span class="vs-v">${c.v}</span>${i === 0 ? '<span class="vs-cur">เวอร์ชันนี้</span>' : ''}<span class="vs-d">${c.date}</span></div>
    <ul class="vs-ul${i === 0 ? '' : ' old'}">${c.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('');
  openSheet({
    title: 'มีอะไรใหม่', body: () => html,
    mount(el) { el.classList.add('sh-tall'); el.querySelector('.sh-title').insertAdjacentHTML('afterend', '<div class="ia-sub">แสดงเฉพาะฟีเจอร์ใหญ่</div>'); },
  });
}

export function mountSettings(root, rerender) {
  if (sub()) { sub()[1](root, rerender); return; }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    const id = b.dataset.st;
    if (id === 'name') nameSheet(rerender);
    else if (id === 'week') weekSheet(rerender);
    else if (id === 'imp') impSheet(rerender);
    else if (id === 'period') openPeriodSetSheet(rerender);
    else if (id === 'ver') versionSheet();
    else if (id === 'intro') location.hash = 'intro';
    else if (SUBS[id]) location.hash = 'settings/' + id;
  });
}
