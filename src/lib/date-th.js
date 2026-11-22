// วันที่ภาษาไทย ปี พ.ศ. · วันที่ในข้อมูลเก็บเป็น 'YYYY-MM-DD' ตามเวลาเครื่อง
export const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
export const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const pad = n => String(n).padStart(2, '0');
export const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayKey = () => toKey(new Date());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const be = y => y + 543;
export const monthYear = d => `${MONTHS[d.getMonth()]} ${be(d.getFullYear())}`;

// 7 วันของสัปดาห์ที่มีวัน d · weekStart 0 = อาทิตย์, 1 = จันทร์
export function weekOf(d, weekStart = 1) {
  const off = (d.getDay() - weekStart + 7) % 7;
  const first = addDays(d, -off);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}
