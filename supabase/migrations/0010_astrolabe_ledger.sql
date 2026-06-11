-- The ledger — every doorway checkout and its fate, one row per attempt.
-- Service-role only (RLS enabled, no client policies): the operator's book.
-- APPLIED to cityflow (uwwquvnvxcmahsweuywl) 2026-06-12 via MCP.
create table if not exists public.astrolabe_ledger (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  product_type       text not null,
  source             text,
  email              text,
  utm_source         text,
  utm_campaign       text,
  -- the doorway funnel's quiz answers + birth data, carried to the webhook generation
  payload            jsonb not null default '{}'::jsonb,
  checkout_started   timestamptz,
  stripe_session_id  text unique,
  payment_completed  timestamptz,
  amount             integer,
  currency           text,
  report_generated   timestamptz,
  reading_id         uuid
);

create index if not exists astrolabe_ledger_product_idx
  on public.astrolabe_ledger (product_type, created_at desc);
create index if not exists astrolabe_ledger_email_idx
  on public.astrolabe_ledger (lower(email));

alter table public.astrolabe_ledger enable row level security;
-- no policies on purpose: only the service role reads or writes the book
