// แยกด้าน → Junk journal · สมุดอิสระ เพิ่มกี่หน้าก็ได้ (บลูขอ 26 พ.ย. 2569) · ช่วงที่ 1: เพิ่มรูป ลาก ย่อ หมุน ลบ
// ชิ้นงานวางด้วยสัดส่วนของหน้า (%) → รูปย่อในรายการ = markup เดียวกับหน้าแก้ ขนาดต่างกันได้
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, MONTHS_SHORT, toKey, fromKey, be } from '../lib/date-th.js';
import { photoURL, savePhoto, removePhoto } from '../lib/photos.js';
import { confirmDelete } from '../ui/confirm.js';

const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5 V19 M5 12 H19"/></svg>';
const IMG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="15.5" cy="9.5" r="1.8"/><path d="M4 17 L9.5 11.5 L14 16 L16.5 13.5 L20 17"/></svg>';
const PAPER_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12.5" rx="1.5"/><path d="M7 10 H17 M7 13.5 H14" stroke-linecap="round"/></svg>';
const NOTE_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 4.5 H19.5 V14 L14 19.5 H4.5 Z"/><path d="M14 19.5 V14 H19.5"/></svg>';
const PASTE_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5 V3.5 H15 V5"/><path d="M9 12 H15 M9 15.5 H13"/></svg>';
const TEXT_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 6 H19 M12 6 V19 M9 19 H15"/></svg>';
const CROP_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3 V17 H21"/><path d="M3 7 H17 V21"/></svg>';
const PEN_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 L5 15.5 L16 4.5 L19.5 8 L8.5 19 Z"/><path d="M14 6.5 L17.5 10"/></svg>';
const PEN_SIZES = [[3, 'เล็ก'], [6, 'กลาง'], [12, 'ใหญ่']];
const PEN_COLORS = ['#2A2A2C', '#D9675F', '#E58F3A', '#4F9A6E', '#4F6FD8', '#FFFFFF'];
// จุด → เส้นโค้งนุ่ม (quadratic ผ่านจุดกึ่งกลาง)
function smooth(p) {
  if (p.length < 2) return `M${p[0][0]} ${p[0][1]} l0.1 0`;
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) d += ` Q${p[i][0]} ${p[i][1]} ${(p[i][0] + p[i + 1][0]) >> 1} ${(p[i][1] + p[i + 1][1]) >> 1}`;
  const z = p[p.length - 1]; return d + ` L${z[0]} ${z[1]}`;
}
const L_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const R_IC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6 L15.5 12 L9.5 18"/></svg>';
const TRASH = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 7 H19.5"/><path d="M9.5 7 V4.5 H14.5 V7"/><path d="M6.5 7 L7.5 20 H16.5 L17.5 7"/></svg>';

let redraw = () => {};
export const resetSideJunk = () => { lst.idx = 0; };

