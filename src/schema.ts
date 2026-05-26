import { z } from 'zod';

/** Schema version, bumped only when the contract changes in a breaking way. */
export const PROFILE_VERSION = 1 as const;

/** Profile freshness window. After this many days, isProfileStale() returns true. */
export const PROFILE_TTL_DAYS = 60;

const flagLevel = z.enum(['low', 'medium', 'high']);
const planLevel = z.enum(['strengths', 'monitor', 'schedule']);
const sourceLevel = z.enum(['intake_quiz', 'parent_edit', 'behavioral_observation']);

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: 'must be an ISO date string'
});

const pref = z.number().min(0).max(100);

export const exportedProfileSchema = z.object({
  version: z.literal(PROFILE_VERSION),
  generated_at: isoDate,
  expires_at: isoDate,
  preferences: z.object({
    visual: pref,
    auditory: pref,
    read_write: pref,
    kinesthetic: pref
  }),
  flags: z.object({
    reading: flagLevel,
    writing: flagLevel,
    math: flagLevel,
    attention: flagLevel
  }),
  needs_corroboration: z.object({
    reading: z.boolean(),
    writing: z.boolean(),
    math: z.boolean(),
    attention: z.boolean()
  }),
  strengths: z.array(z.string()),
  plan: planLevel,
  module_overrides: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
  source: sourceLevel,
  child_label: z.string().max(40).optional()
});

export type ExportedProfile = z.infer<typeof exportedProfileSchema>;
export type VarkChannel = keyof ExportedProfile['preferences'];
export type FlagLevel = z.infer<typeof flagLevel>;
export type PlanLevel = z.infer<typeof planLevel>;
