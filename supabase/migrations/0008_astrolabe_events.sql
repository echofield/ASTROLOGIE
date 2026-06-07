-- 0008_astrolabe_events.sql — the proof-ledger. ADDITIVE ONLY.
-- One new append-only table; NO ALTER/DROP on any existing table. RLS matches
-- Backend A / Atlas exactly: TO authenticated, auth.uid() = user_id (anon
-- sessions are 'authenticated' with their own uid → own rows only). Modeled on
-- astrolabe_aura_events (0005). The durable lifecycle trail for stars/reads/
-- standing/months; "kept" is derivable from the passed-judgment event.

create table if not exists public.astrolabe_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subject_type    text not null check (subject_type in ('star','read','standing','month')),
  subject_id      text not null,
  event_type      text not null,
  payload         jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at      timestamptz not null default now(),
  -- NULL keys are distinct in Postgres → only keyed events dedupe; unkeyed insert freely
  unique (user_id, idempotency_key)
);

alter table public.astrolabe_events enable row level security;
drop policy if exists "own events" on public.astrolabe_events;
create policy "own events" on public.astrolabe_events
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists astrolabe_events_user_idx
  on public.astrolabe_events (user_id, created_at);
create index if not exists astrolabe_events_subject_idx
  on public.astrolabe_events (user_id, subject_type, subject_id);
