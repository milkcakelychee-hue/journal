// แผ่นล่าง (sheet) · บอร์ด Today-Expanded · ห้ามซ้อน sheet: เปิดใหม่จะปิดอันเดิมก่อน
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const X = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5 L17.5 17.5"/><path d="M17.5 6.5 L6.5 17.5"/></svg>';
let current = null;

// openSheet({ title, body: () => html, mount: (el, close) => void, onClose })
export function openSheet({ title, body, mount, onClose }) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sh-back';
  back.innerHTML = `<div class="sheet" role="dialog" aria-label="${title}">
    <div class="sh-grip"></div>
    <div class="sh-head"><div class="sh-hl"><button type="button" class="sh-back-btn" aria-label="ย้อนกลับ" hidden>${BACK}</button><h2 class="sh-title">${title}</h2></div><button type="button" class="sh-x" aria-label="ปิด">${X}</button></div>
    <div class="sh-body"></div></div>`;
  const el = back.querySelector('.sheet');
  const render = () => { el.querySelector('.sh-body').innerHTML = body(); };
  const close = () => { if (current?.back === back) { back.remove(); current = null; document.body.classList.remove('sh-open'); onClose?.(); } };
  // หน้าย่อยในแผ่นเดียวกัน (ไม่ซ้อน sheet): head('หมวด', onBack) · head('เพิ่มกิจกรรม') = ไม่มีปุ่มย้อน
  let onBack = null;
  const head = (t, cb = null) => { el.querySelector('.sh-title').textContent = t; el.setAttribute('aria-label', t); onBack = cb; el.querySelector('.sh-back-btn').hidden = !cb; };
  back.addEventListener('click', e => {
    if (e.target === back || e.target.closest('.sh-x')) close();
    else if (e.target.closest('.sh-back-btn')) onBack?.();
  });
  render();
  document.body.appendChild(back);
  document.body.classList.add('sh-open');
  current = { back, close };
  mount?.(el, close, render, head);
  return { close, render };
}
export function closeSheet() { current?.close(); }
