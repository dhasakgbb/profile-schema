import type { ExportedProfile, VarkChannel } from './schema';

/** Highest-scoring preference channel. Returns null if every channel is 0. */
export function topPreference(p: ExportedProfile): VarkChannel | null {
  const sorted = sortPrefs(p);
  return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
}

/** Second-highest preference channel. Returns null if fewer than two non-zero. */
export function secondPreference(p: ExportedProfile): VarkChannel | null {
  const sorted = sortPrefs(p);
  return sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;
}

/**
 * True when the profile's expires_at has passed. Caller supplies `now`
 * for testability; defaults to current wall clock.
 *
 * Uses Date.parse() rather than lexicographic ISO-string comparison so
 * profiles with non-UTC offsets (e.g. "+05:00") compare correctly. The
 * schema's isoDate refine accepts any string Date.parse() understands.
 */
export function isProfileStale(p: ExportedProfile, now: Date = new Date()): boolean {
  return now.getTime() >= Date.parse(p.expires_at);
}

function sortPrefs(p: ExportedProfile): [VarkChannel, number][] {
  const entries = Object.entries(p.preferences) as [VarkChannel, number][];
  return entries.sort((a, b) => b[1] - a[1]);
}
