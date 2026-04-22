-- Run this entire file in your Supabase SQL Editor

create table if not exists donors (
  id uuid default gen_random_uuid() primary key,
  formal_name text not null,
  informal_first_name text,
  email text,
  phone text,
  employer text,
  address text,
  donor_notes text,
  historical_lifetime_giving numeric(10,2) default 0,
  historical_donation_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists donations (
  id uuid default gen_random_uuid() primary key,
  donor_id uuid references donors(id) on delete cascade,
  amount numeric(10,2) not null,
  date date not null,
  type text not null default 'one-time',
  donation_notes text,
  created_at timestamptz default now()
);

-- Index for fast donor lookups by donation date
create index if not exists donations_donor_id_idx on donations(donor_id);
create index if not exists donations_date_idx on donations(date);

-- Enable Row Level Security (open read/write for now - add auth later)
alter table donors enable row level security;
alter table donations enable row level security;

create policy "Allow all" on donors for all using (true) with check (true);
create policy "Allow all" on donations for all using (true) with check (true);
