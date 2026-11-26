// แยกด้าน → Junk journal · สมุดอิสระ เพิ่มกี่หน้าก็ได้ (บลูขอ 26 พ.ย. 2569) · ช่วงที่ 1: เพิ่มรูป ลาก ย่อ หมุน ลบ
// ชิ้นงานวางด้วยสัดส่วนของหน้า (%) → รูปย่อในรายการ = markup เดียวกับหน้าแก้ ขนาดต่างกันได้
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, MONTHS_SHORT } from '../lib/date-th.js';
import { photoURL, savePhoto, removePhoto } from '../lib/photos.js';
import { confirmDelete } from '../ui/confirm.js';

const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5 V19 M5 12 H19"/></svg>';
const IMG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="15.5" cy="9.5" r="1.8"/><path d="M4 17 L9.5 11.5 L14 16 L16.5 13.5 L20 17"/></svg>';
const PAPER_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12.5" rx="1.5"/><path d="M7 10 H17 M7 13.5 H14" stroke-linecap="round"/></svg>';
const NOTE_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 4.5 H19.5 V14 L14 19.5 H4.5 Z"/><path d="M14 19.5 V14 H19.5"/></svg>';
const PASTE_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5 V3.5 H15 V5"/><path d="M9 12 H15 M9 15.5 H13"/></svg>';
const TEXT_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 6 H19 M12 6 V19 M9 19 H15"/></svg>';
const TRASH = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 7 H19.5"/><path d="M9.5 7 V4.5 H14.5 V7"/><path d="M6.5 7 L7.5 20 H16.5 L17.5 7"/></svg>';

let redraw = () => {};
export const resetSideJunk = () => {};

// ---------- วาดหน้า (ใช้ทั้งรูปย่อและหน้าแก้) ----------
// โพสต์อิท 4 สี (บลูขอ 26 พ.ย. 2569)
export const NOTES = [['yellow', '#F7E58C', 'เหลือง'], ['pink', '#F5C6D3', 'ชมพู'], ['blue', '#C7DAF3', 'ฟ้า'], ['green', '#CFE7B6', 'เขียว']];
const noteBg = c => (NOTES.find(n => n[0] === c) || NOTES[0])[1];
const escT = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// จุดจับมุมขวาล่าง: ลากเพื่อย่อขยาย + หมุน (ใช้เมาส์บนคอมได้)
const HANDLE = '<span class="jj-h" data-jj-h aria-hidden="true"></span>';
function itemHtml(it, sel, editing) {
  const pos = `left:${it.x * 100}%;top:${it.y * 100}%;width:${it.w * 100}%;transform:translate(-50%,-50%) rotate(${it.r}deg)`;
  if (it.kind === 'text') return `<div class="jj-it jj-text${sel ? ' sel' : ''}" data-jj-it="${it.id}" style="${pos}"><div class="jj-tt"${editing ? ' contenteditable="true" data-jj-nt' : ''} aria-label="ข้อความ">${escT(it.text || '')}</div>${sel ? HANDLE : ''}</div>`;
  if (it.kind === 'note') return `<div class="jj-it jj-note${sel ? ' sel' : ''}" data-jj-it="${it.id}" style="${pos};background:${noteBg(it.color)}"><div class="jj-nt"${editing ? ' contenteditable="true" data-jj-nt' : ''} aria-label="ข้อความโพสต์อิท">${escT(it.text || '')}</div>${sel ? HANDLE : ''}</div>`;
  const u = photoURL('jj-' + it.img, () => redraw());
  return `<div class="jj-it${sel ? ' sel' : ''}" data-jj-it="${it.id}" style="left:${it.x * 100}%;top:${it.y * 100}%;width:${it.w * 100}%;aspect-ratio:${1 / it.ar};transform:translate(-50%,-50%) rotate(${it.r}deg)">${u ? `<img src="${u}" alt="" draggable="false">` : ''}${sel ? HANDLE : ''}</div>`;
}
// กระดาษ (บลูขอ 26 พ.ย. 2569) · texture วาดด้วย CSS ไม่ต้องโหลดรูป
export const PAPERS = [['cream', 'ครีม'], ['lined', 'มีเส้น'], ['grid', 'ตาราง'], ['dot', 'จุด'], ['kraft', 'คราฟต์'], ['green', 'เขียว']];
const pageHtml = (pg, sel = null, editing = null) => `<div class="jj-page pp-${pg.paper || 'cream'}">${pg.items.map(it => itemHtml(it, it.id === sel, it.id === editing)).join('')}</div>`;

