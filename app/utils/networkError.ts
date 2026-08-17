export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

// PostgREST/Postgres errors always carry a non-empty `code` (e.g. '42501' for
// an RLS violation, 'PGRST116' for no-rows, etc). A raw network failure from
// supabase-js's underlying fetch call does not have that shape. This has not
// been empirically verified against a real dropped connection yet -- treat it
// as a starting heuristic and adjust based on what actually gets thrown
// during offline manual testing.
export function isNetworkError(error: any): boolean {
  if (!error) return false
  if (!isOnline()) return true
  if (error instanceof TypeError) return true
  const msg = String(error.message ?? '').toLowerCase()
  if (msg.includes('fetch') || msg.includes('network')) return true
  if ('code' in error && !error.code && !error.details && !error.hint) return true
  return false
}

export function friendlyErrorMessage(error: any, fallback: string): string {
  return isNetworkError(error) ? '目前離線，此操作需要網路連線' : (error?.message ?? fallback)
}