// ---------- วาดหน้า (ใช้ทั้งรูปย่อและหน้าแก้) ----------
// โพสต์อิท 4 สี (บลูขอ 26 พ.ย. 2569)
export const NOTES = [['yellow', '#F7E58C', 'เหลือง'], ['pink', '#F5C6D3', 'ชมพู'], ['blue', '#C7DAF3', 'ฟ้า'], ['green', '#CFE7B6', 'เขียว']];
const noteBg = c => (NOTES.find(n => n[0] === c) || NOTES[0])[1];
const escT = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// จุดจับมุมขวาล่าง: ลากเพื่อย่อขยาย + หมุน (ใช้เมาส์บนคอมได้)
const HANDLE = '<span class="jj-h" data-jj-h aria-hidden="true"></span>';
function itemHtml(it, sel, editing) {
  const pos = `left:${it.x * 100}%;top:${it.y * 100}%;width:${it.w * 100}%;transform:translate(-50%,-50%) rotate(${it.r}deg)`;
  if (it.kind === 'draw') return `<svg class="jj-draw${sel ? ' sel' : ''}" viewBox="0 0 1000 750" preserveAspectRatio="none" aria-hidden="true"><path d="${it.d}" stroke="${it.color}" stroke-width="${it.size}"/><path class="jj-hit" data-jj-it="${it.id}" d="${it.d}" stroke="transparent" stroke-width="30"/></svg>`;
  // ข้อความ: ตัวหนา · สีตัวอักษร · ไฮไลต์คาด (บลูขอ 27 พ.ย. 2569)
  if (it.kind === 'text') return `<div class="jj-it jj-text${sel ? ' sel' : ''}" data-jj-it="${it.id}" style="${pos}"><div class="jj-tw"><span class="jj-tt${it.hl ? ' hl' : ''}" style="color:${it.color || '#2A2A2C'};font-weight:${it.bold ? 700 : 400}${it.hl ? `;--hl:${it.hl}` : ''}"${editing ? ' contenteditable="true" data-jj-nt' : ''} aria-label="ข้อความ">${escT(it.text || '')}</span></div>${sel ? HANDLE : ''}</div>`;
  if (it.kind === 'note') return `<div class="jj-it jj-note${sel ? ' sel' : ''}" data-jj-it="${it.id}" style="${pos};background:${noteBg(it.color)}"><div class="jj-nt"${editing ? ' contenteditable="true" data-jj-nt' : ''} aria-label="ข้อความโพสต์อิท">${escT(it.text || '')}</div>${sel ? HANDLE : ''}</div>`;
  const u = photoURL('jj-' + it.img, () => redraw());
  // ครอบรูป: crop = ส่วนที่เหลือ (สัดส่วนของรูปเต็ม) · กล่องแสดงแค่ส่วนนั้น รูปเต็มเลื่อนอยู่ข้างใน
  const c = it.crop || { l: 0, t: 0, r: 1, b: 1 }, cw = c.r - c.l, ch = c.b - c.t;
  const im = `left:${-c.l / cw * 100}%;top:${-c.t / ch * 100}%;width:${100 / cw}%;height:${100 / ch}%`;
  return `<div class="jj-it jj-img${sel ? ' sel' : ''}" data-jj-it="${it.id}" style="left:${it.x * 100}%;top:${it.y * 100}%;width:${it.w * 100}%;aspect-ratio:${cw / (ch * it.ar)};transform:translate(-50%,-50%) rotate(${it.r}deg)"><span class="jj-clip">${u ? `<img src="${u}" alt="" draggable="false" style="${im}">` : ''}</span>${sel ? HANDLE : ''}</div>`;
}
// กระดาษ (บลูขอ 26 พ.ย. 2569) · texture วาดด้วย CSS ไม่ต้องโหลดรูป
export const PAPERS = [['cream', 'ครีม'], ['lined', 'มีเส้น'], ['grid', 'ตาราง'], ['dot', 'จุด'], ['kraft', 'คราฟต์'], ['color', 'เลือกสี']]; // 'เลือกสี' = วงล้อสี (บลูขอ 27 พ.ย. 2569) แทนสีเขียว
// หัวกระดาษแบบรูปที่บลูส่ง (27 พ.ย. 2569): วันที่ · วันในสัปดาห์วงวันนั้น · หัวข้อ · ขนาดเป็น % ของหน้า
function headHtml(pg, editing, live) {
  const h = pg.head; if (!h?.on) return '';
  const k = h.date || toKey(new Date(pg.createdAt)), t = fromKey(k), ws = getData().settings.weekStart ?? 1;
  const days = Array.from({ length: 7 }, (_, i) => (ws + i) % 7).map(d => `<span class="${d === t.getDay() ? 'on' : ''}">${DAYS_SHORT[d]}</span>`).join('');
  const date = `${t.getDate()} ${MONTHS_SHORT[t.getMonth()]} ${String(be(t.getFullYear())).slice(-2)}`;
  return `<div class="jj-head-pp"><div class="jj-hr"><span class="jj-hl">date</span>${live ? `<label class="jj-hd">${date}<input type="date" value="${k}" data-jj-hdate aria-label="วันที่หัวกระดาษ"></label>` : `<span class="jj-hd">${date}</span>`}<span class="jj-hw">${days}</span></div>
    <div class="jj-hr jj-ht"><span class="jj-hl">topic</span><span class="jj-htx"${editing ? ' contenteditable="true" data-jj-nt' : ''}${live ? ' data-jj-topic' : ''} aria-label="หัวข้อ">${escT(h.topic || '')}</span></div></div>`;
}
const pageHtml = (pg, sel = null, editing = null, live = false) => `<div class="jj-page pp-${pg.paper === 'green' ? 'color' : pg.paper || 'cream'}"${pg.paper === 'color' || pg.paper === 'green' ? ` style="--pc:${pg.paperColor || '#8FC58A'}"` : ''}>${headHtml(pg, editing === 'topic', live)}${pg.items.map(it => itemHtml(it, it.id === sel, it.id === editing)).join('')}</div>`;

