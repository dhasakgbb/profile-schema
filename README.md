# profile-schema

Canonical learner-profile schema for the Helena platform.

One zod schema, one place. Consumed by:

- `helena-learner-profile` (SvelteKit producer)
- `helena-spelling` (Svelte 5 SPA)
- `helena-states` (vanilla JS, via `<script>`)
- `helena-math` (vanilla JS, via `<script>`)

## Install

```bash
npm install profile-schema
```

## Use (TypeScript / ESM)

```ts
import { exportedProfileSchema, type ExportedProfile } from 'profile-schema';

const result = exportedProfileSchema.safeParse(json);
if (result.success) {
  const profile: ExportedProfile = result.data;
}
```

## Use (Vanilla JS via CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js"></script>
<script>
  const result = window.HelenaProfile.exportedProfileSchema.safeParse(json);
</script>
```

Note: `window.HelenaProfile` (capital H). The lowercase `window.helenaProfile` is the per-app store in vanilla consumers and is distinct.

## Public API

See `src/index.ts` for the canonical export list. Headlines:

- `PROFILE_VERSION`, `exportedProfileSchema`, `ExportedProfile`
- `topPreference`, `secondPreference`, `isProfileStale`
- `MODE_AFFINITY`, `recommendedSpellingMode`, `recommendedStatesMode`, `recommendedMathMode`
- `encodeProfileFragment`, `decodeProfileFragment`
- `readTelemetry`, `totalLaunches`, `followRate`, `modesBy`, `prettyMode`

## Versioning

SemVer. Major bumps signal schema-breaking changes; consumers update at their own cadence. `PROFILE_VERSION` (the schema's internal version field) and the package's npm version are intentionally separate concerns.
