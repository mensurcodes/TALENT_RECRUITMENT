export function SupabaseNotice() {
  return (
    <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold text-amber-900">Configuration needed</p>
      <p className="mt-2 leading-relaxed text-amber-900/90">
        Add <code className="rounded bg-white px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-white px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code className="rounded bg-white px-1 font-mono text-xs">my-app/.env.local</code>, then restart the dev
        server.
      </p>
    </div>
  );
}
