// สุขภาพ · ส่วนวิตามิน (บอร์ด Side-VitNew) · ติ๊ก "กินแล้ว" ของวันนี้ · จุดรายวันของเดือนที่เลือก
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, todayKey } from '../lib/date-th.js';
import { light, isDue } from './side-habit.js';

const PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7.5"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// สีวิตามิน: เริ่มที่เขียวอมฟ้า แล้วเหลือง ตามบอร์ด
const VIT_START = ['#5FBDB6', '#D9BC3C', '#6C9BD1', '#7DBE78', '#9C86D6', '#EBA463', '#E58F88', '#B5A48E'];
export const vitColor = i => VIT_START[i % 8];
export const vitFreqLabel = v => { const f = v.freq || { kind: 'daily' }; return f.kind === 'daily' ? 'ทุกวัน' : f.kind === 'alt' ? 'วันเว้นวัน' : [...(f.days || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(i => DAYS_SHORT[i]).join(' · '); };

function card(d, v, y, m) {
  const tk = todayKey(), c = v.color, log = d.vitaminLog[v.id] || {};
  const n = new Date(y, m + 1, 0).getDate(), off = (new Date(y, m, 1).getDay() - d.settings.weekStart + 7) % 7;
  let dots = '<span></span>'.repeat(off), due = 0, done = 0;
  for (let i = 1; i <= n; i++) {
    const k = toKey(new Date(y, m, i)), dd = isDue(v, k), ok = !!log[k], ring = k === tk ? ';box-shadow:0 0 0 1.5px #fff,0 0 0 2.5px var(--ink)' : '';
    if (dd) { due++; if (ok) done++; }
    let s = '';
    if (ok) s = `background:${c}`;
    else if (!dd) s = '';
    else if (k < tk) s = `background:${light(c)}`;
    else if (k === tk) s = `border:1.5px solid ${c}`;
    else s = 'border:1px solid #E6E6EA';
    dots += `<span class="vt-dot" style="${s}${ring}"></span>`;
  }
  const on = !!log[tk];
  return `<div class="card vt-card" role="button" tabindex="0" aria-label="แก้ ${esc(v.name)}" data-vt-edit="${v.id}"><div class="vt-in">
      <div class="vt-l"><span class="vt-name">${esc(v.name)}</span><span class="vt-sub">${[v.dose, v.timeSlot].filter(Boolean).map(esc).join(' · ')}</span><span class="vt-freq">${vitFreqLabel(v)}</span>
        <span class="vt-cnt">กินแล้ว ${done}/${due} วัน · ${MONTHS_SHORT[m]}</span></div>
      <div class="vt-r"><button type="button" class="vt-btn${on ? ' on' : ''}" aria-pressed="${on}" style="${on ? `background:${c}` : `border-color:${c};color:${c}`}" data-vt-toggle="${v.id}">${on ? CHECK : ''}กินแล้ว</button>
        <div class="vt-dots" role="img" aria-label="กินแล้ว ${done}/${due} วัน เดือน${MONTHS[m]}">${dots}</div></div>
    </div></div>`;
}

export function vitSection(d, y, m) {
  return `<div class="hb-sh hl-sh"><h2>วิตามิน</h2><button type="button" class="hl-btn" data-vt-add>${PLUS}เพิ่มวิตามิน</button></div>
    ${(d.vitamins || []).map(v => card(d, v, y, m)).join('')}`;
}
