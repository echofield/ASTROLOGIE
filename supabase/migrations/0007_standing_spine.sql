-- 0007_standing_spine.sql — ADDITIVE. Adds the composed YEAR SPINE to the
-- Standing (a new column on the new astrolabe_standing table only; no Backend A
-- table touched). The spine = the arc + twelve chapter shapes, composed at
-- "seal your year" so month one is already rich; monthly readings stay on it.
alter table public.astrolabe_standing
  add column if not exists spine jsonb not null default '{}'::jsonb;
