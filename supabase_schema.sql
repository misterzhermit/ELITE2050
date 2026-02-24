
-- Create table for storing game states
create table if not exists games (
  -- For development, we use text to allow 'default-user'. In production, switch to UUID and uncomment reference
  user_id text primary key, -- references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table games enable row level security;

-- Create policy to allow users to select their own game state
create policy "Users can select their own game state"
  on games for select
  using (auth.uid()::text = user_id or user_id = 'default-user');

-- Create policy to allow users to insert/update their own game state
create policy "Users can insert/update their own game state"
  on games for insert
  with check (auth.uid()::text = user_id or user_id = 'default-user');

create policy "Users can update their own game state"
  on games for update
  using (auth.uid()::text = user_id or user_id = 'default-user');

-- Optional: Create an index on the data column if you plan to query inside the JSONB
-- create index idx_games_data on games using gin (data);
