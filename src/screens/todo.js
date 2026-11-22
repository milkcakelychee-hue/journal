// การ์ด To do ในหน้าวันนี้ · บอร์ด Main / Today-Empty / Today-Done / Today-TodoAdd
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { todayKey, fromKey, MONTHS_SHORT } from '../lib/date-th.js';
import { confirmDelete } from '../ui/confirm.js';
import { timeWheelHtml, mountTimeWheel } from '../ui/timewheel.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = (w, sw, p) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const CHECK = ic(14, 3, '<path d="M5 12.5 L10 17 L19 7.5"/>');
const PLUS = ic(18, 2.2, '<path d="M12 5 V19"/><path d="M5 12 H19"/>');
const CLOCK = ic(18, 2.2, '<circle cx="12" cy="12" r="8"/><path d="M12 8 V12 L15 14"/>');
const CAL = ic(18, 2.2, '<rect x="4" y="5.5" width="16" height="15" rx="3.5"/><path d="M4 10.5 H20"/><path d="M8.5 3.5 V7.5"/><path d="M15.5 3.5 V7.5"/>');
const DOWN = ic(20, 2.2, '<path d="M6 9.5 L12 15.5 L18 9.5"/>');
const UP = ic(20, 2.2, '<path d="M6 14.5 L12 8.5 L18 14.5"/>');
const SWIPE_W = 144; // ปุ่มแก้ไข + ลบ (72 + 72)

// สถานะชั่วคราวของการ์ด (ไม่เก็บลงข้อมูล)
const fresh = () => ({ day: null, adding: false, editingId: null, draft: '', time: '', date: '', wheel: false, collapsed: null, swiped: null });
let ui = fresh();
export function resetTodoUi() { ui = fresh(); }
// วันที่การ์ดแสดง (หน้าวันนี้ = วันนี้ · ปฏิทิน = วันที่เลือก)
const dayKey = () => ui.day || todayKey();
export function setTodoDay(k) { if (ui.day !== k) { ui = fresh(); ui.day = k; } }

const shortDate = k => { const d = fromKey(k); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };

function row(t, first) {
  return `<div class="td-swipe"${first ? '' : ' data-line'}>
    <div class="td-actions">
      <button type="button" class="td-act edit" data-todo-edit="${t.id}">แก้ไข</button>
      <button type="button" class="td-act del" data-todo-del="${t.id}">ลบ</button>
    </div>
    <div class="td-row" data-swipe-id="${t.id}"${ui.swiped === t.id ? ` style="transform:translateX(-${SWIPE_W}px)"` : ''}>
      <div class="td-main"><span class="td-title${t.done ? ' done' : ''}">${esc(t.title)}</span></div>
      ${t.time ? `<span class="td-time${t.done ? ' done' : ''}">${t.time}</span>` : ''}
      <button type="button" role="checkbox" aria-checked="${t.done}" aria-label="${esc(t.title)}" class="td-check" data-todo-toggle="${t.id}">
        ${t.done ? `<span class="td-box on">${CHECK}</span>` : '<span class="td-box"></span>'}
      </button>
    </div></div>`;
}

// แถวพิมพ์ (เพิ่มใหม่ หรือแก้ไข) · บอร์ด Today-TodoAdd + ปุ่มเลือกวัน
function editRow(first) {
  const tk = todayKey();
  const otherDay = ui.date && ui.date !== dayKey();
  return `<div class="td-add"${first ? ' data-first' : ''}>
    <span class="td-box dashed"></span>
    <input type="text" class="td-input" aria-label="ชื่อ To do" value="${esc(ui.draft)}" enterkeyhint="done">
    <label class="td-sq${otherDay ? ' set' : ''}" aria-label="เลือกวัน">${otherDay ? shortDate(ui.date) : CAL}<input type="date" class="td-dateinput" min="${tk}" value="${ui.date || dayKey()}"></label>
    <button type="button" class="td-sq${ui.time ? ' set' : ''}${ui.wheel ? ' open' : ''}" aria-label="ตั้งเวลา" data-todo-wheel><span class="td-timelabel">${ui.time || CLOCK}</span></button>
    <button type="button" class="td-addbtn" data-todo-save>${ui.editingId ? 'บันทึก' : 'เพิ่ม'}</button>
  </div>${ui.wheel ? timeWheelHtml() : ''}`;
}

