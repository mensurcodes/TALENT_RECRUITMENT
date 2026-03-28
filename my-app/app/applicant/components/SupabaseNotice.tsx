export function SupabaseNotice() {
  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-5 text-sm text-amber-950 shadow-sm ring-1 ring-amber-900/5 backdrop-blur-sm">
      <p className="font-semibold tracking-tight text-amber-950">Configuration needed</p>
      <p className="mt-2 leading-relaxed text-amber-900/85">
        Add <code className="rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to <code className="rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-xs">my-app/.env.local</code>, then
        restart the dev server.
      </p>
    </div>
  );
}
