import { Transaction } from "@mysten/sui/transactions";
import { AMM_ORIGINAL_PACKAGE_ID, getAmmPackageId, WORLD_PACKAGE_ID, MODULES } from "../config";
import { suiClient } from "./useDevInspect";

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

async function getObjectRef(objectId: string) {
    const obj = await suiClient.getObject({ id: objectId });
    if (!obj.data) throw new Error(`Object not found: ${objectId}`);
    return { objectId: obj.data.objectId, version: obj.data.version!, digest: obj.data.digest! };
}

/** Authorize AMMAuth on SSU (one-time, owner only) */
export async function buildAuthorizeTx(ctx: SsuContext, ownerCapId: string): Promise<Transaction> {
    const tx = new Transaction();
    const capRef = await getObjectRef(ownerCapId);
    const [cap, receipt] = tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::${MODULES.CHARACTER}::borrow_owner_cap`,
        typeArguments: [STORAGE_UNIT_TYPE],
        arguments: [shared(tx, ctx.characterId, ctx.characterIsv, true), tx.receivingRef(capRef)],
    });
    tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::${MODULES.STORAGE_UNIT}::authorize_extension`,
        typeArguments: [`${AMM_ORIGINAL_PACKAGE_ID}::${MODULES.AMM}::AMMAuth`],
        arguments: [shared(tx, ctx.ssuId, ctx.ssuIsv, true), cap],
    });
    tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::${MODULES.CHARACTER}::return_owner_cap`,
        typeArguments: [STORAGE_UNIT_TYPE],
        arguments: [shared(tx, ctx.characterId, ctx.characterIsv, true), cap, receipt],
    });
    return tx;
}

/** Create pool */
export function buildCreatePoolTx(ctx: SsuContext, params: {
    typeIdA: bigint; typeIdB: bigint;
    reserveA: bigint; reserveB: bigint;
    amp: bigint; feeBps: bigint;
    banner: string; sender: string;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    const adminCap = tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::create_pool`,
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

/** Add liquidity */
export function buildSeedTx(pool: PoolContext, ctx: SsuContext, params: {
    adminCapId: string; typeId: bigint; amount: number;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::add_liquidity`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            tx.object(params.adminCapId),
            shared(tx, ctx.ssuId, ctx.ssuIsv, true),
            shared(tx, ctx.characterId, ctx.characterIsv, false),
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

/** Swap: input from main→open, output from open→main */
export function buildSwapTx(pool: PoolContext, ctx: SsuContext, params: {
    typeIdIn: bigint; amountIn: bigint; minOut: bigint;
}): Transaction {
    const tx = new Transaction();
    const pkg = getAmmPackageId();
    tx.moveCall({
        target: `${pkg}::${MODULES.AMM}::swap`,
        arguments: [
            shared(tx, pool.poolId, pool.poolIsv, true),
            shared(tx, ctx.ssuId, ctx.ssuIsv, true),
            shared(tx, ctx.characterId, ctx.characterIsv, false),
            tx.pure.u64(params.typeIdIn),
            tx.pure.u64(params.amountIn),
            tx.pure.u64(params.minOut),
        ],
    });
    return tx;
}
