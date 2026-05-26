/**
 * Canonical export surface. Anything not listed here is private.
 * Keep the export list flat and explicit — IDE autocomplete is the
 * documentation.
 */
export {
  PROFILE_VERSION,
  PROFILE_TTL_DAYS,
  exportedProfileSchema,
  type ExportedProfile,
  type VarkChannel,
  type FlagLevel,
  type PlanLevel
} from './schema';

export { topPreference, secondPreference, isProfileStale } from './helpers';

export {
  MODE_AFFINITY,
  recommendedSpellingMode,
  recommendedStatesMode,
  recommendedMathMode,
  type SpellingMode,
  type StatesMode,
  type MathMode
} from './recommend';

export { encodeProfileFragment, decodeProfileFragment } from './fragment';

export {
  readTelemetry,
  totalLaunches,
  followRate,
  modesBy,
  prettyMode,
  type ModuleTelemetry,
  type ModuleRow
} from './telemetry';
