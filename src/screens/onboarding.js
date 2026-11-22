// เปิดครั้งแรก · บอร์ด Onb-Welcome → Onb-Name (1/2) → Onb-Sides (2/2) · หรือ Onb-Code (มีรหัสซิงก์อยู่แล้ว)
// "แนะนำแอป" ในตั้งค่า เปิด Onb-Sides ซ้ำได้ (ปุ่มท้ายหน้ากลับไปตั้งค่า)
import { getData, update } from '../store.js';
import { ball } from '../lib/mood.js';
import { connectCode, normCode } from '../sync.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const G = '#A3A3A9', I = p => `<svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">${p}</svg>`;
const BALLS = [[40, 40, 64, '#E6A3B8'], [120, 10, 48, '#76B79D'], [190, 50, 72, '#8FCBC3'], [270, 20, 44, '#E4C673'], [30, 130, 44, '#A3ACB8'], [95, 110, 58, '#A99BC9'], [170, 140, 40, '#E39F6C'], [225, 120, 60, '#D9766B'], [300, 95, 40, '#8FA9CF'], [140, 200, 46, '#6F6A7D']];
const FEATS = [
  [I(`<circle cx="24" cy="24" r="8" fill="${G}"/><path d="M24 6 V12 M24 36 V42 M6 24 H12 M36 24 H42" stroke="${G}" stroke-width="4" stroke-linecap="round"/>`), 'วันนี้', 'To do ของวัน กิจกรรม และอารมณ์ ในหน้าเดียว'],
  [I(`<rect x="8" y="10" width="32" height="30" rx="6" fill="${G}"/>`), 'ปฏิทิน', 'กิจกรรมหลายวัน Quick note มุมมองสัปดาห์ เดือน ปี'],
  [I(`<circle cx="24" cy="24" r="17" fill="${G}"/>`), 'อารมณ์', '10 อารมณ์ โหลความรู้สึก และภาพรวมทั้งปี'],
  [I(`<circle cx="24" cy="13" r="8.5" fill="${G}"/><circle cx="35" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="35" r="8.5" fill="${G}"/><circle cx="13" cy="24" r="8.5" fill="${G}"/>`), 'Habit', 'นิสัยที่อยากสร้างและอยากเลิก นับวันติดต่อกัน'],
  [I(`<rect x="6" y="16" width="36" height="16" rx="8" fill="${G}"/>`), 'สุขภาพ', 'ประจำเดือน วิตามิน ยา และอาการป่วย'],
  [I(`<rect x="9" y="11" width="30" height="30" rx="3" fill="${G}" transform="rotate(-6 24 26)"/>`), 'วันสำคัญ', 'โน้ตแปะวันเกิด วันครบรอบ เดดไลน์'],
  [I(`<rect x="8" y="6" width="32" height="38" rx="2" fill="${G}"/><rect x="13" y="11" width="22" height="22" rx="1" fill="#F3F3F5"/>`), 'หนึ่งวันหนึ่งภาพ', 'เก็บภาพวันละใบพร้อมโน้ตสั้น ๆ ดูเป็นปฏิทินภาพและโฟลเดอร์รายเดือน'],
  [I(`<path d="M10 20 A14 14 0 0 1 36 16" fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round"/><path d="M38 28 A14 14 0 0 1 12 32" fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round"/>`), 'ซิงก์ด้วยรหัส', 'ใช้ข้อมูลเดียวกันได้หลายเครื่อง'],
];
const st = { step: 'welcome', name: '', msg: '', busy: false };
// เปิดหน้าแนะนำแอปจากตั้งค่า = #intro
export const isIntro = () => location.hash === '#intro';
const bar = n => `<div class="ob-top"><button type="button" class="ob-back" aria-label="ย้อนกลับ" data-ob-back>${BACK}</button><div class="ob-bar"><span class="on"></span><span class="${n > 1 ? 'on' : ''}"></span></div><span class="ob-n">${n}/2</span></div>`;

