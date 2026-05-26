import { describe, expect, it } from 'vitest';
import {
  decodeProfileFragment,
  encodeProfileFragment,
  exportedProfileSchema,
  type ExportedProfile
} from '../src/index';

describe('encode → decode → schema.parse round trip', () => {
  const profile: ExportedProfile = {
    version: 1,
    generated_at: '2026-05-26T00:00:00.000Z',
    expires_at: '2026-07-25T00:00:00.000Z',
    preferences: { visual: 55, auditory: 80, read_write: 30, kinesthetic: 40 },
    flags: { reading: 'low', writing: 'low', math: 'medium', attention: 'high' },
    needs_corroboration: { reading: false, writing: false, math: true, attention: false },
    strengths: ['follows multi-step directions', 'recalls song lyrics'],
    plan: 'monitor',
    module_overrides: {
      spelling: {
        followed: { 'speed-spell': 5 },
        overrode: { 'word-sort': 1 },
        last_launches: ['word-sort', 'speed-spell'],
        last_override_streak: 1
      }
    },
    source: 'behavioral_observation',
    child_label: 'Helena'
  };

  it('preserves every field through encode → decode → safeParse', () => {
    const token = encodeProfileFragment(profile);
    const json = decodeProfileFragment(token);
    expect(json).not.toBeNull();
    const parsed = exportedProfileSchema.safeParse(JSON.parse(json as string));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(profile);
    }
  });
});
