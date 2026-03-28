-- Run in Supabase SQL Editor once. Private bucket for per-question interview videos.
-- Set SUPABASE_SERVICE_ROLE_KEY in my-app/.env.local (server only — never NEXT_PUBLIC_*).
-- The Next.js server uploads with the service role; applicants never get that key.

insert into storage.buckets (id, name, public)
values ('assessment-videos', 'assessment-videos', false)
on conflict (id) do nothing;

-- Optional: in Dashboard → Storage → assessment-videos, set max file size (~15MB) and allowed types (video/webm).
