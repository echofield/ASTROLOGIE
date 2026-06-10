-- The Cabinet shelf: readings become plural. One row per reading, kept forever.
-- astrolabe_reads (singleton) is left untouched as the rollback path.
-- APPLIED to cityflow (uwwquvnvxcmahsweuywl) 2026-06-10 via MCP; backfill verified (1 row, opened).
create table if not exists public.astrolabe_readings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  email          text,
  question       text,
  -- what the reading is anchored to: {"kind":"question"} today;
  -- {"kind":"moment","moment":"solar-return","date":"..."} for the calendar doors
  anchor         jsonb not null default '{"kind":"question"}'::jsonb,
  read           jsonb not null,
  language       text not null default 'en',
  corpus_flagged boolean not null default false,
  created_at     timestamptz not null default now(),
  opened_at      timestamptz   -- null = still sealed (the seal not yet broken)
);

create index if not exists astrolabe_readings_user_idx
  on public.astrolabe_readings (user_id, created_at desc);
create index if not exists astrolabe_readings_email_idx
  on public.astrolabe_readings (lower(email), created_at desc);
-- one row per generated reading even when server persist + client mirror both write
create unique index if not exists astrolabe_readings_user_gen_idx
  on public.astrolabe_readings (user_id, (read->>'generatedAt'));

alter table public.astrolabe_readings enable row level security;
drop policy if exists "own readings" on public.astrolabe_readings;
create policy "own readings" on public.astrolabe_readings
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- carry every existing reading across (each singleton row becomes reading No. I,
-- already opened — never re-sealed)
insert into public.astrolabe_readings (user_id, email, question, read, language, corpus_flagged, created_at, opened_at)
select user_id, email, read->>'question', read,
       coalesce(read->>'language', 'en'), corpus_flagged, created_at, created_at
from public.astrolabe_reads
on conflict do nothing;
