# Journal PWA · ส่งต่องานสร้างให้ Claude Code

อัปเดต: 22 พ.ย. 2569 · เจ้าของ: บลู (RML)

## 1. ของที่ส่งต่อ
- **หน้าจอทั้งหมด:** ผืนผ้าใบ Design (artifact) slug `cbfd31ca-6758-42e2-82f9-4f8d2b73504a` · https://claude.ai/artifact/SBzGKeZveZ9CJLKyzSyu5b
  - แต่ละบอร์ดเป็นไฟล์ `project/<ชื่อบอร์ด>.dc.html` (HTML + inline style ล้วน ไม่มี logic) ใช้เป็นต้นแบบหน้าตาได้ตรง ๆ
  - ตำแหน่งบอร์ด/ชื่อเรื่องอยู่ใน `project/canvas.json`
- **สเปก:** `APP_SPEC.md` (ฉบับเดิม) + `claude/APP_SPEC_updates.md` (ส่วนที่เปลี่ยน — ถ้าขัดกันยึดฉบับนี้)
- **สถานะงานออกแบบ:** `claude/HANDOFF_journal_design.md`

## 2. สแตกที่แนะนำ (ยืนยันกับบลูก่อนเริ่ม)
- PWA หน้าเดียว ติดตั้งบน iPhone (Add to Home Screen) · manifest + service worker ใช้งานออฟไลน์
- เก็บข้อมูลในเครื่องก่อน (IndexedDB) · ซิงก์ข้ามเครื่องด้วย Supabase ผ่าน "รหัสซิงก์" (ไม่มีระบบล็อกอิน)
- โฮสต์แบบ static (เช่น GitHub Pages)
- ฟอนต์ Prompt + Bai Jamjuree · ภาษาไทยทั้งแอป · ปี พ.ศ.

## 3. แผนที่หน้าจอ → บอร์ด
| ส่วน | บอร์ด |
|---|---|
| วันนี้ | Main, Today-Empty, Today-Done, Today-TodoAdd, Today-Expanded (Quick note), Today-Many (เลือกวัน), Today-Mood |
| เพิ่มกิจกรรม | Add-New, Add-Filled, Add-Edit, Pick-Cat, Pick-CatEmpty, Pick-Person, Pick-PersonNew, Pick-Place, Pick-PlaceNew, Cat-New, Cat-Edit |
| ปฏิทิน | Cal-Week, Cal-WeekEmpty, Cal-Month, Cal-MonthPin, Cal-Empty, Cal-Add, Cal-AddRange, Cal-Year |
| แยกด้าน | Side-Home |
| อารมณ์ | Side-Mood, Side-MoodYear |
| Habit | Side-Habit, Side-HabitNew, Side-HabitYear |
| สุขภาพ | Side-Health, Side-HealthYear, Side-PeriodLog, Side-PeriodSet, Side-VitNew, Side-DrugLog, Side-DrugNew, Side-DrugDelete, Side-SymLog |
| หนึ่งวันหนึ่งภาพ | Side-Photo, Side-PhotoYear, Side-PhotoSlide, Side-PhotoAdd |
| วันสำคัญ | Imp-List, Imp-New, Imp-All, Imp-History |
| ตั้งค่า | Set-Main, Set-Mood, Set-MoodEdit, Set-Cat, Set-Sync, Set-SyncConfirm, Set-Version |
| เปิดครั้งแรก | Onb-Welcome, Onb-Name, Onb-Sides, Onb-Code |
| ชุดสไตล์ | Style, Style-2 |

## 4. ข้อมูล (ร่าง)
- settings: ชื่อ, วันแรกของสัปดาห์, ช่วงวันสำคัญ (7), period_default_len, period_default_cycle, sync_code, app_version
- moods (ชื่อ สี กลุ่ม ลำดับ) · mood_log (date, mood_id, note ≤100)
- categories / people / places · events (title, start_date, end_date, time|ทั้งวัน, category, people[], place)
- todos (date, title, time?, done) · quick_notes (date, time, text)
- habits (name, type build/quit, freq daily/alt/custom days, color) · habit_log (habit_id, date, done)
- important_dates (title, date, yearly, note_color)
- period_log (date, flow h/m/l, cramps, ended) · vitamins (name, dose, time_slot, freq) · vitamin_log · drugs/drug_categories · drug_log (date, drug, qty, time) · symptoms/symptom_log (date, name, note, time)
- photos (date unique, image blob/ref, note ≤100)

