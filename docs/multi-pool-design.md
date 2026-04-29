# Multi-pool + registry design

Phase 3 design doc for the multi-pair / multi-SSU expansion. Phase 4 will
implement this; nothing here ships until the open questions at the bottom
are resolved.

## Goals

1. **One SSU can host many pools.** Today each SSU hosts at most one
   pool. Operating a real market requires N SSUs for N pairs — not
   scalable. After this change a single SSU can host as many distinct
   pairs as the operator wants.
2. **Cross-SSU discoverability.** A trader on `void-exchange.com` can
   browse every pool in the world, filter by pair / proximity / depth,
   and fly to the SSU that hosts the best venue. No more "you have to be
   linked the SSU URL to find a market."
3. **Pause + delist** as no-slop emergency response. Operators can halt
   trading without destroying state; remove a pool from public discovery
   without losing it on-chain.

## Non-goals

- Constant-product or other curve variants. Tracked separately in
  [`roadmap.md`](./roadmap.md).
- Canonical-currency UX privilege. Deferred until the EVE Frontier
  on-chain currency story is settled.
- LP tokens / fungible liquidity shares. The single-operator-per-pool
  model survives.

## Locked-in decisions

These are the answers from the Phase 3 design conversation:

- **Logical commingling** — all pools on a given SSU share the SSU's
  open inventory; each pool tracks its own `(reserve_a, reserve_b)`.
  No per-pool sub-inventory inside the SSU. The open inventory is
  already extension-locked (hidden from the player UI), so there is no
  player-visibility concern.
- **One active pool per `(pair, ssu)`** — uniqueness enforced at create
  time against the registry's non-delisted entries. Delisted pools free
  the slot for redeployment.
- **Clean slate** — the new package is a fresh start. Existing pools
  on the old package are not migrated and not indexed by the new
  registry.

## Object model

```
AMMRegistry  (shared, one global)
  by_pair:    Table<PairKey, vector<ID>>            # all pools by pair
  by_ssu:     Table<address,  vector<ID>>           # all pools at this SSU
  meta:       Table<ID, PoolMeta>                   # full record per pool
  active_at:  Table<ActiveKey, ID>                  # uniqueness index

AMMPool  (shared, one per pool — unchanged shape, gains config flags)
  id:         UID
  ssu_id:     ID
  + dynamic fields (Config, FeeConfig, PlayerDeposit) — unchanged

AMMAdminCap  (per pool — unchanged)
  id:         UID
  pool_id:    ID

PoolMeta  (stored in registry)
  pool_id:        ID
  ssu_id:         address      # the SSU that hosts the pool
  pair:           PairKey      # canonical sorted (lo, hi)
  amp:            u64
  banner:         String
  paused:         bool
  delisted:       bool
  created_at_ms:  u64

PairKey  (struct, copy + drop + store)
  lo: u64
  hi: u64
```

Notes:

- `PairKey` is canonical: `lo = min(type_id_a, type_id_b)`, `hi = max(...)`,
  so `(A,B)` and `(B,A)` map to the same key.
- `ActiveKey = (PairKey, ssu_id_address)` — used for the uniqueness check.
  Removed when a pool is delisted; re-inserted on `relist`.
- The registry indexes are *redundant by design*: `by_pair` and `by_ssu`
  both reference the same set of pool IDs. Both are needed to keep query
  cost O(1) for the dapp's two main views ("all pools for this pair
  across the world" and "all pools at this SSU").
- `meta` is the source-of-truth row; `by_pair` and `by_ssu` hold IDs only,
  resolve through `meta`.

## Multi-pool per SSU

The inventory invariant becomes:

> For each SSU and each `type_id` that appears in any pool on that SSU:
>
> ```
> physical_open_<type_id> ==
>     Σ over pools P on this SSU touching <type_id> of
>         (P.reserve_<type_id> + P.fee_pool_<type_id>
>          + Σ over traders T of P.player_deposit_<T>.balance_<type_id>)
> ```

The proof reduces to the per-pool conservation already proved in
[`amm-invariants.md`](./amm-invariants.md). No pool can withdraw from
open inventory beyond what its own bookkeeping owes — `withdraw_fees`,
`withdraw_from_swap`, `rescue_items` all assert against the pool's own
balances. Pools cannot read or write each other's reserves; the only
shared object they touch is the SSU itself.

Risk: `set_reserves` and `rescue_items` still trust the admin (per I.9
in the invariants doc). With multi-pool, a misbehaving operator on one
pool can drain physical inventory belonging to another pool. We mitigate
this in two ways:

1. `rescue_items` requires the pool's `AMMAdminCap` (already enforced).
2. Phase 4 adds an *inventory check* entry — `verify_inventory(pool, ssu)
   -> bool` — that re-derives `reserve + fee_pool + Σ deposits` and
   compares against a passed-in physical count. Off-chain monitors run
   this periodically.

Note that the AMM extension itself is one *witness type* (`AMMAuth`) per
package on the SSU. All pools deployed against the same package share
the witness; multi-pool does not require multiple authorizations per
SSU. The first pool's `authorize` call covers every subsequent pool.

## Registry schema

```move
public struct AMMRegistry has key {
    id: UID,
    by_pair: Table<PairKey, vector<ID>>,
    by_ssu: Table<address, vector<ID>>,
    meta: Table<ID, PoolMeta>,
    active_at: Table<ActiveKey, ID>,
}
```

Initialization: a one-shot `init_registry(ctx)` entry, called immediately
after package publish. The function aborts if a registry already exists
in the package's history (tracked via a `RegistryInitWitness` resource —
move from witness pattern, see Move Book on
[capabilities](https://move-book.com/programmability/capability.html)).

Operations:

- `register_pool(reg, pool, admin_cap, banner, ctx)`:
  - asserts uniqueness — `!table::contains(reg.active_at, key)`
  - inserts into all four indexes
  - emits `PoolRegistered`

- `delist_pool(reg, pool, admin_cap)`:
  - removes from `active_at` (frees the slot)
  - sets `meta[pool.id].delisted = true`
  - leaves `by_pair` / `by_ssu` entries (so traders with stuck deposits
    can still locate the pool to drain it)
  - emits `PoolDelisted`

- `relist_pool(reg, pool, admin_cap)`:
  - asserts uniqueness against active_at
  - re-inserts into `active_at`
  - sets `meta[pool.id].delisted = false`
  - emits `PoolRelisted`

- `pause_pool(pool, admin_cap)`, `unpause_pool(pool, admin_cap)`:
  - flip `Config.paused` on the pool itself (not the registry).
  - emits `PoolPaused` / `PoolUnpaused`.
  - `swap` and `deposit_for_swap` abort with new `EPaused` error when
    `paused == true`. `withdraw_from_swap`, `withdraw_fees`, and admin
    operations still work — pause is for new flow, not stuck-deposit
    recovery.

Capabilities — every registry mutation requires `&AMMAdminCap` for the
pool being mutated (or, for `register_pool`, the cap of the pool being
registered). The registry itself has no separate cap; the per-pool
admin cap is sufficient.

## Off-chain indexing

The registry IS the source of truth; an off-chain indexer is a UX
optimization, not a correctness requirement.

The dapp's first load can either:

- **A. Read the registry directly** via `getDynamicFields` /
  `getOwnedObjects`-style queries. Up-to-date, no infrastructure, but
  more RPC calls for "give me all pools for pair X" (one per pair index
  entry).
- **B. Tail events** (`PoolRegistered`, `PoolDelisted`, `PoolRelisted`,
  `PoolPaused`) and maintain a cached view. Single subscription on
  `void-exchange.com`'s backend, fast queries, but adds a small
  infrastructure piece.

Both options are viable. Phase 4 ships option A; option B is a
follow-on if RPC pressure becomes real.

## Pool create flow (after Phase 4)

```
operator → create_pool_v2(
    registry,
    storage_unit,
    type_id_a, type_id_b,
    reserve_a, reserve_b,
    amp, fee_bps,
    banner,
    ctx,
) -> AMMAdminCap

internally:
  1. canonicalize PairKey (sort type ids)
  2. assert !table::contains(registry.active_at, (pair_key, ssu_id))
  3. create AMMPool (existing logic)
  4. insert into registry indexes
  5. emit PoolRegistered
  6. transfer AMMAdminCap to ctx.sender()
```

The current `create_pool` entry stays (for backwards compatibility on the
old package), but the new package's `create_pool_v2` is the only path
the dapp uses.

## Migration

User confirmed clean slate. Concretely:

1. The new package is a fresh `0x...` deployment.
2. The new package emits `init_registry` once on publish.
3. Old pools (deployed against the previous package) are not indexed by
   the new registry. They remain as on-chain shared objects, accessible
   by direct ID for stuck-deposit recovery, but invisible to the new
   dapp's discovery flow.
4. The dapp's `AMM_ENV_ORIGINAL_PACKAGE_ID` and `AMM_ENV_CURRENT_PACKAGE_ID`
   point at the new package.

No `register_existing_pool` entry is needed; old pools simply don't
migrate.

## Implementation order (Phase 4)

1. Add `PairKey`, `PoolMeta`, `ActiveKey`, `AMMRegistry` structs.
2. Add `init_registry` entry + `RegistryInitWitness`.
3. Refactor existing `create_pool` to a private `create_pool_internal`
   shared by old and new entries.
4. Add `create_pool_v2` (the registry-aware entry). Old `create_pool`
   stays.
5. Add `register_pool`, `delist_pool`, `relist_pool` registry mutations.
6. Add `pause` / `unpause` + `EPaused` + check in `swap` and
   `deposit_for_swap`.
7. Add `verify_inventory` view function (the multi-pool inventory
   check from §Multi-pool per SSU).
8. New event types: `PoolRegistered`, `PoolDelisted`, `PoolRelisted`,
   `PoolPaused`, `PoolUnpaused`.
9. Move tests covering: uniqueness on create_pool_v2, pause-blocks-swap,
   delist-frees-slot, relist-fails-on-conflict, register/delist event
   emission.
10. Regenerate codegen.
11. `lib/amm/operations.ts` gains:
    - `buildCreatePoolV2Tx` (compound: register + transfer cap)
    - `buildPauseTx`, `buildUnpauseTx`, `buildDelistTx`, `buildRelistTx`
    - `listPoolsByPair(client, registry, pair)` — `getDynamicFieldObject`
      lookup returning `PoolMeta[]`
    - `listPoolsBySsu(client, registry, ssuId)` — same shape
12. Dapp wires the global market view to `listPoolsByPair`.

## Open questions

These are the calls I want to defer to you before writing code:

### O.1 — Registry init: who calls it?

Two options:

- **Anyone (permissionless)**. The first call wins and creates the
  shared `AMMRegistry`. A `RegistryInitWitness` ensures only one is ever
  created. Anyone re-calling `init_registry` aborts.
- **Module init** (`fun init(ctx) { ... }`). The registry is created
  inside the module's `init` function, called automatically on package
  publish. No external entry, no race condition.

Module init is the standard Sui pattern for one-shot package state.
Recommend: **module init**.

### O.2 — Is `Config.paused` enforced *only* on `swap` and `deposit_for_swap`?

The spec says yes — pause stops new flow but lets stuck deposits drain.
Concretely: `withdraw_from_swap`, `withdraw_fees`, `roll_fees_to_reserves`,
`rescue_items`, `add_liquidity`, `set_reserves`, `update_*`, and
`update_banner` all bypass the pause flag.

The case for tightening: `add_liquidity` while paused could be a footgun
(the operator deposits fresh inventory into a halted pool). The case
for not tightening: a paused pool should still be tunable so the
operator can fix whatever caused the pause.

Recommend: **enforce only on `swap` + `deposit_for_swap`**, with `paused`
state surfaced in the `SwapQuote` so the dapp can show a "paused" badge.

### O.3 — Pair-keyed type_ids: is `u64` enough forever?

EVE Frontier item type IDs are u64 today (per existing `Config`).
Sticking with u64 for `PairKey` is the natural choice and matches the
existing schema. No proposal to change; flagging for explicit
acknowledgement.

### O.4 — Dapp default discovery URL

Today: `void-exchange.com/?ssu=<id>` loads pre-filtered to one SSU.
After Phase 4 the global URL `void-exchange.com` should default to a
"global market" view that consumes the registry. Open question: do we
keep the per-SSU URL form, redirect it to the global view, or both?
Recommend: **both** — `?ssu=<id>` stays for in-game dApp-URL setting on
SSUs; default is global.

### O.5 — Registry capability shape

The spec uses per-pool `AMMAdminCap` for every registry mutation. This
means delisting requires the pool's admin cap, not a registry-wide cap.
Operators only manage their own pools — no central authority can delist
someone else's pool.

The case against: if a pool operator goes dark and their pool gets
exploited, no one can clean up the registry entry. The case for: trust
minimization — the registry is non-custodial.

Recommend: **per-pool cap only**. If we ever need a "circuit breaker"
for the world, we add a separate `RegistryGovernance` cap later.

## Decision matrix

| ID  | Default                                      | Decision |
|-----|----------------------------------------------|----------|
| O.1 | module `init` creates the registry           |          |
| O.2 | pause enforced only on swap + deposit        |          |
| O.3 | PairKey stays u64                            |          |
| O.4 | global view default; per-SSU URL stays       |          |
| O.5 | per-pool admin cap only; no governance cap   |          |

Confirm or override each, and Phase 4 is unblocked.
