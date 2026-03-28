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
        setPending(false);
      }}
      className="text-sm text-zinc-400 transition hover:text-white disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
