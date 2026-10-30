-- Run this entire script in Supabase Dashboard > SQL Editor.
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  issuer text,
  issued_on date,
  storage_path text not null unique,
  public_url text not null,
  created_at timestamptz not null default now()
);

alter table public.certificates enable row level security;

-- Anyone can read the public certificate gallery.
drop policy if exists "Public can view certificates" on public.certificates;
create policy "Public can view certificates" on public.certificates
for select to anon, authenticated using (true);

-- Only signed-in admins can add or remove certificate records.
drop policy if exists "Admins can add certificates" on public.certificates;
create policy "Admins can add certificates" on public.certificates
for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Admins can delete certificates" on public.certificates;
create policy "Admins can delete certificates" on public.certificates
for delete to authenticated using (auth.uid() is not null);

-- Create a PUBLIC bucket named certificates. The public setting allows visitors
-- to view certificate files; writes and deletes remain restricted to signed-in users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', true, 10485760,
  array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/png','image/jpeg','image/webp'];

drop policy if exists "Public can view certificate files" on storage.objects;
create policy "Public can view certificate files" on storage.objects
for select to anon, authenticated using (bucket_id = 'certificates');
drop policy if exists "Admins can upload certificate files" on storage.objects;
create policy "Admins can upload certificate files" on storage.objects
for insert to authenticated with check (bucket_id = 'certificates' and auth.uid() is not null);
drop policy if exists "Admins can delete certificate files" on storage.objects;
create policy "Admins can delete certificate files" on storage.objects
for delete to authenticated using (bucket_id = 'certificates' and auth.uid() is not null);
