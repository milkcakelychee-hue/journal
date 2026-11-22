// ป้าย 2×2 ในหน้าวันนี้ · บอร์ด Main (ป้ายเหมือนกันทุกสถานะ ไม่มีตัวเลข)
const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 L17 7"/><path d="M8.5 7 H17 V15.5"/></svg>';
const G = '#C9C9CE';
const ICONS = {
  habit: `<svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="13" r="8.5" fill="${G}"/><circle cx="35" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="35" r="8.5" fill="${G}"/><circle cx="13" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="24" r="8" fill="${G}"/></svg>`,
  health: `<svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true"><defs><clipPath id="hcl"><polygon points="-25.48,51.42 7.88,60.99 29.93,-15.91 -3.42,-25.48"/></clipPath><clipPath id="hcr"><polygon points="11.34,61.98 51.42,73.48 73.48,-3.42 33.39,-14.92"/></clipPath></defs><circle cx="24" cy="24" r="20" fill="${G}" clip-path="url(#hcl)"/><circle cx="24" cy="24" r="20" fill="${G}" clip-path="url(#hcr)"/></svg>`,
  note: `<svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true"><rect x="8.5" y="9" width="17" height="30" rx="2.5" fill="${G}" transform="rotate(-12 17 24)"/><rect x="24.5" y="9" width="17" height="30" rx="2.5" fill="${G}" transform="rotate(12 33 24)"/></svg>`,
  photo: `<svg width="50" height="50" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="7" width="30" height="34" rx="2" fill="${G}"/><circle cx="30" cy="17" r="3.5" fill="#FFFFFF"/><path d="M13 36 L21 25 L27 32 L30 28 L35 36 Z" fill="#FFFFFF"/></svg>`,
};
// go = ปลายทาง (ผูกจริงเมื่อหน้านั้นสร้างเสร็จ)
const TILES = [
  { id: 'habit', label: 'Habit วันนี้', go: 'habit' },
  { id: 'health', label: 'สุขภาพวันนี้', go: 'health' },
  { id: 'note', label: 'Quick note', go: 'quicknote' },
  { id: 'photo', label: 'หนึ่งวันหนึ่งภาพ', go: 'photo' },
];

export const renderTilesToday = () => `<section aria-label="บันทึกวันนี้"><div class="tl-grid">${TILES.map(t =>
  `<button type="button" class="tl" aria-label="${t.label}" data-go="${t.go}"><span class="tl-arrow">${ARROW}</span><span class="tl-ic">${ICONS[t.id]}</span><span class="tl-lb">${t.label}</span></button>`
).join('')}</div></section>`;
