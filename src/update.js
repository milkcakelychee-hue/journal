// อัปเดตแอปเอง (โหมด prompt: แอปคุมการรีเฟรชเอง)
// เจอเวอร์ชันใหม่ → ถ้าไม่ได้กรอกฟอร์มอยู่ รีเฟรชทันที · ถ้ากำลังกรอก/เปิด sheet อยู่ รอก่อน ข้อมูลที่กรอกไม่หาย
import { registerSW } from 'virtual:pwa-register';

const busy = () => {
  if (document.querySelector('.sheet')) return true;
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

let pending = false;
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { pending = true; tryApply(); },
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
    setInterval(check, 60_000); // ตัวเสริม — iOS หยุดตัวจับเวลาตอนอยู่เบื้องหลัง
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      tryApply();
      check(); // ตัวหลักบน iPhone
    });
  },
});

function tryApply() { if (pending && !busy()) updateSW(true); }
addEventListener('hashchange', tryApply);
document.addEventListener('focusout', () => setTimeout(tryApply, 300));
