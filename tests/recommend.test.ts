import { describe, expect, it } from 'vitest';
import type { ExportedProfile, VarkChannel } from '../src/schema';
import {
  MODE_AFFINITY,
  recommendedMathMode,
  recommendedSpellingMode,
  recommendedStatesMode
} from '../src/recommend';

function mkWithTop(top: VarkChannel, second?: VarkChannel): ExportedProfile {
  const prefs = { visual: 10, auditory: 10, read_write: 10, kinesthetic: 10 };
  prefs[top] = 80;
  if (second) prefs[second] = 60;
  return {
    version: 1,
    generated_at: '2026-01-01T00:00:00.000Z',
    expires_at: '2099-01-01T00:00:00.000Z',
    preferences: prefs,
    flags: { reading: 'low', writing: 'low', math: 'low', attention: 'low' },
    needs_corroboration: { reading: false, writing: false, math: false, attention: false },
    strengths: [],
    plan: 'strengths',
    module_overrides: {},
    source: 'intake_quiz'
  };
}

describe('MODE_AFFINITY', () => {
  it('exposes a table for every consumer module', () => {
    expect(MODE_AFFINITY.spelling).toBeDefined();
    expect(MODE_AFFINITY.states).toBeDefined();
    expect(MODE_AFFINITY.math).toBeDefined();
  });
});

describe('recommendedSpellingMode', () => {
  it('returns the auditory mode for an auditory-leaning learner', () => {
    expect(recommendedSpellingMode(mkWithTop('auditory'), 0)).toBe('speed-spell');
  });
  it('returns null when profile is null', () => {
    expect(recommendedSpellingMode(null, 0)).toBeNull();
  });
  it('rotates to second preference every 4th session', () => {
    const p = mkWithTop('auditory', 'visual');
    expect(recommendedSpellingMode(p, 0)).toBe('speed-spell');
    expect(recommendedSpellingMode(p, 1)).toBe('speed-spell');
    expect(recommendedSpellingMode(p, 4)).toBe('word-wheel'); // visual
  });
});

describe('recommendedMathMode', () => {
  it('returns times-tables for a read/write learner', () => {
    expect(recommendedMathMode(mkWithTop('read_write'), 0)).toBe('times-tables');
  });
  it('returns speed-add for auditory', () => {
    expect(recommendedMathMode(mkWithTop('auditory'), 0)).toBe('speed-add');
  });
  it('returns number-sort for visual or kinesthetic', () => {
    expect(recommendedMathMode(mkWithTop('visual'), 0)).toBe('number-sort');
    expect(recommendedMathMode(mkWithTop('kinesthetic'), 0)).toBe('number-sort');
  });
});

describe('recommendedStatesMode', () => {
  it('returns road-trip for visual/kinesthetic', () => {
    expect(recommendedStatesMode(mkWithTop('visual'), 0)).toBe('road-trip');
    expect(recommendedStatesMode(mkWithTop('kinesthetic'), 0)).toBe('road-trip');
  });
  it('returns quiz for read/write', () => {
    expect(recommendedStatesMode(mkWithTop('read_write'), 0)).toBe('quiz');
  });
  it('returns quest for auditory', () => {
    expect(recommendedStatesMode(mkWithTop('auditory'), 0)).toBe('quest');
  });
});
