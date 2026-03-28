export function SupabaseNotice() {
  return (
    <div className="max-w-lg rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-yellow-100 to-amber-100 p-5 text-sm text-amber-950 shadow-lg ring-4 ring-yellow-200/50">
      <p className="text-base font-bold text-amber-900">Supabase not configured</p>
      <p className="mt-2 leading-relaxed text-amber-900/90">
        Add <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">my-app/.env.local</code>, then
        restart the dev server.
      </p>
    </div>
  );
}
