-- Apply only AFTER choosing and granting the existing administrator in README.
-- These policies add restrictive guards so an old permissive policy cannot allow writes.
-- Existing unrelated policies are never removed. Inspect 00_audit.sql for old RESTRICTIVE policies.
begin;
create or replace function public.fi_is_admin() returns boolean language sql stable security invoker set search_path='' as $$
 select coalesce(auth.jwt()->'app_metadata'->>'role' = 'admin',false);
$$;
revoke all on function public.fi_is_admin() from public;
grant execute on function public.fi_is_admin() to anon,authenticated;
alter table public.posts enable row level security;
alter table public.categories enable row level security;
grant select on public.posts,public.categories to anon,authenticated;
grant insert,update,delete on public.posts,public.categories to authenticated;
-- Explicit sequence grants only for identity/serial columns on these two tables.
do $$ declare seq text; begin
 for seq in select pg_get_serial_sequence('public.'||t,'id') from unnest(array['posts','categories']) t loop
  if seq is not null then execute 'grant usage,select on sequence '||seq||' to authenticated'; end if;
 end loop;
end $$;
do $$ declare t text; cmd text; begin
 foreach t in array array['posts','categories'] loop
  execute format('drop policy if exists fi_public_read on public.%I',t);
  execute format('create policy fi_public_read on public.%I for select to anon,authenticated using (true)',t);
  foreach cmd in array array['insert','update','delete'] loop
   execute format('drop policy if exists fi_%s_allow on public.%I',cmd,t);
   execute format('drop policy if exists fi_%s_guard on public.%I',cmd,t);
   if cmd='insert' then
    execute format('create policy fi_insert_allow on public.%I for insert to authenticated with check (public.fi_is_admin())',t);
    execute format('create policy fi_insert_guard on public.%I as restrictive for insert to anon,authenticated with check (public.fi_is_admin())',t);
   elsif cmd='update' then
    execute format('create policy fi_update_allow on public.%I for update to authenticated using (public.fi_is_admin()) with check (public.fi_is_admin())',t);
    execute format('create policy fi_update_guard on public.%I as restrictive for update to anon,authenticated using (public.fi_is_admin()) with check (public.fi_is_admin())',t);
   else
    execute format('create policy fi_delete_allow on public.%I for delete to authenticated using (public.fi_is_admin())',t);
    execute format('create policy fi_delete_guard on public.%I as restrictive for delete to anon,authenticated using (public.fi_is_admin())',t);
   end if;
  end loop;
 end loop;
end $$;
drop policy if exists fi_visibility_guard on public.posts;
create policy fi_visibility_guard on public.posts as restrictive for select to anon,authenticated using (is_public or public.fi_is_admin());
-- Keep existing public attachments public; do not change bucket visibility or erase files.
update storage.buckets set file_size_limit=10485760,allowed_mime_types=array['image/png','image/jpeg','image/webp','image/gif','application/pdf'] where id='post-files';
drop policy if exists fi_files_read on storage.objects;
create policy fi_files_read on storage.objects for select to anon,authenticated using (bucket_id='post-files');
drop policy if exists fi_files_insert on storage.objects;
create policy fi_files_insert on storage.objects for insert to authenticated with check (bucket_id='post-files' and public.fi_is_admin());
drop policy if exists fi_files_update on storage.objects;
create policy fi_files_update on storage.objects for update to authenticated using (bucket_id='post-files' and public.fi_is_admin()) with check (bucket_id='post-files' and public.fi_is_admin());
drop policy if exists fi_files_delete on storage.objects;
create policy fi_files_delete on storage.objects for delete to authenticated using (bucket_id='post-files' and public.fi_is_admin());
drop policy if exists fi_files_insert_guard on storage.objects;
create policy fi_files_insert_guard on storage.objects as restrictive for insert to anon,authenticated with check (bucket_id<>'post-files' or public.fi_is_admin());
drop policy if exists fi_files_update_guard on storage.objects;
create policy fi_files_update_guard on storage.objects as restrictive for update to anon,authenticated using (bucket_id<>'post-files' or public.fi_is_admin()) with check (bucket_id<>'post-files' or public.fi_is_admin());
drop policy if exists fi_files_delete_guard on storage.objects;
create policy fi_files_delete_guard on storage.objects as restrictive for delete to anon,authenticated using (bucket_id<>'post-files' or public.fi_is_admin());
commit;
