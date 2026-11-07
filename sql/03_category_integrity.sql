-- Audit duplicates first. This transaction fails safely if duplicate slugs exist.
-- Existing orphaned posts are retained by NOT VALID. Repair them manually before VALIDATE.
begin;
create unique index if not exists fi_categories_slug_unique on public.categories(slug);
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.posts'::regclass and conname='fi_posts_category_fk') then
  alter table public.posts add constraint fi_posts_category_fk foreign key(category) references public.categories(slug) on update restrict on delete restrict not valid;
 end if;
end $$;
create or replace function public.fi_check_category_slug() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' or new.slug is distinct from old.slug then
  if new.slug !~ '^[[:alnum:]][[:alnum:]-]{0,79}$' or new.slug in ('write','writeups','categories','login','logout','edit','add-category','manage-categories','stats','bookmarks','about','api','_next') then
   raise exception 'Invalid or reserved category slug';
  end if;
 end if;
 return new;
end $$;
drop trigger if exists fi_category_slug_guard on public.categories;
create trigger fi_category_slug_guard before insert or update of slug on public.categories for each row execute function public.fi_check_category_slug();
commit;
-- Optional AFTER manually fixing orphaned posts:
-- alter table public.posts validate constraint fi_posts_category_fk;
