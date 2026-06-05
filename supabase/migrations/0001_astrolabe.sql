-- The AstroLab persistence: one profile and one sacred star per (anonymous) user.
-- Requires "Anonymous sign-ins" enabled in the project's Auth settings.

create table if not exists public.astrolabe_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  birth_iso  text not null,
  place      text,
  natal      jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.astrolabe_stars (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  star       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.astrolabe_profiles enable row level security;
alter table public.astrolabe_stars    enable row level security;

drop policy if exists "own profile" on public.astrolabe_profiles;
create policy "own profile" on public.astrolabe_profiles
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own star" on public.astrolabe_stars;
create policy "own star" on public.astrolabe_stars
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
