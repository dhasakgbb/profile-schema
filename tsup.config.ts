import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS for TypeScript consumers (helena-learner-profile, helena-spelling).
  // zod is bundled — these consumers will pin one version this way and avoid
  // duplicate zod copies in their own builds.
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    noExternal: ['zod'],
    target: 'es2022'
  },
  // IIFE for vanilla JS consumers (helena-states, helena-math). Exposes
  // `window.HelenaProfile`. zod is bundled because vanilla apps have no
  // module system.
  {
    entry: { 'index.iife': 'src/iife-entry.ts' },
    format: ['iife'],
    globalName: 'HelenaProfile',
    sourcemap: true,
    noExternal: ['zod'],
    target: 'es2020',
    footer: {
      // tsup writes `var HelenaProfile = (() => { ... })();`
      // We want it on window for vanilla pages.
      js: 'if (typeof window !== "undefined") { window.HelenaProfile = HelenaProfile; }'
    }
  }
]);
