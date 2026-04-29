/**
 * Composition layer over the generated `amm.move` bindings.
 *
 * The generated module (`./generated/amm_extension/amm`) exposes a builder
 * per Move entry — one PTB call each. Most AMM workflows need multiple calls
 * in one transaction (e.g. a swap is `deposit_for_swap` → `swap` →
 * `withdraw_from_swap`), so this file provides typed compound builders that
 * the dapp and CLI scripts share.
 *
 * Each builder is a pure function `(args) => Transaction`. No signing, no
 * execution, no client. Callers wire up signing via `executeTx`
 * (CLI scripts) or dapp-kit (frontend).
 *
 * Reference: https://docs.sui.io/concepts/transactions/prog-txn-blocks
 */
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction, type TransactionArgument } from "@mysten/sui/transactions";

import * as amm from "./generated/amm_extension/amm";
import * as character from "./generated/world/character";
import * as storage_unit from "./generated/world/storage_unit";

// === Public types ===

/**
 * On-chain identifiers needed to call into the AMM.
 *
 * `current` is used as the `package` argument on every function call —
 * after a contract upgrade, this points at the latest deployed package.
 *
 * `original` is the *original* package address; it stays stable across
 * upgrades and pins type tags like `AMMAuth`. Authorizing a different
 * `AMMAuth` (different `original`) on an SSU is a different authorization
 * — the chain treats them as distinct types.
 *
 * Reference:
 * https://docs.sui.io/concepts/sui-move-concepts/packages/upgrade#package-id-and-original-id
 */
export interface AmmPackageIds {
    /** Package address used for `tx.moveCall` invocations. */
    current: string;
    /** Original package address used for the `AMMAuth` type tag. */
    original: string;
}

/** Shared-object refs needed for SSU-touching operations. */
export interface SsuContext {
    ssuId: string;
    ssuIsv: number;
    characterId: string;
    characterIsv: number;
}

/** Shared-object ref for a pool. */
export interface PoolContext {
    poolId: string;
    poolIsv: number;
}

// === Helpers ===

/**
 * Build a shared-object ref. Providing `initialSharedVersion` up front lets
 * the consensus layer schedule the tx without an RPC roundtrip — measurably
 * faster than `tx.object(id)` for shared objects whose version is known.
 */
export function sharedRef(
    tx: Transaction,
    objectId: string,
    initialSharedVersion: number,
    mutable: boolean
): TransactionArgument {
    return tx.sharedObjectRef({ objectId, initialSharedVersion, mutable });
}

const STORAGE_UNIT_TYPE = (worldPackageId: string) =>
    `${worldPackageId}::storage_unit::StorageUnit`;

const AMM_AUTH_TYPE = (originalAmmPackageId: string) => `${originalAmmPackageId}::amm::AMMAuth`;

// === Compound PTB builders ===

/**
 * Append the 3-call sequence that authorizes `AMMAuth` on an SSU:
 *   borrow_owner_cap → authorize_extension → return_owner_cap
 *
 * The world's `Character::borrow_owner_cap` consumes a per-cap "ticket"
 * object, hands back a borrowed cap, and requires the cap to be returned
 * within the same PTB. We satisfy that by calling `return_owner_cap` at
 * the end. The middle call is the actual authorization.
 *
 * Mutates `tx` and returns nothing.
 */
export function appendAuthorizeFragment(
    tx: Transaction,
    args: {
        characterRef: TransactionArgument;
        ssuRef: TransactionArgument;
        ownerCapTicketId: string;
        worldPackageId: string;
        ammPackageIds: AmmPackageIds;
    }
): void {
    const ssuType = STORAGE_UNIT_TYPE(args.worldPackageId);
    const authType = AMM_AUTH_TYPE(args.ammPackageIds.original);

    const [cap, receipt] = tx.add(
        character.borrowOwnerCap({
            package: args.worldPackageId,
            arguments: {
                character: args.characterRef,
                ownerCapTicket: tx.object(args.ownerCapTicketId),
            },
            typeArguments: [ssuType],
        })
    );

    tx.add(
        storage_unit.authorizeExtension({
            package: args.worldPackageId,
            arguments: { storageUnit: args.ssuRef, ownerCap: cap },
            typeArguments: [authType],
        })
    );

    tx.add(
        character.returnOwnerCap({
            package: args.worldPackageId,
            arguments: { character: args.characterRef, ownerCap: cap, receipt },
            typeArguments: [ssuType],
        })
    );
}

