-- Stripe orders, written by the webhook (service role only). Not user-readable.
create table if not exists public.astrolabe_orders (
  session_id text primary key,
  email      text,
  amount     integer,
  currency   text,
  paid_at    timestamptz not null default now()
);

alter table public.astrolabe_orders enable row level security;
-- No anon/authenticated policy: only the service role (webhook) may write/read.
