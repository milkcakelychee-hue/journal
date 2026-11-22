-- Journal · ซิงก์ด้วย "รหัสซิงก์" (ไม่มีระบบล็อกอิน)
-- วิธีใช้: Supabase → SQL Editor → วางทั้งไฟล์ → Run (รันซ้ำได้ ไม่ทับข้อมูลเดิม)
-- ความปลอดภัย: ตารางปิดไว้ทั้งหมด (RLS ไม่มี policy) · แอปเข้าถึงได้ผ่านฟังก์ชันด้านล่างเท่านั้น
-- และต้องรู้รหัสซิงก์ถึงจะอ่าน/เขียนข้อมูลของรหัสนั้นได้

create table if not exists journal_sync (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists journal_photos (
  code text not null,
  day text not null,
  img text not null,              -- ภาพ JPEG ที่ย่อแล้ว (base64)
  updated_at timestamptz not null default now(),
  primary key (code, day)
);
alter table journal_sync enable row level security;
alter table journal_photos enable row level security;
revoke all on journal_sync, journal_photos from anon, authenticated;

create or replace function journal_ok(p_code text) returns boolean language sql immutable as $$
  select p_code ~ '^JRNL-[A-Z0-9]{4}-[A-Z0-9]{4}$'
$$;

create or replace function sync_get(p_code text) returns table (data jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select s.data, s.updated_at from journal_sync s where journal_ok(p_code) and s.code = p_code
$$;

create or replace function sync_put(p_code text, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if not journal_ok(p_code) then raise exception 'bad code'; end if;
  insert into journal_sync (code, data, updated_at) values (p_code, p_data, t)
  on conflict (code) do update set data = excluded.data, updated_at = t;
  return t;
end $$;

create or replace function photo_list(p_code text) returns table (day text, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select p.day, p.updated_at from journal_photos p where journal_ok(p_code) and p.code = p_code
$$;

create or replace function photo_get(p_code text, p_day text) returns text
language sql security definer set search_path = public as $$
  select p.img from journal_photos p where journal_ok(p_code) and p.code = p_code and p.day = p_day
$$;

create or replace function photo_put(p_code text, p_day text, p_img text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not journal_ok(p_code) then raise exception 'bad code'; end if;
  insert into journal_photos (code, day, img, updated_at) values (p_code, p_day, p_img, now())
  on conflict (code, day) do update set img = excluded.img, updated_at = now();
end $$;

create or replace function photo_del(p_code text, p_day text) returns void
language sql security definer set search_path = public as $$
  delete from journal_photos where journal_ok(p_code) and code = p_code and day = p_day
$$;

grant execute on function sync_get(text), sync_put(text, jsonb), photo_list(text), photo_get(text, text), photo_put(text, text, text), photo_del(text, text) to anon;
