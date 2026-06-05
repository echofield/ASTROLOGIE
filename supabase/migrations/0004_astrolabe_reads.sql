-- Complete Read artifact + profile geocoordinates for ascendant/houses.

alter table public.astrolabe_profiles
  add column if not exists lat double precision,
  add column if not exists lon double precision;

create table if not exists public.astrolabe_reads (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  read       jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.astrolabe_reads enable row level security;

drop policy if exists "own read" on public.astrolabe_reads;
create policy "own read" on public.astrolabe_reads
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
