-- READ ONLY: first export data, then inspect these results before migrations.
select table_name,column_name,data_type from information_schema.columns
where table_schema='public' and table_name in ('posts','categories') order by table_name,ordinal_position;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
where (schemaname='public' and tablename in ('posts','categories')) or (schemaname='storage' and tablename='objects');
select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on c.relnamespace=n.oid
where (n.nspname='public' and c.relname in ('posts','categories')) or (n.nspname='storage' and c.relname='objects');
select slug,count(*) from public.categories group by slug having count(*)>1;
select p.id,p.category from public.posts p left join public.categories c on p.category=c.slug where c.slug is null;
select id,name,public,file_size_limit,allowed_mime_types from storage.buckets where id='post-files';
-- Do not print user keys or authentication metadata in public reports.
select id,name,slug from public.categories where slug in ('write','writeups','categories','login','logout','edit','add-category','manage-categories','stats','bookmarks','about','api','_next');
select e.extname,n.nspname as extension_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pg_trgm';
select p.proname,pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('fi_is_admin','archive_facets','fi_stamp_updated_at','fi_check_category_slug');
