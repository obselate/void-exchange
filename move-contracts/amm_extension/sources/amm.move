/// AMM extension for EVE Frontier SSU with dynamic fees and rebalance bonuses.
///
/// Liquidity lives in the SSU's open inventory (extension-locked).
/// Main inventory is the player-facing airlock (game UI deposits/withdrawals).
///
/// Dynamic fee system:
/// - Worsening trades pay base_fee + surge (proportional to imbalance)
/// - Rebalancing trades pay base_fee only and receive a bonus from accumulated fees
/// - Bonuses are capped at the fee_pool — house always wins
module amm_extension::amm;

use std::string::String;
use sui::dynamic_field as df;
use world::{character::Character, storage_unit::StorageUnit};

// === Constants ===
const BPS_DENOM: u64 = 10_000;
const N_COINS: u128 = 2;
const MAX_ITER: u64 = 64;

// === Errors ===
#[error(code = 0)]
const EZeroAmount: vector<u8> = b"Amount must be > 0";
#[error(code = 1)]
const EInsufficientOutput: vector<u8> = b"Output below minimum";
#[error(code = 2)]
const EInsufficientLiquidity: vector<u8> = b"Not enough liquidity";
#[error(code = 3)]
const ESSUMismatch: vector<u8> = b"Pool/SSU mismatch";
#[error(code = 4)]
const EInvalidAmp: vector<u8> = b"Amp must be >= 1";
#[error(code = 5)]
const EConvergenceFailed: vector<u8> = b"Math did not converge";
#[error(code = 6)]
const ENotOwner: vector<u8> = b"Not pool owner";
#[error(code = 7)]
const EFeeConfigExists: vector<u8> = b"Fee config already initialized";
#[error(code = 8)]
const EInvalidTypeId: vector<u8> = b"Token type not in this pool";
#[error(code = 9)]
const EInvalidFee: vector<u8> = b"Fee exceeds 100%";
#[error(code = 10)]
const EInsufficientDeposit: vector<u8> = b"Deposit balance too low";
#[error(code = 11)]
const ENoFeeConfig: vector<u8> = b"Fee config not initialized";

// === Structs ===
public struct AMMAuth has drop {}
public struct ConfigKey has copy, drop, store {}
public struct FeeConfigKey has copy, drop, store {}
public struct DepositKey has copy, drop, store { trader: address }

public struct AMMPool has key {
    id: UID,
    ssu_id: ID,
}

public struct AMMAdminCap has key, store {
    id: UID,
    pool_id: ID,
}

public struct Config has drop, store {
    type_id_a: u64,
    type_id_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    target_a: u64,
    target_b: u64,
    amp: u64,
    fee_bps: u64,
    banner: String,
    owner: address,
}

public struct FeeConfig has drop, store {
    surge_bps: u64, // max additional fee at full imbalance
    bonus_bps: u64, // max bonus rate at full imbalance
    fee_pool_a: u64, // accumulated fees in token A
    fee_pool_b: u64, // accumulated fees in token B
}

public struct PlayerDeposit has drop, store {
    balance_a: u64,
    balance_b: u64,
}

public struct SwapWithBonusEvent has copy, drop {
    pool_id: ID,
    trader: address,
    type_id_in: u64,
    type_id_out: u64,
    amount_in: u64,
    amount_out: u64,
    fee: u64,
    bonus: u64,
}

// === Public ===

/// Deposit items for swap: moves items from SSU owner inventory → open inventory
/// and credits the sender's per-player deposit balance on this pool.
/// The player must have deposited items into the SSU via the game UI first.
public fun deposit_for_swap(
    pool: &mut AMMPool,
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, EZeroAmount);
    assert!(pool.ssu_id == object::id(storage_unit), ESSUMismatch);

    let config = df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {});
    let is_a = type_id == config.type_id_a;
    assert!(is_a || type_id == config.type_id_b, EInvalidTypeId);

    // Move items: owner inventory → open inventory (locked in pool)
    let item = storage_unit.withdraw_item<AMMAuth>(
        character,
        AMMAuth {},
        type_id,
        (amount as u32),
        ctx,
    );
    storage_unit.deposit_to_open_inventory<AMMAuth>(
        character,
        item,
        AMMAuth {},
        ctx,
    );

    // Credit player's deposit balance
    let key = DepositKey { trader: ctx.sender() };
    if (!df::exists_(&pool.id, key)) {
        df::add(&mut pool.id, key, PlayerDeposit { balance_a: 0, balance_b: 0 });
    };
    let deposit = df::borrow_mut<DepositKey, PlayerDeposit>(&mut pool.id, key);
    if (is_a) {
        deposit.balance_a = deposit.balance_a + amount;
    } else {
        deposit.balance_b = deposit.balance_b + amount;
    };
}

