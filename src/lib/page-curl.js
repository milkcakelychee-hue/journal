// พับมุมกระดาษตามนิ้ว (แบบรูปที่บลูส่ง 26 พ.ย. 2569)
// F = ตำแหน่งที่มุมขวาล่างถูกลากมา (พิกัดในกระดาษ) · เส้นพับ = เส้นแบ่งครึ่งตั้งฉากของ มุม→F
// แผ่นบน: ตัดส่วนเลยเส้นพับออก (clip-path) · ปีกที่พับ: ส่วนที่ตัด สะท้อนข้ามเส้นพับ วาดใน .jn-flap
export const PAPER_BACK = '#CBC0AA, #FBF8F1 22%, #F2ECE0 65%, #D6CCB8'; // หลังกระดาษครีม
export const WHITE_BACK = '#D9D9DC, #FFFFFF 22%, #F4F4F5 65%, #DADADD'; // หลังกระดาษขาว (แสตมป์รูป)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

function clip(poly, M, n, keepSide) { // Sutherland–Hodgman กับครึ่งระนาบ
  const out = [], f = p => keepSide * dot([p[0] - M[0], p[1] - M[1]], n);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa <= 0) !== (fb <= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
const poly = (pts, dx = 0, dy = 0) => pts.length < 3 ? 'polygon(0 0, 0 0, 0 0)' : `polygon(${pts.map(p => `${(p[0] + dx).toFixed(1)}px ${(p[1] + dy).toFixed(1)}px`).join(',')})`;

export function curl(page, flap, F, w, h, bg = PAPER_BACK) {
  const C = [w, h], n = [C[0] - F[0], C[1] - F[1]], nn = dot(n, n);
  if (nn < 1) { page.style.clipPath = ''; flap.style.visibility = 'hidden'; return; }
  const M = [(C[0] + F[0]) / 2, (C[1] + F[1]) / 2], rect = [[0, 0], [w, 0], [w, h], [0, h]];
  const keep = clip(rect, M, n, 1), cut = clip(rect, M, n, -1);
  page.style.clipPath = poly(keep);
  const ref = cut.map(p => { const k = 2 * dot([p[0] - M[0], p[1] - M[1]], n) / nn; return [p[0] - k * n[0], p[1] - k * n[1]]; });
  // ปีกพับ: กล่องใหญ่ 3 เท่ารอบกระดาษ ให้ส่วนที่พับเกินขอบยังวาดได้
  const deg = Math.atan2(-n[0], n[1]) * 180 / Math.PI;
  flap.style.cssText = `visibility:visible;left:${page.offsetLeft - w}px;top:${page.offsetTop - h}px;width:${3 * w}px;height:${3 * h}px;clip-path:${poly(ref, w, h)};background:linear-gradient(${deg}deg, ${bg})`;
}

// เลื่อน F จาก a → b แบบนุ่ม ๆ
export function animate(a, b, ms, step, done) {
  const t0 = performance.now(), ease = t => 1 - (1 - t) ** 3;
  const tick = now => {
    const t = Math.min(1, (now - t0) / ms), e = ease(t);
    step([a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]);
    if (t < 1) requestAnimationFrame(tick); else done?.();
  };
  requestAnimationFrame(tick);
}

// ---------- ตัวพลิกหน้าใช้ซ้ำได้ (บันทึก · หนึ่งวันหนึ่งภาพ) ----------
// โครง HTML: stack (position:relative) มีแผ่นถัดไปอยู่ใต้, แผ่นบน (top), แผ่นก่อนหน้า (prev ซ่อนไว้ด้วย clip-path ว่าง) และ flap ในตัวห่อที่มี drop-shadow
// ลากมุมขวาล่างขึ้น = dir +1 · ลากลงจากด้านบน = dir -1 (แผ่นก่อนหน้าพับกลับลงมา) · ปล่อยไม่ถึง = คลี่กลับ · ไม่มีแผ่นให้ไป = คลี่กลับเสมอ
// คืน go(dir) สำหรับปุ่มลูกศร · หลังลากจะตั้ง root.dataset.flipNoClick ชั่วครู่ กันการแตะเปิดแผ่นโดยไม่ตั้งใจ
export function attachFlip({ root, stackSel, topSel, prevSel, flapSel, canGo, onGo, bg = PAPER_BACK }) {
  const q = s => root.querySelector(s), flap = () => q(flapSel);
  const size = el => [el.offsetWidth, el.offsetHeight];
  const gone = (w, h) => [w, -h - 6];
  const prevPath = (p, w, h) => [w - Math.sin(p * Math.PI) * w * 0.35, -h - 6 + p * (2 * h + 6)];
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (p0, to, ms, path, done) => { const t0 = performance.now(), tick = now => { const t = Math.min(1, (now - t0) / ms); path(p0 + (to - p0) * (1 - (1 - t) ** 3)); if (t < 1) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); };
  const go = dir => {
    if (!canGo(dir)) return;
    const el = q(dir > 0 ? topSel : prevSel);
    if (!el || reduce()) return onGo(dir);
    const [w, h] = size(el);
    if (dir > 0) animate([w, h], gone(w, h), 520, F => curl(el, flap(), F, w, h, bg), () => onGo(dir));
    else { el.style.visibility = 'visible'; run(0, 1, 520, p => curl(el, flap(), prevPath(p, w, h), w, h, bg), () => onGo(dir)); }
  };
  let drag = null;
  root.addEventListener('pointerdown', e => {
    const stack = e.target.closest(stackSel); if (!stack) return;
    try { stack.setPointerCapture(e.pointerId); } catch {}
    drag = { x0: e.clientX, y0: e.clientY, el: null, dir: 0, moved: false };
  });
  root.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y0, dx = e.clientX - drag.x0;
    if (!drag.dir) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.dir = dy < 0 || dx < 0 ? 1 : -1; drag.moved = true;
      drag.el = q(drag.dir > 0 ? topSel : prevSel);
      if (!drag.el) return;
      [drag.w, drag.h] = size(drag.el);
      drag.r = drag.el.getBoundingClientRect();
      drag.off = [drag.r.right - drag.x0, drag.r.bottom - drag.y0]; // มุมเกาะนิ้ว
      if (drag.dir < 0) drag.el.style.visibility = 'visible';
    }
    if (!drag.el) return;
    const { w, h, r } = drag;
    if (drag.dir > 0) { drag.F = [Math.min(w, e.clientX - r.left + Math.min(drag.off[0], 40)), Math.min(h, e.clientY - r.top + Math.min(drag.off[1], 40))]; curl(drag.el, flap(), drag.F, w, h, bg); }
    else { drag.p = Math.min(1, Math.max(0, dy / (h * 0.8))); curl(drag.el, flap(), prevPath(drag.p, w, h), w, h, bg); }
  });
  const up = () => {
    if (!drag) return; const g = drag; drag = null;
    if (g.moved) { root.dataset.flipNoClick = '1'; setTimeout(() => delete root.dataset.flipNoClick, 50); }
    if (!g.el) return;
    const { w, h } = g, step = F => curl(g.el, flap(), F, w, h, bg);
    const reset = () => { g.el.style.clipPath = ''; g.el.style.visibility = ''; const f = flap(); if (f) f.style.visibility = 'hidden'; };
    if (g.dir > 0) {
      const F = g.F || [w, h], far = (F[1] < h * 0.55 || F[0] < w * 0.35) && canGo(1);
      if (far) animate(F, gone(w, h), 380, step, () => onGo(1)); else animate(F, [w, h], 300, step, reset);
    } else {
      const p0 = g.p || 0, fwd = p0 > 0.35 && canGo(-1);
      run(p0, fwd ? 1 : 0, 340, p => step(prevPath(p, w, h)), () => { if (fwd) onGo(-1); else { g.el.style.clipPath = 'polygon(0 0, 0 0, 0 0)'; reset(); } });
    }
  };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  return { go };
}