/**
 * Standalone authorize: only calls the 3-call fragment. Used by the
 * one-time SSU setup before any pool exists.
 */
export function buildAuthorizeTx(args: {
    ssu: SsuContext;
    ownerCapTicketId: string;
    worldPackageId: string;
    ammPackageIds: AmmPackageIds;
}): Transaction {
    const tx = new Transaction();
    const characterRef = sharedRef(tx, args.ssu.characterId, args.ssu.characterIsv, true);
    const ssuRef = sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, true);
    appendAuthorizeFragment(tx, {
        characterRef,
        ssuRef,
        ownerCapTicketId: args.ownerCapTicketId,
        worldPackageId: args.worldPackageId,
        ammPackageIds: args.ammPackageIds,
    });
    return tx;
}

/**
 * Authorize + create_pool in a single PTB. The pool's `AMMAdminCap` is
 * transferred to `sender` so the operator picks it up immediately.
 */
export function buildAuthorizeAndCreatePoolTx(args: {
    ssu: SsuContext;
    ownerCapTicketId: string;
    worldPackageId: string;
    ammPackageIds: AmmPackageIds;
    pool: {
        typeIdA: bigint;
        typeIdB: bigint;
        reserveA: bigint;
        reserveB: bigint;
        amp: bigint;
        feeBps: bigint;
        banner: string;
    };
    sender: string;
}): Transaction {
    const tx = new Transaction();
    const ssuRef = sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, true);
    const characterRef = sharedRef(tx, args.ssu.characterId, args.ssu.characterIsv, true);

    appendAuthorizeFragment(tx, {
        characterRef,
        ssuRef,
        ownerCapTicketId: args.ownerCapTicketId,
        worldPackageId: args.worldPackageId,
        ammPackageIds: args.ammPackageIds,
    });

    const adminCap = tx.add(
        amm.createPool({
            package: args.ammPackageIds.current,
            arguments: {
                storageUnit: ssuRef,
                typeIdA: args.pool.typeIdA,
                typeIdB: args.pool.typeIdB,
                reserveA: args.pool.reserveA,
                reserveB: args.pool.reserveB,
                amp: args.pool.amp,
                feeBps: args.pool.feeBps,
                banner: args.pool.banner,
            },
        })
    );
    tx.transferObjects([adminCap], tx.pure.address(args.sender));
    return tx;
}

/**
 * Standalone create_pool. Used when the SSU is already authorized.
 */
export function buildCreatePoolTx(args: {
    ssu: SsuContext;
    ammPackageIds: AmmPackageIds;
    pool: {
        typeIdA: bigint;
        typeIdB: bigint;
        reserveA: bigint;
        reserveB: bigint;
        amp: bigint;
        feeBps: bigint;
        banner: string;
    };
    sender: string;
}): Transaction {
    const tx = new Transaction();
    const adminCap = tx.add(
        amm.createPool({
            package: args.ammPackageIds.current,
            arguments: {
                storageUnit: sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, false),
                typeIdA: args.pool.typeIdA,
                typeIdB: args.pool.typeIdB,
                reserveA: args.pool.reserveA,
                reserveB: args.pool.reserveB,
                amp: args.pool.amp,
                feeBps: args.pool.feeBps,
                banner: args.pool.banner,
            },
        })
    );
    tx.transferObjects([adminCap], tx.pure.address(args.sender));
    return tx;
}

/**
 * Seed both tokens + initialize fee config in a single PTB. Run immediately
 * after `create_pool`. The `set_reserves` between the two `add_liquidity`
 * calls and `init_fee_config` is intentional: `create_pool` already set
 * reserves to the seed amounts, and each `add_liquidity` increments them —
 * resetting collapses the double-count. Always uses `current` since this
 * runs on a freshly created pool.
 */