/// Withdraw items from swap: moves items from open inventory → SSU owner inventory
/// and debits the sender's per-player deposit balance.
/// Use to reclaim unswapped input or collect swap output.
public fun withdraw_from_swap(
    pool: &mut AMMPool,
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, EZeroAmount);
    assert!(pool.ssu_id == object::id(storage_unit), ESSUMismatch);

    let config = df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {});
    let is_a = type_id == config.type_id_a;
    assert!(is_a || type_id == config.type_id_b, EInvalidTypeId);

    // Debit player's deposit balance
    let key = DepositKey { trader: ctx.sender() };
    let deposit = df::borrow_mut<DepositKey, PlayerDeposit>(&mut pool.id, key);
    if (is_a) {
        assert!(deposit.balance_a >= amount, EInsufficientDeposit);
        deposit.balance_a = deposit.balance_a - amount;
    } else {
        assert!(deposit.balance_b >= amount, EInsufficientDeposit);
        deposit.balance_b = deposit.balance_b - amount;
    };

    // Move items: open inventory → owner inventory (player picks up via game UI)
    let item = storage_unit.withdraw_from_open_inventory<AMMAuth>(
        character,
        AMMAuth {},
        type_id,
        (amount as u32),
        ctx,
    );
    storage_unit.deposit_item<AMMAuth>(
        character,
        item,
        AMMAuth {},
        ctx,
    );
}

/// View a player's deposit balance on this pool.
public fun player_deposit(pool: &AMMPool, trader: address): (u64, u64) {
    let key = DepositKey { trader };
    if (!df::exists_(&pool.id, key)) return (0, 0);
    let d = df::borrow<DepositKey, PlayerDeposit>(&pool.id, key);
    (d.balance_a, d.balance_b)
}

/// Create pool. Liquidity must already be in the SSU open inventory.
public fun create_pool(
    storage_unit: &StorageUnit,
    type_id_a: u64,
    type_id_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    amp: u64,
    fee_bps: u64,
    banner: String,
    ctx: &mut TxContext,
): AMMAdminCap {
    assert!(type_id_a != type_id_b, EInvalidTypeId);
    assert!(amp >= 1, EInvalidAmp);
    assert!(fee_bps <= BPS_DENOM, EInvalidFee);
    assert!(reserve_a > 0 && reserve_b > 0, EInsufficientLiquidity);

    let mut pool = AMMPool {
        id: object::new(ctx),
        ssu_id: object::id(storage_unit),
    };
    let pool_id = object::id(&pool);

    df::add(
        &mut pool.id,
        ConfigKey {},
        Config {
            type_id_a,
            type_id_b,
            reserve_a,
            reserve_b,
            target_a: reserve_a,
            target_b: reserve_b,
            amp,
            fee_bps,
            banner,
            owner: ctx.sender(),
        },
    );

    transfer::share_object(pool);
    AMMAdminCap { id: object::new(ctx), pool_id }
}

/// Initialize dynamic fee config. Call once after pool creation.
public fun init_fee_config(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    surge_bps: u64,
    bonus_bps: u64,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(!df::exists_(&pool.id, FeeConfigKey {}), EFeeConfigExists);
    assert!(surge_bps <= BPS_DENOM && bonus_bps <= BPS_DENOM, EInvalidFee);

    df::add(
        &mut pool.id,
        FeeConfigKey {},
        FeeConfig {
            surge_bps,
            bonus_bps,
            fee_pool_a: 0,
            fee_pool_b: 0,
        },
    );
}

/// Update dynamic fee parameters.
public fun update_fee_config(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    surge_bps: u64,
    bonus_bps: u64,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(surge_bps <= BPS_DENOM && bonus_bps <= BPS_DENOM, EInvalidFee);
    let fc = df::borrow_mut<FeeConfigKey, FeeConfig>(&mut pool.id, FeeConfigKey {});
    fc.surge_bps = surge_bps;
    fc.bonus_bps = bonus_bps;
}

