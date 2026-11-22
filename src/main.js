import './styles/tokens.css';
import './styles/base.css';
import { renderTabbar, TABS } from './ui/tabbar.js';
import { placeholder } from './screens/placeholder.js';

for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

const app = document.getElementById('app');
const currentTab = () => {
  const id = location.hash.slice(1);
  return TABS.some(t => t.id === id) ? id : 'today';
};

function render() {
  const tab = currentTab();
  app.innerHTML = `<main class="page">${placeholder(tab)}</main>${renderTabbar(tab)}`;
  window.scrollTo(0, 0);
}

app.addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) location.hash = b.dataset.tab;
});
window.addEventListener('hashchange', render);
render();

if (import.meta.env.PROD) import('./update.js');
