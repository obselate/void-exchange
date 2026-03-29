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
use world::{
    character::Character,
    storage_unit::StorageUnit,
};

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

// === Structs ===
public struct AMMAuth has drop {}
public struct ConfigKey has copy, drop, store {}
public struct FeeConfigKey has copy, drop, store {}

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
    amp: u64,
    fee_bps: u64,
    banner: String,
    owner: address,
}

public struct FeeConfig has drop, store {
    surge_bps: u64,      // max additional fee at full imbalance
    bonus_bps: u64,      // max bonus rate at full imbalance
    fee_pool_a: u64,     // accumulated fees in token A
    fee_pool_b: u64,     // accumulated fees in token B
}

public struct SwapEvent has copy, drop {
    pool_id: ID,
    trader: address,
    type_id_in: u64,
    type_id_out: u64,
    amount_in: u64,
    amount_out: u64,
    fee: u64,
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

public fun amm_auth(): AMMAuth { AMMAuth {} }

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
    assert!(amp >= 1, EInvalidAmp);
    assert!(reserve_a > 0 && reserve_b > 0, EInsufficientLiquidity);

    let mut pool = AMMPool {
        id: object::new(ctx),
        ssu_id: object::id(storage_unit),
    };
    let pool_id = object::id(&pool);

    df::add(&mut pool.id, ConfigKey {}, Config {
        type_id_a, type_id_b,
        reserve_a, reserve_b,
        amp, fee_bps, banner,
        owner: ctx.sender(),
    });

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

    df::add(&mut pool.id, FeeConfigKey {}, FeeConfig {
        surge_bps,
        bonus_bps,
        fee_pool_a: 0,
        fee_pool_b: 0,
    });
}

/// Update dynamic fee parameters.
public fun update_fee_config(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    surge_bps: u64,
    bonus_bps: u64,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    let fc = df::borrow_mut<FeeConfigKey, FeeConfig>(&mut pool.id, FeeConfigKey {});
    fc.surge_bps = surge_bps;
    fc.bonus_bps = bonus_bps;
}

/// Swap with dynamic fees and rebalance bonuses.
public fun swap(
    pool: &mut AMMPool,
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id_in: u64,
    amount_in: u64,
    min_out: u64,
    ctx: &mut TxContext,
) {
    assert!(amount_in > 0, EZeroAmount);
    assert!(pool.ssu_id == object::id(storage_unit), ESSUMismatch);

    // --- Phase 1: Read config values (immutable borrow scope) ---
    let (is_a_to_b, reserve_in, reserve_out, type_id_out, base_fee_bps, amp) = {
        let config = df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {});
        let a2b = type_id_in == config.type_id_a;
        if (a2b) {
            (a2b, config.reserve_a, config.reserve_b, config.type_id_b, config.fee_bps, config.amp)
        } else {
            (a2b, config.reserve_b, config.reserve_a, config.type_id_a, config.fee_bps, config.amp)
        }
    };

    // Is this trade worsening or rebalancing?
    let is_worsening = reserve_in >= reserve_out;

    // Calculate imbalance
    let total = reserve_in + reserve_out;
    let diff = if (reserve_in > reserve_out) { reserve_in - reserve_out } else { reserve_out - reserve_in };
    let imbalance_bps = if (total > 0) { diff * BPS_DENOM / total } else { 0 };

    // --- Phase 2: Compute fee and output (immutable borrow of pool.id) ---
    let fee = compute_fee(amount_in, base_fee_bps, imbalance_bps, is_worsening, &pool.id);
    let net_in = amount_in - fee;

    let amount_out = stable_output(reserve_in, reserve_out, amp, net_in);
    assert!(amount_out >= min_out, EInsufficientOutput);
    assert!(amount_out < reserve_out, EInsufficientLiquidity);

    let bonus = compute_bonus(amount_out, imbalance_bps, is_worsening, is_a_to_b, fee, &pool.id);
    let total_output = amount_out + bonus;

    // --- Phase 3: Mutate state ---
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

    // Move input: main → open (player deposited via game UI into main, lock in reserves)
    let item_in = storage_unit.withdraw_item<AMMAuth>(
        character, AMMAuth {}, type_id_in, (amount_in as u32), ctx,
    );
    storage_unit.deposit_to_open_inventory<AMMAuth>(
        character, item_in, AMMAuth {}, ctx,
    );

    // Move output: open → main (release from reserves + bonus, player withdraws via game UI)
    let item_out = storage_unit.withdraw_from_open_inventory<AMMAuth>(
        character, AMMAuth {}, type_id_out, (total_output as u32), ctx,
    );
    storage_unit.deposit_item<AMMAuth>(
        character, item_out, AMMAuth {}, ctx,
    );

    sui::event::emit(SwapWithBonusEvent {
        pool_id,
        trader: ctx.sender(),
        type_id_in, type_id_out,
        amount_in, amount_out,
        fee, bonus,
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
    if (type_id == config.type_id_a) {
        config.reserve_a = config.reserve_a + (amount as u64);
    } else {
        config.reserve_b = config.reserve_b + (amount as u64);
    };

    // Move items: main → open (locked in liquidity reserves)
    let item = storage_unit.withdraw_item<AMMAuth>(
        character, AMMAuth {}, type_id, amount, ctx,
    );
    storage_unit.deposit_to_open_inventory<AMMAuth>(
        character, item, AMMAuth {}, ctx,
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
        character, AMMAuth {}, type_id, (amount as u32), ctx,
    );
    storage_unit.deposit_item<AMMAuth>(
        character, item, AMMAuth {}, ctx,
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
public fun update_banner(
    pool: &mut AMMPool,
    admin_cap: &AMMAdminCap,
    new_banner: String,
) {
    assert!(admin_cap.pool_id == object::id(pool), ENotOwner);
    df::borrow_mut<ConfigKey, Config>(&mut pool.id, ConfigKey {}).banner = new_banner;
}

// === View ===
public fun reserve_a(pool: &AMMPool): u64 { df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).reserve_a }
public fun reserve_b(pool: &AMMPool): u64 { df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).reserve_b }
public fun banner(pool: &AMMPool): String { df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).banner }
public fun fee_bps(pool: &AMMPool): u64 { df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).fee_bps }
public fun amp(pool: &AMMPool): u64 { df::borrow<ConfigKey, Config>(&pool.id, ConfigKey {}).amp }
public fun ssu_id(pool: &AMMPool): ID { pool.ssu_id }