/// Update base trade fee.
public fun update_fee_bps(pool: &mut AMMPool, admin_cap: &AMMAdminCap, fee_bps: u64) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(fee_bps <= BPS_DENOM, EInvalidFee);
    df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {}).fee_bps = fee_bps;
}

/// Update target ratio (the intended reserve balance for dynamic fee calculations).
public fun update_target_ratio(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    target_a: u64,
    target_b: u64,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(target_a > 0 && target_b > 0, EInsufficientLiquidity);
    let config = df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {});
    config.target_a = target_a;
    config.target_b = target_b;
}

/// Swap with dynamic fees and rebalance bonuses.
/// Items must already be deposited via `deposit_for_swap`. Output is credited to
/// the sender's deposit balance — call `withdraw_from_swap` to collect.
///
/// PTB flow: deposit_for_swap → swap → withdraw_from_swap (all in one tx).
public fun swap(
    pool: &mut AMMPool,
    type_id_in: u64,
    amount_in: u64,
    min_out: u64,
    ctx: &mut TxContext,
) {
    assert!(amount_in > 0, EZeroAmount);

    // --- Phase 1: Read config values (immutable borrow scope) ---
    let (
        is_a_to_b,
        reserve_in,
        reserve_out,
        type_id_out,
        base_fee_bps,
        amp,
        target_in,
        target_out,
    ) = {
        let config = df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {});
        assert!(type_id_in == config.type_id_a || type_id_in == config.type_id_b, EInvalidTypeId);
        let a2b = type_id_in == config.type_id_a;
        if (a2b) {
            (
                a2b,
                config.reserve_a,
                config.reserve_b,
                config.type_id_b,
                config.fee_bps,
                config.amp,
                config.target_a,
                config.target_b,
            )
        } else {
            (
                a2b,
                config.reserve_b,
                config.reserve_a,
                config.type_id_a,
                config.fee_bps,
                config.amp,
                config.target_b,
                config.target_a,
            )
        }
    };

    // Imbalance relative to target ratio using cross-product comparison
    // At balance: reserve_in * target_out == reserve_out * target_in
    let actual_cross = (reserve_in as u128) * (target_out as u128);
    let target_cross = (reserve_out as u128) * (target_in as u128);
    let cross_sum = actual_cross + target_cross;
    let cross_diff = if (actual_cross > target_cross) { actual_cross - target_cross } else {
        target_cross - actual_cross
    };
    let imbalance_bps = if (cross_sum > 0) {
        ((cross_diff * (BPS_DENOM as u128)) / cross_sum) as u64
    } else { 0 };

    // Worsening = selling the side that's already oversupplied relative to target
    let is_worsening = actual_cross > target_cross;

    // --- Phase 2: Compute fee and output (immutable borrow of pool.id) ---
    let fee = compute_fee(amount_in, base_fee_bps, imbalance_bps, is_worsening, &pool.id);
    let net_in = amount_in - fee;

    let amount_out = stable_output(reserve_in, reserve_out, amp, net_in, target_in, target_out);
    assert!(amount_out >= min_out, EInsufficientOutput);
    assert!(amount_out < reserve_out, EInsufficientLiquidity);

    let bonus = compute_bonus(
        amount_out,
        imbalance_bps,
        is_worsening,
        is_a_to_b,
        fee,
        target_in,
        target_out,
        &pool.id,
    );
    let total_output = amount_out + bonus;

    // --- Phase 3: Debit input from player deposit, credit output ---
    let key = DepositKey { trader: ctx.sender() };
    assert!(df::exists_(&pool.id, key), EInsufficientDeposit);
    let deposit = df::borrow_mut<DepositKey, PlayerDeposit>(&mut pool.id, key);
    if (is_a_to_b) {
        assert!(deposit.balance_a >= amount_in, EInsufficientDeposit);
        deposit.balance_a = deposit.balance_a - amount_in;
        deposit.balance_b = deposit.balance_b + total_output;
    } else {
        assert!(deposit.balance_b >= amount_in, EInsufficientDeposit);
        deposit.balance_b = deposit.balance_b - amount_in;
        deposit.balance_a = deposit.balance_a + total_output;
    };

    // --- Phase 4: Update pool reserves ---
    let config = df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {});
    if (is_a_to_b) {
        config.reserve_a = config.reserve_a + net_in;
        config.reserve_b = config.reserve_b - amount_out;
    } else {
        config.reserve_b = config.reserve_b + net_in;
        config.reserve_a = config.reserve_a - amount_out;
    };

    update_fee_pool(fee, bonus, is_a_to_b, &mut pool.id);

    let pool_id = object::id(pool);

    sui::event::emit(SwapWithBonusEvent {
        pool_id,
        trader: ctx.sender(),
        type_id_in,
        type_id_out,
        amount_in,
        amount_out,
        fee,
        bonus,
    });
}

