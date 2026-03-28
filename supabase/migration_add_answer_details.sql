-- Run once on existing databases that already have interviews (skip if you recreate from recruitment_schema.sql).
alter table public.interviews add column if not exists answer_details jsonb;
