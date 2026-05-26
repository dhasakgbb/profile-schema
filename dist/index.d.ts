import { z } from 'zod';

/** Schema version, bumped only when the contract changes in a breaking way. */
declare const PROFILE_VERSION: 1;
/** Profile freshness window. After this many days, isProfileStale() returns true. */
declare const PROFILE_TTL_DAYS = 60;
declare const flagLevel: z.ZodEnum<["low", "medium", "high"]>;
declare const planLevel: z.ZodEnum<["strengths", "monitor", "schedule"]>;
declare const exportedProfileSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    generated_at: z.ZodEffects<z.ZodString, string, string>;
    expires_at: z.ZodEffects<z.ZodString, string, string>;
    preferences: z.ZodObject<{
        visual: z.ZodNumber;
        auditory: z.ZodNumber;
        read_write: z.ZodNumber;
        kinesthetic: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        visual: number;
        auditory: number;
        read_write: number;
        kinesthetic: number;
    }, {
        visual: number;
        auditory: number;
        read_write: number;
        kinesthetic: number;
    }>;
    flags: z.ZodObject<{
        reading: z.ZodEnum<["low", "medium", "high"]>;
        writing: z.ZodEnum<["low", "medium", "high"]>;
        math: z.ZodEnum<["low", "medium", "high"]>;
        attention: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        reading: "low" | "medium" | "high";
        writing: "low" | "medium" | "high";
        math: "low" | "medium" | "high";
        attention: "low" | "medium" | "high";
    }, {
        reading: "low" | "medium" | "high";
        writing: "low" | "medium" | "high";
        math: "low" | "medium" | "high";
        attention: "low" | "medium" | "high";
    }>;
    needs_corroboration: z.ZodObject<{
        reading: z.ZodBoolean;
        writing: z.ZodBoolean;
        math: z.ZodBoolean;
        attention: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        reading: boolean;
        writing: boolean;
        math: boolean;
        attention: boolean;
    }, {
        reading: boolean;
        writing: boolean;
        math: boolean;
        attention: boolean;
    }>;
    strengths: z.ZodArray<z.ZodString, "many">;
    plan: z.ZodEnum<["strengths", "monitor", "schedule"]>;
    module_overrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    source: z.ZodEnum<["intake_quiz", "parent_edit", "behavioral_observation"]>;
    child_label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    strengths: string[];
    version: 1;
    generated_at: string;
    expires_at: string;
    preferences: {
        visual: number;
        auditory: number;
        read_write: number;
        kinesthetic: number;
    };
    flags: {
        reading: "low" | "medium" | "high";
        writing: "low" | "medium" | "high";
        math: "low" | "medium" | "high";
        attention: "low" | "medium" | "high";
    };
    needs_corroboration: {
        reading: boolean;
        writing: boolean;
        math: boolean;
        attention: boolean;
    };
    plan: "strengths" | "monitor" | "schedule";
    module_overrides: Record<string, Record<string, unknown>>;
    source: "intake_quiz" | "parent_edit" | "behavioral_observation";
    child_label?: string | undefined;
}, {
    strengths: string[];
    version: 1;
    generated_at: string;
    expires_at: string;
    preferences: {
        visual: number;
        auditory: number;
        read_write: number;
        kinesthetic: number;
    };
    flags: {
        reading: "low" | "medium" | "high";
        writing: "low" | "medium" | "high";
        math: "low" | "medium" | "high";
        attention: "low" | "medium" | "high";
    };
    needs_corroboration: {
        reading: boolean;
        writing: boolean;
        math: boolean;
        attention: boolean;
    };
    plan: "strengths" | "monitor" | "schedule";
    source: "intake_quiz" | "parent_edit" | "behavioral_observation";
    module_overrides?: Record<string, Record<string, unknown>> | undefined;
    child_label?: string | undefined;
}>;
type ExportedProfile = z.infer<typeof exportedProfileSchema>;
type VarkChannel = keyof ExportedProfile['preferences'];
type FlagLevel = z.infer<typeof flagLevel>;
type PlanLevel = z.infer<typeof planLevel>;

