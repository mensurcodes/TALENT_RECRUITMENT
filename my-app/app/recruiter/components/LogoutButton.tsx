"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutRecruiter } from "../actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await logoutRecruiter();
        router.push("/recruiter");
        router.refresh();
      }}
      className="rounded-full px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {pending ? "…" : "Sign out"}
    </button>
  );
}
