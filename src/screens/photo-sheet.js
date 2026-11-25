// เพิ่ม/เปลี่ยนภาพ · บอร์ด Side-PhotoAdd · ถ่ายภาพ / เลือกจากคลังภาพ · เอาภาพออก · โน้ตสั้น ๆ 100 ตัวอักษร
import { getData, update } from '../store.js';
import { DAYS_SHORT, MONTHS_SHORT, fromKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { photoURL, shrink, savePhoto, removePhoto } from '../lib/photos.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5 L17.5 17.5"/><path d="M17.5 6.5 L6.5 17.5"/></svg>';

export function openPhotoSheet(date, onSaved) {
  const old = getData().photos[date];
  const d0 = fromKey(date);
  const f = { blob: null, url: old ? photoURL(date) : null, removed: false, note: old?.note || '', pos: { ...(old?.pos || { x: 50, y: 50 }) } };
  const body = () => `<div class="pa-img${f.url ? ' crop' : ''}" data-pa-crop>${f.url ? `<img src="${f.url}" alt="" draggable="false" style="object-position:${f.pos.x}% ${f.pos.y}%"><button type="button" class="pa-x" aria-label="เอาภาพออก" data-pa-rm>${X}</button>` : ''}</div>
    ${f.url ? '<div class="pa-hint" style="text-align:center;margin-top:8px">ลากภาพเพื่อเลือกส่วนที่จะแสดงในกรอบ</div>' : ''}
    <div class="pa-btns"><label class="pa-btn">ถ่ายภาพ<input type="file" accept="image/*" capture="environment" data-pa-file hidden></label><label class="pa-btn">เลือกจากคลังภาพ<input type="file" accept="image/*" data-pa-file hidden></label></div>
    <label class="pa-note"><span class="pa-nl">โน้ตสั้น ๆ</span><textarea maxlength="100" rows="2" aria-label="โน้ตสั้น ๆ" data-pa-note>${esc(f.note)}</textarea><span class="pa-cnt" data-pa-cnt>${f.note.length}/100</span></label>
    <div class="pa-hint">เก็บได้วันละ 1 ภาพ ถ้าเลือกใหม่จะแทนภาพเดิม</div>
    <button type="button" class="btn-primary" style="margin-top:16px" data-pa-save>บันทึก</button>`;
  openSheet({
    title: `${old ? 'เปลี่ยนภาพ' : 'เพิ่มภาพ'} · ${DAYS_SHORT[d0.getDay()]} ${d0.getDate()} ${MONTHS_SHORT[d0.getMonth()]}`, body,
    mount(el, close, render) {
      if (old && !f.url) photoURL(date, () => { f.url = photoURL(date); render(); });
      el.addEventListener('input', e => { if (e.target.matches('[data-pa-note]')) { f.note = e.target.value.slice(0, 100); el.querySelector('[data-pa-cnt]').textContent = `${f.note.length}/100`; } });
      el.addEventListener('change', async e => {
        const inp = e.target.closest('[data-pa-file]'); const file = inp?.files?.[0]; if (!file) return;
        f.blob = await shrink(file); f.url = URL.createObjectURL(f.blob); f.removed = false; f.pos = { x: 50, y: 50 }; render();
      });
      // ลากเลื่อนภาพในกรอบสแตมป์ → เก็บเป็น object-position (%)
      let drag = null;
      el.addEventListener('pointerdown', e => {
        const box = e.target.closest('[data-pa-crop]'), img = box?.querySelector('img');
        if (!img || e.target.closest('[data-pa-rm]') || !img.naturalWidth) return;
        const bw = box.clientWidth, bh = box.clientHeight, sc = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
        drag = { img, x0: e.clientX, y0: e.clientY, p0: { ...f.pos }, ox: img.naturalWidth * sc - bw, oy: img.naturalHeight * sc - bh };
        box.setPointerCapture(e.pointerId); e.preventDefault();
      });
      el.addEventListener('pointermove', e => {
        if (!drag) return;
        const cl = v => Math.round(Math.min(100, Math.max(0, v)));
        if (drag.ox > 0) f.pos.x = cl(drag.p0.x - (e.clientX - drag.x0) / drag.ox * 100);
        if (drag.oy > 0) f.pos.y = cl(drag.p0.y - (e.clientY - drag.y0) / drag.oy * 100);
        drag.img.style.objectPosition = `${f.pos.x}% ${f.pos.y}%`;
      });
      const end = () => { drag = null; };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('click', async e => {
        if (e.target.closest('[data-pa-rm]')) { f.blob = null; f.url = null; f.removed = true; render(); return; }
        if (!e.target.closest('[data-pa-save]')) return;
        if (!f.blob && !old) return; // ยังไม่ได้เลือกภาพ
        if (f.removed && !f.blob) {
          if (!await confirmDelete({ title: `ลบภาพวันที่ ${d0.getDate()} ${MONTHS_SHORT[d0.getMonth()]}?` })) return;
          await removePhoto(date);
          update(d => { delete d.photos[date]; });
        } else {
          if (f.blob) await savePhoto(date, f.blob);
          update(d => { d.photos[date] = { note: f.note.trim(), pos: { ...f.pos }, updatedAt: Date.now() }; });
        }
        close(); onSaved?.();
      });
    },
  });
}

// แก้ไข/เพิ่มคำอธิบายของภาพ (ไม่ต้องเลือกภาพใหม่)
export function openNoteSheet(date, onSaved) {
  const d0 = fromKey(date);
  let note = getData().photos[date]?.note || '';
  openSheet({
    title: `${note ? 'แก้ไขคำอธิบาย' : 'เพิ่มคำอธิบาย'} · ${DAYS_SHORT[d0.getDay()]} ${d0.getDate()} ${MONTHS_SHORT[d0.getMonth()]}`,
    body: () => `<label class="pa-note" style="margin-top:0"><span class="pa-nl">โน้ตสั้น ๆ</span><textarea maxlength="100" rows="3" aria-label="โน้ตสั้น ๆ" data-pa-note>${esc(note)}</textarea><span class="pa-cnt" data-pa-cnt>${note.length}/100</span></label>
      <button type="button" class="btn-primary" style="margin-top:16px" data-pa-save>บันทึก</button>`,
    mount(el, close) {
      el.addEventListener('input', e => { if (e.target.matches('[data-pa-note]')) { note = e.target.value.slice(0, 100); el.querySelector('[data-pa-cnt]').textContent = `${note.length}/100`; } });
      el.addEventListener('click', e => {
        if (!e.target.closest('[data-pa-save]')) return;
        update(d => { if (d.photos[date]) { d.photos[date].note = note.trim(); d.photos[date].updatedAt = Date.now(); } });
        close(); onSaved?.();
      });
    },
  });
}