/** Highest-scoring preference channel. Returns null if every channel is 0. */
declare function topPreference(p: ExportedProfile): VarkChannel | null;
/** Second-highest preference channel. Returns null if fewer than two non-zero. */
declare function secondPreference(p: ExportedProfile): VarkChannel | null;
/**
 * True when the profile's expires_at has passed. Caller supplies `now`
 * for testability; defaults to current wall clock.
 *
 * Uses Date.parse() rather than lexicographic ISO-string comparison so
 * profiles with non-UTC offsets (e.g. "+05:00") compare correctly. The
 * schema's isoDate refine accepts any string Date.parse() understands.
 */
declare function isProfileStale(p: ExportedProfile, now?: Date): boolean;

type SpellingMode = 'missing-letters' | 'speed-spell' | 'word-wheel' | 'word-sort' | 'boss-round';
type StatesMode = 'road-trip' | 'quest' | 'quiz';
type MathMode = 'times-tables' | 'speed-add' | 'number-sort';
/**
 * Per-module mode-affinity tables. Each mode lists the VARK channels it
 * exercises. Order in the value array doesn't matter; order in the keys
 * array does — the first mode whose affinity matches the target channel
 * wins (gives a deterministic fallback when multiple modes share a tag).
 */
declare const MODE_AFFINITY: {
    readonly spelling: Record<SpellingMode, VarkChannel[]>;
    readonly states: Record<StatesMode, VarkChannel[]>;
    readonly math: Record<MathMode, VarkChannel[]>;
};
declare function recommendedSpellingMode(p: ExportedProfile | null, sessionIndex: number): SpellingMode | null;
declare function recommendedStatesMode(p: ExportedProfile | null, sessionIndex: number): StatesMode | null;
declare function recommendedMathMode(p: ExportedProfile | null, sessionIndex: number): MathMode | null;

/**
 * Encode a profile into a URL-safe base64 token suitable for placing in a
 * fragment (`#profile=...`). Matches the contract used by every consumer.
 *
 * Encoding: `btoa(encodeURIComponent(JSON.stringify(profile)))`, then
 * `'+/' → '-_'` and `'='` stripped. Decode re-pads.
 */
declare function encodeProfileFragment(profile: ExportedProfile): string;
/**
 * Decode a URL-safe base64 token back into the raw JSON text. Returns
 * `null` on any decoding failure — callers decide whether to surface a
 * paste fallback. Does NOT validate against the schema; pair with
 * `exportedProfileSchema.safeParse` to do that.
 */
declare function decodeProfileFragment(token: string): string | null;

/**
 * Consumer apps write gameplay telemetry into
 * `module_overrides.<moduleKey>.{followed, overrode, last_launches, last_override_streak}`.
 * This module reads it defensively — consumer-side bugs cannot crash the
 * parent dashboard, every field falls back to a sensible default.
 */
type ModuleTelemetry = {
    followed: Record<string, number>;
    overrode: Record<string, number>;
    last_launches: string[];
    last_override_streak: number;
};
type ModuleRow = {
    mode: string;
    followed: number;
    overrode: number;
};
/**
 * Read one module's telemetry. Returns null when the slot is missing OR
 * when every field is empty.
 */
declare function readTelemetry(p: ExportedProfile, key: string): ModuleTelemetry | null;
declare function totalLaunches(t: ModuleTelemetry): number;
declare function followRate(t: ModuleTelemetry): number;
declare function modesBy(t: ModuleTelemetry): ModuleRow[];
declare function prettyMode(mode: string): string;

export { type ExportedProfile, type FlagLevel, MODE_AFFINITY, type MathMode, type ModuleRow, type ModuleTelemetry, PROFILE_TTL_DAYS, PROFILE_VERSION, type PlanLevel, type SpellingMode, type StatesMode, type VarkChannel, decodeProfileFragment, encodeProfileFragment, exportedProfileSchema, followRate, isProfileStale, modesBy, prettyMode, readTelemetry, recommendedMathMode, recommendedSpellingMode, recommendedStatesMode, secondPreference, topPreference, totalLaunches };
