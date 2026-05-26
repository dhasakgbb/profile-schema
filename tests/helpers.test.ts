import { describe, expect, it } from 'vitest';
import type { ExportedProfile } from '../src/schema';
import { isProfileStale, secondPreference, topPreference } from '../src/helpers';

function mk(prefs: ExportedProfile['preferences'], expires = '2099-01-01T00:00:00.000Z'): ExportedProfile {
  return {
    version: 1,
    generated_at: '2026-01-01T00:00:00.000Z',
    expires_at: expires,
    preferences: prefs,
    flags: { reading: 'low', writing: 'low', math: 'low', attention: 'low' },
    needs_corroboration: { reading: false, writing: false, math: false, attention: false },
    strengths: [],
    plan: 'strengths',
    module_overrides: {},
    source: 'intake_quiz'
  };
}

describe('topPreference', () => {
  it('returns the highest-scoring channel', () => {
    const p = mk({ visual: 30, auditory: 80, read_write: 50, kinesthetic: 20 });
    expect(topPreference(p)).toBe('auditory');
  });
  it('returns null when all preferences are 0', () => {
    const p = mk({ visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 });
    expect(topPreference(p)).toBeNull();
  });
});

describe('secondPreference', () => {
  it('returns the second-highest channel', () => {
    const p = mk({ visual: 30, auditory: 80, read_write: 50, kinesthetic: 20 });
    expect(secondPreference(p)).toBe('read_write');
  });
  it('returns null when only one non-zero preference exists', () => {
    const p = mk({ visual: 80, auditory: 0, read_write: 0, kinesthetic: 0 });
    expect(secondPreference(p)).toBeNull();
  });
});

describe('isProfileStale', () => {
  it('returns true when now >= expires_at', () => {
    const p = mk({ visual: 50, auditory: 50, read_write: 50, kinesthetic: 50 }, '2026-01-01T00:00:00.000Z');
    expect(isProfileStale(p, new Date('2026-06-01T00:00:00.000Z'))).toBe(true);
  });
  it('returns false when now < expires_at', () => {
    const p = mk({ visual: 50, auditory: 50, read_write: 50, kinesthetic: 50 }, '2099-01-01T00:00:00.000Z');
    expect(isProfileStale(p, new Date('2026-06-01T00:00:00.000Z'))).toBe(false);
  });
});
