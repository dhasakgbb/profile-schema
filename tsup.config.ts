import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS for TypeScript consumers (learner-profile, spelling).
  // zod is bundled — these consumers will pin one version this way and avoid
  // duplicate zod copies in their own builds.
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    noExternal: ['zod'],
    target: 'es2022',
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' })
  },
  // IIFE for vanilla JS consumers (states, math). Exposes
  // `window.HelenaProfile` (capital H — historic identifier, kept pinned by
  // SRI on the CDN; do not rename without a coordinated v1.1.0 re-release
  // and integrity-hash update across all 4 consumers). zod is bundled
  // because vanilla apps have no module system.
  {
    entry: { 'index.iife': 'src/iife-entry.ts' },
    format: ['iife'],
    globalName: 'HelenaProfile',
    sourcemap: true,
    noExternal: ['zod'],
    target: 'es2020',
    outExtension: () => ({ js: '.js' }),
    footer: {
      // tsup writes `var HelenaProfile = (() => { ... })();`
      // We want it on window for vanilla pages.
      js: 'if (typeof window !== "undefined") { window.HelenaProfile = HelenaProfile; }'
    }
  }
]);
