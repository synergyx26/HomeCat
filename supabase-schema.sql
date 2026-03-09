-- ============================================
-- Home & Cats - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable Row Level Security on all tables

-- 0. Profiles table (for admin roles & OAuth user tracking)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Admin policies: admins can view all profiles and all data
create policy "Admins can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update all profiles"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Auto-create profile on user signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 1. Cats table
create table if not exists cats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  breed text,
  date_of_birth date,
  weight numeric(5,2),
  color text,
  gender text,
  chip_id text,
  indoor_outdoor text,
  image_url text,
  notes text,
  created_at timestamptz default now()
);

alter table cats enable row level security;

create policy "Users can view their own cats"
  on cats for select using (auth.uid() = user_id);

create policy "Users can insert their own cats"
  on cats for insert with check (auth.uid() = user_id);

create policy "Users can update their own cats"
  on cats for update using (auth.uid() = user_id);

create policy "Users can delete their own cats"
  on cats for delete using (auth.uid() = user_id);

-- Admin policies for cats
create policy "Admins can view all cats"
  on cats for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 2. Feedings table
create table if not exists feedings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cat_id uuid references cats(id) on delete cascade not null,
  food_type text not null,
  amount text,
  fed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz default now()
);

alter table feedings enable row level security;

create policy "Users can view their own feedings"
  on feedings for select using (auth.uid() = user_id);

create policy "Users can insert their own feedings"
  on feedings for insert with check (auth.uid() = user_id);

create policy "Users can update their own feedings"
  on feedings for update using (auth.uid() = user_id);

create policy "Users can delete their own feedings"
  on feedings for delete using (auth.uid() = user_id);

-- Admin policies for feedings
create policy "Admins can view all feedings"
  on feedings for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 3. Health logs table
create table if not exists health_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cat_id uuid references cats(id) on delete cascade not null,
  log_type text not null default 'other',
  log_date date not null default current_date,
  description text not null,
  notes text,
  created_at timestamptz default now()
);

alter table health_logs enable row level security;

create policy "Users can view their own health logs"
  on health_logs for select using (auth.uid() = user_id);

create policy "Users can insert their own health logs"
  on health_logs for insert with check (auth.uid() = user_id);

create policy "Users can update their own health logs"
  on health_logs for update using (auth.uid() = user_id);

create policy "Users can delete their own health logs"
  on health_logs for delete using (auth.uid() = user_id);

-- Admin policies for health logs
create policy "Admins can view all health logs"
  on health_logs for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================
-- 4. Storage bucket for cat profile images
-- ============================================
insert into storage.buckets (id, name, public)
  values ('cat-images', 'cat-images', true)
  on conflict (id) do nothing;

create policy "Authenticated users can upload cat images"
  on storage.objects for insert
  with check (bucket_id = 'cat-images' and auth.role() = 'authenticated');

create policy "Authenticated users can update cat images"
  on storage.objects for update
  using (bucket_id = 'cat-images' and auth.role() = 'authenticated');

create policy "Authenticated users can delete cat images"
  on storage.objects for delete
  using (bucket_id = 'cat-images' and auth.role() = 'authenticated');

create policy "Anyone can view cat images"
  on storage.objects for select
  using (bucket_id = 'cat-images');

-- ============================================
-- MIGRATION: If upgrading from previous schema, run:
--
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS date_of_birth DATE;
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS image_url TEXT;
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS color TEXT;
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS chip_id TEXT;
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS gender TEXT;
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS indoor_outdoor TEXT;
-- ALTER TABLE cats DROP COLUMN IF EXISTS age;
--
-- Then run the storage bucket section above.
-- ============================================

-- ============================================
-- IMPORTANT: After running this schema, make yourself an admin:
--
-- UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
--
-- ============================================