function page() {
  if (isIntro() || st.step === 'sides') return `${isIntro() ? `<button type="button" class="ob-back" aria-label="ย้อนกลับ" data-ob-back>${BACK}</button>` : bar(2)}
    <h1 class="ob-h" style="margin-top:28px">Journal ทำอะไรได้บ้าง</h1><p class="ob-p" style="margin:6px 0 12px">ทุกอย่างพร้อมใช้ตั้งแต่เริ่ม</p>
    <div class="card ob-list">${FEATS.map(([i, t, s]) => `<div class="ob-f"><span class="ob-fi">${i}</span><span><span class="ob-ft">${t}</span><span class="ob-fs">${s}</span></span></div>`).join('')}</div>
    <div class="ob-foot" style="padding-top:16px"><button type="button" class="ob-main" data-ob-done>${isIntro() ? 'กลับไปตั้งค่า' : 'เริ่มใช้งาน'}</button></div>`;
  if (st.step === 'name') return `${bar(1)}<h1 class="ob-h" style="margin-top:40px">ให้เราเรียกคุณว่าอะไรดี</h1><p class="ob-p" style="margin:8px 0 24px">ใช้ทักทายในหน้าวันนี้ แก้ได้ภายหลังในตั้งค่า</p>
    <input type="text" class="ob-in" maxlength="30" aria-label="ชื่อที่ใช้ทักทาย" value="${esc(st.name)}" data-ob-name><p class="ob-ex" data-ob-ex>${st.name.trim() ? `ตัวอย่าง: "สวัสดี ${esc(st.name.trim())}"` : ''}</p>
    <div class="ob-foot"><button type="button" class="ob-main" data-ob-next>ต่อไป</button></div>`;
  if (st.step === 'code') return `<button type="button" class="ob-back" aria-label="ย้อนกลับ" data-ob-back>${BACK}</button>
    <h1 class="ob-h" style="margin-top:24px">ใส่รหัสซิงก์</h1><p class="ob-p" style="margin:8px 0 24px;line-height:23px">ใช้รหัสจากเครื่องเดิม (ตั้งค่า › ซิงก์ข้อมูล) เพื่อดึงข้อมูลทั้งหมดกลับมา</p>
    <input type="text" class="ob-in ob-code" autocapitalize="characters" autocomplete="off" aria-label="รหัสซิงก์" placeholder="JRNL-XXXX-XXXX" data-ob-code>${st.msg ? `<p class="sy-msg">${st.msg}</p>` : ''}
    <div class="ob-foot"><button type="button" class="ob-main" data-ob-connect${st.busy ? ' disabled' : ''}>เชื่อมต่อ</button></div>`;
  return `<div class="ob-balls" aria-hidden="true">${BALLS.map(([x, y, s, c]) => `<span style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;background:${ball(c)}"></span>`).join('')}</div>
    <h1 class="ob-h1">Journal</h1><p class="ob-p" style="margin-top:8px;font-size:17px;line-height:26px">บันทึกชีวิตด้วยการแตะไม่กี่ครั้ง<br>อารมณ์ Habit กิจกรรม สุขภาพ วันสำคัญ</p>
    <div class="ob-foot ob-2"><button type="button" class="ob-main" data-ob-new>เริ่มใช้งานใหม่</button><button type="button" class="ob-sub" data-ob-has>มีรหัสซิงก์อยู่แล้ว</button></div>`;
}

export const renderOnboarding = () => `<div class="ob${st.step === 'welcome' && !isIntro() ? ' ob-w' : ''}">${page()}</div>`;

export function mountOnboarding(root, rerender) {
  root.addEventListener('input', e => { if (e.target.matches('[data-ob-name]')) { st.name = e.target.value; root.querySelector('[data-ob-ex]').textContent = st.name.trim() ? `ตัวอย่าง: "สวัสดี ${st.name.trim()}"` : ''; } });
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-ob-back],[data-ob-new],[data-ob-has],[data-ob-next],[data-ob-done],[data-ob-connect]'); if (!b) return;
    const ds = b.dataset;
    if (ds.obBack !== undefined) { if (isIntro()) { location.hash = 'settings'; return; } st.msg = ''; st.step = st.step === 'sides' ? 'name' : 'welcome'; }
    else if (ds.obNew !== undefined) { st.name = getData().settings.name || ''; st.step = 'name'; }
    else if (ds.obHas !== undefined) st.step = 'code';
    else if (ds.obNext !== undefined) st.step = 'sides';
    else if (ds.obDone !== undefined) {
      if (isIntro()) { location.hash = 'settings'; return; }
      update(d => { d.settings.name = st.name.trim(); d.settings.onboarded = true; });
      location.hash = 'today'; rerender(); return;
    } else if (ds.obConnect !== undefined) {
      const code = normCode(root.querySelector('[data-ob-code]').value);
      if (!code) { st.msg = 'รหัสไม่ถูกต้อง'; rerender(); return; }
      st.busy = true; st.msg = ''; rerender();
      try {
        if (await connectCode(code)) { update(d => { d.settings.onboarded = true; }); st.busy = false; location.hash = 'today'; rerender(); return; }
        st.msg = 'ไม่พบข้อมูลของรหัสนี้';
      } catch { st.msg = 'ซิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง'; }
      st.busy = false;
    }
    rerender();
  });
}
