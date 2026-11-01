-- =====================================================================
-- Hernan Portfolio: complete, idempotent Supabase setup (run the WHOLE file)
-- Supabase Dashboard > SQL Editor > New query > paste > Run.
-- Safe to run again at any time.
--
-- BEFORE RUNNING: your owner user ID is already filled in below. If you ever
-- change your admin account, update it in the function is_portfolio_owner().
-- (Find it at Dashboard > Authentication > Users > copy the "UID".)
-- =====================================================================

-- ---------- 1. Single source of truth for "who is the admin" ----------
create or replace function public.is_portfolio_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = '95f82a16-c195-44d0-88fd-e3b648ea0e12'::uuid;
$$;
revoke all on function public.is_portfolio_owner() from public;
grant execute on function public.is_portfolio_owner() to anon, authenticated;

-- ---------- 2. Certificates ----------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  issuer text check (issuer is null or char_length(issuer) <= 120),
  issued_on date,
  storage_path text not null unique,
  public_url text not null check (public_url ~* '^https://'),
  created_at timestamptz not null default now()
);
alter table public.certificates enable row level security;

drop policy if exists "Public can view certificates" on public.certificates;
create policy "Public can view certificates" on public.certificates
  for select to anon, authenticated using (true);

drop policy if exists "Admins can add certificates" on public.certificates;
drop policy if exists "Owner can add certificates" on public.certificates;
create policy "Owner can add certificates" on public.certificates
  for insert to authenticated with check (public.is_portfolio_owner());

drop policy if exists "Admins can delete certificates" on public.certificates;
drop policy if exists "Owner can delete certificates" on public.certificates;
create policy "Owner can delete certificates" on public.certificates
  for delete to authenticated using (public.is_portfolio_owner());

drop policy if exists "Owner can update certificates" on public.certificates;
create policy "Owner can update certificates" on public.certificates
  for update to authenticated using (public.is_portfolio_owner()) with check (public.is_portfolio_owner());

-- ---------- 3. Certificate file storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', true, 10485760,
  array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/png','image/jpeg','image/webp'];

drop policy if exists "Public can view certificate files" on storage.objects;
create policy "Public can view certificate files" on storage.objects
  for select to anon, authenticated using (bucket_id = 'certificates');

drop policy if exists "Admins can upload certificate files" on storage.objects;
drop policy if exists "Owner can upload certificate files" on storage.objects;
create policy "Owner can upload certificate files" on storage.objects
  for insert to authenticated with check (bucket_id = 'certificates' and public.is_portfolio_owner());

drop policy if exists "Admins can delete certificate files" on storage.objects;
drop policy if exists "Owner can delete certificate files" on storage.objects;
create policy "Owner can delete certificate files" on storage.objects
  for delete to authenticated using (bucket_id = 'certificates' and public.is_portfolio_owner());

-- ---------- 4. Contact / social links ----------
create table if not exists public.contact_links (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 80),
  category text not null default 'social' check (char_length(category) <= 50),
  type text not null default 'url' check (type in ('url','email','phone')),
  value text not null check (char_length(value) between 1 and 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
-- If the table already existed from an older version, make sure new columns exist.
alter table public.contact_links add column if not exists sort_order integer not null default 0;
alter table public.contact_links add column if not exists created_at timestamptz not null default now();
alter table public.contact_links enable row level security;

drop policy if exists "Public can view contact links" on public.contact_links;
create policy "Public can view contact links" on public.contact_links
  for select to anon, authenticated using (true);

-- Remove any older, broader policies that may exist from earlier versions.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'contact_links'
             and policyname <> 'Public can view contact links'
  loop
    execute format('drop policy %I on public.contact_links', p.policyname);
  end loop;
end $$;

create policy "Owner can manage contact links" on public.contact_links
  for all to authenticated using (public.is_portfolio_owner()) with check (public.is_portfolio_owner());

-- ---------- 5. Managed portfolio content ----------
create table if not exists public.portfolio_content (
  id uuid primary key default gen_random_uuid(),
  section text not null check (char_length(section) <= 80),
  title text not null check (char_length(title) between 1 and 180),
  subtitle text check (subtitle is null or char_length(subtitle) <= 180),
  description text check (description is null or char_length(description) <= 5000),
  url text check (url is null or url ~* '^(https?://|mailto:)'),
  image_url text check (image_url is null or image_url ~* '^https?://'),
  display_date date,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portfolio_content_section_order_idx
  on public.portfolio_content (section, sort_order, created_at desc);
alter table public.portfolio_content enable row level security;

drop policy if exists "Public can read published portfolio content" on public.portfolio_content;
create policy "Public can read published portfolio content" on public.portfolio_content
  for select to anon, authenticated using (is_published = true or public.is_portfolio_owner());

drop policy if exists "Authenticated admins manage portfolio content" on public.portfolio_content;
drop policy if exists "Owner manages portfolio content" on public.portfolio_content;
create policy "Owner manages portfolio content" on public.portfolio_content
  for all to authenticated using (public.is_portfolio_owner()) with check (public.is_portfolio_owner());

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists portfolio_content_touch on public.portfolio_content;
create trigger portfolio_content_touch before update on public.portfolio_content
  for each row execute function public.touch_updated_at();

-- ---------- 6. Refresh the API schema cache ----------
notify pgrst, 'reload schema';
