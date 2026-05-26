/**
 * IIFE bundle entry point. Re-exports everything from the main barrel so
 * tsup can build a single self-contained file for `<script>` consumers.
 *
 * Types disappear at compile time, so vanilla JS callers see only the
 * runtime values. The TypeScript types are still produced from `index.ts`.
 */
export * from './index';
