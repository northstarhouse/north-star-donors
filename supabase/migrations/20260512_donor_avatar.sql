alter table donors add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('donor-avatars', 'donor-avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Allow all donor avatars read" on storage.objects;
create policy "Allow all donor avatars read"
on storage.objects for select
using (bucket_id = 'donor-avatars');

drop policy if exists "Allow all donor avatars insert" on storage.objects;
create policy "Allow all donor avatars insert"
on storage.objects for insert
with check (bucket_id = 'donor-avatars');

drop policy if exists "Allow all donor avatars update" on storage.objects;
create policy "Allow all donor avatars update"
on storage.objects for update
using (bucket_id = 'donor-avatars')
with check (bucket_id = 'donor-avatars');

drop policy if exists "Allow all donor avatars delete" on storage.objects;
create policy "Allow all donor avatars delete"
on storage.objects for delete
using (bucket_id = 'donor-avatars');
