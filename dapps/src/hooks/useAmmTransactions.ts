/**
 * AMM transaction builders for the dapp.
 *
 * Thin facade over `ts-scripts/lib/amm`:
 *  - Compound PTBs come from `lib/amm/operations` (one source of truth
 *    shared with the CLI scripts).
 *  - Single-call admin operations call the generated `amm` bindings
 *    directly via `tx.add(amm.someCall(...))`.
 *
 * Per-pool package IDs are sourced from the dapp's localStorage-backed
 * `getAmmPackageId()` / `getAmmOriginalPackageId()` (so a user with a
 * pool deployed against an older package can still trade).
 */
import { Transaction } from "@mysten/sui/transactions";
import {
    amm,
    buildAuthorizeAndCreatePoolTx,
    buildAuthorizeTx,
    buildCreatePoolTx,
    buildRescueItemsTx,
    buildSeedAndInitFeeTx,
    buildSeedTx,
    buildSwapTx,
    sharedRef,
    type AmmPackageIds,
    type PoolContext,
    type SsuContext,
} from "../../../ts-scripts/lib/amm";
import {
    AMM_ENV_CURRENT_PACKAGE_ID,
    AMM_ENV_ORIGINAL_PACKAGE_ID,
    WORLD_PACKAGE_ID,
    getAmmOriginalPackageId,
    getAmmPackageId,
} from "../config";

// Re-export for callers that imported these from this module historically.
export type { SsuContext, PoolContext };

/** Package IDs reflecting whatever the user has selected (pool-derived
 *  override over .env). */
function packageIds(): AmmPackageIds {
    return { current: getAmmPackageId(), original: getAmmOriginalPackageId() };
}

/** Package IDs forced to the .env-pinned latest deploy. Used for
 *  operations that must run against the newest contract — pool creation
 *  (no upgrade path) and rescue (a recovery-only entry). */
function envPackageIds(): AmmPackageIds {
    return { current: AMM_ENV_CURRENT_PACKAGE_ID, original: AMM_ENV_ORIGINAL_PACKAGE_ID };
}

/** Authorize AMMAuth on SSU (one-time, owner only). */
export function buildAuthorizeTransaction(ctx: SsuContext, ownerCapId: string): Transaction {
    return buildAuthorizeTx({
        ssu: ctx,
        ownerCapTicketId: ownerCapId,
        worldPackageId: WORLD_PACKAGE_ID,
        ammPackageIds: packageIds(),
    });
}

/** Authorize + Create Pool in a single PTB. Uses .env packages — new
 *  pools always target the latest deployment. */
export function buildAuthorizeAndCreatePoolTransaction(
    ctx: SsuContext,
    ownerCapId: string,
    pool: {
        typeIdA: bigint;
        typeIdB: bigint;
        reserveA: bigint;
        reserveB: bigint;
        amp: bigint;
        feeBps: bigint;
        banner: string;
        sender: string;
    },
): Transaction {
    return buildAuthorizeAndCreatePoolTx({
        ssu: ctx,
        ownerCapTicketId: ownerCapId,
        worldPackageId: WORLD_PACKAGE_ID,
        ammPackageIds: envPackageIds(),
        pool,
        sender: pool.sender,
    });
}

/** Create pool (standalone, when authorization is already done). */
export function buildCreatePoolTransaction(
    ctx: SsuContext,
    pool: {
        typeIdA: bigint;
        typeIdB: bigint;
        reserveA: bigint;
        reserveB: bigint;
        amp: bigint;
        feeBps: bigint;
        banner: string;
        sender: string;
    },
): Transaction {
    return buildCreatePoolTx({
        ssu: ctx,
        ammPackageIds: envPackageIds(),
        pool,
        sender: pool.sender,
    });
}

/** Add liquidity (authorizes AMMAuth first — idempotent if already
 *  authorized). */
export function buildSeedTransaction(
    pool: PoolContext,
    ctx: SsuContext,
    params: { adminCapId: string; ownerCapId: string; typeId: bigint; amount: number },
): Transaction {
    return buildSeedTx({
        pool,
        ssu: ctx,
        adminCapId: params.adminCapId,
        ownerCapTicketId: params.ownerCapId,
        typeId: params.typeId,
        amount: params.amount,
        worldPackageId: WORLD_PACKAGE_ID,
        ammPackageIds: packageIds(),
    });
}

/** Set reserves directly (admin only). */
export function buildSetReservesTransaction(
    pool: PoolContext,
    params: { adminCapId: string; reserveA: bigint; reserveB: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.setReserves({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                reserveA: params.reserveA,
                reserveB: params.reserveB,
            },
        }),
    );
    return tx;
}

/** Withdraw accumulated fees (admin only). */
export function buildWithdrawFeesTransaction(
    pool: PoolContext,
    ctx: SsuContext,
    params: { adminCapId: string; typeId: bigint; amount: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.withdrawFees({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                storageUnit: sharedRef(tx, ctx.ssuId, ctx.ssuIsv, true),
                character: sharedRef(tx, ctx.characterId, ctx.characterIsv, false),
                typeId: params.typeId,
                amount: params.amount,
            },
        }),
    );
    return tx;
}

