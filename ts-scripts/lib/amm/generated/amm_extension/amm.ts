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
        owner: bcs.Address
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
/** Create pool. Liquidity must already be in the SSU open inventory. */
export function createPool(options: CreatePoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        'u64',
        'u64',
        'u64',
        'u64',
        'u64',
        'u64',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "typeIdA", "typeIdB", "reserveA", "reserveB", "amp", "feeBps", "banner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'amm',
        function: 'create_pool',
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
    adminCap: RawTransactionArgument<string>;
    newBanner: RawTransactionArgument<string>;
}
export interface UpdateBannerOptions {
    package?: string;
    arguments: UpdateBannerArguments | [
        pool: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>,
        newBanner: RawTransactionArgument<string>
    ];
}
/** Update banner. */
export function updateBanner(options: UpdateBannerOptions) {
    const packageAddress = options.package ?? '@local-pkg/amm-extension';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["pool", "adminCap", "newBanner"];
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