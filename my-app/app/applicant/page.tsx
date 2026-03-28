import { redirect } from "next/navigation";
import { LoginForm } from "./components/LoginForm";
import { SupabaseNotice } from "./components/SupabaseNotice";
import { getApplicantSessionId } from "./lib/auth";
import { hasSupabaseConfig } from "./lib/supabase";

export default async function ApplicantHomePage() {
  const sessionId = await getApplicantSessionId();
  if (sessionId) redirect("/applicant/jobs");

  const ok = hasSupabaseConfig();

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full flex-col items-center justify-center gap-12 px-2">
      <div className="applicant-rise w-full max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/90">Talent platform</p>
        <div className="mx-auto mt-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white shadow-xl shadow-blue-500/30 ring-1 ring-white/30 transition-transform duration-500 hover:scale-[1.02]">
          T
        </div>
        <h1 className="mt-8 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-5xl sm:leading-[1.05]">
          Hire-ready,
          <br />
          <span className="text-blue-600">one flow.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-slate-600">
          Matched roles, structured assessments, and rubric-based scoring — built for speed.
        </p>
      </div>

      <div className="applicant-rise w-full max-w-md [animation-delay:0.1s]">
        {!ok ? <SupabaseNotice /> : <LoginForm />}
      </div>
    </div>
  );
}
