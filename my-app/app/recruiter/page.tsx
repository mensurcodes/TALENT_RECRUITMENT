import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./components/LoginForm";
import { getRecruiterSessionId } from "./lib/auth";
import { hasSupabaseConfig } from "../applicant/lib/supabase";
import { SupabaseNotice } from "../applicant/components/SupabaseNotice";

export default async function RecruiterHomePage() {
  const sessionId = await getRecruiterSessionId();
  if (sessionId) redirect("/recruiter/dashboard");

  const ok = hasSupabaseConfig();

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600/90">Hiring</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Recruiter portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          View applications per job, scores, and download the same PDF report candidates receive.
        </p>
      </div>
      {!ok ? <SupabaseNotice /> : <LoginForm />}
      <p className="text-center text-sm text-slate-500">
        <Link href="/applicant" className="font-medium text-emerald-700 hover:text-emerald-800">
          Applicant portal →
        </Link>
      </p>
    </div>
  );
}
