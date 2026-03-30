import { Transaction } from "@mysten/sui/transactions";
import { getAmmOriginalPackageId, getAmmPackageId, AMM_ENV_ORIGINAL_PACKAGE_ID, AMM_ENV_CURRENT_PACKAGE_ID, WORLD_PACKAGE_ID, MODULES } from "../config";

const STORAGE_UNIT_TYPE = `${WORLD_PACKAGE_ID}::${MODULES.STORAGE_UNIT}::StorageUnit`;

/** All SSU-specific context needed to build transactions. */
export type SsuContext = {
    ssuId: string;
    ssuIsv: number;
    characterId: string;
    characterIsv: number;
};

/** Pool-specific context needed for pool operations. */
export type PoolContext = {
    poolId: string;
    poolIsv: number;
};

function shared(tx: Transaction, objectId: string, isv: number, mutable: boolean) {
    return tx.sharedObjectRef({ objectId, initialSharedVersion: isv, mutable });
}

/** Add the 3-call authorize AMMAuth sequence to an existing transaction.
 *  `originalPkg` controls which deployment's AMMAuth type is authorized. */
function addAuthorizeFragment(
    tx: Transaction, charRef: ReturnType<typeof shared>, ssuRef: ReturnType<typeof shared>,
    ownerCapId: string, originalPkg: string,
) {
    const [cap, receipt] = tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::${MODULES.CHARACTER}::borrow_owner_cap`,
        typeArguments: [STORAGE_UNIT_TYPE],
        arguments: [charRef, tx.object(ownerCapId)],
    });
    tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::${MODULES.STORAGE_UNIT}::authorize_extension`,
        typeArguments: [`${originalPkg}::${MODULES.AMM}::AMMAuth`],
        arguments: [ssuRef, cap],
    });
    tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::${MODULES.CHARACTER}::return_owner_cap`,
        typeArguments: [STORAGE_UNIT_TYPE],
        arguments: [charRef, cap, receipt],
    });
}

/** Authorize AMMAuth on SSU (one-time, owner only) */
export function buildAuthorizeTx(ctx: SsuContext, ownerCapId: string): Transaction {
    const tx = new Transaction();
    const charRef = shared(tx, ctx.characterId, ctx.characterIsv, true);
    const ssuRef = shared(tx, ctx.ssuId, ctx.ssuIsv, true);
    addAuthorizeFragment(tx, charRef, ssuRef, ownerCapId, getAmmOriginalPackageId());
    return tx;
}

/** Authorize + Create Pool in a single PTB (one wallet prompt, one gas coin).
 *  Always uses .env packages — new pools must use the latest deployment. */
export function buildAuthorizeAndCreatePoolTx(ctx: SsuContext, ownerCapId: string, params: {
    typeIdA: bigint; typeIdB: bigint;
    reserveA: bigint; reserveB: bigint;
    amp: bigint; feeBps: bigint;
    banner: string; sender: string;
}): Transaction {
    const tx = new Transaction();
    const ssuRef = shared(tx, ctx.ssuId, ctx.ssuIsv, true);
    const charRef = shared(tx, ctx.characterId, ctx.characterIsv, true);

    addAuthorizeFragment(tx, charRef, ssuRef, ownerCapId, AMM_ENV_ORIGINAL_PACKAGE_ID);

    const adminCap = tx.moveCall({
        target: `${AMM_ENV_CURRENT_PACKAGE_ID}::${MODULES.AMM}::create_pool`,
        arguments: [
            ssuRef,
            tx.pure.u64(params.typeIdA), tx.pure.u64(params.typeIdB),
            tx.pure.u64(params.reserveA), tx.pure.u64(params.reserveB),
            tx.pure.u64(params.amp), tx.pure.u64(params.feeBps),
            tx.pure.string(params.banner),
        ],
    });
    tx.transferObjects([adminCap], tx.pure.address(params.sender));
    return tx;
}

/** Create pool (standalone, for when authorization is already done).
 *  Always uses .env packages — new pools must use the latest deployment. */
export function buildCreatePoolTx(ctx: SsuContext, params: {
    typeIdA: bigint; typeIdB: bigint;
    reserveA: bigint; reserveB: bigint;
    amp: bigint; feeBps: bigint;
    banner: string; sender: string;
}): Transaction {
    const tx = new Transaction();
    const adminCap = tx.moveCall({
        target: `${AMM_ENV_CURRENT_PACKAGE_ID}::${MODULES.AMM}::create_pool`,
        arguments: [
            shared(tx, ctx.ssuId, ctx.ssuIsv, false),
            tx.pure.u64(params.typeIdA), tx.pure.u64(params.typeIdB),
            tx.pure.u64(params.reserveA), tx.pure.u64(params.reserveB),
            tx.pure.u64(params.amp), tx.pure.u64(params.feeBps),
            tx.pure.string(params.banner),
        ],
    });
    tx.transferObjects([adminCap], tx.pure.address(params.sender));
    return tx;
}

/** Add liquidity (authorizes AMMAuth first — idempotent if already authorized).
 *  Character ref is mutable because authorize requires it, but add_liquidity only needs &Character. */
export function buildSeedTx(pool: PoolContext, ctx: SsuContext, params: {
    adminCapId: string; ownerCapId: string; typeId: bigint; amount: number;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    const ssuRef = shared(tx, ctx.ssuId, ctx.ssuIsv, true);
    // Mutable needed for borrow_owner_cap; add_liquidity accepts &mut as superset of &Character
    const charRef = shared(tx, ctx.characterId, ctx.characterIsv, true);

    addAuthorizeFragment(tx, charRef, ssuRef, params.ownerCapId, getAmmOriginalPackageId());

    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::add_liquidity`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            ssuRef,
            charRef,
            tx.pure.u64(params.typeId),
            tx.pure.u32(params.amount),
        ],
    });
    return tx;
}