export function renderTodoCard() {
  const key = dayKey();
  const list = getData().todos.filter(t => t.date === key);
  const done = list.filter(t => t.done).length;
  const allDone = list.length > 0 && done === list.length;
  // ทำครบแล้ว = ย่อเป็นค่าเริ่มต้น · ผู้ใช้กดย่อ/กางเองได้ตลอด
  const collapsed = !ui.adding && !ui.editingId && (ui.collapsed ?? allDone);
  const count = list.length ? `<span class="td-count">${done}/${list.length}</span>` : '';

  if (collapsed) {
    return `<section class="card td-card td-collapsed">
      <div class="td-bar"><h2 class="h-sec">To do</h2>
        ${allDone ? `<span class="td-badge">${ic(12, 3.2, '<path d="M5 12.5 L10 17 L19 7.5"/>')}ทำครบแล้ว</span>` : ''}
        <span style="flex:1"></span>${count}
        <button type="button" class="td-expand" aria-expanded="false" aria-label="ดูทั้งหมด" data-todo-collapse="0">${DOWN}</button></div>
    </section>`;
  }
  const rows = list.map((t, i) => (ui.editingId === t.id ? editRow(i === 0) : row(t, i === 0))).join('');
  return `<section class="card td-card">
    <div class="td-head"><h2 class="h-sec">To do</h2><span style="flex:1"></span>${count}
      ${list.length ? `<button type="button" class="td-expand td-up" aria-expanded="true" aria-label="ย่อ" data-todo-collapse="1">${UP}</button>` : ''}</div>
    <div>${list.length ? rows : '<div class="td-empty">ยังไม่มี To do</div>'}</div>
    ${ui.adding ? editRow(false) : `<button type="button" class="td-addline" data-todo-open>${PLUS}เพิ่ม To do</button>`}
  </section>`;
}

