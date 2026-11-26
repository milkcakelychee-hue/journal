// แยกด้าน · หน้ารวม (Side-Home) + หน้าย่อย #sides/<ด้าน>
import { renderSideMood, mountSideMood, resetSideMood } from './side-mood.js';
import { renderSideHabit, mountSideHabit, resetSideHabit } from './side-habit.js';
import { renderSideHealth, mountSideHealth, resetSideHealth } from './side-health.js';
import { renderSideImp, mountSideImp, resetSideImp } from './side-imp.js';
import { renderSidePhoto, mountSidePhoto, resetSidePhoto } from './side-photo.js';
import { renderSideJournal, mountSideJournal, resetSideJournal } from './side-journal.js';
const SUBS = { mood: [renderSideMood, mountSideMood, resetSideMood], habit: [renderSideHabit, mountSideHabit, resetSideHabit], health: [renderSideHealth, mountSideHealth, resetSideHealth], important: [renderSideImp, mountSideImp, resetSideImp], photo: [renderSidePhoto, mountSidePhoto, resetSidePhoto], journal: [renderSideJournal, mountSideJournal, resetSideJournal] };
const sub = () => SUBS[location.hash.split('/')[1]];
const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 L17 7"/><path d="M8.5 7 H17 V15.5"/></svg>';
const G = '#C9C9CE';
const SIDES = [
  { id: 'mood', label: 'อารมณ์', icon: `<svg width="50" height="50" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="${G}"/></svg>` },
  { id: 'habit', label: 'Habit', icon: `<svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="13" r="8.5" fill="${G}"/><circle cx="35" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="35" r="8.5" fill="${G}"/><circle cx="13" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="24" r="8" fill="${G}"/></svg>` },
  { id: 'health', label: 'สุขภาพ', icon: `<svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true"><defs><clipPath id="shl"><polygon points="-25.48,51.42 7.88,60.99 29.93,-15.91 -3.42,-25.48"/></clipPath><clipPath id="shr"><polygon points="11.34,61.98 51.42,73.48 73.48,-3.42 33.39,-14.92"/></clipPath></defs><circle cx="24" cy="24" r="20" fill="${G}" clip-path="url(#shl)"/><circle cx="24" cy="24" r="20" fill="${G}" clip-path="url(#shr)"/></svg>` },
  { id: 'important', label: 'วันสำคัญ', icon: `<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="11" width="30" height="30" rx="3" fill="${G}" transform="rotate(-6 24 26)"/><circle cx="24" cy="10" r="5" fill="${G}"/></svg>` },
  { id: 'photo', label: 'หนึ่งวันหนึ่งภาพ', icon: `<svg width="50" height="50" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="7" width="30" height="34" rx="2" fill="${G}"/><circle cx="30" cy="17" r="3.5" fill="#FFFFFF"/><path d="M13 36 L21 25 L27 32 L30 28 L35 36 Z" fill="#FFFFFF"/></svg>` },
  { id: 'journal', label: 'บันทึก', icon: `<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="6" width="26" height="30" rx="2" fill="${G}"/><rect x="6" y="28" width="36" height="14" rx="5" fill="${G}"/><rect x="15" y="13" width="14" height="2.5" rx="1.25" fill="#FFFFFF"/><rect x="15" y="19" width="18" height="2.5" rx="1.25" fill="#FFFFFF"/></svg>` },
];

export const renderSides = () => sub() ? sub()[0]() : `<div class="today">
  <div style="height:52px;display:flex;align-items:center"><h1 class="h-page">แยกด้าน</h1></div>
  <div class="sd-grid">${SIDES.map(s => `<button type="button" class="tl sd-tile" aria-label="${s.label}" data-side="${s.id}"><span class="tl-arrow">${ARROW}</span><span class="tl-ic">${s.icon}</span><span class="tl-lb">${s.label}</span></button>`).join('')}</div>
</div>`;

export function mountSides(root, rerender) {
  if (sub()) sub()[1](root, rerender);
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-side],[data-side-back]');
    if (!b) return;
    if (b.dataset.side && SUBS[b.dataset.side]) { SUBS[b.dataset.side][2](); location.hash = 'sides/' + b.dataset.side; }
    else if (b.dataset.sideBack !== undefined) location.hash = location.hash.split('/')[2] === 'today' ? 'today' : 'sides'; // เปิดจากหน้าวันนี้ → กลับหน้าวันนี้
  });
}