/** Set reserves directly (admin only) */
export function buildSetReservesTx(pool: PoolContext, params: {
    adminCapId: string; reserveA: bigint; reserveB: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::set_reserves`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            tx.pure.u64(params.reserveA),
            tx.pure.u64(params.reserveB),
        ],
    });
    return tx;
}

/** Withdraw accumulated fees */
export function buildWithdrawFeesTx(pool: PoolContext, ctx: SsuContext, params: {
    adminCapId: string; typeId: bigint; amount: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::withdraw_fees`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            shared(tx, ctx.ssuId, ctx.ssuIsv, true),
            shared(tx, ctx.characterId, ctx.characterIsv, false),
            tx.pure.u64(params.typeId),
            tx.pure.u64(params.amount),
        ],
    });
    return tx;
}

/** Roll fees into reserves */
export function buildRollFeesToReservesTx(pool: PoolContext, params: {
    adminCapId: string; typeId: bigint; amount: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::roll_fees_to_reserves`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            tx.pure.u64(params.typeId),
            tx.pure.u64(params.amount),
        ],
    });
    return tx;
}

/** Initialize dynamic fee config (one-time, admin only) */
export function buildInitFeeConfigTx(pool: PoolContext, params: {
    adminCapId: string; surgeBps: bigint; bonusBps: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::init_fee_config`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            tx.pure.u64(params.surgeBps),
            tx.pure.u64(params.bonusBps),
        ],
    });
    return tx;
}

/** Seed both tokens into reserves + init fee config — single PTB after pool creation.
 *  Uses .env packages since this runs immediately after create_pool. */
