// แผ่นล่าง (sheet) · บอร์ด Today-Expanded · ห้ามซ้อน sheet: เปิดใหม่จะปิดอันเดิมก่อน
const X = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5 L17.5 17.5"/><path d="M17.5 6.5 L6.5 17.5"/></svg>';
let current = null;

// openSheet({ title, body: () => html, mount: (el, close) => void, onClose })
export function openSheet({ title, body, mount, onClose }) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sh-back';
  back.innerHTML = `<div class="sheet" role="dialog" aria-label="${title}">
    <div class="sh-grip"></div>
    <div class="sh-head"><h2 class="sh-title">${title}</h2><button type="button" class="sh-x" aria-label="ปิด">${X}</button></div>
    <div class="sh-body"></div></div>`;
  const el = back.querySelector('.sheet');
  const render = () => { el.querySelector('.sh-body').innerHTML = body(); };
  const close = () => { if (current?.back === back) { back.remove(); current = null; document.body.classList.remove('sh-open'); onClose?.(); } };
  back.addEventListener('click', e => { if (e.target === back || e.target.closest('.sh-x')) close(); });
  render();
  document.body.appendChild(back);
  document.body.classList.add('sh-open');
  current = { back, close };
  mount?.(el, close, render);
  return { close, render };
}
export function closeSheet() { current?.close(); }
