-- Full rubric evaluation (strengths, improvements, breakdown) for reports & PDFs.
alter table public.interviews add column if not exists evaluation jsonb;

comment on column public.interviews.evaluation is 'Full RubricEvaluation JSON; mirrors applicant/recruiter assessment report.';
