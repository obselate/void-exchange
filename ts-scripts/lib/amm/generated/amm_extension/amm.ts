/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * AMM extension for EVE Frontier SSU with dynamic fees and rebalance bonuses.
 * 
 * Liquidity lives in the SSU's open inventory (extension-locked). Main inventory
 * is the player-facing airlock (game UI deposits/withdrawals).
 * 
 * Dynamic fee system:
 * 
 * - Worsening trades pay base_fee + surge (proportional to imbalance)
 * - Rebalancing trades pay base_fee only and receive a bonus from accumulated fees
 * - Bonuses are capped at the fee_pool — house always wins
 * 
 * Inventory invariant (per side `s`): physical_open_s == reserve_s + fee_pool_s +
 * Σ player_deposit_s Held across the full swap PTB (`deposit_for_swap` → `swap` →
 * `withdraw_from_swap`). See `docs/amm-invariants.md` for the full audit and the
 * proof trace.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
const $moduleName = '@local-pkg/amm-extension::amm';
export const AMMAuth = new MoveStruct({ name: `${$moduleName}::AMMAuth`, fields: {
        dummy_field: bcs.bool()
    } });
export const ConfigKey = new MoveStruct({ name: `${$moduleName}::ConfigKey`, fields: {
        dummy_field: bcs.bool()
    } });
export const FeeConfigKey = new MoveStruct({ name: `${$moduleName}::FeeConfigKey`, fields: {
        dummy_field: bcs.bool()
    } });
export const DepositKey = new MoveStruct({ name: `${$moduleName}::DepositKey`, fields: {
        trader: bcs.Address
    } });
export const AMMPool = new MoveStruct({ name: `${$moduleName}::AMMPool`, fields: {
        id: bcs.Address,
        ssu_id: bcs.Address
    } });
export const AMMAdminCap = new MoveStruct({ name: `${$moduleName}::AMMAdminCap`, fields: {
        id: bcs.Address,
        pool_id: bcs.Address
    } });
export const Config = new MoveStruct({ name: `${$moduleName}::Config`, fields: {
        type_id_a: bcs.u64(),
        type_id_b: bcs.u64(),
        reserve_a: bcs.u64(),
        reserve_b: bcs.u64(),
        target_a: bcs.u64(),
        target_b: bcs.u64(),
        amp: bcs.u64(),
        fee_bps: bcs.u64(),
        banner: bcs.string(),
        owner: bcs.Address,
        /**
         * Pause halts new flow (`swap`, `deposit_for_swap`); admin operations and
         * stuck-deposit drains (`withdraw_from_swap`) are unaffected.
         */
        paused: bcs.bool()
    } });
export const FeeConfig = new MoveStruct({ name: `${$moduleName}::FeeConfig`, fields: {
        surge_bps: bcs.u64(),
        bonus_bps: bcs.u64(),
        fee_pool_a: bcs.u64(),
        fee_pool_b: bcs.u64()
    } });
export const PlayerDeposit = new MoveStruct({ name: `${$moduleName}::PlayerDeposit`, fields: {
        balance_a: bcs.u64(),
        balance_b: bcs.u64()
    } });
export const SwapWithBonusEvent = new MoveStruct({ name: `${$moduleName}::SwapWithBonusEvent`, fields: {
        pool_id: bcs.Address,
        trader: bcs.Address,
        type_id_in: bcs.u64(),
        type_id_out: bcs.u64(),
        amount_in: bcs.u64(),
        amount_out: bcs.u64(),
        fee: bcs.u64(),
        bonus: bcs.u64()
    } });
export const SwapQuote = new MoveStruct({ name: `${$moduleName}::SwapQuote`, fields: {
        amount_out: bcs.u64(),
        fee_amount: bcs.u64(),
        fee_bps: bcs.u64(),
        bonus_amount: bcs.u64(),
        price_impact_bps: bcs.u64()
    } });
export const PairKey = new MoveStruct({ name: `${$moduleName}::PairKey`, fields: {
        lo: bcs.u64(),
        hi: bcs.u64()
    } });
export const ActiveKey = new MoveStruct({ name: `${$moduleName}::ActiveKey`, fields: {
        pair: PairKey,
        ssu: bcs.Address
    } });
