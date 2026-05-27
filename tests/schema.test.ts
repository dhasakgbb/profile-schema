import { describe, expect, it } from 'vitest';
import { exportedProfileSchema, PROFILE_VERSION, PROFILE_TTL_DAYS } from '../src/schema';

const VALID = {
  version: 1,
  generated_at: '2026-05-26T00:00:00.000Z',
  expires_at: '2026-07-25T00:00:00.000Z',
  preferences: { visual: 60, auditory: 70, read_write: 40, kinesthetic: 30 },
  flags: { reading: 'low', writing: 'low', math: 'medium', attention: 'low' },
  needs_corroboration: { reading: false, writing: false, math: true, attention: false },
  strengths: ['solves puzzles', 'remembers stories'],
  plan: 'strengths',
  module_overrides: {},
  source: 'intake_quiz'
} as const;

describe('exportedProfileSchema', () => {
  it('exports PROFILE_VERSION = 1', () => {
    expect(PROFILE_VERSION).toBe(1);
  });

  it('exports PROFILE_TTL_DAYS = 60', () => {
    expect(PROFILE_TTL_DAYS).toBe(60);
  });

  it('accepts a fully valid profile', () => {
    const r = exportedProfileSchema.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it('rejects version != 1', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, version: 2 });
    expect(r.success).toBe(false);
  });

  it('rejects preference outside 0-100', () => {
    const r = exportedProfileSchema.safeParse({
      ...VALID,
      preferences: { ...VALID.preferences, visual: 101 }
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown flag level', () => {
    const r = exportedProfileSchema.safeParse({
      ...VALID,
      flags: { ...VALID.flags, reading: 'extreme' }
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown plan', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, plan: 'bogus' });
    expect(r.success).toBe(false);
  });

  it('rejects unknown source', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, source: 'magic' });
    expect(r.success).toBe(false);
  });

  it('accepts an optional child_label', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, child_label: 'Astrid' });
    expect(r.success).toBe(true);
  });

  it('rejects a child_label over 40 chars', () => {
    const r = exportedProfileSchema.safeParse({
      ...VALID,
      child_label: 'x'.repeat(41)
    });
    expect(r.success).toBe(false);
  });

  it('defaults module_overrides to {} when omitted', () => {
    const { module_overrides, ...rest } = VALID;
    const r = exportedProfileSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.module_overrides).toEqual({});
  });
});
