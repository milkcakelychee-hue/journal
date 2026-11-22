// ค่าเริ่มต้นของข้อมูล ตามสเปกและบอร์ด
export const SCHEMA_VERSION = 1;

const id = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
export { id as newId };

// อารมณ์ 10 ค่า (บวก→ลบ) · HANDOFF ข้อ 4
const MOODS = [
  ['วันพิเศษ', '#E6A3B8', 'pos'], ['มีเรื่องดี', '#76B79D', 'pos'], ['สงบ', '#8FCBC3', 'pos'],
  ['เฉย ๆ', '#E4C673', 'mid'],
  ['เหนื่อย', '#A3ACB8', 'neg'], ['ป่วย', '#A99BC9', 'neg'], ['ไม่ค่อยดี', '#E39F6C', 'neg'],
  ['โกรธ', '#D9766B', 'neg'], ['มีน้ำตา', '#8FA9CF', 'neg'], ['วันที่แย่ที่สุด', '#6F6A7D', 'neg'],
];

// หมวดกิจกรรม 8 หมวด · บอร์ด Set-Cat (สีชิปจาก Cal-Month)
const CATEGORIES = [
  // [ชื่อ, พื้นชิป, ตัวอักษรชิป, แถบสีซ้ายการ์ดกิจกรรม]
  // แถบสีที่มีในบอร์ด: งาน #6C9BD1 · ครอบครัว #D9BC3C · ส่วนตัว #E58F88 · ที่เหลือเลือกโทนเดียวกันเอง
  ['งาน', '#DFEAF6', '#3F6A9F', '#6C9BD1'], ['ส่วนตัว', '#FAE3E1', '#B05A54', '#E58F88'], ['เรียน', '#EBE5F6', '#6A55A6', '#9C88CF'],
  ['สังคม', '#FAE5D0', '#B06F2E', '#E3A066'], ['ครอบครัว', '#FAF2CC', '#8A7416', '#D9BC3C'], ['สุขภาพ', '#E2F1E1', '#4B8A47', '#7FB87B'],
  ['เดินทาง', '#DCF0EE', '#2F8A83', '#5FB5AD'], ['อื่น ๆ', '#EFEFF2', '#55555B', '#A3A3A9'],
];

// หมวดยาเริ่มต้น · บอร์ด Side-DrugNew
export const DRUG_CATS = ['ปวดหัว / ลดไข้', 'ปวดท้อง / ท้องอืด', 'แก้หวัด / แก้ไอ', 'แก้แพ้', 'อื่น ๆ'];

// หมวดอาการเริ่มต้น · บอร์ด Side-SymLog
export const SYM_CATS = ['ปวด', 'ไข้', 'ระบบหายใจ', 'อื่น ๆ'];

export function createDefaultData() {
  return {
    schema: SCHEMA_VERSION,
    settings: {
      name: '',
      noteColorNames: {},       // ความหมายของสีโน้ตวันสำคัญ { yellow: 'วันเกิด', ... } ว่าง = ชื่อสี
      weekStart: 1,            // 0 = อาทิตย์, 1 = จันทร์
      importantDaysAhead: 7,
      periodDefaultLen: 5,
      periodDefaultCycle: 28,
      syncCode: '',
      onboarded: false,
    },
    moods: MOODS.map(([name, color, group], i) => ({ id: id(), name, color, group, order: i })),
    moodLog: {},               // { 'YYYY-MM-DD': { moodId, note } }
    categories: CATEGORIES.map(([name, bg, fg, accent], i) => ({ id: id(), name, bg, fg, accent, color: i, icon: i, order: i, fallback: name === 'อื่น ๆ' })),
    people: [],
    places: [],
    events: [],                // { id, title, startDate, endDate, time|null, categoryId, peopleIds[], placeId }
    todos: [],                 // { id, date, title, time|null, done }
    quickNotes: [],            // { id, date, time, text }
    habits: [],                // { id, name, type:'build'|'quit', freq:{kind:'daily'|'alt'|'custom', days[]}, color, startDate }
    habitLog: {},              // { habitId: { 'YYYY-MM-DD': true } }
    holidays: [],              // { id, name, dates: [YYYY-MM-DD] } วันหยุด (บลูขอ 22 พ.ย. 2569)
    wfh: [],                   // วัน WFH [YYYY-MM-DD] (บลูขอ 22 พ.ย. 2569)
    importantDates: [],        // { id, title, date, yearly, noteColor }
    periodLog: [],             // { id, date, flow:'h'|'m'|'l', cramps, ended }
    vitamins: [],              // { id, name, dose, timeSlot, freq }
    vitaminLog: {},            // { vitaminId: { 'YYYY-MM-DD': true } }
    drugCategories: DRUG_CATS.map(name => ({ id: id(), name })), // { id, name }
    drugs: [],                 // { id, name, categoryId }
    drugArchive: [],           // ยาที่ลบจากรายการแล้ว (ให้บันทึกเก่ายังแสดงชื่อ)
    drugLog: [],               // { id, date, drugId, qty, time }
    symptomCategories: SYM_CATS.map(name => ({ id: id(), name })), // { id, name }
    symptoms: [],              // { id, name, categoryId }
    symptomArchive: [],
    symptomLog: [],            // { id, date, symptomId, note, time }
    photos: {},                // { 'YYYY-MM-DD': { note, updatedAt } } · ตัวภาพอยู่ใน store "photos" แยก
    updatedAt: 0,
  };
}
