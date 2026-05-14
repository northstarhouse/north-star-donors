create table if not exists event_email_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  recipients jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table event_email_groups enable row level security;

drop policy if exists "Allow app session read event_email_groups" on event_email_groups;
create policy "Allow app session read event_email_groups"
on event_email_groups for select to anon
using ((select public.has_valid_app_session()));

drop policy if exists "Allow app session insert event_email_groups" on event_email_groups;
create policy "Allow app session insert event_email_groups"
on event_email_groups for insert to anon
with check ((select public.has_valid_app_session()));

drop policy if exists "Allow app session update event_email_groups" on event_email_groups;
create policy "Allow app session update event_email_groups"
on event_email_groups for update to anon
using ((select public.has_valid_app_session()));

drop policy if exists "Allow app session delete event_email_groups" on event_email_groups;
create policy "Allow app session delete event_email_groups"
on event_email_groups for delete to anon
using ((select public.has_valid_app_session()));