export function renderSideJunk() {
  const d = getData(), pages = [...(d.junk || [])].reverse(); // ใหม่สุดก่อน
  const back = location.hash.split('/')[2] === 'today' ? 'วันนี้' : 'แยกด้าน';
  return `<div class="side">
    <button type="button" class="side-back" data-side-back>${BACK}${back}</button>
    <div class="jj-head"><h1 class="h-page side-title" style="margin:0">Junk journal</h1>
      <button type="button" class="mo-add" aria-label="เพิ่มหน้าใหม่" data-jj-new>${PLUS}</button></div>
    ${pages.length ? `<div class="jj-grid">${pages.map(pg => { const t = new Date(pg.createdAt); return `<button type="button" class="jj-thumb" aria-label="เปิดหน้า ${t.getDate()} ${MONTHS_SHORT[t.getMonth()]}" data-jj-open="${pg.id}">${pageHtml(pg)}<span class="jj-date">${DAYS_SHORT[t.getDay()]} ${t.getDate()} ${MONTHS_SHORT[t.getMonth()]}</span></button>`; }).join('')}</div>`
      : '<div class="ip-empty">ยังไม่มีหน้า กด + เพื่อเริ่มหน้าแรก</div>'}
  </div>`;
}

export function mountSideJunk(root, rerender) {
  redraw = rerender;
  root.addEventListener('click', e => {
    if (e.target.closest('[data-jj-new]')) return openEditor(null, rerender);
    const o = e.target.closest('[data-jj-open]'); if (o) openEditor(o.dataset.jjOpen, rerender);
  });
}

// ---------- ย่อรูป: มีพื้นโปร่งใส = PNG ด้านยาว 800 · ไม่มี = JPEG 80% ด้านยาว 1200 ----------
async function prepImage(file) {
  const bmp = await createImageBitmap(file);
  const hasAlpha = await (async () => {
    if (!/png|webp|gif|heic/i.test(file.type)) return false;
    const c = document.createElement('canvas'), s = Math.min(1, 200 / Math.max(bmp.width, bmp.height));
    c.width = Math.max(1, Math.round(bmp.width * s)); c.height = Math.max(1, Math.round(bmp.height * s));
    const g = c.getContext('2d'); g.drawImage(bmp, 0, 0, c.width, c.height);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < px.length; i += 4) if (px[i] < 250) return true;
    return false;
  })();
  const max = hasAlpha ? 800 : 1200, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(res => c.toBlob(res, hasAlpha ? 'image/png' : 'image/jpeg', 0.8));
  return { blob, ar: c.height / c.width };
}

