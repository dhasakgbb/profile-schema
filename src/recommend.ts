import { topPreference, secondPreference } from './helpers';
import type { ExportedProfile, VarkChannel } from './schema';

export type SpellingMode =
  | 'missing-letters'
  | 'speed-spell'
  | 'word-wheel'
  | 'word-sort'
  | 'boss-round';

export type StatesMode = 'road-trip' | 'quest' | 'quiz';

export type MathMode = 'times-tables' | 'speed-add' | 'number-sort';

/**
 * Per-module mode-affinity tables. Each mode lists the VARK channels it
 * exercises. Order in the value array doesn't matter; order in the keys
 * array does — the first mode whose affinity matches the target channel
 * wins (gives a deterministic fallback when multiple modes share a tag).
 */
export const MODE_AFFINITY = {
  spelling: {
    'missing-letters': ['read_write'],
    'speed-spell': ['auditory'],
    'word-wheel': ['visual'],
    'word-sort': ['kinesthetic'],
    'boss-round': ['auditory', 'visual', 'read_write', 'kinesthetic']
  } as Record<SpellingMode, VarkChannel[]>,
  states: {
    'road-trip': ['visual', 'kinesthetic'],
    quest: ['auditory'],
    quiz: ['read_write']
  } as Record<StatesMode, VarkChannel[]>,
  math: {
    'times-tables': ['read_write'],
    'speed-add': ['auditory'],
    'number-sort': ['visual', 'kinesthetic']
  } as Record<MathMode, VarkChannel[]>
} as const;

const SPELLING_ORDER: SpellingMode[] = [
  'missing-letters',
  'speed-spell',
  'word-wheel',
  'word-sort',
  'boss-round'
];
const STATES_ORDER: StatesMode[] = ['road-trip', 'quest', 'quiz'];
const MATH_ORDER: MathMode[] = ['times-tables', 'speed-add', 'number-sort'];

/**
 * "Stretch turn" cadence: every 4th session, rotate to the learner's
 * SECOND-strongest channel so we don't lock them into a single modality
 * forever. Matches the existing consumer-side behavior.
 */
function targetChannel(p: ExportedProfile, sessionIndex: number): VarkChannel | null {
  const stretch = sessionIndex > 0 && sessionIndex % 4 === 0;
  return stretch ? secondPreference(p) : topPreference(p);
}

function pickMode<M extends string>(
  order: M[],
  table: Record<M, VarkChannel[]>,
  channel: VarkChannel
): M | null {
  for (const mode of order) {
    if (table[mode].includes(channel)) return mode;
  }
  return null;
}

export function recommendedSpellingMode(
  p: ExportedProfile | null,
  sessionIndex: number
): SpellingMode | null {
  if (!p) return null;
  const ch = targetChannel(p, sessionIndex);
  if (!ch) return null;
  return pickMode(SPELLING_ORDER, MODE_AFFINITY.spelling, ch);
}

export function recommendedStatesMode(
  p: ExportedProfile | null,
  sessionIndex: number
): StatesMode | null {
  if (!p) return null;
  const ch = targetChannel(p, sessionIndex);
  if (!ch) return null;
  return pickMode(STATES_ORDER, MODE_AFFINITY.states, ch);
}

export function recommendedMathMode(
  p: ExportedProfile | null,
  sessionIndex: number
): MathMode | null {
  if (!p) return null;
  const ch = targetChannel(p, sessionIndex);
  if (!ch) return null;
  return pickMode(MATH_ORDER, MODE_AFFINITY.math, ch);
}
