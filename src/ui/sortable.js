// ลากเรียงลำดับในรายการ: จับที่ [data-grip] · แถวต้องมี data-id · เสร็จแล้วเรียก onDone(ids)
export function sortable(list, onDone) {
  let drag = null;
  list.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-grip]'); if (!g) return;
    e.preventDefault();
    const row = g.closest('[data-id]');
    drag = { row, y0: e.clientY, h: row.offsetHeight };
    row.classList.add('dragging'); g.setPointerCapture?.(e.pointerId);
  });
  list.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    const sib = dy > drag.h / 2 ? drag.row.nextElementSibling : dy < -drag.h / 2 ? drag.row.previousElementSibling : null;
    if (sib) { if (dy > 0) sib.after(drag.row); else sib.before(drag.row); drag.y0 += dy > 0 ? drag.h : -drag.h; }
    drag.row.style.transform = `translateY(${e.clientY - drag.y0}px)`;
  });
  const end = () => {
    if (!drag) return;
    drag.row.classList.remove('dragging'); drag.row.style.transform = '';
    drag = null;
    onDone([...list.querySelectorAll('[data-id]')].map(r => r.dataset.id));
  };
  list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
}