/** Roll fees into reserves (admin only). */
export function buildRollFeesToReservesTransaction(
    pool: PoolContext,
    params: { adminCapId: string; typeId: bigint; amount: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.rollFeesToReserves({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                typeId: params.typeId,
                amount: params.amount,
            },
        }),
    );
    return tx;
}

/** Initialize dynamic fee config (one-time, admin only). */
export function buildInitFeeConfigTransaction(
    pool: PoolContext,
    params: { adminCapId: string; surgeBps: bigint; bonusBps: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.initFeeConfig({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                surgeBps: params.surgeBps,
                bonusBps: params.bonusBps,
            },
        }),
    );
    return tx;
}

/** Seed both tokens + init fee config — single PTB after pool creation. */
export function buildSeedAndInitFeeTransaction(
    pool: PoolContext,
    ctx: SsuContext,
    params: {
        adminCapId: string;
        typeIdA: bigint;
        amountA: number;
        typeIdB: bigint;
        amountB: number;
        surgeBps: bigint;
        bonusBps: bigint;
    },
): Transaction {
    return buildSeedAndInitFeeTx({
        pool,
        ssu: ctx,
        adminCapId: params.adminCapId,
        ammPackageIds: envPackageIds(),
        seed: params,
    });
}

/** Update base trade fee (admin only). */
export function buildUpdateFeeBpsTransaction(
    pool: PoolContext,
    params: { adminCapId: string; feeBps: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.updateFeeBps({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                feeBps: params.feeBps,
            },
        }),
    );
    return tx;
}

/** Update target ratio (admin only). */
export function buildUpdateTargetRatioTransaction(
    pool: PoolContext,
    params: { adminCapId: string; targetA: bigint; targetB: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.updateTargetRatio({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                targetA: params.targetA,
                targetB: params.targetB,
            },
        }),
    );
    return tx;
}

/** Update dynamic fee parameters (admin only). */
export function buildUpdateFeeConfigTransaction(
    pool: PoolContext,
    params: { adminCapId: string; surgeBps: bigint; bonusBps: bigint },
): Transaction {
    const tx = new Transaction();
    tx.add(
        amm.updateFeeConfig({
            package: getAmmPackageId(),
            arguments: {
                pool: sharedRef(tx, pool.poolId, pool.poolIsv, true),
                adminCap: tx.object(params.adminCapId),
                surgeBps: params.surgeBps,
                bonusBps: params.bonusBps,
            },
        }),
    );
    return tx;
}

/** Rescue items from open inventory → main (drains stranded items
 *  from old pools). Always uses .env packages — `rescue_items` only
 *  exists in the latest contract. */
export function buildRescueItemsTransaction(
    pool: PoolContext,
    ctx: SsuContext,
    adminCapId: string,
    items: ReadonlyArray<{ typeId: bigint; amount: number }>,
): Transaction {
    return buildRescueItemsTx({
        pool,
        ssu: ctx,
        adminCapId,
        items,
        ammPackageIds: envPackageIds(),
    });
}

/** Swap: deposit_for_swap → swap → withdraw_from_swap (one PTB).
 *  The 3-step flow gates items per-player to prevent front-running. */
export function buildSwapTransaction(
    pool: PoolContext,
    ctx: SsuContext,
    swap: {
        typeIdIn: bigint;
        amountIn: bigint;
        minOut: bigint;
        typeIdOut: bigint;
        totalOutput: bigint;
    },
): Transaction {
    return buildSwapTx({
        pool,
        ssu: ctx,
        ammPackageIds: packageIds(),
        swap,
    });
}

/* Backwards-compat aliases — historical names callers may still use. */
export {
    buildAuthorizeTransaction as buildAuthorizeTx,
    buildAuthorizeAndCreatePoolTransaction as buildAuthorizeAndCreatePoolTx,
    buildCreatePoolTransaction as buildCreatePoolTx,
    buildSeedTransaction as buildSeedTx,
    buildSetReservesTransaction as buildSetReservesTx,
    buildWithdrawFeesTransaction as buildWithdrawFeesTx,
    buildRollFeesToReservesTransaction as buildRollFeesToReservesTx,
    buildInitFeeConfigTransaction as buildInitFeeConfigTx,
    buildSeedAndInitFeeTransaction as buildSeedAndInitFeeTx,
    buildUpdateFeeBpsTransaction as buildUpdateFeeBpsTx,
    buildUpdateTargetRatioTransaction as buildUpdateTargetRatioTx,
    buildUpdateFeeConfigTransaction as buildUpdateFeeConfigTx,
    buildRescueItemsTransaction as buildRescueItemsTx,
    buildSwapTransaction as buildSwapTx,
};
