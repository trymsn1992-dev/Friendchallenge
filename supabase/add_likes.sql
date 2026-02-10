-- Create likes table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.progress_logs not null,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  unique(log_id, user_id)
);

-- Enable RLS
alter table public.likes enable row level security;

-- Policies
create policy "Users can see all likes"
  on public.likes for select
  using ( true );

create policy "Users can insert their own likes"
  on public.likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes"
  on public.likes for delete
  using ( auth.uid() = user_id );
