-- 0005_atlas.sql — Atlas memory. ADDITIVE ONLY.
-- Creates two new tables for user state (discovery + behavioral aura log).
-- No ALTER/DROP on any existing Backend A table. RLS matches Backend A's
-- pattern exactly: TO authenticated, auth.uid() = user_id (anon sessions, which
-- are 'authenticated' with their own uid, can only touch their own rows).

-- discoveries: the only core state table. Codex/progress are queries over this.
create table if not exists public.astrolabe_discoveries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  territory   text not null,          -- sign slug, e.g. 'pisces'
  artifact_id text not null,          -- stable id from data/, e.g. 'pisces.veil_pearl'
  found_at    timestamptz not null default now(),
  unique (user_id, artifact_id)
);
alter table public.astrolabe_discoveries enable row level security;
drop policy if exists "own discoveries" on public.astrolabe_discoveries;
create policy "own discoveries" on public.astrolabe_discoveries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists astrolabe_discoveries_user_idx on public.astrolabe_discoveries (user_id);

-- aura_events: append-only behavioral log (the moat insurance; computed later).
create table if not exists public.astrolabe_aura_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,          -- 'territory_enter' | 'artifact_found' | 'reading_opened' | ...
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.astrolabe_aura_events enable row level security;
drop policy if exists "own aura events" on public.astrolabe_aura_events;
create policy "own aura events" on public.astrolabe_aura_events
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists astrolabe_aura_events_user_idx on public.astrolabe_aura_events (user_id, created_at);