// ---------- หน้าแก้ (เต็มจอ ไม่ใช่ sheet) ----------
function openEditor(id, onDone) {
  const d = getData(), old = id ? d.junk.find(p => p.id === id) : null;
  const pg = old ? structuredClone(old) : { id: newId(), createdAt: Date.now(), items: [] };
  let sel = null;
  const ed = document.createElement('div');
  ed.className = 'jj-ed';
  // แถบบน: ยกเลิก / บันทึก · แถบล่าง: เครื่องมือ (มีคำใต้ไอคอน · จอ iPhone วางแถวเดียวได้)
  const bar = () => `<div class="jj-bar"><button type="button" class="jj-tb jj-cancel" data-jj-cancel>ยกเลิก</button>
      <button type="button" class="jj-save" data-jj-done>บันทึก</button></div>`;
  const tools = () => `<div class="jj-tools">
      <label class="jj-ib" aria-label="เพิ่มรูป">${IMG}<small>รูป</small><input type="file" accept="image/*" data-jj-file hidden></label>
      <button type="button" class="jj-ib" aria-label="วางรูปที่คัดลอกไว้" data-jj-paste>${PASTE_IC}<small>วาง</small></button>
      <button type="button" class="jj-ib" aria-label="เพิ่มข้อความ" data-jj-text>${TEXT_IC}<small>ข้อความ</small></button>
      <button type="button" class="jj-ib" aria-label="เพิ่มโพสต์อิท" aria-pressed="${picking === 'note'}" data-jj-note>${NOTE_IC}<small>โพสต์อิท</small></button>
      <button type="button" class="jj-ib" aria-label="เลือกพื้นหลัง" aria-pressed="${picking === 'paper'}" data-jj-paper>${PAPER_IC}<small>พื้นหลัง</small></button>
      ${sel ? `<button type="button" class="jj-ib jj-ib-del" aria-label="ลบชิ้นนี้" data-jj-del>${TRASH}<small>ลบ</small></button>` : ''}</div>`;
  let picking = false, editing = null, toast = '';
  const pick = () => picking === 'note' ? `<div class="jj-papers">${NOTES.map(([k, c, t]) => `<button type="button" class="jj-pp" data-jj-nc="${k}"><span style="background:${c}"></span>${t}</button>`).join('')}</div>`
    : picking === 'paper' ? `<div class="jj-papers">${PAPERS.map(([k, t]) => `<button type="button" class="jj-pp${(pg.paper || 'cream') === k ? ' on' : ''}" aria-pressed="${(pg.paper || 'cream') === k}" data-jj-pp="${k}"><span class="pp-${k}"></span>${t}</button>`).join('')}</div>` : '';
  const draw = () => {
    ed.innerHTML = `${bar()}<div class="jj-stage" data-jj-stage>${pageHtml(pg, sel, editing)}</div>${old ? '<button type="button" class="jj-tb jj-danger jj-delp" data-jj-delpage>ลบหน้านี้</button>' : ''}${pick()}${tools()}${toast ? `<div class="jj-toast" role="status">${toast}</div>` : ''}`;
    const nt = ed.querySelector('[data-jj-nt]'); if (nt) { nt.focus(); const rg = document.createRange(); rg.selectNodeContents(nt); rg.collapse(false); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); }
  };
  const say = t => { toast = t; draw(); setTimeout(() => { toast = ''; if (ed.isConnected) draw(); }, 2200); };
  // จบการพิมพ์โพสต์อิท → เก็บข้อความ
  const stopEdit = () => { if (!editing) return; const nt = ed.querySelector('[data-jj-nt]'), it = pg.items.find(x => x.id === editing); if (nt && it) it.text = nt.innerText.trim(); if (it?.kind === 'text' && !it.text) { pg.items = pg.items.filter(x => x !== it); sel = null; } editing = null; dirty = true; };
  redraw = () => { draw(); };
  draw();
  document.body.append(ed); document.body.classList.add('sh-open');
  const close = () => { ed.remove(); document.body.classList.remove('sh-open'); redraw = onDone; onDone?.(); };
  // แก้ในสำเนา · กด "บันทึก" ถึงจะเก็บ (บลูขอ 26 พ.ย. 2569) · "ยกเลิก" = ทิ้งที่แก้
  let dirty = false;
  const imgsOf = p => new Set((p?.items || []).filter(x => x.img).map(x => x.img));
  const save = () => { const before = imgsOf(old); update(dd => {
    dd.junk ||= []; dd.junkImgs ||= {};
    const i = dd.junk.findIndex(p => p.id === pg.id);
    if (!pg.items.length && i < 0) return; // หน้าใหม่ว่าง = ไม่เก็บ
    pg.updatedAt = Date.now();
    if (i < 0) dd.junk.push(structuredClone(pg)); else dd.junk[i] = structuredClone(pg);
  }); const now = imgsOf(pg); before.forEach(im => !now.has(im) && dropImg(im)); };
  const discard = () => { const keep = imgsOf(old); imgsOf(pg).forEach(im => !keep.has(im) && dropImg(im)); };
  const page = () => ed.querySelector('.jj-page');

  const addImage = async f => {
    const { blob, ar } = await prepImage(f), img = newId();
    await savePhoto('jj-' + img, blob);
    update(dd => { (dd.junkImgs ||= {})[img] = { updatedAt: Date.now() }; });
    const w = ar > 1.3 ? 0.45 : 0.6;
    const it = { id: newId(), img, x: 0.5, y: 0.45, w, ar, r: (Math.random() - 0.5) * 8 }; // ar = สูง/กว้างของรูปจริง
    pg.items.push(it); sel = it.id; dirty = true; draw();
  };
  ed.addEventListener('change', e => { const f = e.target.closest('[data-jj-file]')?.files?.[0]; if (f) addImage(f); });
  // วางรูปจากคลิปบอร์ด (เช่น ยกวัตถุจากแอปรูปภาพ → คัดลอก) · iOS จะเด้งปุ่ม "วาง" ให้ยืนยันอีกครั้ง
  const paste = async () => {
    try {
      for (const ci of await navigator.clipboard.read()) {
        const t = ci.types.find(x => x.startsWith('image/'));
        if (t) return addImage(new File([await ci.getType(t)], 'paste', { type: t }));
      }
      say('ไม่มีรูปที่คัดลอกไว้');
    } catch { say('วางรูปไม่ได้ ลองคัดลอกรูปใหม่อีกครั้ง'); }
  };
  const onPaste = e => { // คอม: ⌘V
    if (!ed.isConnected) return document.removeEventListener('paste', onPaste);
    if (editing) return;
    const f = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith('image/'));
    if (f) { e.preventDefault(); addImage(f); }
  };
  document.addEventListener('paste', onPaste);
  ed.addEventListener('click', async e => {
    if (e.target.closest('[data-jj-done]')) { stopEdit(); save(); document.removeEventListener('paste', onPaste); close(); return; }
    if (e.target.closest('[data-jj-cancel]')) {
      stopEdit();
      if (dirty && !await confirmDelete({ title: 'ทิ้งสิ่งที่แก้ไว้?', body: 'สิ่งที่แก้ในหน้านี้ตั้งแต่บันทึกครั้งล่าสุดจะหายไป', ok: 'ทิ้ง', cancel: 'แก้ต่อ' })) return;
      discard(); document.removeEventListener('paste', onPaste); close(); return;
    }
    if (e.target.closest('[data-jj-paper]')) { stopEdit(); picking = picking === 'paper' ? false : 'paper'; draw(); return; }
    if (e.target.closest('[data-jj-note]')) { stopEdit(); picking = picking === 'note' ? false : 'note'; draw(); return; }
    if (e.target.closest('[data-jj-paste]')) { stopEdit(); paste(); return; }
    if (e.target.closest('[data-jj-text]')) {
      stopEdit(); const it = { id: newId(), kind: 'text', text: '', x: 0.5, y: 0.4, w: 0.45, r: 0 };
      pg.items.push(it); sel = editing = it.id; picking = false; draw(); return;
    }
    const nc = e.target.closest('[data-jj-nc]');
    if (nc) {
      const it = { id: newId(), kind: 'note', color: nc.dataset.jjNc, text: '', x: 0.5, y: 0.45, w: 0.3, r: (Math.random() - 0.5) * 6 };
      pg.items.push(it); sel = editing = it.id; picking = false; draw(); return;
    }
    const pp = e.target.closest('[data-jj-pp]'); if (pp) { pg.paper = pp.dataset.jjPp; dirty = true; draw(); return; }
    if (e.target.closest('[data-jj-del]')) {
      const it = pg.items.find(x => x.id === sel);
      if (!await confirmDelete({ title: it?.kind === 'note' ? 'ลบโพสต์อิทนี้?' : it?.kind === 'text' ? 'ลบข้อความนี้?' : 'ลบรูปนี้ออกจากหน้า?' })) return;
      pg.items = pg.items.filter(x => x.id !== sel); sel = editing = null;
      dirty = true; draw(); return; // รูปที่ไม่ใช้แล้วลบตอนบันทึก
    }
    if (e.target.closest('[data-jj-delpage]')) {
      if (!await confirmDelete({ title: 'ลบหน้านี้ทั้งหน้า?', body: 'รูปทั้งหมดในหน้านี้จะหายไปด้วย' })) return;
      update(dd => { dd.junk = dd.junk.filter(p => p.id !== pg.id); });
      new Set([...imgsOf(old), ...imgsOf(pg)]).forEach(im => dropImg(im));
      close(); return;
    }
  });

  // ---------- ลาก (1 นิ้ว) · ย่อขยาย + หมุน (2 นิ้ว) ----------
  const pts = new Map(); let g = null, tap = null;
  const begin = () => {
    const it = pg.items.find(x => x.id === sel); if (!it) { g = null; return; }
    const r = page().getBoundingClientRect(), p = [...pts.values()];
    g = { it, r, x: it.x, y: it.y, w: it.w, rot: it.r, p0: p.map(q => ({ ...q })) };
  };
  ed.addEventListener('pointerdown', e => {
    if (!e.target.closest('[data-jj-stage]')) return;
    if (editing) { if (e.target.closest('[data-jj-nt]')) return; stopEdit(); draw(); return; } // แตะนอกโพสต์อิท = พิมพ์เสร็จ
    const hit = e.target.closest('[data-jj-it]');
    if (pts.size === 0) {
      const ns = hit?.dataset.jjIt || null;
      tap = { again: ns && ns === sel, x: e.clientX, y: e.clientY, moved: false };
      if (ns !== sel) { sel = ns; ed.querySelector('.jj-tools').outerHTML = tools(); ed.querySelectorAll('.jj-it').forEach(el => { const on = el.dataset.jjIt === sel; el.classList.toggle('sel', on); el.querySelector('.jj-h')?.remove(); if (on) el.insertAdjacentHTML('beforeend', HANDLE); }); }
      if (!sel) return;
      // แตะชิ้นไหน ชิ้นนั้นขึ้นมาบนสุด
      const i = pg.items.findIndex(x => x.id === sel);
      if (i < pg.items.length - 1) { pg.items.push(pg.items.splice(i, 1)[0]); const el = ed.querySelector(`[data-jj-it="${sel}"]`); el.parentNode.append(el); }
    }
    if (!sel) return;
    try { ed.querySelector('[data-jj-stage]').setPointerCapture(e.pointerId); } catch {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); begin(); e.preventDefault();
    if (g && pts.size === 1 && e.target.closest('[data-jj-h]')) { const b = ed.querySelector(`[data-jj-it="${sel}"]`).getBoundingClientRect(); g.c = { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
  });
  ed.addEventListener('pointermove', e => {
    if (!g || !pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 5) tap.moved = true;
    const p = [...pts.values()], { it, r } = g;
    if (p.length === 1 && g.c) { // ลากจุดจับ: ระยะจากกลาง = ขนาด · มุม = การหมุน
      const { c } = g, a0 = g.p0[0];
      it.w = Math.min(1.6, Math.max(0.08, g.w * Math.hypot(p[0].x - c.x, p[0].y - c.y) / Math.max(1, Math.hypot(a0.x - c.x, a0.y - c.y))));
      it.r = g.rot + (Math.atan2(p[0].y - c.y, p[0].x - c.x) - Math.atan2(a0.y - c.y, a0.x - c.x)) * 180 / Math.PI;
    } else if (p.length === 1) {
      it.x = Math.min(1.05, Math.max(-0.05, g.x + (p[0].x - g.p0[0].x) / r.width));
      it.y = Math.min(1.05, Math.max(-0.05, g.y + (p[0].y - g.p0[0].y) / r.height));
    } else if (g.p0.length >= 2) {
      const [a0, b0] = g.p0, [a, b] = p;
      const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y), d1 = Math.hypot(b.x - a.x, b.y - a.y);
      const ang0 = Math.atan2(b0.y - a0.y, b0.x - a0.x), ang1 = Math.atan2(b.y - a.y, b.x - a.x);
      it.w = Math.min(1.6, Math.max(0.08, g.w * d1 / d0));
      it.r = g.rot + (ang1 - ang0) * 180 / Math.PI;
      it.x = g.x + ((a.x + b.x) / 2 - (a0.x + b0.x) / 2) / r.width;
      it.y = g.y + ((a.y + b.y) / 2 - (a0.y + b0.y) / 2) / r.height;
    }
    const el = ed.querySelector(`[data-jj-it="${it.id}"]`);
    Object.assign(el.style, { left: it.x * 100 + '%', top: it.y * 100 + '%', width: it.w * 100 + '%', transform: `translate(-50%,-50%) rotate(${it.r}deg)` });
  });
  ed.addEventListener('wheel', e => {
    const it = pg.items.find(x => x.id === sel); if (!it || !e.ctrlKey) return;
    e.preventDefault(); it.w = Math.min(1.6, Math.max(0.08, it.w * Math.exp(-e.deltaY / 200)));
    ed.querySelector(`[data-jj-it="${it.id}"]`).style.width = it.w * 100 + '%'; dirty = true;
  }, { passive: false });
  const end = e => {
    if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId);
    if (pts.size) { if (tap) tap.moved = true; begin(); return; }
    g = null; if (tap?.moved || !tap) dirty = true;
    // แตะโพสต์อิทที่เลือกอยู่อีกครั้ง (ไม่ลาก) = พิมพ์ข้อความ
    if (tap?.again && !tap.moved && ['note', 'text'].includes(pg.items.find(x => x.id === sel)?.kind)) { editing = sel; draw(); }
    tap = null;
  };
  ed.addEventListener('pointerup', end); ed.addEventListener('pointercancel', end);
}

// ลบตัวรูปเมื่อไม่มีหน้าไหนใช้แล้ว
function dropImg(img) {
  const used = getData().junk.some(p => p.items.some(it => it.img === img));
  if (used) return;
  update(dd => { delete dd.junkImgs?.[img]; });
  removePhoto('jj-' + img);
}
