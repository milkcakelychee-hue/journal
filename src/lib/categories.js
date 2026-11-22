// สีและไอคอนหมวด · บอร์ด Pick-Cat / Cat-New (8 สี × 8 ไอคอน)
export const CAT_COLORS = [
  { tile: 'linear-gradient(180deg,#C8DCF0,#BFD6EE)', dot: '#C8DCF0', bg: '#DFEAF6', fg: '#3F6A9F', accent: '#6C9BD1' }, // งาน
  { tile: 'linear-gradient(180deg,#F6CFCB,#F4C7C3)', dot: '#F6CFCB', bg: '#FAE3E1', fg: '#B05A54', accent: '#E58F88' }, // ส่วนตัว
  { tile: 'linear-gradient(180deg,#DDD3F1,#D6CBEE)', dot: '#DDD3F1', bg: '#EBE5F6', fg: '#6A55A6', accent: '#9C88CF' }, // เรียน
  { tile: 'linear-gradient(180deg,#F7D3B0,#F5CBA0)', dot: '#F7D3B0', bg: '#FAE5D0', fg: '#B06F2E', accent: '#E3A066' }, // สังคม
  { tile: 'linear-gradient(180deg,#F6E8A8,#F5E49A)', dot: '#F6E8A8', bg: '#FAF2CC', fg: '#8A7416', accent: '#D9BC3C' }, // ครอบครัว
  { tile: 'linear-gradient(180deg,#CEE7CB,#C6E3C3)', dot: '#CEE7CB', bg: '#E2F1E1', fg: '#4B8A47', accent: '#7FB87B' }, // สุขภาพ
  { tile: 'linear-gradient(180deg,#C4E5E2,#B9E1DE)', dot: '#C4E5E2', bg: '#DCF0EE', fg: '#2F8A83', accent: '#5FB5AD' }, // เดินทาง
  { tile: 'linear-gradient(180deg,#E8DFD3,#E3D9CB)', dot: '#E8DFD3', bg: '#EFEFF2', fg: '#55555B', accent: '#A3A3A9' }, // อื่น ๆ
];
export const CAT_ICONS = [
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7.5" width="18" height="12.5" rx="3"/><path d="M9 7.5 V6 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 V7.5"/><path d="M3 13 H21"/></svg>`, // งาน
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20 C12 20 4 15 4 9.5 A4 4 0 0 1 12 8 A4 4 0 0 1 20 9.5 C20 15 12 20 12 20 Z"/></svg>`, // ส่วนตัว
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 9.5 L12 5 L21.5 9.5 L12 14 Z"/><path d="M6.5 11.8 V16 C6.5 16 9 18.5 12 18.5 C15 18.5 17.5 16 17.5 16 V11.8"/></svg>`, // เรียน
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19 C3.5 15.5 6 14 9 14 C12 14 14.5 15.5 14.5 19"/><circle cx="17" cy="9.5" r="2.3"/><path d="M16.5 14 C19 14 20.5 15.5 20.5 18.5"/></svg>`, // สังคม
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11 L12 4.5 L20 11 V19 a1 1 0 0 1 -1 1 H5 a1 1 0 0 1 -1 -1 Z"/><path d="M10 20 V14 H14 V20"/></svg>`, // ครอบครัว
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 C5 10.5 10 5 19.5 4.5 C19.5 13.5 14.5 19 5 19 Z"/><path d="M5 19 L13 11"/></svg>`, // สุขภาพ
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17 V12 L7 7.5 H17 L19 12 V17 Z"/><path d="M5 12 H19"/><circle cx="8.5" cy="17" r="1.6"/><circle cx="15.5" cy="17" r="1.6"/></svg>`, // เดินทาง
  s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12 L12 3.5 H20.5 V12 L12 20.5 Z"/><circle cx="16" cy="8" r="1.3"/></svg>`, // อื่น ๆ
];
// ไม่มีหมวด = ป้ายสีเทา
export const NO_CAT = { name: '', bg: '#F3F3F5', fg: '#66666B', accent: '#C9C9CE' };
export const catOf = (d, id) => d.categories.find(c => c.id === id) || NO_CAT;
export const catColor = c => CAT_COLORS[c.color] || CAT_COLORS[7];
export const catIcon = (c, s = 22) => (CAT_ICONS[c.icon] || CAT_ICONS[7])(s);
