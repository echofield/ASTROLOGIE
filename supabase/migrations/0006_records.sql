-- 0006_records.sql — The Standing substrate. ADDITIVE ONLY.
-- Two new tables; no ALTER/DROP on any Backend A table. RLS identical to 0005:
-- TO authenticated, auth.uid() = user_id (anon sessions isolated to own rows).

-- The Day's Record — the writable memory substrate. Capture from day one.
create table if not exists public.astrolabe_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.astrolabe_records enable row level security;
drop policy if exists "own records" on public.astrolabe_records;
create policy "own records" on public.astrolabe_records
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists astrolabe_records_user_idx on public.astrolabe_records (user_id, created_at);

-- The Standing — the one-year commitment + its sealed questions. One per user.
create table if not exists public.astrolabe_standing (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  questions  jsonb not null default '[]'::jsonb,
  status     text not null default 'active'
);
alter table public.astrolabe_standing enable row level security;
drop policy if exists "own standing" on public.astrolabe_standing;
create policy "own standing" on public.astrolabe_standing
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
