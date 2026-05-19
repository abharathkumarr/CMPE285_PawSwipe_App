create extension if not exists pgcrypto with schema extensions;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  username text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint users_email_len check (char_length(email) between 5 and 255),
  constraint users_username_len check (char_length(username) between 2 and 40)
);

create unique index if not exists users_email_lower_idx on public.users (lower(email));
create unique index if not exists users_username_lower_idx on public.users (lower(username));

alter table public.votes drop constraint if exists votes_user_id_users_fkey;
alter table public.votes drop constraint if exists votes_item_id_session_id_key;

alter table public.votes add column if not exists user_id uuid;
alter table public.votes alter column session_id drop not null;

alter table public.votes
  add constraint votes_user_id_users_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

create unique index if not exists votes_item_session_demo_unique
  on public.votes (item_id, session_id) where user_id is null and session_id is not null;

create index if not exists votes_user_id_idx on public.votes(user_id);

create or replace function public.register_user(
  p_email text,
  p_password text,
  p_username text
)
returns table (id uuid, email text, username text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  clean_email text := lower(trim(p_email));
  clean_username text := lower(regexp_replace(trim(p_username), '[^a-z0-9_]', '', 'g'));
begin
  if length(clean_email) < 5 or position('@' in clean_email) = 0 then
    raise exception 'Invalid email';
  end if;
  if length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  if length(clean_username) < 2 then
    raise exception 'Username must be at least 2 characters';
  end if;

  return query
  insert into public.users (email, username, password_hash)
  values (clean_email, clean_username, extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning users.id, users.email, users.username;
end;
$$;

create or replace function public.login_user(p_email text, p_password text)
returns table (id uuid, email text, username text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  clean_email text := lower(trim(p_email));
begin
  return query
  select u.id, u.email, u.username
  from public.users u
  where lower(u.email) = clean_email
    and u.password_hash = extensions.crypt(p_password, u.password_hash);
end;
$$;

drop policy if exists "anyone can insert a vote" on public.votes;
drop policy if exists "sessions can update their own vote" on public.votes;
drop policy if exists "sessions can delete their own vote for undo" on public.votes;
drop policy if exists "app insert votes" on public.votes;
drop policy if exists "app update votes" on public.votes;
drop policy if exists "app delete votes" on public.votes;

create policy "app insert votes"
  on public.votes for insert
  with check (
    user_id is not null
    and choice in ('yes', 'no')
    and exists (select 1 from public.items where id = item_id)
  );

create policy "app update votes"
  on public.votes for update
  using (user_id is not null)
  with check (choice in ('yes', 'no'));

create policy "app delete votes"
  on public.votes for delete
  using (user_id is not null);

create policy "demo insert votes"
  on public.votes for insert
  with check (
    user_id is null
    and session_id is not null
    and session_id like 'demo-voter-%'
    and choice in ('yes', 'no')
    and exists (select 1 from public.items where id = item_id)
  );

alter table public.users enable row level security;
drop policy if exists "users readable" on public.users;
create policy "users readable"
  on public.users for select using (true);

grant select on public.users to anon, authenticated;
grant execute on function public.register_user(text, text, text) to anon, authenticated;
grant execute on function public.login_user(text, text) to anon, authenticated;
