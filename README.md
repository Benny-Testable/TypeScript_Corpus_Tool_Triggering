# orderkit

Order pricing, settlement and export toolkit written in TypeScript for Node 22.

## What it does

- prices orders per channel (retail, wholesale, partner) with tier discounts, volume bonuses and tax
- classifies orders into fulfilment buckets and tracks order status transitions
- reserves inventory all-or-nothing with rollback
- reconciles payments (fee, levy, rebate) and exports reports
- small generic helpers: collection utilities and `withRetry` with exponential backoff

## Requirements

- Node 22 or newer (see `.nvmrc`)
- npm

## Scripts

| Command | Purpose |
|---|---|
| `npm ci` | install exactly what `package-lock.json` lists |
| `npm run typecheck` | `tsc --noEmit` with `strict` enabled |
| `npm test` | run the Vitest suite |
| `npm run coverage` | tests plus V8 coverage (`coverage/`, text, JSON summary and Cobertura) |
| `npm run lint` | ESLint with typescript-eslint, sonarjs and security rules |
| `npm run lint:biome` | Biome lint |
| `npm run build` | bundle `src/index.ts` with Vite into `build/bundle.cjs` |
| `npx stryker run` | mutation testing of `src/` (about one minute) |

## Layout

```
src/
  config/      defaults and environment overrides
  domain/      order classification
  exports/     report export helpers
  legacy/      retired settlement helpers
  models/      order records, tax table, order status
  platform/    argument parsing, snapshots, tracing
  reporting/   settlement reconciliation
  services/    pricing, inventory and the channel processors
  utils/       collection helpers and retry
tests/         Vitest specs, one per module
```

## Notes

- `src/services/retail-order-processor.ts` and `wholesale-order-processor.ts` are intentionally close to each other; they predate the shared summary type and are scheduled to be merged.
- The AWS-style credentials and contact details in `src/config/defaults.ts` are documentation placeholders, not real accounts.
- Some runtime dependencies are pinned to older releases until the export pipeline is migrated (`axios`, `lodash`, `node-fetch`, `qs`, `semver`).