export function buildSeedAndInitFeeTx(args: {
    pool: PoolContext;
    ssu: SsuContext;
    adminCapId: string;
    ammPackageIds: AmmPackageIds;
    seed: {
        typeIdA: bigint;
        amountA: number;
        typeIdB: bigint;
        amountB: number;
        surgeBps: bigint;
        bonusBps: bigint;
    };
}): Transaction {
    const tx = new Transaction();
    const pkg = args.ammPackageIds.current;
    const poolRef = sharedRef(tx, args.pool.poolId, args.pool.poolIsv, true);
    const ssuRef = sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, true);
    const characterRef = sharedRef(tx, args.ssu.characterId, args.ssu.characterIsv, false);
    const adminCap = tx.object(args.adminCapId);

    tx.add(
        amm.addLiquidity({
            package: pkg,
            arguments: {
                pool: poolRef,
                adminCap,
                storageUnit: ssuRef,
                character: characterRef,
                typeId: args.seed.typeIdA,
                amount: args.seed.amountA,
            },
        })
    );
    tx.add(
        amm.addLiquidity({
            package: pkg,
            arguments: {
                pool: poolRef,
                adminCap,
                storageUnit: ssuRef,
                character: characterRef,
                typeId: args.seed.typeIdB,
                amount: args.seed.amountB,
            },
        })
    );
    tx.add(
        amm.setReserves({
            package: pkg,
            arguments: {
                pool: poolRef,
                adminCap,
                reserveA: BigInt(args.seed.amountA),
                reserveB: BigInt(args.seed.amountB),
            },
        })
    );
    tx.add(
        amm.initFeeConfig({
            package: pkg,
            arguments: {
                pool: poolRef,
                adminCap,
                surgeBps: args.seed.surgeBps,
                bonusBps: args.seed.bonusBps,
            },
        })
    );
    return tx;
}

/**
 * Authorize + add_liquidity in one PTB. `appendAuthorizeFragment` is
 * idempotent on the SSU side — if the SSU is already authorized for this
 * AMMAuth type the call still succeeds (the world's authorize is a set
 * operation, not an insert).
 */
export function buildSeedTx(args: {
    pool: PoolContext;
    ssu: SsuContext;
    adminCapId: string;
    ownerCapTicketId: string;
    typeId: bigint;
    amount: number;
    worldPackageId: string;
    ammPackageIds: AmmPackageIds;
}): Transaction {
    const tx = new Transaction();
    const ssuRef = sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, true);
    // Mutable for borrow_owner_cap; add_liquidity accepts `&Character` but
    // a `&mut Character` reference is a superset of `&Character`.
    const characterRef = sharedRef(tx, args.ssu.characterId, args.ssu.characterIsv, true);

    appendAuthorizeFragment(tx, {
        characterRef,
        ssuRef,
        ownerCapTicketId: args.ownerCapTicketId,
        worldPackageId: args.worldPackageId,
        ammPackageIds: args.ammPackageIds,
    });

    tx.add(
        amm.addLiquidity({
            package: args.ammPackageIds.current,
            arguments: {
                pool: sharedRef(tx, args.pool.poolId, args.pool.poolIsv, true),
                adminCap: tx.object(args.adminCapId),
                storageUnit: ssuRef,
                character: characterRef,
                typeId: args.typeId,
                amount: args.amount,
            },
        })
    );
    return tx;
}

/**
 * Swap in three calls: deposit_for_swap → swap → withdraw_from_swap.
 *
 * The split is intentional: `deposit_for_swap` locks the input items into
 * the SSU's open inventory under the trader's per-player deposit balance,
 * `swap` is pure accounting (no item movement), and `withdraw_from_swap`
 * pulls the output back to the trader. Splitting prevents another player
 * from front-running the inventory transfer between deposit and swap.
 */
export function buildSwapTx(args: {
    pool: PoolContext;
    ssu: SsuContext;
    ammPackageIds: AmmPackageIds;
    swap: {
        typeIdIn: bigint;
        amountIn: bigint;
        minOut: bigint;
        typeIdOut: bigint;
        totalOutput: bigint;
    };
}): Transaction {
    const tx = new Transaction();
    const pkg = args.ammPackageIds.current;
    const poolRef = sharedRef(tx, args.pool.poolId, args.pool.poolIsv, true);
    const ssuRef = sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, true);
    const characterRef = sharedRef(tx, args.ssu.characterId, args.ssu.characterIsv, false);

    tx.add(
        amm.depositForSwap({
            package: pkg,
            arguments: {
                pool: poolRef,
                storageUnit: ssuRef,
                character: characterRef,
                typeId: args.swap.typeIdIn,
                amount: args.swap.amountIn,
            },
        })
    );
    tx.add(
        amm.swap({
            package: pkg,
            arguments: {
                pool: poolRef,
                typeIdIn: args.swap.typeIdIn,
                amountIn: args.swap.amountIn,
                minOut: args.swap.minOut,
            },
        })
    );
    tx.add(
        amm.withdrawFromSwap({
            package: pkg,
            arguments: {
                pool: poolRef,
                storageUnit: ssuRef,
                character: characterRef,
                typeId: args.swap.typeIdOut,
                amount: args.swap.totalOutput,
            },
        })
    );
    return tx;
}