// ผูกเหตุการณ์ครั้งเดียวกับ root ของหน้า · rerender = วาดการ์ดใหม่
export function bindTodo(root, rerender) {
  const draw = () => {
    rerender();
    if (ui.wheel) mountTimeWheel(root, ui.time, v => {
      ui.time = v;
      const l = root.querySelector('.td-timelabel'); if (l) l.textContent = v;
      root.querySelector('[data-todo-wheel]')?.classList.add('set');
    });
  };
  const closeForm = () => { ui.adding = false; ui.editingId = null; ui.draft = ''; ui.time = ''; ui.date = ''; ui.wheel = false; };

  const save = () => {
    const title = ui.draft.trim();
    if (!title) return;
    const date = ui.date || dayKey();
    if (ui.editingId) {
      const id = ui.editingId;
      update(d => { const x = d.todos.find(y => y.id === id); if (x) Object.assign(x, { title, time: ui.time || null, date }); });
      closeForm(); draw();
      return;
    }
    update(d => d.todos.push({ id: newId(), date, title, time: ui.time || null, done: false }));
    ui.draft = ''; ui.time = ''; ui.wheel = false; // วันที่เลือกไว้คงเดิม เผื่อเพิ่มหลายข้อให้วันเดียวกัน
    draw();
    root.querySelector('.td-input')?.focus();
  };

  root.addEventListener('click', async e => {
    const t = e.target.closest('[data-todo-toggle],[data-todo-save],[data-todo-open],[data-todo-collapse],[data-todo-wheel],[data-tw-clear],[data-todo-edit],[data-todo-del]');
    // แตะที่อื่น → ปิดแถวที่ปัดเปิดไว้
    if (ui.swiped && !e.target.closest('.td-actions')) {
      const was = ui.swiped; ui.swiped = null;
      root.querySelector(`[data-swipe-id="${was}"]`)?.style.removeProperty('transform');
      if (t?.dataset.todoToggle === was) return;
    }
    if (!t) return;
    const ds = t.dataset;
    if (ds.todoToggle) {
      const id = ds.todoToggle;
      let nowAllDone = false;
      update(d => {
        const x = d.todos.find(y => y.id === id); if (x) x.done = !x.done;
        const l = d.todos.filter(y => y.date === dayKey()); nowAllDone = l.every(y => y.done);
      });
      if (nowAllDone) ui.collapsed = null; // ทำครบ → กลับไปย่อตามค่าเริ่มต้น
      draw();
    } else if ('todoSave' in ds) save();
    else if ('todoOpen' in ds) { closeForm(); ui.adding = true; draw(); root.querySelector('.td-input')?.focus(); }
    else if ('todoCollapse' in ds) { ui.collapsed = ds.todoCollapse === '1'; closeForm(); draw(); }
    else if ('todoWheel' in ds) {
      ui.wheel = !ui.wheel;
      if (ui.wheel && !ui.time) { const n = new Date(); ui.time = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; }
      draw();
    } else if ('twClear' in ds) { ui.time = ''; ui.wheel = false; draw(); }
    else if (ds.todoEdit) {
      const x = getData().todos.find(y => y.id === ds.todoEdit); if (!x) return;
      closeForm(); ui.swiped = null;
      Object.assign(ui, { editingId: x.id, draft: x.title, time: x.time || '', date: x.date });
      draw(); root.querySelector('.td-input')?.focus();
    } else if (ds.todoDel) {
      const x = getData().todos.find(y => y.id === ds.todoDel); if (!x) return;
      ui.swiped = null; draw();
      if (await confirmDelete({ title: `ลบ "${x.title}"?` })) { update(d => { d.todos = d.todos.filter(y => y.id !== x.id); }); draw(); }
    }
  });
  root.addEventListener('input', e => { if (e.target.classList.contains('td-input')) ui.draft = e.target.value; });
  root.addEventListener('change', e => {
    if (e.target.classList.contains('td-dateinput')) { ui.date = e.target.value || dayKey(); draw(); }
  });
  root.addEventListener('keydown', e => {
    if (e.target.classList.contains('td-input') && e.key === 'Enter') { e.preventDefault(); save(); }
  });
  // แตะที่อื่นตอนช่องว่างอยู่ → ปิดแถวเพิ่ม (ไม่ปิดถ้ากำลังใช้ปุ่มวัน/เวลา)
  root.addEventListener('focusout', e => {
    if (!e.target.classList.contains('td-input')) return;
    setTimeout(() => {
      const f = document.activeElement;
      if (root.querySelector('.td-add')?.contains(f) || root.querySelector('.tw')?.contains(f)) return;
      if (ui.adding && !ui.draft.trim() && !ui.time && !ui.wheel) { closeForm(); draw(); }
    }, 150);
  });

  // ปัดซ้ายที่แถว → เผยปุ่มแก้ไข/ลบ
  let sx = 0, sy = 0, row = null, dx = 0, horiz = null;
  root.addEventListener('touchstart', e => {
    row = e.target.closest('.td-row'); if (!row) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; horiz = null;
    row.style.transition = 'none';
  }, { passive: true });
  root.addEventListener('touchmove', e => {
    if (!row) return;
    const mx = e.touches[0].clientX - sx, my = e.touches[0].clientY - sy;
    if (horiz === null && Math.abs(mx) + Math.abs(my) > 8) horiz = Math.abs(mx) > Math.abs(my);
    if (!horiz) return;
    const base = ui.swiped === row.dataset.swipeId ? -SWIPE_W : 0;
    dx = Math.max(-SWIPE_W, Math.min(0, base + mx));
    row.style.transform = `translateX(${dx}px)`;
  }, { passive: true });
  root.addEventListener('touchend', () => {
    if (!row) return;
    row.style.transition = '';
    if (horiz) {
      const id = row.dataset.swipeId;
      if (dx < -SWIPE_W / 2) {
        if (ui.swiped && ui.swiped !== id) root.querySelector(`[data-swipe-id="${ui.swiped}"]`)?.style.removeProperty('transform');
        ui.swiped = id; row.style.transform = `translateX(-${SWIPE_W}px)`;
      } else { if (ui.swiped === id) ui.swiped = null; row.style.removeProperty('transform'); }
    }
    row = null;
  });
}
