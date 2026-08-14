-- Patient Monitor SQL Migration Schema (Supabase Postgres)
-- Target Patient: Yousef

-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- 1. Water Intake
create table if not exists water_intake (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  entry_time time not null,
  liquid_type text not null,
  amount_ml numeric not null check (amount_ml >= 0),
  notes text,
  created_at timestamptz default now()
);

-- 2. Urine Output
create table if not exists urine_output (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  entry_time time not null,
  volume_ml numeric not null check (volume_ml >= 0),
  notes text,
  created_at timestamptz default now()
);

-- 3. Sugar & Insulin Monitor
create table if not exists sugar_monitor (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  entry_time time not null,
  blood_sugar_mgdl numeric not null check (blood_sugar_mgdl >= 0),
  insulin_type text,
  insulin_units numeric check (insulin_units is null or insulin_units >= 0),
  notes text,
  created_at timestamptz default now()
);

-- 4. Daily Locked Summary
create table if not exists daily_summary (
  id uuid primary key default gen_random_uuid(),
  summary_date date not null unique,
  total_intake_ml numeric default 0,
  total_output_ml numeric default 0,
  net_balance_ml numeric default 0,
  avg_blood_sugar_mgdl numeric,
  total_insulin_units numeric default 0,
  reading_count int default 0,
  updated_at timestamptz default now()
);

-- 5. Medication & Insulin Schedule
create table if not exists medication_schedule (
  id uuid primary key default gen_random_uuid(),
  medicine_name text not null,
  dose_label text,
  category text check (category in ('insulin','oral','iv','other')) default 'other',
  scheduled_time time not null,
  label text,
  recurrence text check (recurrence in ('daily','specific_days','once')) default 'daily',
  days_of_week int[],
  active boolean default true,
  created_at timestamptz default now()
);

-- 6. Medication Reminder Log
create table if not exists medication_reminder_log (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references medication_schedule(id) on delete cascade,
  due_at timestamptz not null,
  status text check (status in ('pending','given','snoozed','missed')) default 'pending',
  acknowledged_at timestamptz,
  linked_sugar_monitor_id uuid references sugar_monitor(id) on delete set null,
  created_at timestamptz default now()
);

-- 7. Web Push Subscriptions
create table if not exists push_subscription (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- Index optimizations
create index if not exists idx_water_intake_date on water_intake(entry_date);
create index if not exists idx_urine_output_date on urine_output(entry_date);
create index if not exists idx_sugar_monitor_date on sugar_monitor(entry_date);
create index if not exists idx_daily_summary_date on daily_summary(summary_date);
create index if not exists idx_med_log_due_status on medication_reminder_log(due_at, status);

-- Trigger function to automatically recalculate daily summary
create or replace function recalculate_daily_summary_for_date(target_date date)
returns void as $$
declare
  v_intake numeric;
  v_output numeric;
  v_avg_sugar numeric;
  v_total_insulin numeric;
  v_reading_cnt int;
begin
  select coalesce(sum(amount_ml), 0) into v_intake
  from water_intake where entry_date = target_date;

  select coalesce(sum(volume_ml), 0) into v_output
  from urine_output where entry_date = target_date;

  select
    round(coalesce(avg(blood_sugar_mgdl), 0), 1),
    coalesce(sum(insulin_units), 0),
    count(*)
  into v_avg_sugar, v_total_insulin, v_reading_cnt
  from sugar_monitor where entry_date = target_date;

  insert into daily_summary (
    summary_date,
    total_intake_ml,
    total_output_ml,
    net_balance_ml,
    avg_blood_sugar_mgdl,
    total_insulin_units,
    reading_count,
    updated_at
  )
  values (
    target_date,
    v_intake,
    v_output,
    v_intake - v_output,
    v_avg_sugar,
    v_total_insulin,
    v_reading_cnt,
    now()
  )
  on conflict (summary_date) do update set
    total_intake_ml = excluded.total_intake_ml,
    total_output_ml = excluded.total_output_ml,
    net_balance_ml = excluded.net_balance_ml,
    avg_blood_sugar_mgdl = excluded.avg_blood_sugar_mgdl,
    total_insulin_units = excluded.total_insulin_units,
    reading_count = excluded.reading_count,
    updated_at = now();
end;
$$ language plpgsql;

-- Trigger handler
create or replace function trigger_update_daily_summary()
returns trigger as $$
begin
  if (TG_OP = 'DELETE') then
    perform recalculate_daily_summary_for_date(OLD.entry_date);
    return OLD;
  else
    perform recalculate_daily_summary_for_date(NEW.entry_date);
    if (TG_OP = 'UPDATE' and OLD.entry_date <> NEW.entry_date) then
      perform recalculate_daily_summary_for_date(OLD.entry_date);
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql;

-- Bind triggers
drop trigger if exists trg_water_summary on water_intake;
create trigger trg_water_summary
after insert or update or delete on water_intake
for each row execute function trigger_update_daily_summary();

drop trigger if exists trg_urine_summary on urine_output;
create trigger trg_urine_summary
after insert or update or delete on urine_output
for each row execute function trigger_update_daily_summary();

drop trigger if exists trg_sugar_summary on sugar_monitor;
create trigger trg_sugar_summary
after insert or update or delete on sugar_monitor
for each row execute function trigger_update_daily_summary();

-- Disable RLS for single-user home care access
alter table water_intake disable row level security;
alter table urine_output disable row level security;
alter table sugar_monitor disable row level security;
alter table daily_summary disable row level security;
alter table medication_schedule disable row level security;
alter table medication_reminder_log disable row level security;
alter table push_subscription disable row level security;
