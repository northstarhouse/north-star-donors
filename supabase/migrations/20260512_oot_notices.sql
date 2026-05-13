create table if not exists oot_notices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table oot_notices enable row level security;

drop policy if exists "Allow app session read oot_notices" on oot_notices;
create policy "Allow app session read oot_notices"
on oot_notices for select
to anon
using ((select public.has_valid_app_session()));

drop policy if exists "Allow anon insert oot_notices" on oot_notices;
create policy "Allow anon insert oot_notices"
on oot_notices for insert
to anon
with check (true);
