// แยกด้าน · อารมณ์ · มุมมองเดือน (Side-Mood) ส่วนบน: ปฏิทินย่อ + สรุปเดือนนี้
// + โหลความรู้สึก / รายสัปดาห์ / วันในสัปดาห์ · มุมมองปี (Side-MoodYear)
import { getData, update } from '../store.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, todayKey, fromKey } from '../lib/date-th.js';
import { ball, tint } from '../lib/mood.js';

const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const st = { view: 'month', y: 0, m: 0 };
export function resetSideMood() { const t = new Date(); Object.assign(st, { view: 'month', y: t.getFullYear(), m: t.getMonth() }); }
resetSideMood();

// สถิติของเดือน y/m: วันที่ควรนับ = ถึงวันนี้ (เดือนปัจจุบัน) หรือทั้งเดือน (อดีต)
function monthStats(d, y, m) {
  const tk = todayKey();
  const n = new Date(y, m + 1, 0).getDate();
  let elapsed = 0, logged = 0, pos = 0; const count = {};
  for (let i = 1; i <= n; i++) {
    const k = toKey(new Date(y, m, i));
    if (k > tk) break;
    elapsed++;
    const mood = d.moods.find(x => x.id === d.moodLog[k]?.moodId);
    if (!mood) continue;
    logged++; count[mood.id] = (count[mood.id] || 0) + 1;
    if (mood.group === 'pos') pos++;
  }
  return { elapsed, logged, pos, count, pct: logged ? Math.round(pos / logged * 100) : null };
}

function calendar(d) {
  const { y, m } = st, ws = d.settings.weekStart, tk = todayKey();
  const off = (new Date(y, m, 1).getDay() - ws + 7) % 7, n = new Date(y, m + 1, 0).getDate();
  let cells = Array.from({ length: 7 }, (_, i) => `<div class="smc-dn">${DAYS_SHORT[(ws + i) % 7]}</div>`).join('') + '<div class="smc-blank"></div>'.repeat(off);
  for (let i = 1; i <= n; i++) {
    const k = toKey(new Date(y, m, i));
    const mood = d.moods.find(x => x.id === d.moodLog[k]?.moodId);
    const inner = mood ? `<span class="smc-ball" style="background:${ball(mood.color)}">${i}</span>`
      : k < tk ? `<span class="smc-miss">${i}</span>`
      : k === tk ? `<span class="smc-miss">${i}</span>` : `<span class="smc-fut">${i}</span>`;
    // วันนี้และวันที่ผ่านมา แตะเพื่อจด/แก้อารมณ์ย้อนหลังได้ (บลูขอ 23 พ.ย. 2569)
    cells += k <= tk ? `<button type="button" class="smc-day" aria-label="${i} ${MONTHS[m]}${mood ? ` ${esc(mood.name)}` : ' ยังไม่บันทึก'}"${k === tk ? ' aria-current="date"' : ''} data-sm-day="${k}"><span class="smc-wrap${k === tk ? ' today' : ''}">${inner}</span></button>`
      : `<div class="smc-day"><span class="smc-wrap">${inner}</span></div>`;
  }
  return `<section class="card smc">${cells}</section>`;
}

function summary(d) {
  const s = monthStats(d, st.y, st.m);
  const pm = st.m === 0 ? { y: st.y - 1, m: 11 } : { y: st.y, m: st.m - 1 };
  const p = monthStats(d, pm.y, pm.m);
  const topId = Object.keys(s.count).sort((a, b) => s.count[b] - s.count[a])[0];
  const top = d.moods.find(x => x.id === topId);
  const cmp = s.pct == null || p.pct == null ? '' : s.pct > p.pct ? `<div class="sms-sub up">↑ จาก ${p.pct}% เดือนก่อน</div>`
    : s.pct < p.pct ? `<div class="sms-sub down">↓ จาก ${p.pct}% เดือนก่อน</div>` : `<div class="sms-sub">เท่ากับเดือนก่อน</div>`;
  return `<h2 class="sm-h">สรุปเดือนนี้</h2>
    <div class="sms">
      <div class="sms-card"><div class="sms-lab">บันทึกแล้ว</div><div class="sms-val">${s.logged}<span class="sms-of">/${s.elapsed} วัน</span></div></div>
      <div class="sms-card"><div class="sms-lab">พบบ่อยสุด</div>${top ? `<div class="sms-val"><span class="sms-ball" style="background:${ball(top.color)}"></span><span class="sms-name">${esc(top.name)}</span></div><div class="sms-sub">${s.count[topId]} วัน</div>` : '<div class="sms-val">–</div>'}</div>
      <div class="sms-card"><div class="sms-lab">อารมณ์บวก</div><div class="sms-val">${s.pct == null ? '–' : `${s.pct}%`}</div>${cmp}</div>
    </div>`;
}

