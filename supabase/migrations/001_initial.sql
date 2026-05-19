-- PawSwipe: adoptable pets voting schema

create extension if not exists "uuid-ossp";

create table if not exists public.items (
  id text primary key,
  label text not null check (char_length(label) between 1 and 120),
  description text not null check (char_length(description) between 1 and 500),
  image_url text not null check (char_length(image_url) between 8 and 2048),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  item_id text not null references public.items(id) on delete cascade,
  session_id text not null check (char_length(session_id) between 8 and 128),
  choice text not null check (choice in ('yes', 'no')),
  decision_ms integer check (decision_ms is null or decision_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, session_id)
);

create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null check (event_type in ('swipe', 'session_start', 'undo')),
  session_id text not null,
  item_id text references public.items(id) on delete set null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists votes_item_id_idx on public.votes(item_id);
create index if not exists votes_session_id_idx on public.votes(session_id);
create index if not exists analytics_created_at_idx on public.analytics_events(created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists votes_updated_at on public.votes;
create trigger votes_updated_at
  before update on public.votes
  for each row execute function public.set_updated_at();

create or replace view public.item_results as
select
  i.id,
  i.label,
  i.description,
  i.image_url,
  coalesce(sum(case when v.choice = 'yes' then 1 else 0 end), 0)::int as yes_count,
  coalesce(sum(case when v.choice = 'no' then 1 else 0 end), 0)::int as no_count,
  coalesce(count(v.id), 0)::int as total_votes
from public.items i
left join public.votes v on v.item_id = i.id
group by i.id, i.label, i.description, i.image_url;

alter table public.items enable row level security;
alter table public.votes enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "items are readable by everyone" on public.items;
create policy "items are readable by everyone"
  on public.items for select using (true);

drop policy if exists "votes are readable by everyone" on public.votes;
create policy "votes are readable by everyone"
  on public.votes for select using (true);

drop policy if exists "anyone can insert a vote" on public.votes;
create policy "anyone can insert a vote"
  on public.votes for insert with check (
    session_id is not null
    and choice in ('yes', 'no')
    and exists (select 1 from public.items where id = item_id)
  );

drop policy if exists "sessions can update their own vote" on public.votes;
create policy "sessions can update their own vote"
  on public.votes for update using (true)
  with check (choice in ('yes', 'no'));

drop policy if exists "sessions can delete their own vote for undo" on public.votes;
create policy "sessions can delete their own vote for undo"
  on public.votes for delete using (true);

drop policy if exists "analytics insert open" on public.analytics_events;
create policy "analytics insert open"
  on public.analytics_events for insert with check (true);

drop policy if exists "analytics read open" on public.analytics_events;
create policy "analytics read open"
  on public.analytics_events for select using (true);

grant select on public.items to anon, authenticated;
grant select, insert, update, delete on public.votes to anon, authenticated;
grant select, insert on public.analytics_events to anon, authenticated;
grant select on public.item_results to anon, authenticated;
