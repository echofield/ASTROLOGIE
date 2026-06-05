-- Astrolabe record layer: Genius journal + sealed-star ledger.
-- Anonymous sessions are authenticated users in Supabase, so RLS stays per-user.

create table if not exists public.astrolabe_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists astrolabe_messages_user_created_idx
  on public.astrolabe_messages (user_id, created_at desc);

create table if not exists public.astrolabe_star_ledger (
  user_id    uuid not null references auth.users(id) on delete cascade,
  sealed_at  timestamptz not null,
  star       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, sealed_at)
);

create index if not exists astrolabe_star_ledger_user_sealed_idx
  on public.astrolabe_star_ledger (user_id, sealed_at desc);

alter table public.astrolabe_messages    enable row level security;
alter table public.astrolabe_star_ledger enable row level security;

drop policy if exists "own messages" on public.astrolabe_messages;
create policy "own messages" on public.astrolabe_messages
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own star ledger" on public.astrolabe_star_ledger;
create policy "own star ledger" on public.astrolabe_star_ledger
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
