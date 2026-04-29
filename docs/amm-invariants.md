# AMM contract invariants

A line-by-line audit of [`amm.move`](../move-contracts/amm_extension/sources/amm.move),
done as part of Phase 2. Every invariant is testable; every fix is backed
by a citation and a Move test.

## Invariants the contract maintains

### I.1 — SSU binding is permanent

`AMMPool.ssu_id` is set at creation and never mutated. Every function that
touches an SSU asserts `pool.ssu_id == object::id(storage_unit)` (error
`ESSUMismatch`). A pool cannot be moved between SSUs.

Enforced at: `deposit_for_swap`, `withdraw_from_swap`, `add_liquidity`,
`withdraw_fees`, `rescue_items`. Reference:
[Sui object identity](https://docs.sui.io/concepts/sui-move-concepts#object-id).

### I.2 — Capability binding is permanent

`AMMAdminCap.pool_id` is set at creation and never mutated. Every admin
function asserts `admin_cap.pool_id == object::id(pool)` (error `ENotOwner`).
The cap is an unforgeable witness — Sui's object model prevents constructing
one outside the package. Reference: [Move Book on capabilities](
https://move-book.com/programmability/capability.html).

### I.3 — Inventory conservation across a swap

For each side `s ∈ {a, b}`, the SSU's open inventory of token `s` always
equals `reserve_s + fee_pool_s + Σ player_deposits.balance_s`.

The full swap PTB (`deposit_for_swap` → `swap` → `withdraw_from_swap`)
preserves this invariant. The proof is a step-by-step accounting trace —
see [`swap-conservation.md`](./swap-conservation.md) — but in summary:

- `deposit_for_swap` moves `amount_in` from main → open AND credits
  `player_deposit.balance_in` by the same amount. Both sides up by
  `amount_in`. ✓
- `swap` is pure accounting:
  - `reserve_in` += `net_in = amount_in - fee`
  - `fee_pool_in` += `fee`
  - so `reserve_in + fee_pool_in` += `amount_in` ✓ (consumes the deposit)
  - `reserve_out` -= `amount_out`
  - `fee_pool_out` -= `bonus`
  - so `reserve_out + fee_pool_out` -= `amount_out + bonus = total_output`
  - `player_deposit.balance_out` += `total_output` ✓ (output is owed)
- `withdraw_from_swap` moves `total_output` open → main AND debits
  `player_deposit.balance_out` by the same amount. ✓

### I.4 — `fee_pool` is monotonically non-decreasing modulo bonus and admin
withdrawals

`fee_pool_s` is incremented only by `swap` (when fee accrues). It is
decremented only by:

1. `compute_bonus` payout via `update_fee_pool` (capped at `fee_pool_s`,
   so it cannot underflow — see I.5).
2. `withdraw_fees` admin operation (asserts `amount <= fee_pool_s`).
3. `roll_fees_to_reserves` admin operation (asserts `amount <= fee_pool_s`).

### I.5 — Bonus is capped at `min(I·b·out / 10000², fee_pool, 3·fee_in_out_units)`

For a rebalancing trade with imbalance `I` (BPS, ≤ 10000) and bonus rate
`b` (BPS, ≤ 10000), the raw bonus is `(amount_out · I · b) / 10000²`. The
final bonus is the minimum of:

1. Raw bonus.
2. Available `fee_pool_out` (so the house can never be drained beyond the
   collected fees).
3. `3 · fee · target_out / target_in`, normalizing the fee from input units
   to output units.

The intent is "rebalancing is rewarded but bounded." The 3× factor ensures
the bonus is never more than 3× the fee that would be collected on the
opposite worsening trade.

### I.6 — Pool/SSU mismatch aborts every reserve-touching call

See I.1.

### I.7 — Type-id discipline

A pool exposes exactly two type-ids `{type_id_a, type_id_b}`. Every
function that accepts a `type_id` argument asserts membership. Calling
with an unknown type-id aborts with `EInvalidTypeId`.

### I.8 — Targets and reserves are independent

`target_a/target_b` are an admin-set ratio defining the "balanced" state;
`reserve_a/reserve_b` track actual on-chain liquidity. They diverge as
trades happen, and the divergence drives the surge / bonus mechanism.
Targets are *only* mutated by `update_target_ratio` (admin-gated).

This is by design — the admin is responsible for periodically re-pegging
the target if the market's natural ratio shifts.

### I.9 — `set_reserves` trusts the admin

`set_reserves` rewrites `reserve_a/reserve_b` without checking that the
SSU's open inventory actually matches. It exists to let the admin
reconcile the on-chain reserve counter with whatever physical inventory
ended up in the SSU after a manual deposit, dust collection, etc.

This breaks I.3 momentarily when called. The admin is expected to
restore the invariant by depositing the right amount into open
inventory (or accept a temporary skew).

A future change (Phase 4 pause/delist) will gate this behind a "pool is
paused" flag so swaps can't run against a stale reserve count.

### I.10 — Fee math is bounded

`effective_fee_bps` is clamped to `BPS_DENOM - 1` (i.e. 9999, just under
100%). A trade can never pay 100% of its input as fee — meaningfully,
this guarantees `net_in > 0` whenever `amount_in > 0` and ensures the
StableSwap math has a positive new reserve.

## Findings, severity, and disposition

The audit catalogues every finding. Each is tagged with severity and
either fixed in this commit, deferred to Phase 4, or accepted with rationale.

### B.1 — `compute_fee` multiplies u64s without overflow guard *(fixed)*

```move
(amount_in * effective_fee_bps) / BPS_DENOM
```

`amount_in: u64` × `effective_fee_bps: u64` overflows u64 when
`amount_in > u64::MAX / 9999 ≈ 1.84·10¹⁵`. EVE Frontier item counts are
practically bounded by `u32` in `add_liquidity` (max 4.3·10⁹) so the
overflow is not reachable today, but `set_reserves` accepts u64 so an
admin error or a future amount-bound change could expose the bug.

**Fix:** promote to u128 for the multiplication, divide back to u64. Same
pattern as the existing `imbalance_bps` calculation. Reference: [Move Book
on integer arithmetic and overflow](
https://move-book.com/move-basics/primitive-types.html#integer-types).

### B.2 — `withdraw_from_swap` does not check deposit existence *(fixed)*

```move
let deposit = df::borrow_mut<DepositKey, PlayerDeposit>(&mut pool.id, key);
```

If the trader never called `deposit_for_swap`, the dynamic field doesn't
exist and `df::borrow_mut` aborts with the framework's internal error code,
not our typed `EInsufficientDeposit`. The downstream check
`assert!(deposit.balance_a >= amount, ...)` is unreachable.

**Fix:** add `assert!(df::exists_(&pool.id, key), EInsufficientDeposit)`
before the borrow, mirroring the check in `swap` (line 392). Reference:
[Sui framework `dynamic_field`](
https://docs.sui.io/references/framework/sui/dynamic_field).

### B.3 — `EInsufficientLiquidity` overloaded across reserves and fee pool *(partially fixed)*

The same error code is raised for "swap output exceeds reserve" (line 376)
and "withdrawal exceeds fee_pool" (lines 503, 506, 574, 577). Different
semantics, same code — bad for off-chain error decoders.

**Fix:** introduce `EInsufficientFeePool` (code 12) and use it in
`withdraw_fees` and `roll_fees_to_reserves`. Leave `EInsufficientLiquidity`
for the swap-side path.

### B.4 — `compute_bonus` precedence is correct but obscure *(documented)*

```move
let fee_cap = (fee_in_out_units * 3 as u64);
```

Move parses this as `(fee_in_out_units * 3) as u64` — `*` binds tighter
than `as`, so the multiplication happens in u128 and the cast truncates.
This is the right semantics, but the reader has to verify that
operator-precedence claim. Comment added; no code change.

Reference: [Move Book on operator precedence](
https://move-book.com/move-basics/expression.html).

### B.5 — `set_reserves` breaks I.3 by design *(deferred to Phase 4)*

See I.9. Fix is to gate `set_reserves` behind a `paused: bool` flag added
in Phase 4 (pause/delist).

### B.6 — Min-fee-of-1 only applies when `base_fee_bps > 0` *(accepted)*

```move
if (fee == 0 && base_fee_bps > 0) { 1 } else { fee }
```

A pool configured with `base_fee_bps = 0` and `surge_bps > 0` charges
nothing on a tiny worsening trade where `surge / 10000` rounds to zero.
This is technically a fee-evasion vector for very small trades, but the
loss is bounded at 1 unit per trade and gas costs make it impractical to
exploit. Documented in the source.

### B.7 — Convergence failure is not gracefully handled *(accepted)*

`stable_get_d` and `stable_get_y` `abort EConvergenceFailed` after 64
iterations. In practice, convergence happens in <16 iterations for any
valid input; failure indicates degenerate input that the assertions
upstream should have caught. The abort rolls back the entire tx, so no
state corruption — accepted as correct behaviour.

## Tests added in this commit

| Test                                    | Covers  |
|-----------------------------------------|---------|
| `test_withdraw_from_swap_no_deposit`    | B.2     |
| `test_withdraw_fees_exceeds_pool`       | B.3     |
| `test_compute_bonus_capped_at_fee_pool` | I.5     |
| `test_compute_bonus_capped_at_3x_fee`   | I.5     |
| `test_quote_matches_swap`               | quote() |
| `test_quote_imbalanced_pool`            | quote() |

B.1 (u128 promotion in `compute_fee`) is exercised implicitly — every
existing fee-computing test now runs through the u128 path. A direct
overflow test would require `amount_in > u64::MAX / 9999`, which the
test framework cannot construct (storage_unit `add_liquidity` is u32).
