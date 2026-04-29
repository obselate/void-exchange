# Void Exchange Roadmap

This document captures planned but unimplemented work. Each item is grounded in
concrete intent — usually distilled from an earlier WIP stub or a known
limitation — and references the Move / SDK docs we will need when we build it.

## On-chain quote view function

**Why.** The dapp currently re-implements the StableSwap math, fee, and bonus
logic in TypeScript to render swap previews. That is a single-source-of-truth
violation: any change to `amm.move` math silently drifts from the dapp.

**Plan.** Add a Move view function on `amm_extension::amm`:

```move
public struct SwapQuote has copy, drop {
    amount_out: u64,
    fee_amount: u64,
    fee_bps: u64,           // effective fee BPS for this trade (base + surge)
    bonus_amount: u64,      // 0 if worsening
    price_impact_bps: u64,  // (mid_price - exec_price) / mid_price
    max_input: u64,         // largest amount_in that won't exceed reserve_out
}

public fun quote(pool: &AMMPool, type_id_in: u64, amount_in: u64): SwapQuote;
```

The dapp reads this via `devInspectTransactionBlock`
([Sui docs](https://docs.sui.io/sui-api-ref#sui_devInspectTransactionBlock))
which executes the call without on-chain side effects, returning BCS bytes that
the SDK decodes against the published struct layout.

**Status.** Scheduled for Phase 2 (Move audit), implemented alongside the
contract hardening pass.

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

**Status.** Scheduled after Phase 4 (multi-pool registry). Blocked on
multi-pool because we need pair-level curve selection before adding curves.

## Multi-pool per SSU + cross-SSU registry

**Why.** Today each SSU hosts at most one pool. Operating an actual market
requires N SSUs for N pairs, which is unscalable. Discoverability is also
zero — there is no way to find pools you haven't been linked to.

**Plan.** Two-part redesign, designed in Phase 3, implemented in Phase 4:

1. **Multi-pool per SSU.** Make `AMMPool` keyed under the SSU rather than
   one-per-extension. Reserves remain in the SSU open inventory; per-pool
   accounting tracks which `(type_id_a, type_id_b)` pair each pool owns.
2. **Shared `PoolRegistry`.** Single shared object indexing all pools by
   `(coin_a, coin_b)` pair and by SSU. Created on package publish, written to
   on `create_pool` / `delist_pool`, read by the dapp for the global market
   view.

Patterns to study:
- [DeepBook v3](https://docs.sui.io/standards/deepbookv3) shared `Registry`
  object for pool indexing.
- Sui [`sui::table`](https://docs.sui.io/references/framework/sui/table)
  for keyed collections.

## Pause + delist for pool operators

**Why.** "No slop" requires emergency response paths. Operators must be able
to halt swaps without losing reserves, and remove a pool from public discovery
without destroying its on-chain state.

**Plan.** Two `AMMAdminCap`-gated flags on `Config`:

- `paused: bool` — when true, `swap` / `deposit_for_swap` abort with
  `EPaused`. `withdraw_from_swap` and admin operations still work so users can
  reclaim deposits.
- `delisted: bool` — registry entry hidden but pool object remains. Reverse-
  able via `relist`.

Implemented in Phase 4 alongside the registry.

## Canonical EVE Frontier currency support

**Why.** EVE Frontier may have an on-chain canonical token. Pools quoting
against it (analogous to USDC pairs in DeFi) get UX privileges in the dapp:
default base, price aggregation, etc.

**Status.** Deferred. Requires research on which on-chain token is in
common circulation. No protocol-level privilege — the dapp surfaces the hint.

## Sponsored transactions for new traders

**Why.** New players don't have SUI for gas. The existing
`ts-scripts/utils/transaction.ts::executeSponsoredTransaction` uses Mysten's
[sponsored transaction pattern](https://docs.sui.io/concepts/transactions/sponsored-transactions)
but is unused by the dapp.

**Status.** Deferred. Blocked on a sponsor wallet operations plan
(funding, abuse limits, key rotation).