## 5. กติกาที่ต้องไม่หลุด
- ไม่มี: แจ้งเตือน, AI, เกม/แต้ม (ยกเว้น streak ใน Habit), ค้นหา, dark mode
- ลบทุกอย่างต้องมีป๊อปอัปยืนยัน · ปุ่ม +/- พิมพ์ตัวเลขได้ · ใส่รหัสซิงก์จากเครื่องอื่น = แทนที่ข้อมูล ต้องยืนยัน
- ไม่มี sheet ซ้อน sheet (ขั้นถัดไปเป็นหน้าใหม่ใน sheet เดิม + ‹)
- ข้อความสรุปใช้การนับ + แม่แบบประโยคเท่านั้น
- การคาดการณ์ประจำเดือน: ตาม APP_SPEC_updates.md (เฉลี่ยรอบจริง ≤6 รอบ, <3 รอบใช้ค่าตั้งเอง, ยึด log จริงเสมอ)
- หนึ่งวันหนึ่งภาพ: วันละ 1 ภาพ ภาพใหม่แทนที่ภาพเดิม · ย่อภาพก่อนเก็บ/ซิงก์

## 6. Prompt สำหรับ Claude Code

```
คุณจะสร้างแอป "Journal" เป็น PWA สำหรับ iPhone ให้บลู ตอบเป็นภาษาไทยเท่านั้น

อ่านก่อนเริ่ม:
1. BUILD_HANDOFF_claude_code.md (ไฟล์นี้) — แผนที่หน้าจอ ข้อมูล กติกา
2. APP_SPEC.md และ APP_SPEC_updates.md (ถ้าขัดกัน ยึด updates)
3. ต้นแบบหน้าจอ: ไฟล์ project/*.dc.html จาก artifact cbfd31ca-6758-42e2-82f9-4f8d2b73504a
   (ถ้าเปิด artifact ไม่ได้ ให้ถามบลูให้ export ไฟล์มาไว้ในโฟลเดอร์ designs/)

วิธีทำงาน:
- ก่อนเขียนโค้ด เสนอสแตก โครงโฟลเดอร์ และโครงข้อมูล แล้วรอบลูตอบ "ผ่าน"
- สร้างทีละส่วนตามลำดับ: โครงแอป + เมนูล่าง 4 แท็บ + เก็บข้อมูลในเครื่อง → วันนี้ → ปฏิทิน/เพิ่มกิจกรรม → แยกด้าน (อารมณ์, Habit, สุขภาพ, วันสำคัญ, หนึ่งวันหนึ่งภาพ) → ตั้งค่า → เปิดครั้งแรก → ซิงก์ Supabase
- จบแต่ละส่วน: สรุปสั้น ๆ ว่าทำอะไร วิธีลองบนมือถือ แล้วรอ "ผ่าน" ก่อนเริ่มส่วนถัดไป
- หน้าตาต้องตรงกับบอร์ด (สี ฟอนต์ ระยะ ขนาด) ใช้ค่าจากบอร์ด Style และ Style-2 เป็น design token
- ห้ามเพิ่มฟีเจอร์ที่ไม่มีในบอร์ดหรือสเปก ถ้าเจอจุดที่สเปกไม่บอก ให้ถามก่อน
- ห้ามมี: แจ้งเตือน, AI, เกม/แต้ม (ยกเว้น streak ใน Habit), ค้นหา, dark mode
- ลบทุกอย่างมีป๊อปอัปยืนยัน · ปุ่ม +/- พิมพ์เลขได้ · ไม่มี sheet ซ้อน sheet
- ข้อความในแอปใช้ตามบอร์ดเท่านั้น ถ้าต้องเพิ่มคำใหม่ให้แจ้งแยกไว้ในรายงาน
- อย่าใส่ secret ของ Supabase ลงใน repo
```
