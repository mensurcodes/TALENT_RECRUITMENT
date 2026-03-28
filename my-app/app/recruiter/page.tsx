import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "./lib/supabase";
import { getRecruiterSessionId } from "./lib/auth";
import { fetchRecruiterJobs } from "./actions";
import { SupabaseNotice } from "./components/SupabaseNotice";
import { LoginForm } from "./components/LoginForm"; // ✅ ADD THIS

export default async function DashboardPage() {
  const recruiterId = await getRecruiterSessionId();

  // ✅ If NOT logged in → show login form (NOT redirect)
  if (!recruiterId) {
    const ok = hasSupabaseConfig();

    return (
      <div className="space-y-10">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
            Recruiter portal
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Sign in
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
            Use your{" "}
            <span className="text-zinc-200">recruiter credentials</span> from
            your <code className="text-zinc-300">recruiters</code> row in
            Supabase.
          </p>
        </section>

        {!ok ? <SupabaseNotice /> : <LoginForm />}
      </div>
    );
  }

  // ✅ If logged in → normal behavior (UNCHANGED)
  const ok = hasSupabaseConfig();
  if (!ok) {
    return <SupabaseNotice />;
  }

  const jobs = await fetchRecruiterJobs(recruiterId);

  return (
    <div className="min-h-screen">
      <main className="px-8 py-10 max-w-2xl mx-auto">
        {jobs.length === 0 ? (
          <p className="text-sm text-zinc-500">No jobs yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl bg-white px-5 py-4 text-sm text-zinc-800 ring-1 ring-black/[.06] dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/[.08]"
              >
                <div className="flex justify-between items-start gap-4">
                  {/* LEFT: job info */}
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{job.title}</span>

                    <span className="text-xs text-zinc-500">
                      {job.company_name} • {job.recruiter_name}
                    </span>

                    {job.employment_type && (
                      <span className="text-xs">{job.employment_type}</span>
                    )}

                    {job.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* RIGHT: actions */}
                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={`/recruiter/jobs/${job.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </a>

                    <a
                      href={`/recruiter/jobs/${job.id}/edit`}
                      className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Edit
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
