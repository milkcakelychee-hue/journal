// บันทึกอาการ · บอร์ด Side-SymLog (+ ป๊อปอัปลบแบบ Side-DrugDelete) · แบบเดียวกับจดยา: ไม่มีแถบสลับ มี "+ เพิ่มอาการใหม่" ในรายการ
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, MONTHS_SHORT, fromKey, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DOWN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10 L12 15 L17 10"/></svg>';
const CLOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8 V12 L15 14"/></svg>';
const PEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/></svg>';
const BIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 L8 20 H16 L17 7"/></svg>';
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const ALL = '';
const EDIT_T = 'แก้ไขอาการ', MAIN_T = 'บันทึกอาการ';
const NEW = '__new'; // ตัวเลือก "+ เพิ่มอาการใหม่" ในรายการ

// logId = แก้บันทึกเดิม
export function openSymSheet(onSaved, logId) {
  const d0 = getData();
  const oldLog = logId ? d0.symptomLog.find(x => x.id === logId) : null;
  const st = {
    view: 'list', filter: ALL, open: null,
    sel: oldLog?.symptomId || (d0.symptoms.length ? null : NEW), note: oldLog?.note || '', time: oldLog?.time || nowHM(), date: oldLog?.date || todayKey(),
    nName: '', nCat: d0.symptomCategories[0]?.id || '', editId: null, cNew: '', prevView: 'list', cDraft: {},
  };
  const catName = id => getData().symptomCategories.find(c => c.id === id)?.name || '';
  const lastLog = id => getData().symptomLog.filter(x => x.symptomId === id).map(x => x.date).sort().pop();

  const dropdown = (key, val, withAll) => {
    const opts = [...(withAll ? [{ id: ALL, name: 'ทั้งหมด' }] : []), ...getData().symptomCategories];
    const label = val === ALL && withAll ? 'ทั้งหมด' : catName(val) || 'อื่น ๆ';
    return `<div class="vn-wrap"><div class="ea-lab">หมวดอาการ</div>
      <button type="button" class="vn-sel${st.open === key ? ' open' : ''}" aria-haspopup="listbox" aria-expanded="${st.open === key}" data-sy-open="${key}"><span>${esc(label)}</span>${DOWN}</button>
      ${st.open === key ? `<div role="listbox" class="vn-list">${opts.map(o => `<div role="option" tabindex="0" aria-selected="${o.id === val}" class="vn-opt${o.id === val ? ' on' : ''}" data-sy-cat="${key}:${o.id}">${esc(o.name)}${o.id === val ? '<span>✓</span>' : ''}</div>`).join('')}<div role="option" tabindex="0" class="vn-opt" data-sy-cats>+ เพิ่มหมวด / แก้ไขหมวด</div></div>` : ''}</div>`;
  };

  const CAL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="15" rx="3.5"/><path d="M4 10.5 H20"/><path d="M8.5 3.5 V7.5"/><path d="M15.5 3.5 V7.5"/></svg>';
  const dLabel = k => { const dt = fromKey(k); return `${k === todayKey() ? 'วันนี้' : DAYS_SHORT[dt.getDay()]} · ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`; };
  const noteTime = () => `<div><div class="ea-lab">หมายเหตุ</div><input type="text" class="ea-input" aria-label="หมายเหตุ" value="${esc(st.note)}" data-sy-note></div>
    <div class="dg-qt"><div style="flex:1.3"><div class="ea-lab">วันที่</div><label class="ea-time pl-date"><span class="ea-ico">${CAL}</span><span style="flex:1">${dLabel(st.date)}</span><input type="date" class="td-dateinput" max="${todayKey()}" aria-label="วันที่" value="${st.date}" data-sy-date></label></div>
      <div style="flex:1"><div class="ea-lab">เวลา</div><label class="ea-time pl-date"><span class="ea-ico">${CLOCK}</span><span style="flex:1">${st.time}</span><input type="time" class="td-dateinput" aria-label="เวลา" value="${st.time}" data-sy-time></label></div></div>`;

  const listBody = () => {
    const d = getData();
    const items = d.symptoms.filter(x => st.filter === ALL || x.categoryId === st.filter);
    const rows = items.map(x => {
      const on = st.sel === x.id, last = lastLog(x.id), dt = last && fromKey(last);
      const sub = [catName(x.categoryId), last ? `จดล่าสุด ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}` : ''].filter(Boolean).join(' · ');
      return `<div class="dg-row"><button type="button" role="radio" aria-checked="${on}" class="dg-pick" data-sy-sel="${x.id}"><span class="dg-radio${on ? ' on' : ''}"></span><span><span class="dg-n${on ? ' on' : ''}">${esc(x.name)}</span>${sub ? `<span class="dg-s">${esc(sub)}</span>` : ''}</span></button>
        <button type="button" class="dg-ic" aria-label="แก้ไข ${esc(x.name)}" data-sy-edit="${x.id}">${PEN}</button><button type="button" class="dg-ic" aria-label="ลบ ${esc(x.name)}" data-sy-del="${x.id}">${BIN}</button></div>`;
    }).join('');
    const nw = st.sel === NEW;
    const newRow = `<div class="dg-row"><button type="button" role="radio" aria-checked="${nw}" class="dg-pick" data-sy-sel="${NEW}"><span class="dg-radio${nw ? ' on' : ''}"></span><span class="dg-n${nw ? ' on' : ''}">+ เพิ่มอาการใหม่</span></button></div>`;
    return `${d.symptoms.length ? dropdown('filter', st.filter, true) : ''}
      <div>${d.symptoms.length ? '<div class="ea-lab">อาการที่เคยจด</div>' : ''}<div class="dg-list" role="radiogroup">${rows}${oldLog ? '' : newRow}</div></div>
      ${nw ? newBody() : ''}
      ${noteTime()}`;
  };
  const newBody = () => `<div><div class="ea-lab">ชื่ออาการ</div><input type="text" class="ea-input" aria-label="ชื่ออาการใหม่" value="${esc(st.nName)}" data-sy-name></div>${dropdown('ncat', st.nCat, false)}`;

  // จัดการหมวดอาการ (หน้าย่อยในแผ่นเดียวกัน)
  const catsBody = () => `<div class="hn"><div class="dg-list">${getData().symptomCategories.map(c => `<div class="dg-row"><input type="text" class="dg-cin" aria-label="ชื่อหมวด" value="${esc(st.cDraft[c.id] ?? c.name)}" data-sy-cname="${c.id}"><button type="button" class="dg-ic" aria-label="ลบ ${esc(c.name)}" data-sy-cdel="${c.id}">${BIN}</button></div>`).join('')}</div>
      <div><div class="ea-lab">เพิ่มหมวด</div><div class="dg-qt"><input type="text" class="ea-input" style="flex:1" aria-label="ชื่อหมวด" placeholder="ชื่อหมวด" value="${esc(st.cNew)}" data-sy-cnew><button type="button" class="btn-secondary dg-cadd" data-sy-cadd>เพิ่ม</button></div></div></div>
      <button type="button" class="btn-primary" style="margin-top:20px" data-sy-csave>บันทึก</button>`;

  const body = () => {
    if (st.view === 'cats') return catsBody();
    if (st.view === 'edit') return `<div class="hn">${newBody()}</div><button type="button" class="btn-primary" style="margin-top:20px" data-sy-editsave>บันทึก</button>`;
    return `<div class="hn">${listBody()}</div>
      <div class="${oldLog ? 'btn-row' : ''}" style="margin-top:20px">${oldLog ? '<button type="button" class="btn-secondary" data-sy-logdel>ลบ</button>' : ''}<button type="button" class="btn-primary" data-sy-save>บันทึก</button></div>`;
  };

  openSheet({
    title: 'บันทึกอาการ', body,
    mount(el, close, render, head) {
      const editBack = () => { Object.assign(st, { view: 'list', nName: '', open: null }); head('บันทึกอาการ'); render(); };
      el.addEventListener('input', e => {
        const t = e.target;
        if (t.matches('[data-sy-note]')) st.note = t.value;
        else if (t.matches('[data-sy-name]')) st.nName = t.value;
        else if (t.matches('[data-sy-cnew]')) st.cNew = t.value;
        else if (t.matches('[data-sy-cname]')) st.cDraft[t.dataset.syCname] = t.value;
      });
      el.addEventListener('change', e => {
        if (e.target.matches('[data-sy-time]') && e.target.value) { st.time = e.target.value; render(); }
        if (e.target.matches('[data-sy-date]') && e.target.value && e.target.value <= todayKey()) { st.date = e.target.value; render(); } });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-sy-cats],[data-sy-cdel],[data-sy-csave],[data-sy-cadd],[data-sy-open],[data-sy-cat],[data-sy-sel],[data-sy-edit],[data-sy-del],[data-sy-save],[data-sy-editsave],[data-sy-logdel]');
        if (!b) { if (st.open && !e.target.closest('.vn-list')) { st.open = null; render(); } return; }
        const ds = b.dataset;
        if (ds.syCats !== undefined) {
          const back = st.view;
          Object.assign(st, { view: 'cats', open: null, prevView: back });
          st.cDraft = {};
          head('หมวดอาการ', () => { st.view = st.prevView; head(st.view === 'edit' ? 'แก้ไขอาการ' : 'บันทึกอาการ', st.view === 'edit' ? editBack : null); render(); });
        } else if (ds.syCsave !== undefined) {
          update(d => { d.symptomCategories.forEach(c => { const v = (st.cDraft[c.id] ?? '').trim(); if (v) c.name = v; }); });
          st.cDraft = {}; onSaved?.();
          st.view = st.prevView; head(st.view === 'edit' ? EDIT_T : MAIN_T, st.view === 'edit' ? editBack : null);
        } else if (ds.syCadd !== undefined) {
          const v = st.cNew.trim(); if (!v) { el.querySelector('[data-sy-cnew]').focus(); return; }
          update(d => { d.symptomCategories.push({ id: newId(), name: v }); }); st.cNew = '';
        } else if (ds.syCdel) {
          const c = getData().symptomCategories.find(x => x.id === ds.syCdel);
          if (!await confirmDelete({ title: `ลบหมวด "${c.name}"?`, body: 'อาการในหมวดนี้จะยังอยู่' })) return;
          update(d => { d.symptomCategories = d.symptomCategories.filter(x => x.id !== c.id); d.symptoms.forEach(x => { if (x.categoryId === c.id) x.categoryId = ''; }); });
          if (st.filter === c.id) st.filter = ALL; if (st.nCat === c.id) st.nCat = getData().symptomCategories[0]?.id || '';
          onSaved?.();
        } else if (ds.syOpen) st.open = st.open === ds.syOpen ? null : ds.syOpen;
        else if (ds.syCat) { const [k, id] = ds.syCat.split(':'); if (k === 'filter') st.filter = id; else st.nCat = id; st.open = null; }
        else if (ds.sySel) st.sel = ds.sySel;
        else if (ds.syEdit) {
          const x = getData().symptoms.find(v => v.id === ds.syEdit);
          Object.assign(st, { view: 'edit', editId: x.id, nName: x.name, nCat: x.categoryId, open: null });
          head('แก้ไขอาการ', editBack);
        } else if (ds.syDel) {
          const x = getData().symptoms.find(v => v.id === ds.syDel);
          if (!await confirmDelete({ title: `ลบ "${x.name}"?`, body: 'ชื่ออาการนี้จะหายจากรายการที่เคยจด<br>บันทึกอาการที่ผ่านมาจะยังอยู่' })) return;
          update(d => { d.symptoms = d.symptoms.filter(y => y.id !== x.id); (d.symptomArchive ||= []).push({ id: x.id, name: x.name, categoryId: x.categoryId }); });
          if (st.sel === x.id) st.sel = getData().symptoms.length ? null : NEW;
          onSaved?.();
        } else if (ds.syEditsave !== undefined) {
          const name = st.nName.trim(); if (!name) { el.querySelector('[data-sy-name]').focus(); return; }
          update(d => { const v = d.symptoms.find(y => y.id === st.editId); if (v) Object.assign(v, { name, categoryId: st.nCat }); });
          Object.assign(st, { view: 'list', nName: '' }); head('บันทึกอาการ'); onSaved?.();
        } else if (ds.syLogdel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${symName(getData(), oldLog.symptomId)}"?` })) return;
          update(d => { d.symptomLog = d.symptomLog.filter(x => x.id !== oldLog.id); });
          close(); onSaved?.(); return;
        } else {
          if (!st.sel) return;
          let symptomId = st.sel;
          if (symptomId === NEW) { // ยาใหม่: เพิ่มเข้ารายการพร้อมจดในครั้งเดียว
            const name = st.nName.trim(); if (!name) { el.querySelector('[data-sy-name]').focus(); return; }
            symptomId = newId();
            update(d => { d.symptoms.push({ id: symptomId, name, categoryId: st.nCat }); });
          }
          const rec = { symptomId, note: st.note.trim(), time: st.time, date: st.date };
          update(d => {
            const ex = oldLog && d.symptomLog.find(x => x.id === oldLog.id);
            if (ex) Object.assign(ex, rec); else d.symptomLog.push({ id: newId(), date: st.date, ...rec });
          });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}

// ชื่ออาการ (รวมอาการที่ลบออกจากรายการแล้ว)
export const symName = (d, id) => (d.symptoms.find(x => x.id === id) || (d.symptomArchive || []).find(x => x.id === id))?.name || '';

export function symSection(d, k) {
  const PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
  const logs = d.symptomLog.filter(x => x.date === k).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  return `<div class="hb-sh hl-sh"><h2>อาการป่วย</h2><button type="button" class="hl-btn" data-sy-add>${PLUS}บันทึกอาการ</button></div>
    ${logs.length ? `<div class="card sy-card">${logs.map(x => `<button type="button" class="dg-log sy-log" data-sy-log="${x.id}"><span class="dg-dot" style="background:#8E7BC4"></span><span class="dg-ln"><span class="sy-n">${esc(symName(d, x.symptomId))}</span>${x.note ? `<span class="dg-s">${esc(x.note)}</span>` : ''}</span><span class="dg-lt">${x.time || ''}</span></button>`).join('')}</div>` : ''}`;
}
