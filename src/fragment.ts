import type { ExportedProfile } from './schema';

/**
 * Encode a profile into a URL-safe base64 token suitable for placing in a
 * fragment (`#profile=...`). Matches the contract used by every consumer.
 *
 * Encoding: `btoa(encodeURIComponent(JSON.stringify(profile)))`, then
 * `'+/' → '-_'` and `'='` stripped. Decode re-pads.
 */
export function encodeProfileFragment(profile: ExportedProfile): string {
  const json = JSON.stringify(profile);
  const b64 = base64Encode(encodeURIComponent(json));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a URL-safe base64 token back into the raw JSON text. Returns
 * `null` on any decoding failure — callers decide whether to surface a
 * paste fallback. Does NOT validate against the schema; pair with
 * `exportedProfileSchema.safeParse` to do that.
 */
export function decodeProfileFragment(token: string): string | null {
  try {
    const standard = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = standard + '==='.slice(0, (4 - (standard.length % 4)) % 4);
    return decodeURIComponent(base64Decode(padded));
  } catch {
    return null;
  }
}

function base64Encode(s: string): string {
  if (typeof btoa === 'function') return btoa(s);
  // Node fallback (used in tests and SSR contexts).
  return Buffer.from(s, 'binary').toString('base64');
}

function base64Decode(s: string): string {
  if (typeof atob === 'function') return atob(s);
  return Buffer.from(s, 'base64').toString('binary');
}