/**
 * Run a swap quote via `devInspectTransactionBlock` — no signature, no gas,
 * no state mutation. Returns the same `SwapQuote` struct the on-chain
 * `swap` would compute, decoded from BCS via the generated `MoveStruct`.
 *
 * Use this in place of any client-side reimplementation of the AMM math —
 * the dapp's swap preview, fee/bonus indicators, and price-impact display
 * should all flow through here so they stay in lockstep with the contract.
 *
 * Aborts on the same conditions as `swap` (`EInvalidTypeId`, `EZeroAmount`,
 * `EInsufficientLiquidity` if `amount_in` is too large for current
 * reserves). On abort, the underlying `devInspect` returns a non-success
 * effects status and this function throws with the parsed Move abort.
 *
 * Reference:
 * https://docs.sui.io/sui-api-ref#sui_devInspectTransactionBlock
 */
export async function quoteSwap(
    client: SuiJsonRpcClient,
    args: {
        pool: PoolContext;
        ammPackageIds: AmmPackageIds;
        typeIdIn: bigint;
        amountIn: bigint;
        /** Sender address used for `devInspect`. Any valid address works —
         *  no signature, no gas — so an admin/operator address is fine. */
        sender: string;
    }
): Promise<{
    amountOut: bigint;
    feeAmount: bigint;
    feeBps: bigint;
    bonusAmount: bigint;
    priceImpactBps: bigint;
}> {
    const tx = new Transaction();
    tx.add(
        amm.quote({
            package: args.ammPackageIds.current,
            arguments: {
                pool: sharedRef(tx, args.pool.poolId, args.pool.poolIsv, false),
                typeIdIn: args.typeIdIn,
                amountIn: args.amountIn,
            },
        })
    );

    const result = await client.devInspectTransactionBlock({
        sender: args.sender,
        transactionBlock: tx,
    });

    if (result.effects.status.status !== "success") {
        throw new Error(`quoteSwap failed: ${result.effects.status.error ?? "unknown"}`);
    }

    const returnValues = result.results?.[0]?.returnValues;
    if (!returnValues || returnValues.length === 0) {
        throw new Error("quoteSwap: devInspect returned no values");
    }
    // returnValues[0] is [bytes, type] for the first return value.
    const [bytes] = returnValues[0];
    const decoded = amm.SwapQuote.parse(new Uint8Array(bytes));
    return {
        amountOut: BigInt(decoded.amount_out),
        feeAmount: BigInt(decoded.fee_amount),
        feeBps: BigInt(decoded.fee_bps),
        bonusAmount: BigInt(decoded.bonus_amount),
        priceImpactBps: BigInt(decoded.price_impact_bps),
    };
}

/**
 * Rescue one or more item types from open inventory back to the SSU
 * owner inventory. Used for draining stranded items from old pools after
 * a contract upgrade. Always uses `current` package — `rescue_items` is
 * a recovery entry that may not exist in older deployments.
 */
export function buildRescueItemsTx(args: {
    pool: PoolContext;
    ssu: SsuContext;
    adminCapId: string;
    items: ReadonlyArray<{ typeId: bigint; amount: number }>;
    ammPackageIds: AmmPackageIds;
}): Transaction {
    const tx = new Transaction();
    const pkg = args.ammPackageIds.current;
    const poolRef = sharedRef(tx, args.pool.poolId, args.pool.poolIsv, false);
    const ssuRef = sharedRef(tx, args.ssu.ssuId, args.ssu.ssuIsv, true);
    const characterRef = sharedRef(tx, args.ssu.characterId, args.ssu.characterIsv, false);
    const adminCap = tx.object(args.adminCapId);

    for (const item of args.items) {
        tx.add(
            amm.rescueItems({
                package: pkg,
                arguments: {
                    pool: poolRef,
                    adminCap,
                    storageUnit: ssuRef,
                    character: characterRef,
                    typeId: item.typeId,
                    amount: item.amount,
                },
            })
        );
    }
    return tx;
}
