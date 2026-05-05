create table if not exists public.protected_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'fund-development',
  status text not null default 'draft',
  content_html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists protected_documents_category_idx
  on public.protected_documents(category);

alter table public.protected_documents enable row level security;

revoke all on public.protected_documents from anon, authenticated;
grant select on public.protected_documents to anon;

drop policy if exists "Protected documents require app session"
  on public.protected_documents;

create policy "Protected documents require app session"
  on public.protected_documents
  for select
  to anon
  using ((select public.has_valid_app_session()));
