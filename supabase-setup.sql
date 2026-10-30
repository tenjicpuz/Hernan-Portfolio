-- Run once in Supabase SQL Editor. Uses Supabase Auth; no service-role key in browser.
create table if not exists public.portfolio_content (
 id uuid primary key default gen_random_uuid(),
 section text not null,
 title text not null,
 subtitle text,
 description text,
 url text,
 image_url text,
 display_date date,
 sort_order integer not null default 0,
 is_published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists portfolio_content_section_order_idx on public.portfolio_content(section,sort_order,created_at desc);
alter table public.portfolio_content enable row level security;
drop policy if exists "Public can read published portfolio content" on public.portfolio_content;
create policy "Public can read published portfolio content" on public.portfolio_content for select using (is_published = true);
drop policy if exists "Authenticated admins manage portfolio content" on public.portfolio_content;
create policy "Authenticated admins manage portfolio content" on public.portfolio_content for all to authenticated using (true) with check (true);
-- IMPORTANT: restrict authenticated access to trusted admin accounts. For a single-owner portfolio,
-- use Supabase Dashboard -> Authentication -> Users and do not create public sign-up flows.
-- If other authenticated users exist, replace the broad authenticated policy with an admin allowlist.
