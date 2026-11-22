// ป๊อปอัปยืนยันการลบ · บอร์ด Side-DrugDelete
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TRASH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 L8 20 H16 L17 7"/></svg>';

// confirmDelete({ title: 'ลบ "x"?', body: 'บรรทัด1<br>บรรทัด2' }) → Promise<boolean>
export function confirmDelete({ title, body = '', ok = 'ลบ', cancel = 'ยกเลิก' }) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'cf-back';
    el.innerHTML = `<div class="cf" role="alertdialog" aria-labelledby="cf-t">
      <div class="cf-ic">${TRASH}</div>
      <h2 id="cf-t" class="cf-t">${esc(title)}</h2>
      ${body ? `<p class="cf-b">${body}</p>` : '<div style="height:18px"></div>'}
      <div class="cf-btns"><button type="button" class="cf-no">${cancel}</button><button type="button" class="cf-yes">${ok}</button></div>
    </div>`;
    const done = v => { el.remove(); resolve(v); };
    el.addEventListener('click', e => {
      if (e.target.closest('.cf-yes')) done(true);
      else if (e.target.closest('.cf-no') || e.target === el) done(false);
    });
    document.body.appendChild(el);
    el.querySelector('.cf-no').focus();
  });
}
