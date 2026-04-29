# Void Exchange Roadmap

Planned work. Each item is grounded in concrete intent and references the
Move / SDK docs we will need when we build it.

For shipped work, see:
- [`amm-invariants.md`](./amm-invariants.md) — Phase 2 audit. The on-chain
  `quote()` view function and the contract hardening pass.
- [`multi-pool-design.md`](./multi-pool-design.md) — Phase 3 design,
  implemented in Phase 4. Multi-pool per SSU, cross-SSU registry,
  pause / delist / relist.

## Constant-product curve variant

**Why.** Current pool exposes only the StableSwap curve (good for correlated
pairs, narrow ranges). Constant-product (`x * y = k`) is appropriate for
volatile / uncorrelated pairs where StableSwap's narrow peg is wrong.

**Plan.** Add a curve discriminator to `Config` and a second math path:

```move
public enum Curve has copy, drop, store {
    Stable { amp: u64 },
    ConstantProduct { weight_a: u64, weight_b: u64 },
}
```

Reuse the same fee / bonus / inventory plumbing — only the output computation
forks. Reference: [Balancer V1 weighted math](https://docs.balancer.fi/concepts/math/weighted-math.html)
for the weighted-CP formula. Move enum support is edition 2024 and is
documented in the [Move Book](https://move-book.com/move-basics/enum.html).

**Status.** Multi-pool + registry is now in place, so curve selection per
pool is feasible. Implementation deferred until there's product demand for
it.

## Global market view + StationOps admin UI

**Why.** Phase 4 ships the on-chain registry but the dapp UI doesn't yet
consume it. Two follow-ons:

1. **Global market view** at `void-exchange.com` (no `?ssu=`) — list every
   pool from `pools_by_pair` / `pools_by_ssu`, sortable by depth / amp /
   pair, with a "fly to SSU" link.
2. **StationOps admin UI** — buttons for `pause` / `unpause` / `delist` /
   `relist` wired to `buildPausePoolTransaction` etc. in
   `dapps/src/hooks/useAmmTransactions.ts`.

**Status.** Shipped. The global view lives in
`dapps/src/components/GlobalMarketView.tsx`, fed by `useAllPools` →
`fetchAllPoolMeta` (events for the universe + `pool_meta` view per row).
Lifecycle buttons live in the new "Market Lifecycle" section of
`StationOps.tsx`, gated by the per-pool `AMMAdminCap`.

## AMM setup wizard

See [`amm-setup-wizard-plan.md`](./amm-setup-wizard-plan.md). A single
`tsx ts-scripts/amm_extension/setup-wizard.ts` flow that authorises the
extension, creates the pool, seeds liquidity, and inits the fee config in
one prompt-driven session.

**Status.** Shipped at `ts-scripts/amm_extension/setup-wizard.ts`
(also `pnpm setup-wizard`). Two PTBs end-to-end: authorize +
`create_pool` (registry-aware), then `add_liquidity` x2 +
`set_reserves` + `init_fee_config`. Auto-writes `dapps/.env`. The
plan doc still describes the original 3-tx flow for reference.

## Canonical EVE Frontier currency support

**Why.** EVE Frontier may have an on-chain canonical token. Pools quoting
against it (analogous to USDC pairs in DeFi) get UX privileges in the dapp:
default base, price aggregation, etc.

**Status.** Deferred. Requires research on which on-chain token is in
common circulation. No protocol-level privilege — the dapp surfaces the
hint via the registry's `PoolMeta`.

## Sponsored transactions for new traders

**Why.** New players don't have SUI for gas. The existing
`ts-scripts/utils/transaction.ts::executeSponsoredTransaction` uses Mysten's
[sponsored transaction pattern](https://docs.sui.io/concepts/transactions/sponsored-transactions)
but is unused by the dapp.

**Status.** Deferred. Blocked on a sponsor wallet operations plan
(funding, abuse limits, key rotation).
