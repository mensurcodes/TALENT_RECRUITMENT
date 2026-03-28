"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutApplicant } from "../actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await logoutApplicant();
        router.push("/applicant");
        router.refresh();
        setPending(false);
      }}
      className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