/// Add liquidity: move items from main inventory into open inventory
/// and update the pool reserves. Owner calls this after depositing via game UI.
public fun add_liquidity(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    amount: u32,
    ctx: &mut TxContext,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(pool.ssu_id == object::id(storage_unit), ESSUMismatch);

    let config = df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {});
    assert!(type_id == config.type_id_a || type_id == config.type_id_b, EInvalidTypeId);
    if (type_id == config.type_id_a) {
        config.reserve_a = config.reserve_a + (amount as u64);
    } else {
        config.reserve_b = config.reserve_b + (amount as u64);
    };

    // Move items: main → open (locked in liquidity reserves)
    let item = storage_unit.withdraw_item<AMMAuth>(
        character,
        AMMAuth {},
        type_id,
        amount,
        ctx,
    );
    storage_unit.deposit_to_open_inventory<AMMAuth>(
        character,
        item,
        AMMAuth {},
        ctx,
    );
}

/// Set reserves directly. Owner uses this to sync reserves with actual inventory.
public fun set_reserves(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    reserve_a: u64,
    reserve_b: u64,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(reserve_a > 0 && reserve_b > 0, EZeroAmount);
    let config = df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {});
    config.reserve_a = reserve_a;
    config.reserve_b = reserve_b;
}

/// Withdraw accumulated fees from open inventory → main (admin picks up via game UI).
public fun withdraw_fees(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(pool.ssu_id == object::id(storage_unit), ESSUMismatch);
    assert!(amount > 0, EZeroAmount);

    let config = df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {});
    let is_a = type_id == config.type_id_a;
    assert!(is_a || type_id == config.type_id_b, EInvalidTypeId);
    assert!(df::exists_(&pool.id, FeeConfigKey {}), ENoFeeConfig);

    let fc = df::borrow_mut<FeeConfigKey, FeeConfig>(&mut pool.id, FeeConfigKey {});
    if (is_a) {
        assert!(amount <= fc.fee_pool_a, EInsufficientLiquidity);
        fc.fee_pool_a = fc.fee_pool_a - amount;
    } else {
        assert!(amount <= fc.fee_pool_b, EInsufficientLiquidity);
        fc.fee_pool_b = fc.fee_pool_b - amount;
    };

    // Move tokens: open → main (admin withdraws via game UI)
    let item = storage_unit.withdraw_from_open_inventory<AMMAuth>(
        character,
        AMMAuth {},
        type_id,
        (amount as u32),
        ctx,
    );
    storage_unit.deposit_item<AMMAuth>(
        character,
        item,
        AMMAuth {},
        ctx,
    );
}

/// Rescue items from open inventory → main. Works without a pool reference,
/// so it can recover items stranded by an old/orphaned pool.
/// Requires AMMAuth to be authorized on the SSU for this package.
public fun rescue_items(
    pool: &AMMPool,
    admin_cap: &AMMAdminCap,
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    amount: u32,
    ctx: &mut TxContext,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(pool.ssu_id == object::id(storage_unit), ESSUMismatch);
    assert!(amount > 0, EZeroAmount);
    let item = storage_unit.withdraw_from_open_inventory<AMMAuth>(
        character,
        AMMAuth {},
        type_id,
        amount,
        ctx,
    );
    storage_unit.deposit_item<AMMAuth>(
        character,
        item,
        AMMAuth {},
        ctx,
    );
}

/// Roll accumulated fees into reserves (deepens liquidity, no token movement).
public fun roll_fees_to_reserves(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    type_id: u64,
    amount: u64,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    assert!(amount > 0, EZeroAmount);

    let config = df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {});
    let is_a = type_id == config.type_id_a;
    assert!(is_a || type_id == config.type_id_b, EInvalidTypeId);
    assert!(df::exists_(&pool.id, FeeConfigKey {}), ENoFeeConfig);

    // Move from fee_pool → reserves (accounting only, tokens already in open inventory)
    let fc = df::borrow_mut<FeeConfigKey, FeeConfig>(&mut pool.id, FeeConfigKey {});
    if (is_a) {
        assert!(amount <= fc.fee_pool_a, EInsufficientLiquidity);
        fc.fee_pool_a = fc.fee_pool_a - amount;
    } else {
        assert!(amount <= fc.fee_pool_b, EInsufficientLiquidity);
        fc.fee_pool_b = fc.fee_pool_b - amount;
    };

    let config_mut = df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {});
    if (is_a) {
        config_mut.reserve_a = config_mut.reserve_a + amount;
    } else {
        config_mut.reserve_b = config_mut.reserve_b + amount;
    };
}

