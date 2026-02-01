-- Create tables if they don't exist
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  bio text,
  preferred_units text[],
  achievements text[],
  avatar_url text,
  full_name text
);

create table if not exists public.challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  goal int not null,
  unit text not null,
  start_date date not null,
  end_date date not null,
  creator_id uuid references auth.users not null,
  creator_name text,
  participants uuid[]
);

create table if not exists public.progress_logs (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges not null,
  user_id uuid references auth.users not null,
  user_name text,
  amount int not null,
  created_at timestamptz default now()
);

-- Storage buckets (this is pseudo-code for Supabase Dashboard, but good to document)
-- bucket: 'avatars'
