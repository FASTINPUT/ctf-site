begin;
-- Additive: existing content, category slugs, file URLs, and PAGE delimiters are untouched.
alter table public.posts add column if not exists platform text;
alter table public.posts add column if not exists problem_url text;
alter table public.posts add column if not exists difficulty text;
alter table public.posts add column if not exists tags text[] default '{}';
alter table public.posts add column if not exists status text;
alter table public.posts add column if not exists solved_at date;
alter table public.posts add column if not exists page_titles text[] default '{}';
alter table public.posts add column if not exists updated_at timestamptz;
alter table public.posts add column if not exists is_public boolean not null default true;
-- Historical edit times are unknown. Leave updated_at NULL until the next edit.
create or replace function public.fi_stamp_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists fi_posts_updated_at on public.posts;
create trigger fi_posts_updated_at before update on public.posts for each row execute function public.fi_stamp_updated_at();
create index if not exists fi_posts_category_created on public.posts(category,created_at desc,id desc);
create index if not exists fi_posts_updated on public.posts(updated_at desc nulls last,id desc);
create index if not exists fi_posts_created on public.posts(created_at desc,id desc);
create extension if not exists pg_trgm with schema extensions;
-- Respect the namespace of an existing pg_trgm installation.
do $$ declare ns text; begin
 select n.nspname into ns from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pg_trgm';
 execute format('create index if not exists fi_posts_title_search on public.posts using gin(title %I.gin_trgm_ops)',ns);
 execute format('create index if not exists fi_posts_content_search on public.posts using gin(content %I.gin_trgm_ops)',ns);
end $$;
-- SQL invoker function obeys caller RLS, and exposes only filter values.
create or replace function public.archive_facets() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('platforms',coalesce((select jsonb_agg(x order by x) from (select distinct platform x from public.posts where platform is not null and platform<>'') a),'[]'::jsonb),
 'difficulties',coalesce((select jsonb_agg(x order by x) from (select distinct difficulty x from public.posts where difficulty is not null and difficulty<>'') a),'[]'::jsonb));
$$;
revoke all on function public.archive_facets() from public;
grant execute on function public.archive_facets() to anon,authenticated;
commit;
