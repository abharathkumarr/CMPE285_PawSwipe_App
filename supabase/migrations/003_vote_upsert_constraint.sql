-- PostgREST: optional unique for (item_id, user_id). App uses update-or-insert instead.

alter table public.votes drop constraint if exists votes_item_user_key;

alter table public.votes
  add constraint votes_item_user_key unique (item_id, user_id);
