// จดยา · บอร์ด Side-DrugLog / Side-DrugNew / Side-DrugDelete
// เลือกจากยาที่เคยจด (กรองตามหมวด) หรือ "+ เพิ่มยาใหม่" ในรายการเดียวกัน (บลูขอ 22 พ.ย. 2569: ไม่มีแถบสลับ) · แก้/ลบชื่อยาในรายการ · แตะบันทึกในหน้าสุขภาพ = แก้/ลบบันทึกนั้น
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { MONTHS_SHORT, fromKey, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DOWN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10 L12 15 L17 10"/></svg>';
const CLOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8 V12 L15 14"/></svg>';
const PEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/></svg>';
const BIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 L8 20 H16 L17 7"/></svg>';
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const ALL = '';
const EDIT_T = 'แก้ไขยา', MAIN_T = 'จดยา';
const NEW = '__new'; // ตัวเลือก "+ เพิ่มยาใหม่" ในรายการ

// logId = แก้บันทึกเดิม
export function openDrugSheet(onSaved, logId) {
  const d0 = getData();
  const oldLog = logId ? d0.drugLog.find(x => x.id === logId) : null;
  const st = {
    view: 'list', filter: ALL, open: null,
    sel: oldLog?.drugId || (d0.drugs.length ? null : NEW), qty: oldLog?.qty || '', time: oldLog?.time || nowHM(),
    nName: '', nCat: d0.drugCategories[0]?.id || '', editId: null, cNew: '', prevView: 'list', cDraft: {},
  };
  const catName = id => getData().drugCategories.find(c => c.id === id)?.name || '';
  const lastLog = id => getData().drugLog.filter(x => x.drugId === id).map(x => x.date).sort().pop();

  const dropdown = (key, val, withAll) => {
    const opts = [...(withAll ? [{ id: ALL, name: 'ทั้งหมด' }] : []), ...getData().drugCategories];
    const label = val === ALL && withAll ? 'ทั้งหมด' : catName(val) || 'อื่น ๆ';
    return `<div class="vn-wrap"><div class="ea-lab">หมวดยา</div>
      <button type="button" class="vn-sel${st.open === key ? ' open' : ''}" aria-haspopup="listbox" aria-expanded="${st.open === key}" data-dg-open="${key}"><span>${esc(label)}</span>${DOWN}</button>
      ${st.open === key ? `<div role="listbox" class="vn-list">${opts.map(o => `<div role="option" tabindex="0" aria-selected="${o.id === val}" class="vn-opt${o.id === val ? ' on' : ''}" data-dg-cat="${key}:${o.id}">${esc(o.name)}${o.id === val ? '<span>✓</span>' : ''}</div>`).join('')}<div role="option" tabindex="0" class="vn-opt" data-dg-cats>+ เพิ่มหมวด / แก้ไขหมวด</div></div>` : ''}</div>`;
  };

  const qtyTime = () => `<div class="dg-qt"><div style="flex:1"><div class="ea-lab">จำนวน</div><input type="text" class="ea-input" aria-label="จำนวน" value="${esc(st.qty)}" data-dg-qty></div>
      <div style="flex:1"><div class="ea-lab">เวลา</div><label class="ea-time pl-date"><span class="ea-ico">${CLOCK}</span><span style="flex:1">${st.time}</span><input type="time" class="td-dateinput" aria-label="เวลา" value="${st.time}" data-dg-time></label></div></div>`;

  const listBody = () => {
    const d = getData();
    const drugs = d.drugs.filter(x => st.filter === ALL || x.categoryId === st.filter);
    const rows = drugs.map(x => {
      const on = st.sel === x.id, last = lastLog(x.id), dt = last && fromKey(last);
      const sub = [catName(x.categoryId), last ? `จดล่าสุด ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}` : ''].filter(Boolean).join(' · ');
      return `<div class="dg-row"><button type="button" role="radio" aria-checked="${on}" class="dg-pick" data-dg-sel="${x.id}"><span class="dg-radio${on ? ' on' : ''}"></span><span><span class="dg-n${on ? ' on' : ''}">${esc(x.name)}</span>${sub ? `<span class="dg-s">${esc(sub)}</span>` : ''}</span></button>
        <button type="button" class="dg-ic" aria-label="แก้ไข ${esc(x.name)}" data-dg-edit="${x.id}">${PEN}</button><button type="button" class="dg-ic" aria-label="ลบ ${esc(x.name)}" data-dg-del="${x.id}">${BIN}</button></div>`;
    }).join('');
    const nw = st.sel === NEW;
    const newRow = `<div class="dg-row"><button type="button" role="radio" aria-checked="${nw}" class="dg-pick" data-dg-sel="${NEW}"><span class="dg-radio${nw ? ' on' : ''}"></span><span class="dg-n${nw ? ' on' : ''}">+ เพิ่มยาใหม่</span></button></div>`;
    return `${d.drugs.length ? dropdown('filter', st.filter, true) : ''}
      <div>${d.drugs.length ? '<div class="ea-lab">ยาที่เคยจด</div>' : ''}<div class="dg-list" role="radiogroup">${rows}${oldLog ? '' : newRow}</div></div>
      ${nw ? newBody() : ''}
      ${qtyTime()}`;
  };
  const newBody = () => `<div><div class="ea-lab">ชื่อยา</div><input type="text" class="ea-input" aria-label="ชื่อยาใหม่" value="${esc(st.nName)}" data-dg-name></div>${dropdown('ncat', st.nCat, false)}`;

  // จัดการหมวดยา (หน้าย่อยในแผ่นเดียวกัน)
  const catsBody = () => `<div class="hn"><div class="dg-list">${getData().drugCategories.map(c => `<div class="dg-row"><input type="text" class="dg-cin" aria-label="ชื่อหมวด" value="${esc(st.cDraft[c.id] ?? c.name)}" data-dg-cname="${c.id}"><button type="button" class="dg-ic" aria-label="ลบ ${esc(c.name)}" data-dg-cdel="${c.id}">${BIN}</button></div>`).join('')}</div>
      <div><div class="ea-lab">เพิ่มหมวด</div><div class="dg-qt"><input type="text" class="ea-input" style="flex:1" aria-label="ชื่อหมวด" placeholder="ชื่อหมวด" value="${esc(st.cNew)}" data-dg-cnew><button type="button" class="btn-secondary dg-cadd" data-dg-cadd>เพิ่ม</button></div></div></div>
      <button type="button" class="btn-primary" style="margin-top:20px" data-dg-csave>บันทึก</button>`;

  const body = () => {
    if (st.view === 'cats') return catsBody();
    if (st.view === 'edit') return `<div class="hn">${newBody()}</div><button type="button" class="btn-primary" style="margin-top:20px" data-dg-editsave>บันทึก</button>`;
    return `<div class="hn">${listBody()}</div>
      <div class="${oldLog ? 'btn-row' : ''}" style="margin-top:20px">${oldLog ? '<button type="button" class="btn-secondary" data-dg-logdel>ลบ</button>' : ''}<button type="button" class="btn-primary" data-dg-save>บันทึก</button></div>`;
  };

  openSheet({
    title: 'จดยา', body,
    mount(el, close, render, head) {
      const editBack = () => { Object.assign(st, { view: 'list', nName: '', open: null }); head('จดยา'); render(); };
      el.addEventListener('input', e => {
        const t = e.target;
        if (t.matches('[data-dg-qty]')) st.qty = t.value;
        else if (t.matches('[data-dg-name]')) st.nName = t.value;
        else if (t.matches('[data-dg-cnew]')) st.cNew = t.value;
        else if (t.matches('[data-dg-cname]')) st.cDraft[t.dataset.dgCname] = t.value;
      });
      el.addEventListener('change', e => {
        if (e.target.matches('[data-dg-time]') && e.target.value) { st.time = e.target.value; render(); } });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-dg-cats],[data-dg-cdel],[data-dg-csave],[data-dg-cadd],[data-dg-open],[data-dg-cat],[data-dg-sel],[data-dg-edit],[data-dg-del],[data-dg-save],[data-dg-editsave],[data-dg-logdel]');
        if (!b) { if (st.open && !e.target.closest('.vn-list')) { st.open = null; render(); } return; }
        const ds = b.dataset;
        if (ds.dgCats !== undefined) {
          const back = st.view;
          Object.assign(st, { view: 'cats', open: null, prevView: back });
          st.cDraft = {};
          head('หมวดยา', () => { st.view = st.prevView; head(st.view === 'edit' ? 'แก้ไขยา' : 'จดยา', st.view === 'edit' ? editBack : null); render(); });
        } else if (ds.dgCsave !== undefined) {
          update(d => { d.drugCategories.forEach(c => { const v = (st.cDraft[c.id] ?? '').trim(); if (v) c.name = v; }); });
          st.cDraft = {}; onSaved?.();
          st.view = st.prevView; head(st.view === 'edit' ? EDIT_T : MAIN_T, st.view === 'edit' ? editBack : null);
        } else if (ds.dgCadd !== undefined) {
          const v = st.cNew.trim(); if (!v) { el.querySelector('[data-dg-cnew]').focus(); return; }
          update(d => { d.drugCategories.push({ id: newId(), name: v }); }); st.cNew = '';
        } else if (ds.dgCdel) {
          const c = getData().drugCategories.find(x => x.id === ds.dgCdel);
          if (!await confirmDelete({ title: `ลบหมวด "${c.name}"?`, body: 'ยาในหมวดนี้จะยังอยู่' })) return;
          update(d => { d.drugCategories = d.drugCategories.filter(x => x.id !== c.id); d.drugs.forEach(x => { if (x.categoryId === c.id) x.categoryId = ''; }); });
          if (st.filter === c.id) st.filter = ALL; if (st.nCat === c.id) st.nCat = getData().drugCategories[0]?.id || '';
          onSaved?.();
        } else if (ds.dgOpen) st.open = st.open === ds.dgOpen ? null : ds.dgOpen;
        else if (ds.dgCat) { const [k, id] = ds.dgCat.split(':'); if (k === 'filter') st.filter = id; else st.nCat = id; st.open = null; }
        else if (ds.dgSel) st.sel = ds.dgSel;
        else if (ds.dgEdit) {
          const x = getData().drugs.find(v => v.id === ds.dgEdit);
          Object.assign(st, { view: 'edit', editId: x.id, nName: x.name, nCat: x.categoryId, open: null });
          head('แก้ไขยา', editBack);
        } else if (ds.dgDel) {
          const x = getData().drugs.find(v => v.id === ds.dgDel);
          if (!await confirmDelete({ title: `ลบ "${x.name}"?`, body: 'ชื่อยานี้จะหายจากรายการที่เคยจด<br>บันทึกการกินยาที่ผ่านมาจะยังอยู่' })) return;
          update(d => { d.drugs = d.drugs.filter(y => y.id !== x.id); (d.drugArchive ||= []).push({ id: x.id, name: x.name, categoryId: x.categoryId }); });
          if (st.sel === x.id) st.sel = getData().drugs.length ? null : NEW;
          onSaved?.();
        } else if (ds.dgEditsave !== undefined) {
          const name = st.nName.trim(); if (!name) { el.querySelector('[data-dg-name]').focus(); return; }
          update(d => { const v = d.drugs.find(y => y.id === st.editId); if (v) Object.assign(v, { name, categoryId: st.nCat }); });
          Object.assign(st, { view: 'list', nName: '' }); head('จดยา'); onSaved?.();
        } else if (ds.dgLogdel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${drugName(getData(), oldLog.drugId)}"?` })) return;
          update(d => { d.drugLog = d.drugLog.filter(x => x.id !== oldLog.id); });
          close(); onSaved?.(); return;
        } else {
          if (!st.sel) return;
          let drugId = st.sel;
          if (drugId === NEW) { // ยาใหม่: เพิ่มเข้ารายการพร้อมจดในครั้งเดียว
            const name = st.nName.trim(); if (!name) { el.querySelector('[data-dg-name]').focus(); return; }
            drugId = newId();
            update(d => { d.drugs.push({ id: drugId, name, categoryId: st.nCat }); });
          }
          const rec = { drugId, qty: st.qty.trim(), time: st.time };
          update(d => {
            const ex = oldLog && d.drugLog.find(x => x.id === oldLog.id);
            if (ex) Object.assign(ex, rec); else d.drugLog.push({ id: newId(), date: todayKey(), ...rec });
          });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}

// ชื่อยา (รวมยาที่ลบออกจากรายการแล้ว เพื่อให้บันทึกเก่ายังแสดงชื่อได้)
export const drugName = (d, id) => (d.drugs.find(x => x.id === id) || (d.drugArchive || []).find(x => x.id === id))?.name || '';

const DOTC = '#C9C9CE';
export function drugSection(d, k) {
  const PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
  const logs = d.drugLog.filter(x => x.date === k).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  return `<div class="hb-sh hl-sh"><h2>ยา</h2><button type="button" class="hl-btn" data-dg-add>${PLUS}จดยา</button></div>
    ${logs.length ? `<div class="card dg-card">${logs.map(x => `<button type="button" class="dg-log" data-dg-log="${x.id}"><span class="dg-dot" style="background:${DOTC}"></span><span class="dg-ln">${esc(drugName(d, x.drugId))}</span><span class="dg-lq">${esc(x.qty || '')}</span><span class="dg-lt">${x.time || ''}</span></button>`).join('')}</div>` : ''}`;
}