// ---------- โหลความรู้สึก ----------
const JAR_PATH = 'M72 40 L168 40 L168 54 C168 68 212 74 212 104 L212 236 C212 258 198 270 176 270 L64 270 C42 270 28 258 28 236 L28 104 C28 74 72 68 72 54 Z';
const jit = (i, k) => (((i + 1) * (k * 7919 + 104729)) % 97) / 97 - 0.5; // เยื้องเล็กน้อยแบบคงที่
function jar(d) {
  const { y, m } = st, n = new Date(y, m + 1, 0).getDate(), tk = todayKey();
  const list = [];
  for (let i = 1; i <= n; i++) { const k = toKey(new Date(y, m, i)); if (k > tk) break; const md = d.moods.find(x => x.id === d.moodLog[k]?.moodId); if (md) list.push(md); }
  const big = list.length <= 23;
  const r = big ? 17 : 14, dx = big ? 35.6 : 29, dy = big ? 28.7 : 24, wide = big ? 5 : 6;
  const grads = d.moods.map((md, i) => `<radialGradient id="mj${i}" cx="0.32" cy="0.28" r="0.75"><stop offset="0" stop-color="${tint(md.color)}"/><stop offset="0.72" stop-color="${md.color}"/></radialGradient>`).join('');
  let row = 0, col = 0, balls = '';
  list.forEach((md, i) => {
    const per = row % 2 ? wide - 1 : wide;
    const cx = 120 + (col - (per - 1) / 2) * dx + jit(i, 1) * 3, cy = 270 - r - 9 - row * dy + jit(i, 2) * 2.5;
    balls += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="url(#mj${d.moods.indexOf(md)})"/>`;
    if (++col >= per) { col = 0; row++; }
  });
  const cnt = id => list.filter(x => x.id === id).length;
  const moods = [...d.moods].sort((a, b) => a.order - b.order);
  const rows = Math.ceil(moods.length / 2);
  return `<section class="card sm-sec">
    <div class="sm-sh"><h2>สัดส่วนอารมณ์</h2><span>โหลความรู้สึก · ${MONTHS_SHORT[m]}</span></div>
    <div style="margin-top:8px;display:flex;justify-content:center"><svg width="150" height="178" viewBox="0 0 240 284" role="img" aria-label="โหลความรู้สึก ${list.length} ลูกในเดือนนี้">
      <defs><linearGradient id="mjl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A9ADB5"/><stop offset="0.45" stop-color="#F4F5F7"/><stop offset="1" stop-color="#9EA3AB"/></linearGradient><linearGradient id="mjg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="1" stop-color="#E6E8EC" stop-opacity="0.75"/></linearGradient>${grads}</defs>
      <ellipse cx="120" cy="274" rx="92" ry="6" fill="#000" fill-opacity="0.08"/><path d="${JAR_PATH}" fill="url(#mjg)" stroke="#C5CAD2" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="62" y="8" width="116" height="32" rx="9" fill="url(#mjl)"/>${balls}<path d="M42 112 V226" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-opacity="0.7" fill="none"/></svg></div>
    <div class="sm-leg" style="grid-template-rows:repeat(${rows},auto)">${moods.map(md => { const c = cnt(md.id); return `<div class="sm-li" style="opacity:${c ? 1 : 0.45}"><span class="sm-lb" style="background:${ball(md.color)}"></span><span class="sm-ln">${esc(md.name)}</span><span class="sm-lc">${c}</span></div>`; }).join('')}</div>
    <div class="sm-foot">1 ลูก = 1 วันที่บันทึก · ตัวเลข = จำนวนวัน · เรียงจากบวกไปลบ</div>
  </section>`;
}

// ---------- รายสัปดาห์ ----------
function weekly(d) {
  const { y, m } = st, ws = d.settings.weekStart, tk = todayKey(), n = new Date(y, m + 1, 0).getDate();
  const off = (new Date(y, m, 1).getDay() - ws + 7) % 7;
  const weeks = Math.ceil((off + n) / 7);
  const moodOf = k => d.moods.find(x => x.id === d.moodLog[k]?.moodId);
  const statOf = keys => { let l = 0, p = 0; keys.forEach(k => { const md = k <= tk && moodOf(k); if (md) { l++; if (md.group === 'pos') p++; } }); return { l, p }; };
  const fmt = (a, b) => a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}` : `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`;
  let html = '', curIdx = -1; const stats = [];
  for (let w = 0; w < weeks; w++) {
    const days = Array.from({ length: 7 }, (_, i) => new Date(y, m, 1 - off + w * 7 + i));
    const keys = days.map(toKey);
    const inM = days.filter(x => x.getMonth() === m);
    const s = statOf(keys.filter((k, i) => days[i].getMonth() === m)); stats.push(s);
    if (keys.includes(tk)) curIdx = w;
    const cells = days.map((day, i) => {
      const k = keys[i], md = moodOf(k);
      if (day.getMonth() !== m || k > tk) return '<span class="sw-c"><span class="sw-dot"></span></span>';
      return `<span class="sw-c">${md ? `<span class="sw-ball" style="background:${ball(md.color)}"></span>` : '<span class="sw-miss"></span>'}</span>`;
    }).join('');
    html += `<div class="sw-row"><div class="sw-top"><span class="sw-t">สัปดาห์ ${w + 1} <span>${fmt(days[0], days[6])}</span></span>${toKey(inM[0]) > tk ? '' : `<span class="sw-p">บวก ${s.p}/${s.l} วัน</span>`}</div><div class="sw-cells">${cells}</div></div>`;
  }
  let note = '';
  if (curIdx > 0) {
    const a = stats[curIdx], b = stats[curIdx - 1];
    const ra = a.l ? a.p / a.l : 0, rb = b.l ? b.p / b.l : 0;
    const word = ra < rb ? 'น้อยกว่า' : ra > rb ? 'มากกว่า' : 'เท่ากับ';
    note = `<div class="sm-note">สัปดาห์นี้บันทึกแล้ว ${a.l} วัน อารมณ์บวก ${a.p} วัน ${word}สัปดาห์ก่อน (${b.p} จาก ${b.l} วัน)</div>`;
  }
  return `<h2 class="sm-h">แนวโน้มเดือนนี้</h2><section class="card sm-sec">
    <div class="sm-sh"><h2>รายสัปดาห์</h2><span>${MONTHS_SHORT[m]} ${y + 543}</span></div>
    <div class="sw-dn">${Array.from({ length: 7 }, (_, i) => `<span>${DAYS_SHORT[(ws + i) % 7]}</span>`).join('')}</div>
    ${html}${note}</section>`;
}

// ---------- วันในสัปดาห์ ----------
const WD = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];
const GC = { pos: '#8FBF8C', mid: '#E4C673', neg: '#A3ACB8' };
function weekdays(d) {
  const { y, m } = st, ws = d.settings.weekStart, tk = todayKey(), n = new Date(y, m + 1, 0).getDate();
  const by = Array.from({ length: 7 }, () => ({ pos: 0, mid: 0, neg: 0 }));
  for (let i = 1; i <= n; i++) { const dt = new Date(y, m, i), k = toKey(dt); if (k > tk) break; const md = d.moods.find(x => x.id === d.moodLog[k]?.moodId); if (md) by[dt.getDay()][md.group]++; }
  let best = -1;
  for (let j = 0; j < 7; j++) { const wd = (ws + j) % 7; if (by[wd].pos > 0 && (best < 0 || by[wd].pos > by[best].pos)) best = wd; }
  const rows = Array.from({ length: 7 }, (_, j) => {
    const wd = (ws + j) % 7, g = by[wd], tot = g.pos + g.mid + g.neg;
    const bars = tot ? ['pos', 'mid', 'neg'].filter(k => g[k]).map(k => `<span style="width:${(g[k] / tot * 100).toFixed(1)}%;background:${GC[k]}"></span>`).join('') : '';
    return `<div class="swd-row"><span class="swd-n${wd === best ? ' on' : ''}">${WD[wd]}</span><span class="swd-bar">${bars}</span><span class="swd-v">${tot ? `${g.pos}/${tot}` : '–'}</span></div>`;
  }).join('');
  return `<h2 class="sm-h">รูปแบบ</h2><section class="card sm-sec">
    <div class="sm-sh"><h2>วันในสัปดาห์</h2><span>สัดส่วน · ${MONTHS_SHORT[m]}</span></div>
    <div style="height:8px"></div>${rows}
    <div class="swd-leg"><span><i style="background:${GC.pos}"></i>บวก</span><span><i style="background:${GC.mid}"></i>กลาง</span><span><i style="background:${GC.neg}"></i>ลบ</span></div>
    ${best >= 0 ? `<div class="sm-note">วัน${WD[best] === 'พฤหัสฯ' ? 'พฤหัสบดี' : WD[best]}อารมณ์บวกบ่อยที่สุดในเดือนนี้</div>` : ''}</section>`;
}

// ---------- มุมมองปี · Side-MoodYear ----------
function yearView(d) {
  const y = st.y, tk = todayKey(), t = new Date();
  const heads = Array.from({ length: 12 }, (_, m) => `<span class="smy-mh${y === t.getFullYear() && m === t.getMonth() ? ' on' : ''}">${m + 1}</span>`).join('');
  const count = {}; let logged = 0, rows = '';
  for (let day = 1; day <= 31; day++) {
    let cells = '';
    for (let m = 0; m < 12; m++) {
      const dt = new Date(y, m, day);
      if (dt.getMonth() !== m) { cells += '<span class="smy-c"></span>'; continue; }
      const k = toKey(dt);
      if (k > tk) { cells += '<span class="smy-c fut"></span>'; continue; }
      const md = d.moods.find(x => x.id === d.moodLog[k]?.moodId);
      if (md) { count[md.id] = (count[md.id] || 0) + 1; logged++; }
      cells += md ? `<span class="smy-c" style="background:${md.color}"></span>` : '<span class="smy-c miss"></span>';
    }
    rows += `<div class="smy-row"><span class="smy-dn">${day}</span><div class="smy-g">${cells}</div></div>`;
  }
  const list = [...d.moods].sort((a, b) => (count[b.id] || 0) - (count[a.id] || 0) || a.order - b.order);
  const max = Math.max(1, ...list.map(x => count[x.id] || 0));
  const bars = list.map(md => { const c = count[md.id] || 0; return `<div class="smy-br"><span class="smy-sq" style="background:${md.color}"></span><span class="smy-bn">${esc(md.name)}</span><span class="smy-bar"><span style="width:${(c / max * 100).toFixed(1)}%;background:${md.color}"></span></span><span class="smy-pc">${logged ? Math.round(c / logged * 100) : 0}%</span><span class="smy-n">${c}</span></div>`; }).join('');
  return `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="ปีก่อน" data-sm-year="-1">${L}</button>
      <div class="sm-title">${y + 543}</div>
      <button type="button" class="cal-arrow" aria-label="ปีถัดไป" data-sm-year="1">${R}</button></div>
    <section class="card smy"><div role="img" aria-label="อารมณ์รายวันทั้งปี ${y + 543} คอลัมน์ละหนึ่งเดือน แถวละหนึ่งวัน">
      <div class="smy-row smy-head"><span class="smy-dn"></span><div class="smy-g">${heads}</div></div>
      <div class="smy-rows">${rows}</div></div></section>
    <section class="card sm-sec"><div class="sm-sh"><h2>สัดส่วนทั้งปี</h2><span>จาก ${logged} วันที่บันทึก</span></div>
      <div style="margin-top:8px">${bars}</div>
      <div class="sm-foot" style="margin-top:6px">% = สัดส่วนจากวันที่บันทึก · ตัวเลขจาง = จำนวนวัน</div>
      <div class="smy-leg"><span><i class="miss"></i>ไม่ได้บันทึก</span><span><i class="fut"></i>ยังมาไม่ถึง</span></div></section>`;
}

export function renderSideMood() {
  const d = getData();
  const seg = id => `<button type="button" class="seg-btn${st.view === id ? ' on' : ''}" aria-pressed="${st.view === id}" data-sm-view="${id}">${id === 'month' ? 'เดือน' : 'ปี'}</button>`;
  return `<div class="side">
    <button type="button" class="side-back" data-side-back>${BACK}${location.hash.split('/')[2] === 'today' ? 'วันนี้' : 'แยกด้าน'}</button>
    <h1 class="h-page side-title">อารมณ์</h1>
    <div class="seg" style="margin:0">${seg('month')}${seg('year')}</div>
    ${st.view === 'month' ? `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="เดือนก่อน" data-sm-month="-1">${L}</button>
      <div class="sm-title">${MONTHS[st.m]} <span style="color:var(--muted)">${st.y + 543}</span></div>
      <button type="button" class="cal-arrow" aria-label="เดือนถัดไป" data-sm-month="1">${R}</button></div>
    ${calendar(d)}${summary(d)}${jar(d)}${weekly(d)}${weekdays(d)}` : yearView(d)}
  </div>`;
}

export function mountSideMood(root, rerender) {
  root.addEventListener('click', e => {
    const dy = e.target.closest('[data-sm-day]');
    if (dy) { openMoodDay(dy.dataset.smDay, rerender); return; }
    const b = e.target.closest('[data-sm-view],[data-sm-month],[data-sm-year]');
    if (!b) return;
    if (b.dataset.smView) st.view = b.dataset.smView;
    else if (b.dataset.smYear) st.y += Number(b.dataset.smYear);
    else { const n = st.m + Number(b.dataset.smMonth); st.y += Math.floor(n / 12); st.m = (n + 12) % 12; }
    rerender();
  });
}

// จด/แก้อารมณ์ของวันใดก็ได้ (ไม่เกินวันนี้) · เลือกอารมณ์ + โน้ตสั้น ๆ · ลบได้ (มีป๊อปอัป)
function openMoodDay(k, onSaved) {
  const d0 = getData(), old = d0.moodLog[k], dt = fromKey(k);
  const f = { pick: old?.moodId || null, note: old?.note || '' };
  const moods = [...d0.moods].sort((a, b) => a.order - b.order);
  const body = () => `<div class="md-grid">${moods.map(m => { const on = m.id === f.pick, dim = f.pick && !on;
      return `<button type="button" class="md-btn${on ? ' on' : ''}" aria-pressed="${on}" aria-label="${esc(m.name)}" data-md-pick="${m.id}"${on ? ` style="background:${m.color}2E"` : ''}><span class="md-ball" style="background:${ball(m.color)};opacity:${dim ? 0.5 : 1}"></span><span class="md-name">${esc(m.name)}</span></button>`; }).join('')}</div>
    <label class="pa-note"><span class="pa-nl">โน้ตสั้น ๆ</span><textarea maxlength="100" rows="2" aria-label="โน้ตสั้น ๆ" data-md-note>${esc(f.note)}</textarea><span class="pa-cnt" data-md-cnt>${f.note.length}/100</span></label>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:16px">${old ? '<button type="button" class="btn-secondary" data-md-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-md-save>บันทึก</button></div>`;
  openSheet({
    title: `อารมณ์ · ${DAYS_SHORT[dt.getDay()]} ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`, body,
    mount(el, close, render) {
      el.addEventListener('input', e => { if (e.target.matches('[data-md-note]')) { f.note = e.target.value.slice(0, 100); el.querySelector('[data-md-cnt]').textContent = `${f.note.length}/100`; } });
      el.addEventListener('click', async e => {
        const p = e.target.closest('[data-md-pick]');
        if (p) { f.pick = p.dataset.mdPick; render(); return; }
        if (e.target.closest('[data-md-del]')) {
          if (!await confirmDelete({ title: `ลบอารมณ์วันที่ ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}?` })) return;
          update(dd => { delete dd.moodLog[k]; }); close(); onSaved?.(); return;
        }
        if (e.target.closest('[data-md-save]')) {
          if (!f.pick) return;
          update(dd => { dd.moodLog[k] = { moodId: f.pick, note: f.note.trim() }; }); close(); onSaved?.();
        }
      });
    },
  });
}