/// Update banner.
public fun update_banner(pool: &mut AMMPool, admin_cap: &AMMAdminCap, new_banner: String) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {}).banner = new_banner;
}

// === View ===
public fun reserve_a(pool: &AMMPool): u64 {
    df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).reserve_a
}

public fun reserve_b(pool: &AMMPool): u64 {
    df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).reserve_b
}

public fun target_a(pool: &AMMPool): u64 {
    df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).target_a
}

public fun target_b(pool: &AMMPool): u64 {
    df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).target_b
}

public fun banner(pool: &AMMPool): String {
    df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).banner
}

public fun fee_bps(pool: &AMMPool): u64 {
    df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).fee_bps
}

public fun amp(pool: &AMMPool): u64 { df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).amp }

public fun ssu_id(pool: &AMMPool): ID { pool.ssu_id }

// === Internal: Dynamic Fee Logic ===

/// Compute fee. Worsening trades pay base + surge. Rebalancing trades pay base only.
/// Minimum fee is 1 for any trade when fee_bps > 0 (prevents small trades from being free).
fun compute_fee(
    amount_in: u64,
    base_fee_bps: u64,
    imbalance_bps: u64,
    is_worsening: bool,
    pool_uid: &UID,
): u64 {
    let has_fee_config = df::exists_(pool_uid, FeeConfigKey {});

    let fee = if (!has_fee_config || !is_worsening) {
        // Flat base fee: no FeeConfig, or rebalancing trade
        (amount_in * base_fee_bps) / BPS_DENOM
    } else {
        // Worsening trade with dynamic fees
        let fc = df::borrow<FeeConfigKey, FeeConfig>(pool_uid, FeeConfigKey {});
        let surge = (imbalance_bps * fc.surge_bps) / BPS_DENOM;
        let raw_fee_bps = base_fee_bps + surge;
        let effective_fee_bps = if (raw_fee_bps > BPS_DENOM - 1) { BPS_DENOM - 1 } else {
            raw_fee_bps
        };
        (amount_in * effective_fee_bps) / BPS_DENOM
    };

    // Minimum fee of 1 for any trade when fees are configured
    if (fee == 0 && base_fee_bps > 0) { 1 } else { fee }
}

/// Compute bonus for rebalancing trades. Returns 0 if worsening or no FeeConfig.
/// Bonus is capped at fee_pool AND at 3x the fee (normalized to output units).
fun compute_bonus(
    amount_out: u64,
    imbalance_bps: u64,
    is_worsening: bool,
    is_a_to_b: bool,
    fee: u64,
    target_in: u64,
    target_out: u64,
    pool_uid: &UID,
): u64 {
    if (is_worsening || !df::exists_(pool_uid, FeeConfigKey {})) return 0;

    let fc = df::borrow<FeeConfigKey, FeeConfig>(pool_uid, FeeConfigKey {});
    let bonus_rate = (imbalance_bps * fc.bonus_bps) / BPS_DENOM;
    let raw_bonus = (amount_out * bonus_rate) / BPS_DENOM;

    // Cap at available fee pool and at 3x the fee (converted to output-token units)
    let available = if (is_a_to_b) { fc.fee_pool_b } else { fc.fee_pool_a };
    let mut capped = if (raw_bonus > available) { available } else { raw_bonus };
    let fee_in_out_units = (fee as u128) * (target_out as u128) / (target_in as u128);
    let fee_cap = (fee_in_out_units * 3 as u64);
    if (capped > fee_cap) { capped = fee_cap };
    capped
}

/// Update fee pools: add fee to input side, deduct bonus from output side.
fun update_fee_pool(fee: u64, bonus: u64, is_a_to_b: bool, pool_uid: &mut UID) {
    if (!df::exists_(pool_uid, FeeConfigKey {})) return;

    let fc = df::borrow_mut<FeeConfigKey, FeeConfig>(pool_uid, FeeConfigKey {});
    if (is_a_to_b) {
        fc.fee_pool_a = fc.fee_pool_a + fee;
        fc.fee_pool_b = fc.fee_pool_b - bonus;
    } else {
        fc.fee_pool_b = fc.fee_pool_b + fee;
        fc.fee_pool_a = fc.fee_pool_a - bonus;
    };
}