export const PoolMeta = new MoveStruct({ name: `${$moduleName}::PoolMeta`, fields: {
        pool_id: bcs.Address,
        ssu_id: bcs.Address,
        pair: PairKey,
        amp: bcs.u64(),
        banner: bcs.string(),
        paused: bcs.bool(),
        delisted: bcs.bool(),
        /**
         * `tx_context::epoch_timestamp_ms` at registration. Stable across upgrades; used
         * by clients for sort/filter.
         */
        created_at_ms: bcs.u64()
    } });
export const AMMRegistry = new MoveStruct({ name: `${$moduleName}::AMMRegistry`, fields: {
        id: bcs.Address,
        /**
         * All pools that trade a given pair. `vector<ID>` so a single (pair) read returns
         * every venue across SSUs.
         */
        by_pair: table.Table,
        /** All pools hosted at a given SSU. */
        by_ssu: table.Table,
        /** Source-of-truth row per pool. */
        meta: table.Table,
        /** Uniqueness index for active (non-delisted) pools. */
        active_at: table.Table
    } });
export const PoolRegistered = new MoveStruct({ name: `${$moduleName}::PoolRegistered`, fields: {
        pool_id: bcs.Address,
        ssu_id: bcs.Address,
        pair: PairKey,
        amp: bcs.u64()
    } });
export const PoolDelisted = new MoveStruct({ name: `${$moduleName}::PoolDelisted`, fields: {
        pool_id: bcs.Address,
        pair: PairKey,
        ssu_id: bcs.Address
    } });
export const PoolRelisted = new MoveStruct({ name: `${$moduleName}::PoolRelisted`, fields: {
        pool_id: bcs.Address,
        pair: PairKey,
        ssu_id: bcs.Address
    } });
export const PoolPaused = new MoveStruct({ name: `${$moduleName}::PoolPaused`, fields: {
        pool_id: bcs.Address
    } });
export const PoolUnpaused = new MoveStruct({ name: `${$moduleName}::PoolUnpaused`, fields: {
        pool_id: bcs.Address
    } });
