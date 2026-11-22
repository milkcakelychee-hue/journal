// เพิ่ม/แก้กิจกรรม · บอร์ด Add-New / Add-Filled / Add-Edit
// หมวด → Pick-Cat → Cat-New (หน้าย่อยในแผ่นเดียวกัน) · คน → Pick-Person → Pick-PersonNew · ที่ → Pick-Place → Pick-PlaceNew
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, fromKey, toKey, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { timeWheelHtml, mountTimeWheel } from '../ui/timewheel.js';
import { catColor, catIcon, CAT_COLORS, CAT_ICONS } from '../lib/categories.js';
const PLUS16 = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = (p, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const CAL = ic('<rect x="4" y="5.5" width="16" height="15" rx="3.5"/><path d="M4 10.5 H20"/><path d="M8.5 3.5 V7.5"/><path d="M15.5 3.5 V7.5"/>');
const CLOCK = ic('<circle cx="12" cy="12" r="8"/><path d="M12 7.5 V12 L15 14"/>', 20);
const CHEV = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');
const T_CAT = '<svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="6" width="16" height="16" rx="3.5" fill="#C9C9CE"/><rect x="26" y="6" width="16" height="16" rx="3.5" fill="#C9C9CE"/><rect x="6" y="26" width="16" height="16" rx="3.5" fill="#C9C9CE"/><rect x="26" y="26" width="16" height="16" rx="3.5" fill="#C9C9CE"/></svg>';
const T_PER = '<svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="8" fill="#C9C9CE"/><path d="M8 42 A16 16 0 0 1 40 42 Z" fill="#C9C9CE"/></svg>';
const T_PLC = '<svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="18" r="12" fill="#C9C9CE"/><path d="M13.5 24 L34.5 24 L24 43 Z" fill="#C9C9CE"/></svg>';

const dLabel = k => { const d = fromKey(k); return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };

// openEventSheet({ date } | { id }, onSaved)
export function openEventSheet({ date, id }, onSaved) {
  const d = getData();
  const old = id ? d.events.find(e => e.id === id) : null;
  const f = old
    ? { title: old.title, startDate: old.startDate, endDate: old.endDate || old.startDate, time: old.time || null, categoryId: old.categoryId || null, peopleIds: [...(old.peopleIds || [])], placeId: old.placeId || null }
    : { title: '', startDate: date || todayKey(), endDate: date || todayKey(), time: null, categoryId: null, peopleIds: [], placeId: null };
  let wheel = false;
  let view = 'form'; // form | cat | catnew | person | personnew | place | placenew | date
  let rg = null; // ร่างช่วงวัน { startDate, endDate, edit: 'startDate'|'endDate', y, m }
  let pn = ''; // ชื่อคน/ที่ใหม่
  let cn = null; // ร่างหมวดใหม่ { name, color, icon }

  const tile = (key, icon, label, value, bg = '') => `<button type="button" class="ea-tile${value ? ' on' : ''}" aria-label="${label}" data-ea-pick="${key}"${bg ? ` style="background:${bg}"` : ''}>${icon}
    <span class="ea-tl">${value ? `<span class="ea-tv">${esc(value)}</span><span class="ea-tk">${label}</span>` : `<span class="ea-tv">${label}</span>`}</span></button>`;
  const dateField = (key, label, active = false) => `<div class="ea-col"><div class="ea-lab">${label}</div>
    <button type="button" class="ea-date${active ? ' on' : ''}" aria-label="${label} ${dLabel(rangeOf(key))}" data-ea-date="${key}"><span class="ea-ico">${CAL}</span><span>${dLabel(rangeOf(key))}</span></button></div>`;
  const rangeOf = key => (view === 'date' ? rg : f)[key];

  // หน้าเลือกหมวด · Pick-Cat / Pick-CatEmpty
  const catPage = () => {
    const cats = [...getData().categories].sort((a, b) => a.order - b.order);
    return `${cats.length ? `<div class="pc-grid">${cats.map(c => `<button type="button" class="pc-tile${c.id === f.categoryId ? ' on' : ''}" aria-pressed="${c.id === f.categoryId}" aria-label="${esc(c.name)}" style="background:${catColor(c).tile}" data-ea-cat="${c.id}"><span>${catIcon(c)}</span><span class="pc-name">${esc(c.name)}</span></button>`).join('')}</div>`
      : '<div class="pc-empty">ยังไม่มีหมวด · บันทึกแบบไม่มีหมวดได้ (ป้ายสีเทา)</div>'}
      <div class="pc-row"><button type="button" class="pc-none${f.categoryId ? '' : ' on'}" aria-pressed="${!f.categoryId}" data-ea-cat="">ไม่มีหมวด</button>
        <button type="button" class="pc-new" data-ea-catnew>${PLUS16}หมวดใหม่</button></div>`;
  };

  // หมวดใหม่ · Cat-New (ค่าเริ่มต้นตามบอร์ด: สีแรก · ไอคอนสุดท้าย)
  const COLOR_NAMES = ['งาน', 'ส่วนตัว', 'เรียน', 'สังคม', 'ครอบครัว', 'สุขภาพ', 'เดินทาง', 'อื่น ๆ'];
  const catNewPage = () => `<div class="ea">
      <div class="cn-prev"><span class="cn-chip" style="background:${CAT_COLORS[cn.color].tile}">${CAT_ICONS[cn.icon](16)}<span data-cn-prev>${esc(cn.name.trim() || 'ชื่อหมวด')}</span></span></div>
      <div><div class="ea-lab">ชื่อหมวด</div><input type="text" class="ea-input" aria-label="ชื่อหมวด" placeholder="ชื่อหมวด" value="${esc(cn.name)}" data-cn-name></div>
      <div><div class="ea-lab">สี</div><div class="cn-colors">${CAT_COLORS.map((c, i) => `<button type="button" class="cn-color" aria-pressed="${i === cn.color}" aria-label="สี ${COLOR_NAMES[i]}" data-cn-color="${i}"><span class="${i === cn.color ? 'on' : ''}" style="background:${c.tile}"></span></button>`).join('')}</div></div>
      <div><div class="ea-lab">ไอคอน</div><div class="cn-icons">${CAT_ICONS.map((f, i) => `<button type="button" class="cn-icon${i === cn.icon ? ' on' : ''}" aria-pressed="${i === cn.icon}" aria-label="ไอคอน ${i + 1}" data-cn-icon="${i}">${f(26)}</button>`).join('')}</div></div>
    </div>
    <div style="margin-top:16px"><button type="button" class="btn-primary" data-cn-save>สร้างหมวด</button></div>`;

  // หน้าเลือกคน · Pick-Person (เลือกได้หลายคน) / Pick-PersonNew
  const personPage = () => {
    const ppl = getData().people;
    const sel = id => f.peopleIds.includes(id);
    return `${ppl.length ? `<div class="pc-grid">${ppl.map(p => `<button type="button" class="pp-tile${sel(p.id) ? ' on' : ''}" aria-pressed="${sel(p.id)}" aria-label="${esc(p.name)}" data-ea-person="${p.id}"><span>${T_PER.replace(/30/g, '28')}</span><span class="pc-name">${esc(p.name)}</span></button>`).join('')}</div>` : ''}
      <div class="pc-row"${ppl.length ? '' : ' style="margin-top:0"'}><button type="button" class="pc-none${f.peopleIds.length ? '' : ' on'}" aria-pressed="${!f.peopleIds.length}" data-ea-person="">ไม่ระบุ</button>
        <button type="button" class="pc-new" data-ea-personnew>${PLUS16}คนใหม่</button></div>`;
  };
  const personNewPage = () => `<input type="text" class="ea-input" aria-label="คนใหม่" placeholder="พิมพ์ชื่อคน" value="${esc(pn)}" data-pn-name>
    <div style="margin-top:16px"><button type="button" class="btn-primary" data-pn-save>เพิ่ม</button></div>`;

  // หน้าเลือกที่ · Pick-Place (เลือกได้ที่เดียว) / Pick-PlaceNew
  const placePage = () => {
    const pl = getData().places;
    return `${pl.length ? `<div class="pc-grid">${pl.map(p => `<button type="button" class="pp-tile${p.id === f.placeId ? ' on' : ''}" aria-pressed="${p.id === f.placeId}" aria-label="${esc(p.name)}" data-ea-place="${p.id}"><span>${T_PLC.replace(/30/g, '28')}</span><span class="pc-name">${esc(p.name)}</span></button>`).join('')}</div>` : ''}
      <div class="pc-row"${pl.length ? '' : ' style="margin-top:0"'}><button type="button" class="pc-none${f.placeId ? '' : ' on'}" aria-pressed="${!f.placeId}" data-ea-place="">ไม่ระบุ</button>
        <button type="button" class="pc-new" data-ea-placenew>${PLUS16}ที่ใหม่</button></div>`;
  };
  const placeNewPage = () => `<input type="text" class="ea-input" aria-label="ที่ใหม่" placeholder="พิมพ์ชื่อสถานที่" value="${esc(pn)}" data-pn-name>
    <div style="margin-top:16px"><button type="button" class="btn-primary" data-pl-save>เพิ่ม</button></div>`;

  // เลือกวัน · Cal-AddRange (ปฏิทินในแผ่นเดียวกัน)
  const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>', 22), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>', 22);
  const datePage = () => {
    const { y, m } = rg, ws = getData().settings.weekStart;
    const off = (new Date(y, m, 1).getDay() - ws + 7) % 7, n = new Date(y, m + 1, 0).getDate();
    const tail = (7 - (off + n) % 7) % 7;
    const multi = rg.startDate !== rg.endDate, tk = todayKey();
    let cells = Array.from({ length: 7 }, (_, i) => `<div class="dr-dn">${DAYS_SHORT[(ws + i) % 7]}</div>`).join('') + '<div class="dr-blank"></div>'.repeat(off);
    for (let i = 1; i <= n; i++) {
      const k = toKey(new Date(y, m, i));
      const end = k === rg.startDate || k === rg.endDate;
      const inR = multi && k >= rg.startDate && k <= rg.endDate;
      const band = !inR ? '' : k === rg.startDate ? 'left:50%;right:0' : k === rg.endDate ? 'left:0;right:50%' : 'left:0;right:0';
      cells += `<button type="button" class="dr-day" aria-label="${i} ${MONTHS[m]}"${k === tk ? ' aria-current="date"' : ''} data-dr-day="${k}">${band ? `<span class="dr-band" style="${band}"></span>` : ''}<span class="dr-num${end ? ' on' : ''}">${i}</span></button>`;
    }
    cells += '<div class="dr-blank"></div>'.repeat(tail);
    const days = Math.round((fromKey(rg.endDate) - fromKey(rg.startDate)) / 864e5) + 1;
    return `<div class="ea-row">${dateField('startDate', 'วันเริ่ม', rg.edit === 'startDate')}${dateField('endDate', 'วันจบ', rg.edit === 'endDate')}</div>
      <div class="dr-nav"><button type="button" class="dr-arrow" aria-label="เดือนก่อน" data-dr-month="-1">${L}</button>
        <div class="dr-title">${MONTHS[m]} <span style="color:var(--muted)">${y + 543}</span></div>
        <button type="button" class="dr-arrow" aria-label="เดือนถัดไป" data-dr-month="1">${R}</button></div>
      <div class="dr-grid">${cells}</div>
      <div style="margin-top:14px"><button type="button" class="btn-primary" data-dr-ok>ตกลง · ${days} วัน</button></div>`;
  };

  const body = () => {
    if (view === 'date') return datePage();
    if (view === 'place') return placePage();
    if (view === 'placenew') return placeNewPage();
    if (view === 'person') return personPage();
    if (view === 'personnew') return personNewPage();
    if (view === 'cat') return catPage();
    if (view === 'catnew') return catNewPage();
    const dd = getData();
    const cat = dd.categories.find(c => c.id === f.categoryId);
    const ppl = f.peopleIds.map(i => dd.people.find(p => p.id === i)).filter(Boolean).map(p => p.name).join(', ');
    const plc = dd.places.find(p => p.id === f.placeId);
    const on = !!f.time;
    return `<div class="ea">
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" aria-label="ชื่อกิจกรรม" placeholder="ชื่อกิจกรรม" value="${esc(f.title)}" data-ea-title></div>
      <div class="ea-row">${dateField('startDate', 'วันเริ่ม')}${dateField('endDate', 'วันจบ')}</div>
      <div><div class="ea-sw-row"><div><div class="ea-sw-t">กำหนดเวลา</div><div class="ea-sw-s">${on ? 'ตั้งเวลาให้กิจกรรม' : 'ปิดไว้ = ทั้งวัน'}</div></div>
        <button type="button" role="switch" aria-checked="${on}" aria-label="กำหนดเวลา" class="ea-sw${on ? ' on' : ''}" data-ea-switch><span></span></button></div>
        ${on ? `<div style="margin-top:6px"><button type="button" class="ea-time${wheel ? ' open' : ''}" aria-label="เวลา" data-ea-time><span class="ea-ico">${CLOCK}</span><span style="flex:1">${f.time}</span><span class="ea-chev">${CHEV}</span></button></div>${wheel ? timeWheelHtml('') : ''}` : ''}</div>
      <div class="ea-tiles">${cat ? tile('cat', `<span style="display:flex;height:30px;align-items:center">${catIcon(cat, 26)}</span>`, 'หมวด', cat.name, catColor(cat).tile) : tile('cat', T_CAT, 'หมวด')}${tile('person', T_PER, 'คน', ppl)}${tile('place', T_PLC, 'ที่', plc?.name)}</div>
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:16px">${old ? '<button type="button" class="btn-secondary" data-ea-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-ea-save>บันทึก</button></div>`;
  };

  openSheet({
    title: old ? 'แก้กิจกรรม' : 'เพิ่มกิจกรรม',
    body,
    mount(el, close, render, head) {
      const title = old ? 'แก้กิจกรรม' : 'เพิ่มกิจกรรม';
      const go = v => { view = v; if (v === 'form') head(title); else if (v === 'cat') head('หมวด', () => go('form')); else if (v === 'catnew') head('หมวดใหม่', () => go('cat'));
        else if (v === 'person') head('คน', () => go('form'));
        else if (v === 'personnew') head('คนใหม่', () => go('person'));
        else if (v === 'place') head('ที่', () => go('form'));
        else if (v === 'placenew') head('ที่ใหม่', () => go('place'));
        else head('เลือกวัน', () => go('form'));
        rerender();
        if (v === 'personnew' || v === 'placenew') el.querySelector('[data-pn-name]')?.focus();
      };
      const rerender = () => {
        render();
        if (view !== 'form') return;
        if (wheel) {
          el.querySelector('.tw-clear')?.remove();
          mountTimeWheel(el, f.time, v => { f.time = v; const s = el.querySelector('[data-ea-time] span:nth-child(2)'); if (s) s.textContent = v; });
        }
      };
      el.addEventListener('input', e => {
        if (e.target.matches('[data-ea-title]')) f.title = e.target.value;
        if (e.target.matches('[data-pn-name]')) pn = e.target.value;
        if (e.target.matches('[data-cn-name]')) { cn.name = e.target.value; el.querySelector('[data-cn-prev]').textContent = cn.name.trim() || 'ชื่อหมวด'; }
      });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-ea-switch],[data-ea-time],[data-ea-save],[data-ea-del],[data-ea-pick],[data-ea-cat],[data-ea-catnew],[data-cn-color],[data-cn-icon],[data-cn-save],[data-ea-person],[data-ea-personnew],[data-pn-save],[data-ea-place],[data-ea-placenew],[data-pl-save],[data-ea-date],[data-dr-day],[data-dr-month],[data-dr-ok]');
        if (!b) return;
        if (b.dataset.eaSwitch !== undefined) { f.time = f.time ? null : '09:00'; wheel = !!f.time; rerender(); }
        else if (b.dataset.eaTime !== undefined) { wheel = !wheel; rerender(); }
        else if (b.dataset.eaPick === 'cat') { wheel = false; go('cat'); }
        else if (b.dataset.eaCat !== undefined) { f.categoryId = b.dataset.eaCat || null; go('form'); }
        else if (b.dataset.eaCatnew !== undefined) { cn = { name: '', color: 0, icon: 7 }; go('catnew'); }
        else if (b.dataset.cnColor) { cn.color = Number(b.dataset.cnColor); rerender(); }
        else if (b.dataset.cnIcon) { cn.icon = Number(b.dataset.cnIcon); rerender(); }
        else if (b.dataset.cnSave !== undefined) {
          const name = cn.name.trim();
          if (!name) { el.querySelector('[data-cn-name]').focus(); return; }
          const id = newId(), pal = CAT_COLORS[cn.color];
          update(dd => { dd.categories.push({ id, name, bg: pal.bg, fg: pal.fg, accent: pal.accent, color: cn.color, icon: cn.icon, order: Math.max(-1, ...dd.categories.map(c => c.order)) + 1 }); });
          f.categoryId = id; go('form');
        }
        else if (b.dataset.eaPick === 'person') { wheel = false; go('person'); }
        else if (b.dataset.eaPerson !== undefined) {
          const id = b.dataset.eaPerson;
          if (!id) { f.peopleIds = []; go('form'); }
          else { f.peopleIds = f.peopleIds.includes(id) ? f.peopleIds.filter(x => x !== id) : [...f.peopleIds, id]; rerender(); }
        }
        else if (b.dataset.eaPersonnew !== undefined) { pn = ''; go('personnew'); }
        else if (b.dataset.pnSave !== undefined) {
          const name = pn.trim();
          if (!name) { el.querySelector('[data-pn-name]').focus(); return; }
          const ex = getData().people.find(p => p.name === name);
          const id = ex ? ex.id : newId();
          if (!ex) update(dd => { dd.people.push({ id, name }); });
          if (!f.peopleIds.includes(id)) f.peopleIds = [...f.peopleIds, id];
          go('person');
        }
        else if (b.dataset.eaDate) {
          const k = b.dataset.eaDate;
          if (view !== 'date') { const d0 = fromKey(f[k]); rg = { startDate: f.startDate, endDate: f.endDate, edit: k, y: d0.getFullYear(), m: d0.getMonth() }; wheel = false; go('date'); }
          else { rg.edit = k; const d0 = fromKey(rg[k]); rg.y = d0.getFullYear(); rg.m = d0.getMonth(); rerender(); }
        }
        else if (b.dataset.drMonth) { const n = rg.m + Number(b.dataset.drMonth); rg.y += Math.floor(n / 12); rg.m = (n + 12) % 12; rerender(); }
        else if (b.dataset.drDay) {
          const k = b.dataset.drDay;
          // แตะวันเริ่ม → ต่อไปเลือกวันจบ · วันจบก่อนวันเริ่ม = เริ่มใหม่ที่วันนั้น
          if (rg.edit === 'startDate' || k < rg.startDate) { rg.startDate = k; if (rg.endDate < k) rg.endDate = k; rg.edit = 'endDate'; }
          else rg.endDate = k;
          rerender();
        }
        else if (b.dataset.drOk !== undefined) { f.startDate = rg.startDate; f.endDate = rg.endDate; go('form'); }
        else if (b.dataset.eaPick === 'place') { wheel = false; go('place'); }
        else if (b.dataset.eaPlace !== undefined) { f.placeId = b.dataset.eaPlace || null; go('form'); }
        else if (b.dataset.eaPlacenew !== undefined) { pn = ''; go('placenew'); }
        else if (b.dataset.plSave !== undefined) {
          const name = pn.trim();
          if (!name) { el.querySelector('[data-pn-name]').focus(); return; }
          const ex = getData().places.find(p => p.name === name);
          const id = ex ? ex.id : newId();
          if (!ex) update(dd => { dd.places.push({ id, name }); });
          f.placeId = id; go('form');
        }
        else if (b.dataset.eaSave !== undefined) {
          const title = f.title.trim();
          if (!title) { el.querySelector('[data-ea-title]').focus(); return; }
          const rec = { ...f, title, endDate: f.endDate === f.startDate ? null : f.endDate };
          update(dd => {
            if (old) Object.assign(dd.events.find(x => x.id === old.id), rec);
            else dd.events.push({ id: newId(), ...rec });
          });
          close(); onSaved?.();
        } else if (b.dataset.eaDel !== undefined) {
          const ok = await confirmDelete({ title: `ลบ "${old.title}"?` });
          if (!ok) return;
          update(dd => { dd.events = dd.events.filter(x => x.id !== old.id); });
          close(); onSaved?.();
        }
      });
    },
  });
}
