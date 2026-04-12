create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'schedule_item_status') then
    create type public.schedule_item_status as enum ('planned', 'completed', 'skipped');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_channel') then
    create type public.reminder_channel as enum ('email');
  end if;
  if not exists (select 1 from pg_type where typname = 'template_source') then
    create type public.template_source as enum ('vn_default_v1', 'custom');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum ('pending', 'sent', 'failed');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_date date not null,
  gender text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vaccine_templates (
  id bigint generated always as identity primary key,
  version text not null,
  sort_order integer not null,
  milestone text not null,
  recommended_age_days integer not null,
  recommended_age_label text not null,
  vaccine_name text not null,
  origin text not null,
  disease text not null,
  estimated_price integer not null,
  appointment_time_local time not null default '08:00:00',
  template_source public.template_source not null default 'vn_default_v1',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists vaccine_templates_version_sort_order_idx
  on public.vaccine_templates(version, sort_order);

create table if not exists public.child_vaccine_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  template_entry_id bigint references public.vaccine_templates(id) on delete set null,
  sort_order integer not null default 0,
  scheduled_date date not null,
  appointment_time_local time not null default '08:00:00',
  recommended_age_days integer,
  recommended_age_label text not null,
  milestone text not null,
  vaccine_name text not null,
  origin text not null,
  disease text not null,
  estimated_price integer,
  actual_price integer,
  notes text,
  status public.schedule_item_status not null default 'planned',
  template_source public.template_source not null default 'vn_default_v1',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists child_vaccine_items_child_template_idx
  on public.child_vaccine_items(child_id, template_entry_id)
  where template_entry_id is not null;

create table if not exists public.reminder_preferences (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null unique references public.children(id) on delete cascade,
  reminder_email text,
  channel public.reminder_channel not null default 'email',
  email_enabled boolean not null default true,
  remind_one_day boolean not null default true,
  remind_two_hours boolean not null default true,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  child_vaccine_item_id uuid not null references public.child_vaccine_items(id) on delete cascade,
  channel public.reminder_channel not null default 'email',
  reminder_key text not null check (reminder_key in ('before_1_day', 'before_2_hours')),
  scheduled_for timestamptz not null,
  status public.delivery_status not null default 'pending',
  provider_message_id text,
  error_message text,
  payload jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists notification_deliveries_unique_reminder_idx
  on public.notification_deliveries(child_vaccine_item_id, channel, reminder_key);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists children_set_updated_at on public.children;
create trigger children_set_updated_at
before update on public.children
for each row execute procedure public.set_updated_at();

drop trigger if exists child_vaccine_items_set_updated_at on public.child_vaccine_items;
create trigger child_vaccine_items_set_updated_at
before update on public.child_vaccine_items
for each row execute procedure public.set_updated_at();

drop trigger if exists reminder_preferences_set_updated_at on public.reminder_preferences;
create trigger reminder_preferences_set_updated_at
before update on public.reminder_preferences
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.vaccine_templates enable row level security;
alter table public.child_vaccine_items enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "children_own_all" on public.children;
create policy "children_own_all"
  on public.children
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "vaccine_templates_read_authenticated" on public.vaccine_templates;
create policy "vaccine_templates_read_authenticated"
  on public.vaccine_templates for select
  using (auth.role() = 'authenticated');

drop policy if exists "schedule_items_own_all" on public.child_vaccine_items;
create policy "schedule_items_own_all"
  on public.child_vaccine_items
  for all
  using (
    exists (
      select 1
      from public.children
      where children.id = child_vaccine_items.child_id
        and children.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.children
      where children.id = child_vaccine_items.child_id
        and children.user_id = auth.uid()
    )
  );

drop policy if exists "reminder_preferences_own_all" on public.reminder_preferences;
create policy "reminder_preferences_own_all"
  on public.reminder_preferences
  for all
  using (
    exists (
      select 1
      from public.children
      where children.id = reminder_preferences.child_id
        and children.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.children
      where children.id = reminder_preferences.child_id
        and children.user_id = auth.uid()
    )
  );

drop policy if exists "notification_deliveries_read_own" on public.notification_deliveries;
create policy "notification_deliveries_read_own"
  on public.notification_deliveries
  for select
  using (
    exists (
      select 1
      from public.children
      where children.id = notification_deliveries.child_id
        and children.user_id = auth.uid()
    )
  );

insert into public.vaccine_templates (
  version,
  sort_order,
  milestone,
  recommended_age_days,
  recommended_age_label,
  vaccine_name,
  origin,
  disease,
  estimated_price,
  appointment_time_local,
  template_source
) values
  ('vn_default_v1', 1, 'Mốc 2 tháng tuổi', 59, '1 tháng 29 ngày', 'Infanrix Hexa (6 trong 1) — Mũi 1', 'Bỉ', 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib', 1098000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 2, 'Mốc 2 tháng tuổi', 66, '2 tháng 6 ngày', 'Rotateq — Liều uống 1', 'Mỹ', 'Tiêu chảy cấp do Rotavirus', 665000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 3, 'Mốc 2 tháng tuổi', 73, '2 tháng 13 ngày', 'Prevenar 13 (Phế cầu) — Mũi 1', 'Bỉ', 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', 1190000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 4, 'Mốc 2 tháng tuổi', 80, '2 tháng 20 ngày', 'Bexsero (Não mô cầu B) — Mũi 1', 'Ý', 'Viêm màng não do não mô cầu nhóm B', 1788000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 5, 'Mốc 2 tháng tuổi', 87, '2 tháng 27 ngày', 'MenQuadfi (Não mô cầu ACYW) — Mũi 1', 'Mỹ', 'Viêm màng não do não mô cầu nhóm A, C, Y, W-135', 1950000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 6, 'Mốc 3 tháng tuổi', 96, '3 tháng 6 ngày', 'Infanrix Hexa (6 trong 1) — Mũi 2', 'Bỉ', 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib', 1098000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 7, 'Mốc 3 tháng tuổi', 103, '3 tháng 13 ngày', 'Rotateq — Liều uống 2', 'Mỹ', 'Tiêu chảy cấp do Rotavirus', 665000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 8, 'Mốc 3 tháng tuổi', 110, '3 tháng 20 ngày', 'Prevenar 13 (Phế cầu) — Mũi 2', 'Bỉ', 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', 1190000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 9, 'Mốc 4 tháng tuổi', 129, '4 tháng 9 ngày', 'Infanrix Hexa (6 trong 1) — Mũi 3', 'Bỉ', 'Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib', 1098000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 10, 'Mốc 4 tháng tuổi', 136, '4 tháng 16 ngày', 'Rotateq — Liều uống 3', 'Mỹ', 'Tiêu chảy cấp do Rotavirus', 665000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 11, 'Mốc 4 tháng tuổi', 143, '4 tháng 23 ngày', 'Prevenar 13 (Phế cầu) — Mũi 3', 'Bỉ', 'Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu', 1190000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 12, 'Mốc 4 tháng tuổi', 150, '5 tháng 0 ngày', 'Bexsero (Não mô cầu B) — Mũi 2', 'Ý', 'Viêm màng não do não mô cầu nhóm B', 1788000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 13, 'Mốc 4 tháng tuổi', 157, '5 tháng 7 ngày', 'MenQuadfi (Não mô cầu ACYW) — Mũi 2', 'Mỹ', 'Viêm màng não do não mô cầu nhóm A, C, Y, W-135', 1950000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 14, 'Mốc 6 tháng tuổi', 185, '6 tháng 5 ngày', 'Vắc xin Cúm tứ giá — Mũi 1', 'Pháp/Mỹ', 'Cúm mùa', 356000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 15, 'Mốc 6 tháng tuổi', 192, '6 tháng 12 ngày', 'MenQuadfi (Não mô cầu ACYW) — Mũi 3', 'Mỹ', 'Viêm màng não do não mô cầu nhóm A, C, Y, W-135', 1950000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 16, 'Mốc 6 tháng tuổi', 213, '7 tháng 3 ngày', 'Vắc xin Cúm tứ giá — Mũi 2', 'Pháp/Mỹ', 'Cúm mùa (mũi 2 cách mũi 1 tối thiểu 4 tuần)', 356000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 17, 'Mốc 9 tháng tuổi', 276, '9 tháng 6 ngày', 'Sởi đơn / MMR — Mũi 1', 'Ấn Độ/Mỹ', 'Sởi (hoặc Sởi-Quai bị-Rubella nếu dùng MMR)', 155000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 18, 'Mốc 12 tháng tuổi', 367, '12 tháng 7 ngày', 'MMR / Priorix (Sởi-Quai bị-Rubella) — Mũi 1', 'Mỹ/Bỉ', 'Sởi, Quai bị, Rubella', 350000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 19, 'Mốc 12 tháng tuổi', 374, '12 tháng 14 ngày', 'Varivax (Thủy đậu) — Mũi 1', 'Mỹ', 'Thủy đậu', 985000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 20, 'Mốc 12 tháng tuổi', 381, '12 tháng 21 ngày', 'Imojev (Viêm não Nhật Bản) — Mũi 1', 'Thái Lan', 'Viêm não Nhật Bản', 988000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 21, 'Mốc 12 tháng tuổi', 388, '12 tháng 28 ngày', 'Prevenar 13 (Phế cầu) — Mũi nhắc', 'Bỉ', 'Viêm phổi, Viêm màng não do phế cầu (nhắc lại)', 1190000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 22, 'Mốc 12 tháng tuổi', 395, '13 tháng 5 ngày', 'Bexsero (Não mô cầu B) — Mũi nhắc', 'Ý', 'Viêm màng não do não mô cầu nhóm B (nhắc lại)', 1788000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 23, 'Mốc 12 tháng tuổi', 402, '13 tháng 12 ngày', 'MenQuadfi (Não mô cầu ACYW) — Mũi nhắc', 'Mỹ', 'Viêm màng não do não mô cầu ACYW (nhắc lại)', 1950000, '08:00:00', 'vn_default_v1'),
  ('vn_default_v1', 24, 'Mốc 12 tháng tuổi', 409, '13 tháng 19 ngày', 'Avaxim 80U (Viêm gan A) — Mũi 1', 'Pháp', 'Viêm gan A', 765000, '08:00:00', 'vn_default_v1')
on conflict (version, sort_order) do nothing;
