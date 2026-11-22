// การ์ดอารมณ์ในหน้าวันนี้ · บอร์ด Main (ยังไม่เลือก/บันทึกแล้ว) / Today-Mood (แตะแล้วขยาย มีโน้ตสั้น ๆ)
import { getData, update } from '../store.js';
import { todayKey } from '../lib/date-th.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PENCIL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/></svg>';
const MAX = 100;

// สีอ่อนตรงไฮไลต์ของลูกบอล = ผสมสีอารมณ์กับขาว
const tint = (hex, t = 0.47) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) + (255 - parseInt(hex.slice(i, i + 2), 16)) * t).toString(16).padStart(2, '0')).join('');
const rgba = (hex, a) => `rgba(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',')},${a})`;

// ui.pick = อารมณ์ที่แตะ (ยังไม่บันทึก) · null = ไม่ได้ขยายการ์ด
let ui = { pick: null, note: '' };
export function resetMoodUi() { ui = { pick: null, note: '' }; }

export function renderMoodCard() {
  const d = getData();
  const saved = d.moodLog[todayKey()];
  const moods = [...d.moods].sort((a, b) => a.order - b.order);
  const active = ui.pick ?? saved?.moodId ?? null;
  // บันทึกแล้ว = ล็อก แตะอารมณ์อื่นไม่ได้ · แก้ได้จากปุ่มดินสอมุมการ์ดเท่านั้น
  const locked = !!saved && !ui.pick;
  const pickName = ui.pick ? moods.find(m => m.id === ui.pick)?.name : '';
  return `<section class="card md-card">
    <button type="button" class="md-edit" aria-label="เพิ่มหรือแก้ไขอารมณ์" data-mood-edit>${PENCIL}</button>
    <h2 class="h-sec">วันนี้รู้สึกยังไง</h2>
    <div class="md-sub">${ui.pick ? `เลือกแล้ว: ${esc(pickName)}` : 'บันทึกเมื่อจบวัน'}</div>
    <div class="md-grid">${moods.map(m => {
      const on = m.id === active;
      const dim = active && !on;
      return `<button type="button" class="md-btn${on ? ' on' : ''}" aria-pressed="${on}" aria-label="${esc(m.name)}" data-mood="${m.id}"${locked ? ' disabled' : ''}${on ? ` style="background:${rgba(m.color, 0.18)}"` : ''}>
        <span class="md-ball" style="background:radial-gradient(circle at 32% 28%,${tint(m.color)} 0%,${m.color} 72%);opacity:${dim ? 0.5 : 1}"></span>
        <span class="md-name">${esc(m.name)}</span></button>`;
    }).join('')}</div>
    ${ui.pick ? `<label class="md-note"><span class="md-note-lb">โน้ตสั้น ๆ</span>
        <textarea class="md-note-in" maxlength="${MAX}" rows="2">${esc(ui.note)}</textarea>
        <span class="md-count">${[...ui.note].length}/${MAX}</span></label>
      <button type="button" class="md-save" data-mood-save>บันทึก</button>` : ''}
  </section>`;
}

export function bindMood(root, rerender) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-mood],[data-mood-save],[data-mood-edit]');
    if (!b) return;
    if ('moodEdit' in b.dataset) {
      const saved = getData().moodLog[todayKey()];
      if (!saved || ui.pick) return;
      ui.pick = saved.moodId; ui.note = saved.note || '';
      rerender();
    } else if (b.dataset.mood) {
      if (getData().moodLog[todayKey()] && !ui.pick) return; // ล็อกอยู่
      ui.pick = b.dataset.mood;
      rerender();
    } else {
      const pick = ui.pick, note = ui.note.trim().slice(0, MAX);
      update(d => { d.moodLog[todayKey()] = { moodId: pick, note }; });
      resetMoodUi();
      rerender();
    }
  });
  root.addEventListener('input', e => {
    if (!e.target.classList.contains('md-note-in')) return;
    ui.note = e.target.value;
    const c = root.querySelector('.md-count'); if (c) c.textContent = `${[...ui.note].length}/${MAX}`;
  });
}
