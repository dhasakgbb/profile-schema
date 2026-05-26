import type { ExportedProfile } from './schema';

/**
 * Consumer apps write gameplay telemetry into
 * `module_overrides.<moduleKey>.{followed, overrode, last_launches, last_override_streak}`.
 * This module reads it defensively — consumer-side bugs cannot crash the
 * parent dashboard, every field falls back to a sensible default.
 */
export type ModuleTelemetry = {
  followed: Record<string, number>;
  overrode: Record<string, number>;
  last_launches: string[];
  last_override_streak: number;
};

export type ModuleRow = {
  mode: string;
  followed: number;
  overrode: number;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function coerceCountMap(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      out[k] = Math.floor(val);
    }
  }
  return out;
}

/**
 * Read one module's telemetry. Returns null when the slot is missing OR
 * when every field is empty.
 */
export function readTelemetry(p: ExportedProfile, key: string): ModuleTelemetry | null {
  const raw = p.module_overrides?.[key];
  if (!isObj(raw)) return null;
  const followed = coerceCountMap(raw.followed);
  const overrode = coerceCountMap(raw.overrode);
  const last_launches = Array.isArray(raw.last_launches)
    ? raw.last_launches.filter((x): x is string => typeof x === 'string')
    : [];
  const last_override_streak =
    typeof raw.last_override_streak === 'number' &&
    Number.isFinite(raw.last_override_streak) &&
    raw.last_override_streak >= 0
      ? Math.floor(raw.last_override_streak)
      : 0;
  const hasAny =
    Object.keys(followed).length > 0 ||
    Object.keys(overrode).length > 0 ||
    last_launches.length > 0;
  if (!hasAny) return null;
  return { followed, overrode, last_launches, last_override_streak };
}

export function totalLaunches(t: ModuleTelemetry): number {
  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
  return sum(t.followed) + sum(t.overrode);
}

export function followRate(t: ModuleTelemetry): number {
  const followed = Object.values(t.followed).reduce((a, b) => a + b, 0);
  const total = totalLaunches(t);
  if (total === 0) return 0;
  return Math.round((followed / total) * 100);
}

export function modesBy(t: ModuleTelemetry): ModuleRow[] {
  const keys = new Set<string>([...Object.keys(t.followed), ...Object.keys(t.overrode)]);
  return [...keys]
    .map((mode) => ({
      mode,
      followed: t.followed[mode] ?? 0,
      overrode: t.overrode[mode] ?? 0
    }))
    .sort((a, b) => b.followed + b.overrode - (a.followed + a.overrode));
}

export function prettyMode(mode: string): string {
  return mode.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
