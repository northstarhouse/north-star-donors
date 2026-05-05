create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null,
  status text not null default 'active'
    check (status in ('active', 'complete', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists initiatives_area_title_key
  on public.initiatives(area, title);

create index if not exists initiatives_area_idx
  on public.initiatives(area);

create index if not exists initiatives_status_idx
  on public.initiatives(status);

alter table public.initiatives enable row level security;

grant select on public.initiatives to anon, authenticated;

drop policy if exists "token_can_read" on public.initiatives;
create policy "token_can_read"
  on public.initiatives
  for select
  to anon, authenticated
  using (public.has_valid_app_session());

alter table public.tasks
  add column if not exists initiative_id uuid
  references public.initiatives(id)
  on delete set null;

create index if not exists tasks_initiative_id_idx
  on public.tasks(initiative_id);

with membership_email_campaign as (
  insert into public.initiatives (title, area, status)
  values ('Membership Email Campaign', 'Membership', 'active')
  on conflict (area, title)
  do update set
    status = excluded.status,
    updated_at = now()
  returning id
)
update public.tasks
set
  initiative_id = (select id from membership_email_campaign),
  updated_at = now()
where title = 'Confirm Constant Contact sender address';