// === StableSwap Math (u128 internally for normalized values) ===

fun stable_get_d(x: u128, y: u128, a: u64): u128 {
    let s = x + y;
    if (s == 0) return 0;
    if (x == 0 || y == 0) return 0;
    let ann = (a as u128) * N_COINS;
    let mut d = s;
    let mut i = 0u64;
    while (i < MAX_ITER) {
        let mut dp = d;
        dp = dp * d / (x * N_COINS);
        dp = dp * d / (y * N_COINS);
        let prev = d;
        d = (ann * s + N_COINS * dp) * d / ((ann - 1) * d + (N_COINS + 1) * dp);
        let diff = if (d > prev) { d - prev } else { prev - d };
        if (diff <= 1) return d;
        i = i + 1;
    };
    abort EConvergenceFailed
}

fun stable_get_y(x_new: u128, d: u128, a: u64): u128 {
    let ann = (a as u128) * N_COINS;
    let c = d * d / (x_new * N_COINS) * d / (ann * N_COINS);
    let b = x_new + d / ann;
    let mut y = d;
    let mut i = 0u64;
    while (i < MAX_ITER) {
        let prev = y;
        y = (y * y + c) / (2 * y + b - d);
        let diff = if (y > prev) { y - prev } else { prev - y };
        if (diff <= 1) return y;
        i = i + 1;
    };
    abort EConvergenceFailed
}

/// Weighted StableSwap output: normalizes reserves by target ratio so the
/// curve's peg point matches the intended market ratio, not 1:1.
///
/// Normalization: norm_in = r_in * t_out, norm_out = r_out * t_in
/// At balance (r_in/r_out == t_in/t_out), norm_in == norm_out.
/// Output is computed in normalized space then denormalized: raw / t_in.
fun stable_output(r_in: u64, r_out: u64, a: u64, net_in: u64, t_in: u64, t_out: u64): u64 {
    // Normalize reserves so balanced = equal
    let norm_in = (r_in as u128) * (t_out as u128);
    let norm_out = (r_out as u128) * (t_in as u128);
    let norm_net_in = (net_in as u128) * (t_out as u128);

    let d = stable_get_d(norm_in, norm_out, a);
    let y_new = stable_get_y(norm_in + norm_net_in, d, a);
    let raw_norm = norm_out - y_new;

    // Denormalize: divide by t_in (the output token's target scaling factor)
    // Integer division already rounds down conservatively — no extra -1 needed
    (raw_norm / (t_in as u128) as u64)
}

// === Test-only wrappers for internal math ===

#[test_only]
public fun stable_get_d_test(x: u128, y: u128, a: u64): u128 {
    stable_get_d(x, y, a)
}

#[test_only]
public fun stable_output_test(
    r_in: u64,
    r_out: u64,
    a: u64,
    net_in: u64,
    t_in: u64,
    t_out: u64,
): u64 {
    stable_output(r_in, r_out, a, net_in, t_in, t_out)
}

#[test_only]
public fun compute_fee_test(
    pool: &AMMPool,
    amount_in: u64,
    base_fee_bps: u64,
    imbalance_bps: u64,
    is_worsening: bool,
): u64 {
    compute_fee(amount_in, base_fee_bps, imbalance_bps, is_worsening, &pool.id)
}

#[test_only]
public fun compute_bonus_test(
    pool: &AMMPool,
    amount_out: u64,
    imbalance_bps: u64,
    is_worsening: bool,
    is_a_to_b: bool,
    fee: u64,
    target_in: u64,
    target_out: u64,
): u64 {
    compute_bonus(
        amount_out,
        imbalance_bps,
        is_worsening,
        is_a_to_b,
        fee,
        target_in,
        target_out,
        &pool.id,
    )
}

#[test_only]
public fun fee_pool_a(pool: &AMMPool): u64 {
    df::borrow<FeeConfigKey, FeeConfig>(&pool.id, FeeConfigKey {}).fee_pool_a
}

#[test_only]
public fun fee_pool_b(pool: &AMMPool): u64 {
    df::borrow<FeeConfigKey, FeeConfig>(&pool.id, FeeConfigKey {}).fee_pool_b
}
