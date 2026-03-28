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
    <div className="flex min-h-[calc(100dvh-8rem)] w-full flex-col items-center justify-center gap-10">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 via-lime-400 to-emerald-500 text-3xl font-black text-white shadow-xl ring-4 ring-white">
          T
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
          Talent Recruitment
        </h1>
        <p className="mt-3 text-lg font-medium text-emerald-800">
          AI-matched roles · video assessments · instant scoring
        </p>
        <p className="mt-2 text-sm text-emerald-700/80">
          Sign in to explore open positions and complete your application in one flow.
        </p>
      </div>

      {!ok ? <SupabaseNotice /> : <LoginForm />}
    </div>
  );
}
