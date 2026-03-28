-- Run in Supabase SQL Editor once. Creates interview at application time with a 7-day assessment window.
-- Videos in Storage use paths: {interview_id}/{timestamp}_{question_id}.webm

alter table public.interviews add column if not exists assessment_status text default 'pending_assessment';
alter table public.interviews add column if not exists assessment_deadline_at timestamptz;
alter table public.interviews add column if not exists applied_at timestamptz default now();

comment on column public.interviews.assessment_status is 'pending_assessment | completed';
comment on column public.interviews.assessment_deadline_at is 'Complete the timed assessment by this time (applied_at + 7 days).';
comment on column public.interviews.applied_at is 'When the candidate submitted the application form.';

-- Backfill: completed interviews
update public.interviews
set assessment_status = 'completed'
where submitted_at is not null
  and coalesce(assessment_status, '') not in ('completed');

-- Backfill: still pending (no submission yet)
update public.interviews
set assessment_status = 'pending_assessment'
where submitted_at is null
  and (assessment_status is null or assessment_status = '');

-- Deadlines for existing rows
update public.interviews
set assessment_deadline_at = coalesce(applied_at, created_at) + interval '7 days'
where assessment_deadline_at is null;

-- One application + interview per applicant per job (dedupe duplicates before running if this fails)
create unique index if not exists interviews_applicant_job_unique
  on public.interviews (applicant_id, job_id)
  where applicant_id is not null;
