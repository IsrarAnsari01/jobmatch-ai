-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  resume_url text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resume insights table
create table public.resume_insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  raw_text text not null,
  skills text[] default '{}',
  experience_years integer,
  job_titles text[] default '{}',
  target_roles text[] default '{}',
  education jsonb default '{}',
  summary text,
  keywords text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Job listings table (scraped jobs cache)
create table public.job_listings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  company text not null,
  location text,
  description text not null,
  url text not null unique,
  hr_email text,
  platform text default 'indeed',
  scraped_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Job matches table
create table public.job_matches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_listing_id uuid references public.job_listings(id) on delete cascade not null,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  match_reasons text[] default '{}',
  created_at timestamptz default now(),
  unique(user_id, job_listing_id)
);

-- Sent applications table
create table public.sent_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_listing_id uuid references public.job_listings(id) on delete cascade not null,
  sent_at timestamptz default now(),
  status text default 'sent',
  unique(user_id, job_listing_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.resume_insights enable row level security;
alter table public.job_listings enable row level security;
alter table public.job_matches enable row level security;
alter table public.sent_applications enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Resume insights policies
create policy "Users can manage own resume insights" on public.resume_insights
  for all using (auth.uid() = user_id);

-- Job listings (public read, service role write)
create policy "Anyone can read job listings" on public.job_listings
  for select using (true);

-- Job matches policies
create policy "Users can manage own job matches" on public.job_matches
  for all using (auth.uid() = user_id);

-- Sent applications policies
create policy "Users can manage own applications" on public.sent_applications
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger resume_insights_updated_at before update on public.resume_insights
  for each row execute procedure public.handle_updated_at();

-- Storage bucket for resumes
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);

create policy "Users can upload own resume" on storage.objects
  for insert with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can read own resume" on storage.objects
  for select using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own resume" on storage.objects
  for delete using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
