// Quick note · บอร์ด Today-Expanded (ค่าเริ่ม = วันนี้) / Today-Many (เปลี่ยนวัน)
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { todayKey } from '../lib/date-th.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Quick note ผูกกับวันนี้เสมอ (บลูกำหนด 22 พ.ย. 2569: ไม่มีแถวเลือกวัน)
// editId = แก้โน้ตเดิม (มีปุ่มลบ แบบบอร์ด Add-Edit)
export function openQuickNote(onSaved, editId = null) {
  const orig = editId ? getData().quickNotes.find(n => n.id === editId) : null;
  const st = { text: orig?.text || '' };
  openSheet({
    title: 'Quick note',
    body: () => `
      <div style="margin-top:4px"><textarea class="qn-text" aria-label="Quick note" placeholder="จดสั้น ๆ">${esc(st.text)}</textarea></div>
      <div class="btn-row" style="margin-top:16px">${orig ? '<button type="button" class="btn-secondary" data-qn-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-qn-save>บันทึก</button></div>`,
    mount(el, close) {
      el.addEventListener('input', e => { if (e.target.classList.contains('qn-text')) st.text = e.target.value; });
      el.addEventListener('click', async e => {
        if (e.target.closest('[data-qn-del]')) {
          if (await confirmDelete({ title: 'ลบ Quick note นี้?' })) {
            update(d => { d.quickNotes = d.quickNotes.filter(n => n.id !== editId); });
            close(); onSaved?.();
          }
          return;
        }
        if (!e.target.closest('[data-qn-save]')) return;
        const text = st.text.trim();
        if (!text) { el.querySelector('.qn-text').focus(); return; }
        if (orig) {
          update(d => { const x = d.quickNotes.find(n => n.id === editId); if (x) x.text = text; });
          close(); onSaved?.();
          return;
        }
        const n = new Date();
        const time = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
        update(d => d.quickNotes.push({ id: newId(), date: todayKey(), time, text }));
        close();
        onSaved?.();
      });
      setTimeout(() => el.querySelector('.qn-text')?.focus(), 250);
    },
  });
}

const PENCIL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/></svg>';

// กล่อง Quick note ของวันนี้ ท้ายหน้าวันนี้ · ใช้สไตล์เดียวกับแผงวันในปฏิทิน (Cal-Month)
export function renderQuickNotesToday(key = todayKey()) {
  const list = getData().quickNotes.filter(n => n.date === key).sort((a, b) => (a.time < b.time ? -1 : 1));
  return list.map(n => `<div class="qn-box"><div class="qn-box-h"><span>Quick note</span><span class="qn-box-r"><span style="font-weight:400">${n.time}</span><button type="button" class="qn-edit" aria-label="แก้ไข Quick note" data-qn-edit="${n.id}">${PENCIL}</button></span></div><div class="qn-box-t">${esc(n.text)}</div></div>`).join('');
}
