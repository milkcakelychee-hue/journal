import './styles/tokens.css';
import './styles/base.css';
import { renderTabbar, TABS } from './ui/tabbar.js';
import { placeholder } from './screens/placeholder.js';
import { renderSides, mountSides } from './screens/sides.js';
import * as store from './store.js';
const { loadData } = store;
if (import.meta.env.DEV) window.__store = store; // ใช้ทดสอบตอนพัฒนาเท่านั้น
import { renderToday, mountToday } from './screens/today.js';
import { renderCalendar, mountCalendar, resetCalendar } from './screens/calendar.js';
import { resetTodoUi } from './screens/todo.js';
import { resetMoodUi } from './screens/mood-today.js';
import { renderSettings, mountSettings } from './screens/settings.js';
import { renderOnboarding, mountOnboarding, isIntro } from './screens/onboarding.js';

const SCREENS = { today: renderToday, calendar: renderCalendar, sides: renderSides, settings: renderSettings };
const MOUNTS = { today: mountToday, calendar: mountCalendar, sides: mountSides, settings: mountSettings };

for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

const app = document.getElementById('app');
const currentTab = () => {
  const id = location.hash.slice(1).split('/')[0];
  return TABS.some(t => t.id === id) ? id : 'today';
};

let lastTab = null;
function render() {
  const tab = currentTab();
  if (tab === 'calendar' && lastTab !== 'calendar') resetCalendar();
  lastTab = tab;
  resetTodoUi(); resetMoodUi();
  // เปิดครั้งแรก หรือ "แนะนำแอป" จากตั้งค่า → หน้าเต็มจอ ไม่มีเมนูล่าง
  if (!store.getData().settings.onboarded || isIntro()) {
    app.innerHTML = `<main class="page ob-page">${renderOnboarding()}</main>`;
    mountOnboarding(app.querySelector('main'), render);
    window.scrollTo(0, 0); return;
  }
  app.innerHTML = `<main class="page">${(SCREENS[tab] || (() => placeholder(tab)))()}</main>${renderTabbar(tab)}`;
  // ผูกเหตุการณ์ใหม่กับ <main> ทุกครั้งที่วาดหน้า (main ถูกสร้างใหม่ ของเก่าจึงหายไปด้วย)
  MOUNTS[tab]?.(app.querySelector('main'), () => { const y = scrollY; render(); scrollTo(0, y); });
  window.scrollTo(0, 0);
}

app.addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) location.hash = b.dataset.tab;
});
window.addEventListener('hashchange', render);
await loadData();
render();
import('./sync.js').then(m => m.syncNow()); // ซิงก์ตอนเปิดแอป (ถ้ามีรหัส)

if (import.meta.env.PROD) import('./update.js');
