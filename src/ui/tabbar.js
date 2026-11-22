// เมนูล่าง 4 แท็บ ตามบอร์ด Main
const ICONS = {
  today: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3 V5"/><path d="M12 19 V21"/><path d="M3 12 H5"/><path d="M19 12 H21"/><path d="M5.6 5.6 L7 7"/><path d="M17 17 L18.4 18.4"/><path d="M5.6 18.4 L7 17"/><path d="M17 7 L18.4 5.6"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="3.5"/><path d="M4 10.5 H20"/><path d="M8.5 3.5 V7.5"/><path d="M15.5 3.5 V7.5"/>',
  sides: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
  settings: '<path d="M4 8 H20"/><path d="M4 16 H20"/><circle cx="9" cy="8" r="2.5" fill="#FFFFFF"/><circle cx="15" cy="16" r="2.5" fill="#FFFFFF"/>',
};

export const TABS = [
  { id: 'today', label: 'วันนี้' },
  { id: 'calendar', label: 'ปฏิทิน' },
  { id: 'sides', label: 'แยกด้าน' },
  { id: 'settings', label: 'ตั้งค่า' },
];

export function renderTabbar(current) {
  return `<nav class="tabbar" aria-label="เมนูหลัก">${TABS.map(t => {
    const on = t.id === current;
    const s = on ? 28 : 24;
    return `<button type="button" class="tab${on ? ' on' : ''}" data-tab="${t.id}"${on ? ' aria-current="page"' : ''}>
      <span class="tab-ic"><svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[t.id]}</svg></span>
      <span class="tab-lb">${t.label}</span></button>`;
  }).join('')}</nav>`;
}
