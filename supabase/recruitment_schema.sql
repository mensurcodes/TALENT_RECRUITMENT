-- Hackathon schema — paste into Supabase SQL Editor and run.
-- Drops existing tables first so you can re-run after errors or schema tweaks.
-- WARNING: This deletes all rows in these tables.

drop table if exists public.interviews cascade;
drop table if exists public.jobs cascade;
drop table if exists public.applicants cascade;
drop table if exists public.recruiters cascade;

-- Demo-only: passwords in plain text. Swap for Supabase Auth after the hackathon.

create table public.recruiters (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  username text not null unique,
  password text not null,
  age int,
  phone text,
  company_name text not null,
  created_at timestamptz default now()
);

create table public.applicants (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  username text not null unique,
  password text not null,
  age int,
  school_name text,
  education_level text,
  employment_type text,
  resume_url text,
  github_url text,
  created_at timestamptz default now()
);

create table public.jobs (
  id bigserial primary key,
  recruiter_id bigint not null references public.recruiters (id) on delete cascade,
  recruiter_name text not null,
  title text not null,
  company_name text not null,
  employment_type text,
  description text,
  us_work_auth text,
  grading_rubric text,
  created_at timestamptz default now()
);

create table public.interviews (
  id bigserial primary key,
  job_id bigint not null references public.jobs (id) on delete cascade,
  applicant_id bigint references public.applicants (id) on delete cascade,
  applicant_name text not null,
  recruiter_name text not null,
  result text,
  feedback text,
  score int,
  max_score int,
  summary text,
  github_url text,
  resume_label text,
  submitted_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Optional: turn on RLS later in Dashboard when you add real auth.