// รายการหน้า: "เล่ม" = เรียงหมุนเป็นวง (coverflow แบบรูปที่บลูส่ง 27 พ.ย. 2569) · "ตาราง" = รูปย่อเรียงลงมา
const lst = { view: 'book', idx: 0 };
const thumbDate = pg => { const t = new Date(pg.createdAt); return `${DAYS_SHORT[t.getDay()]} ${t.getDate()} ${MONTHS_SHORT[t.getMonth()]}`; };
export function renderSideJunk() {
  const d = getData(), pages = [...(d.junk || [])].reverse(); // ใหม่สุดก่อน
  const back = location.hash.split('/')[2] === 'today' ? 'วันนี้' : 'แยกด้าน';
  lst.idx = Math.min(lst.idx, Math.max(0, pages.length - 1));
  const seg = (id, t) => `<button type="button" class="seg-btn${lst.view === id ? ' on' : ''}" aria-pressed="${lst.view === id}" data-jj-view="${id}">${t}</button>`;
  const body = !pages.length ? '<div class="ip-empty">ยังไม่มีหน้า กด + เพื่อเริ่มหน้าแรก</div>'
    : lst.view === 'grid' ? `<div class="jj-grid">${pages.map(pg => `<button type="button" class="jj-thumb" aria-label="เปิดหน้า ${thumbDate(pg)}" data-jj-open="${pg.id}">${pageHtml(pg)}<span class="jj-date">${thumbDate(pg)}</span></button>`).join('')}</div>`
    : `<div class="jj-cf" data-jj-cf>${pages.map((pg, i) => `<button type="button" class="jj-cfi" data-jj-cfi="${i}" data-id="${pg.id}" aria-label="หน้า ${thumbDate(pg)}">${pageHtml(pg)}</button>`).join('')}</div>
      <div class="jj-cf-cap"><button type="button" class="cal-arrow" aria-label="หน้าก่อน" data-jj-cfgo="-1">${L_IC}</button><span class="jj-cf-mid"><span data-jj-cfd>${thumbDate(pages[lst.idx])}</span><span class="jj-cf-n" data-jj-cfn>${lst.idx + 1} / ${pages.length}</span></span><button type="button" class="cal-arrow" aria-label="หน้าถัดไป" data-jj-cfgo="1">${R_IC}</button></div>`;
  return `<div class="side">
    <button type="button" class="side-back" data-side-back>${BACK}${back}</button>
    <div class="jj-head"><h1 class="h-page side-title" style="margin:0">Junk journal</h1>
      <button type="button" class="mo-add" aria-label="เพิ่มหน้าใหม่" data-jj-new>${PLUS}</button></div>
    ${pages.length ? `<div class="seg" style="margin:0">${seg('book', 'เล่ม')}${seg('grid', 'ตาราง')}</div>` : ''}
    ${body}
  </div>`;
}
export function mountSideJunk(root, rerender) {
  redraw = rerender;
  const pages = () => [...(getData().junk || [])].reverse();
  // วางแต่ละหน้าตามระยะจากหน้ากลาง: กลาง = ตรง · ข้าง ๆ = หมุนเอียงซ้อนกันเป็นวง
  let pos = lst.idx;
  const layout = (anim = true) => {
    const items = root.querySelectorAll('[data-jj-cfi]'); if (!items.length) return;
    items.forEach(el => {
      const o = +el.dataset.jjCfi - pos, a = Math.abs(o), sg = Math.sign(o);
      const x = a < 1 ? o * 62 : sg * (62 + (a - 1) * 16), rot = -Math.max(-1, Math.min(1, o)) * 58, z = -Math.min(a, 1) * 120 - Math.max(0, a - 1) * 30;
      el.style.transition = anim ? 'transform .45s cubic-bezier(.16,1,.3,1), opacity .45s' : 'none';
      el.style.transform = `translateX(${x}%) translateZ(${z}px) rotateY(${rot}deg)`;
      el.style.zIndex = 100 - Math.round(a * 10); el.style.opacity = a > 5 ? 0 : 1;
      el.tabIndex = Math.round(o) === 0 ? 0 : -1;
    });
    const ps = pages(), i = Math.round(Math.max(0, Math.min(ps.length - 1, pos)));
    const dd = root.querySelector('[data-jj-cfd]'), nn = root.querySelector('[data-jj-cfn]');
    if (dd) dd.textContent = thumbDate(ps[i]); if (nn) nn.textContent = `${i + 1} / ${ps.length}`;
  };
  const snap = i => { lst.idx = pos = Math.max(0, Math.min(pages().length - 1, i)); layout(); };
  layout(false);
  // เลื่อนด้วยปุ่ม ‹ › (บลูขอ 27 พ.ย. 2569 · ไม่ใช้การลาก)
  root.addEventListener('click', e => {
    if (e.target.closest('[data-jj-new]')) return openEditor(null, rerender);
    const v = e.target.closest('[data-jj-view]'); if (v) { lst.view = v.dataset.jjView; rerender(); return; }
    const cg = e.target.closest('[data-jj-cfgo]'); if (cg) { snap(lst.idx + Number(cg.dataset.jjCfgo)); return; }
    const ci = e.target.closest('[data-jj-cfi]');
    if (ci) { const i = +ci.dataset.jjCfi; if (i !== lst.idx) snap(i); else openEditor(ci.dataset.id, rerender); return; }
    const o = e.target.closest('[data-jj-open]'); if (o) openEditor(o.dataset.jjOpen, rerender);
  });
  root.addEventListener('keydown', e => { if (!root.querySelector('[data-jj-cf]')) return; if (e.key === 'ArrowLeft') snap(lst.idx - 1); if (e.key === 'ArrowRight') snap(lst.idx + 1); });
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
  if (!id) lst.idx = 0; // หน้าใหม่ = อยู่หน้าแรกของเล่ม
  const d = getData(), old = id ? d.junk.find(p => p.id === id) : null;
  const pg = old ? structuredClone(old) : { id: newId(), createdAt: Date.now(), items: [] };
  let sel = null;
  const ed = document.createElement('div');
  ed.className = 'jj-ed';
  // แถบบน: ยกเลิก / บันทึก · แถบล่าง: เครื่องมือ (มีคำใต้ไอคอน · จอ iPhone วางแถวเดียวได้)
  const bar = () => `<div class="jj-bar"><button type="button" class="jj-tb jj-cancel" data-jj-cancel>ยกเลิก</button>
      <button type="button" class="jj-fit" data-jj-fit${view.s > 1 ? '' : ' hidden'}>ดูทั้งหน้า</button>
      <button type="button" class="jj-save" data-jj-done>บันทึก</button></div>`;
  const tools = () => `<div class="jj-tools">
      <label class="jj-ib" aria-label="เพิ่มรูป">${IMG}<small>รูป</small><input type="file" accept="image/*" data-jj-file hidden></label>
      <button type="button" class="jj-ib" aria-label="วางรูปที่คัดลอกไว้" data-jj-paste>${PASTE_IC}<small>วาง</small></button>
      <button type="button" class="jj-ib" aria-label="ปากกา" aria-pressed="${picking === 'pen'}" data-jj-pen>${PEN_IC}<small>ปากกา</small></button>
      <button type="button" class="jj-ib" aria-label="เพิ่มข้อความ" data-jj-text>${TEXT_IC}<small>ข้อความ</small></button>
      <button type="button" class="jj-ib" aria-label="เพิ่มโพสต์อิท" aria-pressed="${picking === 'note'}" data-jj-note>${NOTE_IC}<small>โพสต์อิท</small></button>
      <button type="button" class="jj-ib" aria-label="เลือกพื้นหลัง" aria-pressed="${picking === 'paper'}" data-jj-paper>${PAPER_IC}<small>พื้นหลัง</small></button>
      ${pg.items.find(x => x.id === sel)?.img ? `<button type="button" class="jj-ib" aria-label="ครอบรูป" data-jj-crop>${CROP_IC}<small>ครอบ</small></button>` : ''}
      ${sel ? `<button type="button" class="jj-ib jj-ib-del" aria-label="ลบชิ้นนี้" data-jj-del>${TRASH}<small>ลบ</small></button>` : ''}</div>`;
  let picking = false, editing = null, toast = '';
  // ซูมกระดาษ (บลูขอ 27 พ.ย. 2569): สองนิ้วบนที่ว่าง = ซูม · นิ้วเดียวบนที่ว่างตอนซูมอยู่ = เลื่อน
  const view = { s: 1, x: 0, y: 0 };
  const applyView = () => { const pgEl = ed.querySelector('.jj-page'); if (pgEl) pgEl.style.transform = view.s > 1 ? `translate(${view.x}px,${view.y}px) scale(${view.s})` : ''; ed.querySelector('[data-jj-fit]')?.toggleAttribute('hidden', view.s <= 1); };
  // ปากกา (บลูขอ 27 พ.ย. 2569): เส้นทึบ 3 ขนาด เลือกสีได้ · เปิดโหมดแล้วนิ้วเดียว = วาด
  const pen = { size: 6, color: PEN_COLORS[0] };
  // แถบแต่งข้อความ: ขึ้นเมื่อเลือกกล่องข้อความ · สีใช้วงล้อสีของระบบ (input type=color)
  const textBar = () => { const it = pg.items.find(x => x.id === sel); if (it?.kind !== 'text') return '';
    return `<div class="jj-papers jj-tbar">
      <button type="button" class="jj-tbtn${it.bold ? ' on' : ''}" aria-pressed="${!!it.bold}" data-jj-bold><b>B</b><small>ตัวหนา</small></button>
      <label class="jj-tbtn"><i class="jj-sw" style="background:${it.color || '#2A2A2C'}"></i><small>สีตัวอักษร</small><input type="color" value="${it.color || '#2A2A2C'}" data-jj-tcolor></label>
      <button type="button" class="jj-tbtn${it.hl ? ' on' : ''}" aria-pressed="${!!it.hl}" data-jj-hl><i class="jj-hlic"></i><small>ไฮไลต์</small></button>
      ${it.hl ? `<label class="jj-tbtn"><i class="jj-sw" style="background:${it.hl}"></i><small>สีไฮไลต์</small><input type="color" value="${it.hl}" data-jj-hcolor></label>` : ''}</div>`; };
  const pick = () => picking === 'pen' ? `<div class="jj-papers jj-pens">${PEN_SIZES.map(([z, t]) => `<button type="button" class="jj-pz${pen.size === z ? ' on' : ''}" aria-label="เส้น${t}" aria-pressed="${pen.size === z}" data-jj-pz="${z}"><i style="width:${z * 1.4 + 4}px;height:${z * 1.4 + 4}px;background:${pen.color}"></i></button>`).join('')}<span class="jj-sep"></span>${PEN_COLORS.map(c => `<button type="button" class="jj-pc${pen.color === c ? ' on' : ''}" aria-label="สี ${c}" aria-pressed="${pen.color === c}" data-jj-pc="${c}"><i style="background:${c}"></i></button>`).join('')}</div>`
    : picking === 'note' ? `<div class="jj-papers">${NOTES.map(([k, c, t]) => `<button type="button" class="jj-pp" data-jj-nc="${k}"><span style="background:${c}"></span>${t}</button>`).join('')}</div>`
    : picking === 'paper' ? `<div class="jj-papers"><button type="button" class="jj-pp" aria-pressed="${!!pg.head?.on}" data-jj-head><span class="jj-headsw${pg.head?.on ? ' on' : ''}"></span>หัวกระดาษ</button><span class="jj-sep"></span>${PAPERS.map(([k, t]) => k === 'color'
      ? `<label class="jj-pp${['color', 'green'].includes(pg.paper) ? ' on' : ''}"><span class="pp-color jj-wheel" style="--pc:${pg.paperColor || '#8FC58A'}"></span>${t}<input type="color" value="${pg.paperColor || '#8FC58A'}" data-jj-pcolor aria-label="เลือกสีพื้นหลัง"></label>`
      : `<button type="button" class="jj-pp${(pg.paper || 'cream') === k ? ' on' : ''}" aria-pressed="${(pg.paper || 'cream') === k}" data-jj-pp="${k}"><span class="pp-${k}"></span>${t}</button>`).join('')}</div>` : '';
  const draw = () => {
    ed.innerHTML = `${bar()}<div class="jj-stage" data-jj-stage>${pageHtml(pg, sel, editing, true)}</div>${old ? '<button type="button" class="jj-tb jj-danger jj-delp" data-jj-delpage>ลบหน้านี้</button>' : ''}${pick() || textBar()}${tools()}${toast ? `<div class="jj-toast" role="status">${toast}</div>` : ''}`;
    applyView();
    const nt = ed.querySelector('[data-jj-nt]'); if (nt) { nt.focus(); const rg = document.createRange(); rg.selectNodeContents(nt); rg.collapse(false); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); }
  };
  const say = t => { toast = t; draw(); setTimeout(() => { toast = ''; if (ed.isConnected) draw(); }, 2200); };
  // จบการพิมพ์โพสต์อิท → เก็บข้อความ
  const stopEdit = () => { if (!editing) return; if (editing === 'topic') { const nt = ed.querySelector('[data-jj-nt]'); if (nt) pg.head.topic = nt.innerText.trim(); editing = null; dirty = true; return; } const nt = ed.querySelector('[data-jj-nt]'), it = pg.items.find(x => x.id === editing); if (nt && it) it.text = nt.innerText.trim(); if (it?.kind === 'text' && !it.text) { pg.items = pg.items.filter(x => x !== it); sel = null; } editing = null; dirty = true; };
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
  // วงล้อสี: เปลี่ยนสีสด ๆ ระหว่างเลือก
  ed.addEventListener('input', e => {
    const pcl = e.target.closest('[data-jj-pcolor]');
    if (pcl) { pg.paper = 'color'; pg.paperColor = pcl.value; dirty = true; const pe = ed.querySelector('.jj-stage .jj-page'); pe.className = 'jj-page pp-color'; pe.style.setProperty('--pc', pcl.value); pcl.previousElementSibling.style.setProperty('--pc', pcl.value); ed.querySelectorAll('.jj-papers .jj-pp.on').forEach(x => x.classList.remove('on')); pcl.parentElement.classList.add('on'); return; }
    const tc = e.target.closest('[data-jj-tcolor],[data-jj-hcolor]'); if (!tc) return;
    const it = pg.items.find(x => x.id === sel); if (!it) return;
    const el = ed.querySelector(`[data-jj-it="${it.id}"] .jj-tt`);
    if (tc.dataset.jjTcolor !== undefined) { it.color = tc.value; el.style.color = tc.value; }
    else { it.hl = it.lastHl = tc.value; el.style.setProperty('--hl', tc.value); }
    tc.previousElementSibling.previousElementSibling.style.background = tc.value; dirty = true;
  });
  ed.addEventListener('change', e => {
    const hd = e.target.closest('[data-jj-hdate]'); if (hd) { if (hd.value) { pg.head.date = hd.value; dirty = true; draw(); } return; } const f = e.target.closest('[data-jj-file]')?.files?.[0]; if (f) addImage(f); });
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
    const syncText = () => { const nt = ed.querySelector('[data-jj-nt]'), it = pg.items.find(x => x.id === editing); if (nt && it) it.text = nt.innerText; };
    if (e.target.closest('[data-jj-bold]')) { syncText(); const it = pg.items.find(x => x.id === sel); it.bold = !it.bold; dirty = true; draw(); return; }
    if (e.target.closest('[data-jj-hl]')) { syncText(); const it = pg.items.find(x => x.id === sel); it.hl = it.hl ? undefined : (it.lastHl || '#F7E58C'); if (it.hl) it.lastHl = it.hl; dirty = true; draw(); return; }
    if (e.target.closest('[data-jj-pen]')) { stopEdit(); picking = picking === 'pen' ? false : 'pen'; sel = null; draw(); return; }
    const pz = e.target.closest('[data-jj-pz]'); if (pz) { pen.size = +pz.dataset.jjPz; draw(); return; }
    const pcl = e.target.closest('[data-jj-pc]'); if (pcl) { pen.color = pcl.dataset.jjPc; draw(); return; }
    if (e.target.closest('[data-jj-paper]')) { stopEdit(); picking = picking === 'paper' ? false : 'paper'; draw(); return; }
    if (e.target.closest('[data-jj-note]')) { stopEdit(); picking = picking === 'note' ? false : 'note'; draw(); return; }
    if (e.target.closest('[data-jj-crop]')) { openCrop(pg.items.find(x => x.id === sel)); return; }
    if (e.target.closest('[data-jj-fit]')) { Object.assign(view, { s: 1, x: 0, y: 0 }); applyView(); return; }
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
    if (e.target.closest('[data-jj-head]')) { pg.head = { ...(pg.head || {}), on: !pg.head?.on }; dirty = true; draw(); return; }
    const pp = e.target.closest('[data-jj-pp]'); if (pp) { pg.paper = pp.dataset.jjPp; dirty = true; draw(); return; }
    if (e.target.closest('[data-jj-del]')) {
      const it = pg.items.find(x => x.id === sel);
      if (!await confirmDelete({ title: it?.kind === 'note' ? 'ลบโพสต์อิทนี้?' : it?.kind === 'text' ? 'ลบข้อความนี้?' : it?.kind === 'draw' ? 'ลบเส้นนี้?' : 'ลบรูปนี้ออกจากหน้า?' })) return;
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
    const it = pg.items.find(x => x.id === sel); if (!it || it.kind === 'draw') { g = null; return; } // เส้นปากกา: เลือกเพื่อลบได้ ย้ายไม่ได้
    const r = page().getBoundingClientRect(), p = [...pts.values()];
    g = { it, r, x: it.x, y: it.y, w: it.w, rot: it.r, p0: p.map(q => ({ ...q })) };
  };
  ed.addEventListener('pointerdown', e => {
    if (!e.target.closest('[data-jj-stage]')) return;
    if (editing) { if (e.target.closest('[data-jj-nt]')) return; stopEdit(); draw(); return; } // แตะนอกโพสต์อิท = พิมพ์เสร็จ
    if (e.target.closest('[data-jj-topic]') && picking !== 'pen') { sel = null; editing = 'topic'; draw(); return; }
    if (e.target.closest('[data-jj-hdate]')) return; // เปิดตัวเลือกวันที่ของระบบ
    if (picking === 'pen' && !vpts.size) { // โหมดปากกา
      if (stroke) { // นิ้วที่สองลง = เลิกวาด ไปซูมแทน
        stroke.el.remove(); const first = stroke.first; stroke = null;
        vpts.set(first.id, first); vpts.set(e.pointerId, { x: e.clientX, y: e.clientY }); vbegin(); e.preventDefault(); return;
      }
      const rc = page().getBoundingClientRect(), at = ev => [Math.round((ev.clientX - rc.left) / rc.width * 1000), Math.round((ev.clientY - rc.top) / rc.height * 750)];
      const svg = page().insertAdjacentElement('beforeend', document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
      svg.setAttribute('viewBox', '0 0 1000 750'); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('jj-draw');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('stroke', pen.color); path.setAttribute('stroke-width', pen.size); svg.append(path);
      stroke = { el: svg, path, at, pts: [at(e)], id: e.pointerId, first: { id: e.pointerId, x: e.clientX, y: e.clientY } };
      path.setAttribute('d', smooth(stroke.pts));
      try { ed.querySelector('[data-jj-stage]').setPointerCapture(e.pointerId); } catch {}
      e.preventDefault(); return;
    }
    const hit = e.target.closest('[data-jj-it]');
    if (vpts.size || (pts.size === 0 && !hit)) { // ที่ว่าง → ซูม/เลื่อนกระดาษ
      if (!vpts.size && sel) { sel = null; draw(); }
      try { ed.querySelector('[data-jj-stage]').setPointerCapture(e.pointerId); } catch {}
      vpts.set(e.pointerId, { x: e.clientX, y: e.clientY }); vbegin(); e.preventDefault(); return;
    }
    if (pts.size === 0) {
      const ns = hit?.dataset.jjIt || null;
      tap = { again: ns && ns === sel, x: e.clientX, y: e.clientY, moved: false };
      if (ns !== sel) { sel = ns; draw(); }
      if (!sel) return;
      // แตะชิ้นไหน ชิ้นนั้นขึ้นมาบนสุด
      const i = pg.items.findIndex(x => x.id === sel);
      if (i < pg.items.length - 1 && pg.items[i].kind !== 'draw') { pg.items.push(pg.items.splice(i, 1)[0]); const el = ed.querySelector(`[data-jj-it="${sel}"]`); el.parentNode.append(el); }
    }
    if (!sel) return;
    try { ed.querySelector('[data-jj-stage]').setPointerCapture(e.pointerId); } catch {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); begin(); e.preventDefault();
    if (g && pts.size === 1 && e.target.closest('[data-jj-h]')) { const b = ed.querySelector(`[data-jj-it="${sel}"]`).getBoundingClientRect(); g.c = { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
  });
  // ---------- ครอบรูป: แผงเต็มจอในหน้าแก้ (ไม่ใช่ sheet) · ลากมุม = ปรับขอบ · ลากในกรอบ = เลื่อน ----------
  function openCrop(it) {
    if (!it) return;
    const c = { ...(it.crop || { l: 0, t: 0, r: 1, b: 1 }) }, u = photoURL('jj-' + it.img);
    const pane = document.createElement('div'); pane.className = 'jj-crop';
    const fitW = Math.min(innerWidth - 48, (innerHeight - 220) / it.ar);
    pane.innerHTML = `<div class="jj-bar"><button type="button" class="jj-tb jj-cancel" data-cr-x>ยกเลิก</button><button type="button" class="jj-tb" data-cr-reset>รูปเต็ม</button><button type="button" class="jj-save" data-cr-ok>เสร็จ</button></div>
      <div class="jj-cr-area"><div class="jj-cr-img" style="width:${fitW}px;aspect-ratio:${1 / it.ar}"><img src="${u}" alt="" draggable="false"><div class="jj-cr-box" data-cr-box>${['tl', 'tr', 'bl', 'br'].map(k => `<span class="jj-cr-h c-${k}" data-cr-h="${k}"></span>`).join('')}</div></div></div>`;
    ed.append(pane);
    const box = pane.querySelector('[data-cr-box]'), area = pane.querySelector('.jj-cr-img');
    const show = () => Object.assign(box.style, { left: c.l * 100 + '%', top: c.t * 100 + '%', width: (c.r - c.l) * 100 + '%', height: (c.b - c.t) * 100 + '%' });
    show();
    let dr = null; const MIN = 0.08, cl = v => Math.min(1, Math.max(0, v));
    pane.addEventListener('pointerdown', e => {
      const h = e.target.closest('[data-cr-h]')?.dataset.crH, inBox = e.target.closest('[data-cr-box]'); if (!h && !inBox) return;
      try { pane.setPointerCapture(e.pointerId); } catch {}
      dr = { h, x: e.clientX, y: e.clientY, c0: { ...c }, r: area.getBoundingClientRect() }; e.preventDefault();
    });
    pane.addEventListener('pointermove', e => {
      if (!dr) return;
      const dx = (e.clientX - dr.x) / dr.r.width, dy = (e.clientY - dr.y) / dr.r.height, o = dr.c0;
      if (!dr.h) { const w = o.r - o.l, hh = o.b - o.t; c.l = Math.min(1 - w, Math.max(0, o.l + dx)); c.r = c.l + w; c.t = Math.min(1 - hh, Math.max(0, o.t + dy)); c.b = c.t + hh; }
      else {
        if (dr.h.includes('l')) c.l = Math.min(o.r - MIN, cl(o.l + dx)); else c.r = Math.max(o.l + MIN, cl(o.r + dx));
        if (dr.h.includes('t')) c.t = Math.min(o.b - MIN, cl(o.t + dy)); else c.b = Math.max(o.t + MIN, cl(o.b + dy));
      }
      show();
    });
    const up = () => { dr = null; }; pane.addEventListener('pointerup', up); pane.addEventListener('pointercancel', up);
    pane.addEventListener('click', e => {
      if (e.target.closest('[data-cr-x]')) { pane.remove(); return; }
      if (e.target.closest('[data-cr-reset]')) { Object.assign(c, { l: 0, t: 0, r: 1, b: 1 }); show(); return; }
      if (!e.target.closest('[data-cr-ok]')) return;
      const o = it.crop || { l: 0, t: 0, r: 1, b: 1 };
      it.w *= (c.r - c.l) / (o.r - o.l); // ขนาดรูปบนกระดาษเท่าเดิม แค่ตัดขอบออก
      it.crop = c.l === 0 && c.t === 0 && c.r === 1 && c.b === 1 ? undefined : c;
      dirty = true; pane.remove(); draw();
    });
  }

  let stroke = null;
  ed.addEventListener('pointermove', e => {
    if (!stroke || e.pointerId !== stroke.id) return;
    const q = stroke.at(e), l = stroke.pts[stroke.pts.length - 1];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) < 3) return;
    stroke.pts.push(q); stroke.path.setAttribute('d', smooth(stroke.pts));
  });
  const strokeEnd = e => {
    if (!stroke || e.pointerId !== stroke.id) return;
    const s0 = stroke; stroke = null; s0.el.remove();
    pg.items.push({ id: newId(), kind: 'draw', d: smooth(s0.pts), color: pen.color, size: pen.size }); dirty = true; draw();
  };
  ed.addEventListener('pointerup', strokeEnd); ed.addEventListener('pointercancel', strokeEnd);

  const vpts = new Map(); let vg = null;
  const vbegin = () => { const rc = ed.querySelector('.jj-page').getBoundingClientRect(); vg = { v: { ...view }, p0: [...vpts.values()].map(q => ({ ...q })), bx: rc.left - view.x, by: rc.top - view.y, bw: rc.width / view.s, bh: rc.height / view.s }; };
  ed.addEventListener('pointermove', e => {
    if (!vg || !vpts.has(e.pointerId)) return;
    vpts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...vpts.values()], { v, p0 } = vg;
    if (p.length >= 2 && p0.length >= 2) {
      const m0 = { x: (p0[0].x + p0[1].x) / 2, y: (p0[0].y + p0[1].y) / 2 }, m1 = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      view.s = Math.min(4, Math.max(1, v.s * Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) / Math.max(1, Math.hypot(p0[1].x - p0[0].x, p0[1].y - p0[0].y))));
      const ux = (m0.x - vg.bx - v.x) / v.s, uy = (m0.y - vg.by - v.y) / v.s; // จุดบนกระดาษใต้กลางนิ้ว
      view.x = m1.x - vg.bx - ux * view.s; view.y = m1.y - vg.by - uy * view.s;
    } else if (p.length === 1 && view.s > 1) { view.x = v.x + p[0].x - p0[0].x; view.y = v.y + p[0].y - p0[0].y; }
    view.x = Math.min(0, Math.max(vg.bw * (1 - view.s), view.x)); view.y = Math.min(0, Math.max(vg.bh * (1 - view.s), view.y));
    if (view.s === 1) view.x = view.y = 0;
    applyView();
  });
  const vend = e => { if (!vpts.has(e.pointerId)) return; vpts.delete(e.pointerId); if (vpts.size) vbegin(); else vg = null; };
  ed.addEventListener('pointerup', vend); ed.addEventListener('pointercancel', vend);
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