export function buildSeedAndInitFeeTx(pool: PoolContext, ctx: SsuContext, params: {
    adminCapId: string;
    typeIdA: bigint; amountA: number;
    typeIdB: bigint; amountB: number;
    surgeBps: bigint; bonusBps: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = AMM_ENV_CURRENT_PACKAGE_ID;
    const poolRef = shared(tx, pool.poolId, pool.poolIsv, true);
    const ssuRef = shared(tx, ctx.ssuId, ctx.ssuIsv, true);
    const charRef = shared(tx, ctx.characterId, ctx.characterIsv, false);
    const adminCap = tx.object(params.adminCapId);

    // Seed token A
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::add_liquidity`,
        arguments: [poolRef, adminCap, ssuRef, charRef, tx.pure.u64(params.typeIdA), tx.pure.u32(params.amountA)],
    });
    // Seed token B
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::add_liquidity`,
        arguments: [poolRef, adminCap, ssuRef, charRef, tx.pure.u64(params.typeIdB), tx.pure.u32(params.amountB)],
    });
    // Reset reserves — create_pool already set them, add_liquidity double-counted
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::set_reserves`,
        arguments: [poolRef, adminCap, tx.pure.u64(params.amountA), tx.pure.u64(params.amountB)],
    });
    // Init dynamic fee config
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::init_fee_config`,
        arguments: [poolRef, adminCap, tx.pure.u64(params.surgeBps), tx.pure.u64(params.bonusBps)],
    });
    return tx;
}

/** Update base trade fee (admin only) */
export function buildUpdateFeeBpsTx(pool: PoolContext, params: {
    adminCapId: string; feeBps: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::update_fee_bps`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            tx.pure.u64(params.feeBps),
        ],
    });
    return tx;
}

/** Update target ratio (admin only) */
export function buildUpdateTargetRatioTx(pool: PoolContext, params: {
    adminCapId: string; targetA: bigint; targetB: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::update_target_ratio`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            tx.pure.u64(params.targetA),
            tx.pure.u64(params.targetB),
        ],
    });
    return tx;
}

/** Update dynamic fee parameters (admin only) */
export function buildUpdateFeeConfigTx(pool: PoolContext, params: {
    adminCapId: string; surgeBps: bigint; bonusBps: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::update_fee_config`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            tx.pure.u64(params.surgeBps),
            tx.pure.u64(params.bonusBps),
        ],
    });
    return tx;
}

/** Rescue items from open inventory → main (for draining old pools).
 *  Always uses .env packages since rescue_items only exists in the latest contract. */
export function buildRescueItemsTx(pool: PoolContext, ctx: SsuContext, adminCapId: string, items: { typeId: bigint; amount: number }[]): Transaction {
    const tx = new Transaction();
    const poolRef = shared(tx, pool.poolId, pool.poolIsv, false);
    const ssuRef = shared(tx, ctx.ssuId, ctx.ssuIsv, true);
    const charRef = shared(tx, ctx.characterId, ctx.characterIsv, false);
    const adminCap = tx.object(adminCapId);

    for (const item of items) {
        tx.moveCall({
            target: `${AMM_ENV_CURRENT_PACKAGE_ID}::${MODULES.AMM}::rescue_items`,
            arguments: [poolRef, adminCap, ssuRef, charRef, tx.pure.u64(item.typeId), tx.pure.u32(item.amount)],
        });
    }
    return tx;
}

/** Swap: deposit_for_swap → swap → withdraw_from_swap (all in one PTB).
 *  The 3-step flow gates items per-player to prevent front-running. */
export function buildSwapTx(pool: PoolContext, ctx: SsuContext, params: {
    typeIdIn: bigint; amountIn: bigint; minOut: bigint;
    typeIdOut: bigint; totalOutput: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    const poolRef = shared(tx, pool.poolId, pool.poolIsv, true);
    const ssuRef = shared(tx, ctx.ssuId, ctx.ssuIsv, true);
    const charRef = shared(tx, ctx.characterId, ctx.characterIsv, false);

    // 1. Lock input items from SSU owner inventory into open inventory
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::deposit_for_swap`,
        arguments: [poolRef, ssuRef, charRef, tx.pure.u64(params.typeIdIn), tx.pure.u64(params.amountIn)],
    });
    // 2. Execute swap (accounting only — no item movement)
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::swap`,
        arguments: [poolRef, tx.pure.u64(params.typeIdIn), tx.pure.u64(params.amountIn), tx.pure.u64(params.minOut)],
    });
    // 3. Collect output from open inventory back to SSU owner inventory
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::withdraw_from_swap`,
        arguments: [poolRef, ssuRef, charRef, tx.pure.u64(params.typeIdOut), tx.pure.u64(params.totalOutput)],
    });
    return tx;
}
