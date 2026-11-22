// ตั้งค่า · ซิงก์ข้อมูล (บอร์ด Set-Sync / Set-SyncConfirm)
import { getData, update } from '../store.js';
import { MONTHS_SHORT } from '../lib/date-th.js';
import { confirmDelete, WARN } from '../ui/confirm.js';
import { syncNow, connectCode, startSync, lastSync, normCode, onSync } from '../sync.js';

const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const BACK = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), COPY = ic('<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 4 H6 a2 2 0 0 0 -2 2 V16"/>');
const ui = { msg: '', copied: false, busy: false };
const when = ts => { if (!ts) return ''; const d = new Date(ts); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

export function renderSetSync() {
  const code = getData().settings.syncCode, last = lastSync();
  const status = code
    ? `<div class="sy-st"><i style="background:#5BAE6A"></i><span class="sy-t">เชื่อมต่อแล้ว</span><span class="sy-l">${last ? `ซิงก์ล่าสุด ${when(last)}` : ''}</span></div>
       <button type="button" class="btn-primary sy-btn" data-sy-now${ui.busy ? ' disabled' : ''}>ซิงก์ตอนนี้</button>`
    : `<div class="sy-st"><i style="background:#C2C2C7"></i><span class="sy-t">ยังไม่เชื่อมต่อ</span></div>
       <button type="button" class="btn-primary sy-btn" data-sy-start${ui.busy ? ' disabled' : ''}>สร้างรหัสซิงก์</button>`;
  return `<div class="side">
    <button type="button" class="side-back" data-st-back>${BACK}ตั้งค่า</button>
    <h1 class="h-page side-title">ซิงก์ข้อมูล</h1>
    <div class="card sy-card">${status}${ui.msg ? `<p class="sy-msg">${ui.msg}</p>` : ''}</div>
    ${code ? `<div class="st-gt">รหัสซิงก์ของคุณ</div>
    <div class="card sy-card"><div class="sy-code"><span>${code}</span><button type="button" class="sy-copy" aria-label="คัดลอกรหัส" data-sy-copy>${COPY}${ui.copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>
      <p class="sy-p">ข้อมูลทั้งหมดผูกกับรหัสนี้ เก็บรหัสไว้ให้ดี ใช้แทนการสำรองข้อมูล ถ้าเปลี่ยนเครื่องหรือล้างแอป ใส่รหัสนี้เพื่อดึงข้อมูลกลับ อย่าส่งรหัสให้คนอื่น</p></div>` : ''}
    <div class="st-gt">ใช้รหัสจากเครื่องอื่น</div>
    <div class="card sy-card"><input type="text" class="ea-input sy-in" autocapitalize="characters" autocomplete="off" aria-label="รหัสซิงก์จากเครื่องอื่น" placeholder="เช่น JRNL-XXXX-XXXX" data-sy-in>
      <button type="button" class="btn-secondary sy-btn2" data-sy-connect>เชื่อมต่อ</button>
      <p class="sy-p2">ข้อมูลบนเครื่องนี้จะถูกแทนที่ด้วยข้อมูลของรหัสที่ใส่</p></div>
  </div>`;
}

let redraw = () => {};
onSync(() => { if (location.hash === '#settings/sync') redraw(); }); // ลงทะเบียนครั้งเดียว

export function mountSetSync(root, rerender) {
  redraw = rerender;
  root.addEventListener('click', async e => {
    if (e.target.closest('[data-st-back]')) { ui.msg = ''; location.hash = 'settings'; return; }
    if (e.target.closest('[data-sy-now]')) { ui.busy = true; ui.msg = ''; rerender(); const ok = await syncNow(); ui.busy = false; ui.msg = ok ? '' : 'ซิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง'; rerender(); return; }
    if (e.target.closest('[data-sy-start]')) { ui.busy = true; ui.msg = ''; rerender(); const ok = await startSync(update); ui.busy = false; ui.msg = ok ? '' : 'ซิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง'; rerender(); return; }
    if (e.target.closest('[data-sy-copy]')) { try { await navigator.clipboard.writeText(getData().settings.syncCode); ui.copied = true; rerender(); setTimeout(() => { ui.copied = false; rerender(); }, 1500); } catch { /* ไม่รองรับ */ } return; }
    if (e.target.closest('[data-sy-connect]')) {
      const code = normCode(root.querySelector('[data-sy-in]').value);
      if (!code) { ui.msg = 'รหัสไม่ถูกต้อง'; rerender(); return; }
      const cur = getData().settings.syncCode;
      if (code === cur) return;
      const ok = await confirmDelete({ title: `เชื่อมต่อรหัส ${code}?`, body: `ข้อมูลทั้งหมดบนเครื่องนี้จะถูกแทนที่ด้วยข้อมูลของรหัสนี้ และย้อนกลับไม่ได้${cur ? `<br>ถ้ายังต้องการข้อมูลเดิม จดรหัสปัจจุบัน (${cur}) ไว้ก่อน` : ''}`, ok: 'แทนที่ข้อมูล', icon: WARN });
      if (!ok) return;
      ui.busy = true; rerender();
      try { ui.msg = await connectCode(code) ? '' : 'ไม่พบข้อมูลของรหัสนี้'; } catch { ui.msg = 'ซิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง'; }
      ui.busy = false; rerender();
    }
  });
}
