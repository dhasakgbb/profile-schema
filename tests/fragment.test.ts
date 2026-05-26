import { describe, expect, it } from 'vitest';
import { decodeProfileFragment, encodeProfileFragment } from '../src/fragment';
import type { ExportedProfile } from '../src/schema';

const PROFILE: ExportedProfile = {
  version: 1,
  generated_at: '2026-05-26T00:00:00.000Z',
  expires_at: '2026-07-25T00:00:00.000Z',
  preferences: { visual: 60, auditory: 70, read_write: 40, kinesthetic: 30 },
  flags: { reading: 'low', writing: 'low', math: 'medium', attention: 'low' },
  needs_corroboration: { reading: false, writing: false, math: true, attention: false },
  strengths: ['solves puzzles'],
  plan: 'strengths',
  module_overrides: {},
  source: 'intake_quiz',
  child_label: 'Helena'
};

describe('encode/decodeProfileFragment', () => {
  it('round-trips a typical profile', () => {
    const token = encodeProfileFragment(PROFILE);
    const decoded = decodeProfileFragment(token);
    expect(decoded).not.toBeNull();
    expect(JSON.parse(decoded as string)).toEqual(PROFILE);
  });

  it('produces a URL-safe token with no +, /, or =', () => {
    const token = encodeProfileFragment(PROFILE);
    expect(token).not.toMatch(/[+/=]/);
  });

  it('handles non-ASCII child_label (round-trip)', () => {
    const p: ExportedProfile = { ...PROFILE, child_label: 'Élena' };
    const token = encodeProfileFragment(p);
    const decoded = decodeProfileFragment(token);
    expect(JSON.parse(decoded as string)).toEqual(p);
  });

  it('decodeProfileFragment returns null on garbage input', () => {
    expect(decodeProfileFragment('!!!not-base64@@@')).toBeNull();
  });

  it('decodeProfileFragment handles all three padding lengths (0/1/2 stripped)', () => {
    expect(decodeProfileFragment(encodeNaive('a'))).toBe('a');
    expect(decodeProfileFragment(encodeNaive('ab'))).toBe('ab');
    expect(decodeProfileFragment(encodeNaive('abc'))).toBe('abc');
  });
});

function encodeNaive(raw: string): string {
  const b64 = Buffer.from(encodeURIComponent(raw), 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