export interface MakePairArguments {
    a: RawTransactionArgument<number | bigint>;
    b: RawTransactionArgument<number | bigint>;
}
export interface MakePairOptions {
    package?: string;
    arguments: MakePairArguments | [
        a: RawTransactionArgument<number | bigint>,
        b: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Construct a canonical `PairKey`. Sorts `(a, b)` so the resulting key is
 * direction-independent.
 */
export function makePair(options: MakePairOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["a", "b"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'make_pair',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DepositForSwapArguments {
    pool: RawTransactionArgument<string>;
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    amount: RawTransactionArgument<number | bigint>;
}
export interface DepositForSwapOptions {
    package?: string;
    arguments: DepositForSwapArguments | [
        pool: RawTransactionArgument<string>,
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        amount: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Deposit items for swap: moves items from SSU owner inventory → open inventory
 * and credits the sender's per-player deposit balance on this pool. The player
 * must have deposited items into the SSU via the game UI first.
 */
export function depositForSwap(options: DepositForSwapOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "storageUnit", "character", "typeId", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'deposit_for_swap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface WithdrawFromSwapArguments {
    pool: RawTransactionArgument<string>;
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    amount: RawTransactionArgument<number | bigint>;
}
export interface WithdrawFromSwapOptions {
    package?: string;
    arguments: WithdrawFromSwapArguments | [
        pool: RawTransactionArgument<string>,
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        amount: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Withdraw items from swap: moves items from open inventory → SSU owner inventory
 * and debits the sender's per-player deposit balance. Use to reclaim unswapped
 * input or collect swap output.
 */
export function withdrawFromSwap(options: WithdrawFromSwapOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "storageUnit", "character", "typeId", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'withdraw_from_swap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PlayerDepositArguments {
    pool: RawTransactionArgument<string>;
    trader: RawTransactionArgument<string>;
}
export interface PlayerDepositOptions {
    package?: string;
    arguments: PlayerDepositArguments | [
        pool: RawTransactionArgument<string>,
        trader: RawTransactionArgument<string>
    ];
}
/** View a player's deposit balance on this pool. */
export function playerDeposit(options: PlayerDepositOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "trader"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'player_deposit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreatePoolArguments {
    registry: RawTransactionArgument<string>;
    storageUnit: RawTransactionArgument<string>;
    typeIdA: RawTransactionArgument<number | bigint>;
    typeIdB: RawTransactionArgument<number | bigint>;
    reserveA: RawTransactionArgument<number | bigint>;
    reserveB: RawTransactionArgument<number | bigint>;
    amp: RawTransactionArgument<number | bigint>;
    feeBps: RawTransactionArgument<number | bigint>;
    banner: RawTransactionArgument<string>;
}
export interface CreatePoolOptions {
    package?: string;
    arguments: CreatePoolArguments | [
        registry: RawTransactionArgument<string>,
        storageUnit: RawTransactionArgument<string>,
        typeIdA: RawTransactionArgument<number | bigint>,
        typeIdB: RawTransactionArgument<number | bigint>,
        reserveA: RawTransactionArgument<number | bigint>,
        reserveB: RawTransactionArgument<number | bigint>,
        amp: RawTransactionArgument<number | bigint>,
        feeBps: RawTransactionArgument<number | bigint>,
        banner: RawTransactionArgument<string>
    ];
}
/**
 * Create pool and register it. Liquidity must already be in the SSU open
 * inventory. Aborts with `EPoolAlreadyRegistered` if an active pool already exists
 * for `(make_pair(type_id_a, type_id_b), ssu)` — delisting the existing pool first
 * frees the slot for redeployment (see `delist_pool`).
 */
export function createPool(options: CreatePoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64',
        'u64',
        'u64',
        'u64',
        'u64',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "storageUnit", "typeIdA", "typeIdB", "reserveA", "reserveB", "amp", "feeBps", "banner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'create_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PausePoolArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface PausePoolOptions {
    package?: string;
    arguments: PausePoolArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
}
/**
 * Pause `swap` and `deposit_for_swap` for this pool. Admin operations,
 * `withdraw_from_swap`, and stuck-deposit drains continue to work.
 */
export function pausePool(options: PausePoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "registry", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'pause_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnpausePoolArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface UnpausePoolOptions {
    package?: string;
    arguments: UnpausePoolArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
}
/** Resume `swap` and `deposit_for_swap`. */
export function unpausePool(options: UnpausePoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "registry", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'unpause_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DelistPoolArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface DelistPoolOptions {
    package?: string;
    arguments: DelistPoolArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
}
/**
 * Delist the pool from the active-uniqueness index. The pool object, `by_pair`,
 * and `by_ssu` entries remain so traders with stuck deposits can still locate and
 * drain them. Frees the `(pair, ssu)` slot for a fresh deployment.
 */
export function delistPool(options: DelistPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "registry", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'delist_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RelistPoolArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface RelistPoolOptions {
    package?: string;
    arguments: RelistPoolArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
}
/**
 * Re-add a delisted pool to the active-uniqueness index. Aborts if a different
 * pool now occupies the `(pair, ssu)` slot.
 */
export function relistPool(options: RelistPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "registry", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'relist_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PoolsByPairArguments {
    registry: RawTransactionArgument<string>;
    pair: TransactionArgument;
}
export interface PoolsByPairOptions {
    package?: string;
    arguments: PoolsByPairArguments | [
        registry: RawTransactionArgument<string>,
        pair: TransactionArgument
    ];
}
export function poolsByPair(options: PoolsByPairOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "pair"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'pools_by_pair',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PoolsBySsuArguments {
    registry: RawTransactionArgument<string>;
    ssuId: RawTransactionArgument<string>;
}
export interface PoolsBySsuOptions {
    package?: string;
    arguments: PoolsBySsuArguments | [
        registry: RawTransactionArgument<string>,
        ssuId: RawTransactionArgument<string>
    ];
}
export function poolsBySsu(options: PoolsBySsuOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "ssuId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'pools_by_ssu',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PoolMetaArguments {
    registry: RawTransactionArgument<string>;
    poolId: RawTransactionArgument<string>;
}
export interface PoolMetaOptions {
    package?: string;
    arguments: PoolMetaArguments | [
        registry: RawTransactionArgument<string>,
        poolId: RawTransactionArgument<string>
    ];
}
export function poolMeta(options: PoolMetaOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "poolId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'pool_meta',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ActivePoolForArguments {
    registry: RawTransactionArgument<string>;
    pair: TransactionArgument;
    ssuId: RawTransactionArgument<string>;
}
export interface ActivePoolForOptions {
    package?: string;
    arguments: ActivePoolForArguments | [
        registry: RawTransactionArgument<string>,
        pair: TransactionArgument,
        ssuId: RawTransactionArgument<string>
    ];
}
export function activePoolFor(options: ActivePoolForOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "pair", "ssuId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'active_pool_for',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PairLoArguments {
    p: TransactionArgument;
}
export interface PairLoOptions {
    package?: string;
    arguments: PairLoArguments | [
        p: TransactionArgument
    ];
}
export function pairLo(options: PairLoOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["p"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'pair_lo',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PairHiArguments {
    p: TransactionArgument;
}
export interface PairHiOptions {
    package?: string;
    arguments: PairHiArguments | [
        p: TransactionArgument
    ];
}
export function pairHi(options: PairHiOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["p"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'pair_hi',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaPoolIdArguments {
    m: TransactionArgument;
}
export interface MetaPoolIdOptions {
    package?: string;
    arguments: MetaPoolIdArguments | [
        m: TransactionArgument
    ];
}
export function metaPoolId(options: MetaPoolIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_pool_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaSsuIdArguments {
    m: TransactionArgument;
}
export interface MetaSsuIdOptions {
    package?: string;
    arguments: MetaSsuIdArguments | [
        m: TransactionArgument
    ];
}
export function metaSsuId(options: MetaSsuIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_ssu_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaPairArguments {
    m: TransactionArgument;
}
export interface MetaPairOptions {
    package?: string;
    arguments: MetaPairArguments | [
        m: TransactionArgument
    ];
}
export function metaPair(options: MetaPairOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_pair',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaAmpArguments {
    m: TransactionArgument;
}
export interface MetaAmpOptions {
    package?: string;
    arguments: MetaAmpArguments | [
        m: TransactionArgument
    ];
}
export function metaAmp(options: MetaAmpOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_amp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaBannerArguments {
    m: TransactionArgument;
}
export interface MetaBannerOptions {
    package?: string;
    arguments: MetaBannerArguments | [
        m: TransactionArgument
    ];
}
export function metaBanner(options: MetaBannerOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_banner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaPausedArguments {
    m: TransactionArgument;
}
export interface MetaPausedOptions {
    package?: string;
    arguments: MetaPausedArguments | [
        m: TransactionArgument
    ];
}
export function metaPaused(options: MetaPausedOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaDelistedArguments {
    m: TransactionArgument;
}
export interface MetaDelistedOptions {
    package?: string;
    arguments: MetaDelistedArguments | [
        m: TransactionArgument
    ];
}
export function metaDelisted(options: MetaDelistedOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_delisted',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MetaCreatedAtMsArguments {
    m: TransactionArgument;
}
export interface MetaCreatedAtMsOptions {
    package?: string;
    arguments: MetaCreatedAtMsArguments | [
        m: TransactionArgument
    ];
}
export function metaCreatedAtMs(options: MetaCreatedAtMsOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["m"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'meta_created_at_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface InitFeeConfigArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    surgeBps: RawTransactionArgument<number | bigint>;
    bonusBps: RawTransactionArgument<number | bigint>;
}
export interface InitFeeConfigOptions {
    package?: string;
    arguments: InitFeeConfigArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        surgeBps: RawTransactionArgument<number | bigint>,
        bonusBps: RawTransactionArgument<number | bigint>
    ];
}
/** Initialize dynamic fee config. Call once after pool creation. */
export function initFeeConfig(options: InitFeeConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "surgeBps", "bonusBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'init_fee_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateFeeConfigArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    surgeBps: RawTransactionArgument<number | bigint>;
    bonusBps: RawTransactionArgument<number | bigint>;
}
export interface UpdateFeeConfigOptions {
    package?: string;
    arguments: UpdateFeeConfigArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        surgeBps: RawTransactionArgument<number | bigint>,
        bonusBps: RawTransactionArgument<number | bigint>
    ];
}
/** Update dynamic fee parameters. */
export function updateFeeConfig(options: UpdateFeeConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "surgeBps", "bonusBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'update_fee_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateFeeBpsArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    feeBps: RawTransactionArgument<number | bigint>;
}
export interface UpdateFeeBpsOptions {
    package?: string;
    arguments: UpdateFeeBpsArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        feeBps: RawTransactionArgument<number | bigint>
    ];
}
/** Update base trade fee. */
export function updateFeeBps(options: UpdateFeeBpsOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "feeBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'update_fee_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateTargetRatioArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    targetA: RawTransactionArgument<number | bigint>;
    targetB: RawTransactionArgument<number | bigint>;
}
export interface UpdateTargetRatioOptions {
    package?: string;
    arguments: UpdateTargetRatioArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        targetA: RawTransactionArgument<number | bigint>,
        targetB: RawTransactionArgument<number | bigint>
    ];
}
/** Update target ratio (the intended reserve balance for dynamic fee calculations). */
export function updateTargetRatio(options: UpdateTargetRatioOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "targetA", "targetB"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'update_target_ratio',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuoteArguments {
    pool: RawTransactionArgument<string>;
    typeIdIn: RawTransactionArgument<number | bigint>;
    amountIn: RawTransactionArgument<number | bigint>;
}
export interface QuoteOptions {
    package?: string;
    arguments: QuoteArguments | [
        pool: RawTransactionArgument<string>,
        typeIdIn: RawTransactionArgument<number | bigint>,
        amountIn: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Read-only swap preview. Runs the same math as `swap` without mutating the pool.
 * Aborts on identical conditions (`EInvalidTypeId`, `EZeroAmount`,
 * `EInsufficientLiquidity`). Designed for `devInspectTransactionBlock` so the dapp
 * can render a quote without a wallet signature. See
 * [Sui RPC `dev_inspect`](https://docs.sui.io/sui-api-ref#sui_devInspectTransactionBlock).
 */
export function quote(options: QuoteOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "typeIdIn", "amountIn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'quote',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuoteAmountOutArguments {
    q: TransactionArgument;
}
export interface QuoteAmountOutOptions {
    package?: string;
    arguments: QuoteAmountOutArguments | [
        q: TransactionArgument
    ];
}
export function quoteAmountOut(options: QuoteAmountOutOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["q"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'quote_amount_out',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuoteFeeAmountArguments {
    q: TransactionArgument;
}
export interface QuoteFeeAmountOptions {
    package?: string;
    arguments: QuoteFeeAmountArguments | [
        q: TransactionArgument
    ];
}
export function quoteFeeAmount(options: QuoteFeeAmountOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["q"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'quote_fee_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuoteFeeBpsArguments {
    q: TransactionArgument;
}
export interface QuoteFeeBpsOptions {
    package?: string;
    arguments: QuoteFeeBpsArguments | [
        q: TransactionArgument
    ];
}
export function quoteFeeBps(options: QuoteFeeBpsOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["q"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'quote_fee_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuoteBonusAmountArguments {
    q: TransactionArgument;
}
export interface QuoteBonusAmountOptions {
    package?: string;
    arguments: QuoteBonusAmountArguments | [
        q: TransactionArgument
    ];
}
export function quoteBonusAmount(options: QuoteBonusAmountOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["q"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'quote_bonus_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuotePriceImpactBpsArguments {
    q: TransactionArgument;
}
export interface QuotePriceImpactBpsOptions {
    package?: string;
    arguments: QuotePriceImpactBpsArguments | [
        q: TransactionArgument
    ];
}
export function quotePriceImpactBps(options: QuotePriceImpactBpsOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["q"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'quote_price_impact_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SwapArguments {
    pool: RawTransactionArgument<string>;
    typeIdIn: RawTransactionArgument<number | bigint>;
    amountIn: RawTransactionArgument<number | bigint>;
    minOut: RawTransactionArgument<number | bigint>;
}
export interface SwapOptions {
    package?: string;
    arguments: SwapArguments | [
        pool: RawTransactionArgument<string>,
        typeIdIn: RawTransactionArgument<number | bigint>,
        amountIn: RawTransactionArgument<number | bigint>,
        minOut: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Swap with dynamic fees and rebalance bonuses. Items must already be deposited
 * via `deposit_for_swap`. Output is credited to the sender's deposit balance —
 * call `withdraw_from_swap` to collect.
 *
 * PTB flow: deposit_for_swap → swap → withdraw_from_swap (all in one tx).
 */
export function swap(options: SwapOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "typeIdIn", "amountIn", "minOut"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'swap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AddLiquidityArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    amount: RawTransactionArgument<number>;
}
export interface AddLiquidityOptions {
    package?: string;
    arguments: AddLiquidityArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        amount: RawTransactionArgument<number>
    ];
}
/**
 * Add liquidity: move items from main inventory into open inventory and update the
 * pool reserves. Owner calls this after depositing via game UI.
 */
export function addLiquidity(options: AddLiquidityOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'u64',
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "storageUnit", "character", "typeId", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'add_liquidity',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetReservesArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    reserveA: RawTransactionArgument<number | bigint>;
    reserveB: RawTransactionArgument<number | bigint>;
}
export interface SetReservesOptions {
    package?: string;
    arguments: SetReservesArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        reserveA: RawTransactionArgument<number | bigint>,
        reserveB: RawTransactionArgument<number | bigint>
    ];
}
/** Set reserves directly. Owner uses this to sync reserves with actual inventory. */
export function setReserves(options: SetReservesOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "reserveA", "reserveB"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'set_reserves',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface WithdrawFeesArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    amount: RawTransactionArgument<number | bigint>;
}
export interface WithdrawFeesOptions {
    package?: string;
    arguments: WithdrawFeesArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        amount: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Withdraw accumulated fees from open inventory → main (admin picks up via game
 * UI).
 */
export function withdrawFees(options: WithdrawFeesOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "storageUnit", "character", "typeId", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'withdraw_fees',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RescueItemsArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    amount: RawTransactionArgument<number>;
}
export interface RescueItemsOptions {
    package?: string;
    arguments: RescueItemsArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        amount: RawTransactionArgument<number>
    ];
}
/**
 * Rescue items from open inventory → main. Works without a pool reference, so it
 * can recover items stranded by an old/orphaned pool. Requires AMMAuth to be
 * authorized on the SSU for this package.
 */
export function rescueItems(options: RescueItemsOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'u64',
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "storageUnit", "character", "typeId", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'rescue_items',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RollFeesToReservesArguments {
    pool: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    amount: RawTransactionArgument<number | bigint>;
}
export interface RollFeesToReservesOptions {
    package?: string;
    arguments: RollFeesToReservesArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        amount: RawTransactionArgument<number | bigint>
    ];
}
/** Roll accumulated fees into reserves (deepens liquidity, no token movement). */
export function rollFeesToReserves(options: RollFeesToReservesOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "typeId", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'roll_fees_to_reserves',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateBannerArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
    newBanner: RawTransactionArgument<string>;
}
export interface UpdateBannerOptions {
    package?: string;
    arguments: UpdateBannerArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        newBanner: RawTransactionArgument<string>
    ];
}
/**
 * Update banner. Mirrors the change into the registry's `PoolMeta` so the dapp's
 * global market view stays consistent.
 */
export function updateBanner(options: UpdateBannerOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "registry", "adminCap", "newBanner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'update_banner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ReserveAArguments {
    pool: RawTransactionArgument<string>;
}
export interface ReserveAOptions {
    package?: string;
    arguments: ReserveAArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function reserveA(options: ReserveAOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'reserve_a',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ReserveBArguments {
    pool: RawTransactionArgument<string>;
}
export interface ReserveBOptions {
    package?: string;
    arguments: ReserveBArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function reserveB(options: ReserveBOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'reserve_b',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TargetAArguments {
    pool: RawTransactionArgument<string>;
}
export interface TargetAOptions {
    package?: string;
    arguments: TargetAArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function targetA(options: TargetAOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'target_a',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TargetBArguments {
    pool: RawTransactionArgument<string>;
}
export interface TargetBOptions {
    package?: string;
    arguments: TargetBArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function targetB(options: TargetBOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'target_b',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BannerArguments {
    pool: RawTransactionArgument<string>;
}
export interface BannerOptions {
    package?: string;
    arguments: BannerArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function banner(options: BannerOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'banner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface FeeBpsArguments {
    pool: RawTransactionArgument<string>;
}
export interface FeeBpsOptions {
    package?: string;
    arguments: FeeBpsArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function feeBps(options: FeeBpsOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'fee_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AmpArguments {
    pool: RawTransactionArgument<string>;
}
export interface AmpOptions {
    package?: string;
    arguments: AmpArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function amp(options: AmpOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'amp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SsuIdArguments {
    pool: RawTransactionArgument<string>;
}
export interface SsuIdOptions {
    package?: string;
    arguments: SsuIdArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function ssuId(options: SsuIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'ssu_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsPausedArguments {
    pool: RawTransactionArgument<string>;
}
export interface IsPausedOptions {
    package?: string;
    arguments: IsPausedArguments | [
        pool: RawTransactionArgument<string>
    ];
}
export function isPaused(options: IsPausedOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'is_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}