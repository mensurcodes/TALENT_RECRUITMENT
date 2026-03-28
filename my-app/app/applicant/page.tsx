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
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col items-center justify-center gap-10">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-sm">
          T
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Talent Recruitment
        </h1>
        <p className="mt-3 text-base text-slate-600">Matched roles, assessments, and scoring in one place.</p>
        <p className="mt-2 text-sm text-slate-500">Sign in with your applicant credentials to continue.</p>
      </div>

      {!ok ? <SupabaseNotice /> : <LoginForm />}
    </div>
  );
}
