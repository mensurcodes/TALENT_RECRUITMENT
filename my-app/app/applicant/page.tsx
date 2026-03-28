import { redirect } from "next/navigation";
import { LoginForm } from "./components/LoginForm";
import { SupabaseNotice } from "./components/SupabaseNotice";
import { getApplicantSessionId } from "./lib/auth";
import { hasSupabaseConfig } from "./lib/supabase";

export default async function ApplicantHomePage() {
  const sessionId = await getApplicantSessionId();
  if (sessionId) {
    redirect("/applicant/jobs");
  }

  const ok = hasSupabaseConfig();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Applicant portal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Sign in
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
          Use the <span className="text-zinc-200">username</span> and{" "}
          <span className="text-zinc-200">password</span> from your{" "}
          <code className="text-zinc-300">applicants</code> row in Supabase. Then browse matched
          jobs, apply, and complete the video assessment.
        </p>
      </section>

      {!ok ? <SupabaseNotice /> : <LoginForm />}
    </div>
  );
}
