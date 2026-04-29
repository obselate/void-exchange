# `ts-scripts/amm_extension/`

Operational scripts targeting `amm_extension::amm` on a published package.

## Status

Several scripts that previously lived here (`swap.ts`, `create-pool.ts`,
`quote.ts`, `amm-ids.ts`, `modules.ts`) were removed in the Phase 0 cleanup.
They referenced Move functions that have never existed in the live
`amm.move` source (`create_stable_pool`, `swap_a_for_b`, `quote_*`, etc.) —
they were aspirational stubs from an earlier design pass. The intent each
one signaled is now tracked in [`docs/roadmap.md`](../../docs/roadmap.md):

- On-chain `quote()` view function — Phase 2.
- Constant-product curve variant — post-Phase 4.

`authorize-amm.ts` is the only script that is correct against the current
Move surface. It will be migrated to use `ts-scripts/lib/` in Phase 1
once the AMM PTB builders are in place.
