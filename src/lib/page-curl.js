// พับมุมกระดาษตามนิ้ว (แบบรูปที่บลูส่ง 26 พ.ย. 2569)
// F = ตำแหน่งที่มุมขวาล่างถูกลากมา (พิกัดในกระดาษ) · เส้นพับ = เส้นแบ่งครึ่งตั้งฉากของ มุม→F
// แผ่นบน: ตัดส่วนเลยเส้นพับออก (clip-path) · ปีกที่พับ: ส่วนที่ตัด สะท้อนข้ามเส้นพับ วาดใน .jn-flap
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

export function curl(page, flap, F, w, h) {
  const C = [w, h], n = [C[0] - F[0], C[1] - F[1]], nn = dot(n, n);
  if (nn < 1) { page.style.clipPath = ''; flap.style.visibility = 'hidden'; return; }
  const M = [(C[0] + F[0]) / 2, (C[1] + F[1]) / 2], rect = [[0, 0], [w, 0], [w, h], [0, h]];
  const keep = clip(rect, M, n, 1), cut = clip(rect, M, n, -1);
  page.style.clipPath = poly(keep);
  const ref = cut.map(p => { const k = 2 * dot([p[0] - M[0], p[1] - M[1]], n) / nn; return [p[0] - k * n[0], p[1] - k * n[1]]; });
  // ปีกพับ: กล่องใหญ่ 3 เท่ารอบกระดาษ ให้ส่วนที่พับเกินขอบยังวาดได้
  const deg = Math.atan2(-n[0], n[1]) * 180 / Math.PI;
  flap.style.cssText = `visibility:visible;left:${page.offsetLeft - w}px;top:${page.offsetTop - h}px;width:${3 * w}px;height:${3 * h}px;clip-path:${poly(ref, w, h)};background:linear-gradient(${deg}deg, #CBC0AA, #FBF8F1 22%, #F2ECE0 65%, #D6CCB8)`;
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