// === Internal: Dynamic Fee Logic ===

/// Compute fee. Worsening trades pay base + surge. Rebalancing trades pay base only.
fun compute_fee(amount_in: u64, base_fee_bps: u64, imbalance_bps: u64,
    is_worsening: bool, pool_uid: &UID): u64 {

    let has_fee_config = df::exists_(pool_uid, FeeConfigKey {});

    if (!has_fee_config || !is_worsening) {
        // Flat base fee: no FeeConfig, or rebalancing trade
        return (amount_in * base_fee_bps) / BPS_DENOM
    };

    // Worsening trade with dynamic fees
    let fc = df::borrow<FeeConfigKey, FeeConfig>(pool_uid, FeeConfigKey {});
    let surge = (imbalance_bps * fc.surge_bps) / BPS_DENOM;
    let effective_fee_bps = base_fee_bps + surge;
    (amount_in * effective_fee_bps) / BPS_DENOM
}

/// Compute bonus for rebalancing trades. Returns 0 if worsening or no FeeConfig.
/// Bonus is capped at fee_pool AND at the fee collected on this trade (house always wins).
fun compute_bonus(amount_out: u64, imbalance_bps: u64, is_worsening: bool,
    is_a_to_b: bool, fee: u64, pool_uid: &UID): u64 {

    if (is_worsening || !df::exists_(pool_uid, FeeConfigKey {})) return 0;

    let fc = df::borrow<FeeConfigKey, FeeConfig>(pool_uid, FeeConfigKey {});
    let bonus_rate = (imbalance_bps * fc.bonus_bps) / BPS_DENOM;
    let raw_bonus = (amount_out * bonus_rate) / BPS_DENOM;

    // Cap at available fee pool and at the fee collected on this trade
    let available = if (is_a_to_b) { fc.fee_pool_b } else { fc.fee_pool_a };
    let mut capped = if (raw_bonus > available) { available } else { raw_bonus };
    let fee_cap = fee * 3;
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

// === StableSwap Math ===

fun stable_get_d(x: u64, y: u64, a: u64): u64 {
    let s = (x as u128) + (y as u128);
    if (s == 0) return 0;
    let ann = (a as u128) * N_COINS;
    let mut d = s;
    let mut i = 0u64;
    while (i < MAX_ITER) {
        let mut dp = d;
        dp = dp * d / ((x as u128) * N_COINS);
        dp = dp * d / ((y as u128) * N_COINS);
        let prev = d;
        d = (ann * s + N_COINS * dp) * d / ((ann - 1) * d + (N_COINS + 1) * dp);
        let diff = if (d > prev) { d - prev } else { prev - d };
        if (diff <= 1) return (d as u64);
        i = i + 1;
    };
    abort EConvergenceFailed
}

fun stable_get_y(x_new: u64, d: u64, a: u64): u64 {
    let ann = (a as u128) * N_COINS;
    let x = (x_new as u128);
    let d128 = (d as u128);
    let c = d128 * d128 / (x * N_COINS) * d128 / (ann * N_COINS);
    let b = x + d128 / ann;
    let mut y = d128;
    let mut i = 0u64;
    while (i < MAX_ITER) {
        let prev = y;
        y = (y * y + c) / (2 * y + b - d128);
        let diff = if (y > prev) { y - prev } else { prev - y };
        if (diff <= 1) return (y as u64);
        i = i + 1;
    };
    abort EConvergenceFailed
}

fun stable_output(r_in: u64, r_out: u64, a: u64, net_in: u64): u64 {
    let d = stable_get_d(r_in, r_out, a);
    let y_new = stable_get_y(r_in + net_in, d, a);
    let raw = r_out - y_new;
    if (raw > 0) { raw - 1 } else { 0 }
}
