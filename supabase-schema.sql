-- ============================================
-- Home & Cats - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable Row Level Security on all tables

-- 1. Cats table
create table if not exists cats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  breed text,
  age integer,
  weight numeric(5,2),
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
