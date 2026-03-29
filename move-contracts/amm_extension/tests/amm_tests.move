/// Unit tests for AMM math + integration tests for both curve types.
#[test_only]
module amm_extension::amm_tests;

use amm_extension::amm::{Self, AMMPool, AMMAuth};
use std::string::utf8;
use sui::{clock, test_scenario as ts};
use world::{
    access::{OwnerCap, AdminACL},
    character::{Self, Character},
    energy::EnergyConfig,
    network_node::{Self, NetworkNode},
    object_registry::ObjectRegistry,
    storage_unit::{Self, StorageUnit},
    test_helpers::{Self, governor, admin, user_a, user_b, tenant},
};

// === Constants ===
const SCALE: u64 = 100_000_000;

const CHARACTER_A_ITEM_ID: u32 = 1234u32;
const CHARACTER_B_ITEM_ID: u32 = 5678u32;

const LOCATION_HASH: vector<u8> =
    x"7a8f3b2e9c4d1a6f5e8b2d9c3f7a1e5b7a8f3b2e9c4d1a6f5e8b2d9c3f7a1e5b";
const MAX_CAPACITY: u64 = 100_000;
const STORAGE_TYPE_ID: u64 = 5555;
const STORAGE_ITEM_ID: u64 = 90002;

const TOKEN_A_TYPE_ID: u64 = 88069;
const TOKEN_A_ITEM_ID: u64 = 1000004145107;
const TOKEN_A_VOLUME: u64 = 1;

const TOKEN_B_TYPE_ID: u64 = 88070;
const TOKEN_B_ITEM_ID: u64 = 1000004145108;
const TOKEN_B_VOLUME: u64 = 1;

const MS_PER_SECOND: u64 = 1000;
const NWN_TYPE_ID: u64 = 111000;
const NWN_ITEM_ID: u64 = 5000;
const FUEL_MAX_CAPACITY: u64 = 1000;
const FUEL_BURN_RATE_IN_MS: u64 = 3600 * MS_PER_SECOND;
const MAX_PRODUCTION: u64 = 100;
const FUEL_TYPE_ID: u64 = 1;
const FUEL_VOLUME: u64 = 10;

const STATUS_ONLINE: u8 = 1;

// ============================================================
// Constant Product math tests
// ============================================================

#[test]
fun test_cp_equal_weights() {
    let out = amm::cp_get_output_test(1000, 1000, SCALE / 2, SCALE / 2, 100);
    assert!(out == 90, 0); // 1000*100/1100
}

#[test]
fun test_cp_asymmetric_weights() {
    let w_in = (SCALE * 3) / 4;
    let w_out = SCALE / 4;
    let out = amm::cp_get_output_test(1000, 1000, w_in, w_out, 100);
    assert!(out == 272, 0); // 1000*3*100/1100
}

#[test]
fun test_cp_large_reserves() {
    let out = amm::cp_get_output_test(
        1_000_000_000, 1_000_000_000,
        SCALE / 2, SCALE / 2,
        1_000_000,
    );
    assert!(out == 999_000, 0);
}

// ============================================================
// StableSwap math tests
// ============================================================

#[test]
/// Balanced reserves: D should equal sum of reserves.
fun test_stable_get_d_balanced() {
    let d = amm::stable_get_d_test(1000, 1000, 100);
    assert!(d == 2000, 0);
}

#[test]
/// Imbalanced reserves: D should be between max(x,y)*2 and x+y.
fun test_stable_get_d_imbalanced() {
    let d = amm::stable_get_d_test(1000, 500, 100);
    assert!(d > 1000 && d <= 1500, 0);
}

#[test]
/// Balanced 1000/1000, amp=100, swap 100.
/// StableSwap near the peg → output ≈ 99 (near 1:1 minus rounding).
fun test_stable_output_balanced_small() {
    let out = amm::stable_get_output_test(1000, 1000, 100, 100);
    // With amp=100, output should be close to 100 (much better than CP's 90)
    assert!(out >= 98 && out <= 100, out);
}

#[test]
/// Balanced 1000/1000, amp=100, swap 500 (large relative to reserves).
/// StableSwap still gives more than CP but slippage visible.
fun test_stable_output_large_swap() {
    let stable_out = amm::stable_get_output_test(1000, 1000, 100, 500);
    let cp_out = amm::cp_get_output_test(1000, 1000, SCALE / 2, SCALE / 2, 500);
    // Stable should beat constant product
    assert!(stable_out > cp_out, 0);
    // CP gives 333, stable should give significantly more
    assert!(cp_out == 333, 1);
    assert!(stable_out > 450, 2);
}

#[test]
/// Low amp (1) should behave closer to constant product.
fun test_stable_low_amp() {
    let out = amm::stable_get_output_test(1000, 1000, 1, 100);
    let cp_out = amm::cp_get_output_test(1000, 1000, SCALE / 2, SCALE / 2, 100);
    // Low amp gives less than high amp but still >= CP
    assert!(out >= cp_out, 0);
}

#[test]
/// High amp (1000) should give near-1:1 for balanced reserves.
fun test_stable_high_amp() {
    let out = amm::stable_get_output_test(1000, 1000, 1000, 100);
    assert!(out >= 99, 0); // Very close to 1:1
}

#[test]
/// Test with ore-scale quantities: 5000/5000, amp=200, swap 2000.
fun test_stable_ore_scale() {
    let out = amm::stable_get_output_test(5000, 5000, 200, 2000);
    // Even at 40% of reserves, StableSwap should give a good rate
    assert!(out > 1800, 0);
}

// ============================================================
// Fee tests
// ============================================================

#[test]
fun test_fee_flat() {
    let fee = amm::calculate_dynamic_fee_test(30, 0, 1000, 1000, SCALE / 2, SCALE / 2);
    assert!(fee == 30, 0);
}

#[test]
fun test_fee_balanced() {
    let fee = amm::calculate_dynamic_fee_test(30, 100, 500, 500, SCALE / 2, SCALE / 2);
    assert!(fee == 30, 0);
}

#[test]
fun test_fee_imbalanced() {
    let fee = amm::calculate_dynamic_fee_test(30, 100, 800, 200, SCALE / 2, SCALE / 2);
    assert!(fee == 90, 0); // 30 + 100*0.6
}

#[test]
fun test_fee_capped() {
    let fee = amm::calculate_dynamic_fee_test(4000, 10000, 950, 50, SCALE / 2, SCALE / 2);
    assert!(fee == 5000, 0);
}

// ============================================================
// Price impact tests
// ============================================================

#[test]
/// No slippage → 0 impact.
fun test_price_impact_zero() {
    // Effective price equals spot: 1000 in, 1000 out, reserves 1:1
    let impact = amm::calculate_price_impact_test(1000, 1000, 100, 100);
    assert!(impact == 0, 0);
}

#[test]
/// Constant product swap: 100 in from 1000/1000 → 90 out.
/// Spot=1.0, effective=0.9, impact=10%.
fun test_price_impact_cp() {
    let impact = amm::calculate_price_impact_test(1000, 1000, 100, 90);
    assert!(impact == 1000, 0); // 10% = 1000 bps
}

#[test]
/// Small swap on stable: nearly 1:1 → near-zero impact.
fun test_price_impact_stable_small() {
    let impact = amm::calculate_price_impact_test(1000, 1000, 10, 9);
    assert!(impact == 1000, 0); // even 1 unit diff is 10% on small amounts
    // With actual stable math output of ~10, impact would be ~0
    let impact2 = amm::calculate_price_impact_test(1000, 1000, 100, 99);
    assert!(impact2 == 100, 0); // 1% = 100 bps
}

// ============================================================
// Integration test helpers
// ============================================================

fun setup_nwn(ts: &mut ts::Scenario) {
    test_helpers::setup_world(ts);
    test_helpers::configure_assembly_energy(ts);
    test_helpers::register_server_address(ts);
}

fun create_character(ts: &mut ts::Scenario, user: address, item_id: u32): ID {
    ts::next_tx(ts, admin());
    let admin_acl = ts::take_shared<AdminACL>(ts);
    let mut registry = ts::take_shared<ObjectRegistry>(ts);
    let character = character::create_character(
        &mut registry, &admin_acl, item_id, tenant(), 100, user, utf8(b"name"), ts::ctx(ts),
    );
    let character_id = object::id(&character);
    character.share_character(&admin_acl, ts.ctx());
    ts::return_shared(registry);
    ts::return_shared(admin_acl);
    character_id
}

fun create_network_node(ts: &mut ts::Scenario, character_id: ID): ID {
    ts::next_tx(ts, admin());
    let mut registry = ts::take_shared<ObjectRegistry>(ts);
    let character = ts::take_shared_by_id<Character>(ts, character_id);
    let admin_acl = ts::take_shared<AdminACL>(ts);
    let nwn = network_node::anchor(
        &mut registry, &character, &admin_acl,
        NWN_ITEM_ID, NWN_TYPE_ID, LOCATION_HASH,
        FUEL_MAX_CAPACITY, FUEL_BURN_RATE_IN_MS, MAX_PRODUCTION, ts.ctx(),
    );
    let id = object::id(&nwn);
    nwn.share_network_node(&admin_acl, ts.ctx());
    ts::return_shared(character);
    ts::return_shared(admin_acl);
    ts::return_shared(registry);
    id
}

fun create_storage_unit(ts: &mut ts::Scenario, character_id: ID): (ID, ID) {
    let nwn_id = create_network_node(ts, character_id);
    ts::next_tx(ts, admin());
    let mut registry = ts::take_shared<ObjectRegistry>(ts);
    let mut nwn = ts::take_shared_by_id<NetworkNode>(ts, nwn_id);
    let character = ts::take_shared_by_id<Character>(ts, character_id);
    let storage_unit_id = {
        let admin_acl = ts::take_shared<AdminACL>(ts);
        let storage_unit = storage_unit::anchor(
            &mut registry, &mut nwn, &character, &admin_acl,
            STORAGE_ITEM_ID, STORAGE_TYPE_ID, MAX_CAPACITY, LOCATION_HASH, ts.ctx(),
        );
        let storage_unit_id = object::id(&storage_unit);
        storage_unit.share_storage_unit(&admin_acl, ts.ctx());
        ts::return_shared(admin_acl);
        storage_unit_id
    };
    ts::return_shared(character);
    ts::return_shared(registry);
    ts::return_shared(nwn);
    (storage_unit_id, nwn_id)
}

fun online_storage_unit(
    ts: &mut ts::Scenario, user: address, character_id: ID, storage_id: ID, nwn_id: ID,
) {
    let clock = clock::create_for_testing(ts.ctx());
    ts::next_tx(ts, user);
    let mut character = ts::take_shared_by_id<Character>(ts, character_id);
    let (owner_cap, receipt) = character.borrow_owner_cap<NetworkNode>(
        ts::most_recent_receiving_ticket<OwnerCap<NetworkNode>>(&character_id), ts.ctx(),
    );
    ts::next_tx(ts, user);
    {
        let mut nwn = ts::take_shared_by_id<NetworkNode>(ts, nwn_id);
        nwn.deposit_fuel_test(&owner_cap, FUEL_TYPE_ID, FUEL_VOLUME, 10, &clock);
        ts::return_shared(nwn);
    };
    ts::next_tx(ts, user);
    {
        let mut nwn = ts::take_shared_by_id<NetworkNode>(ts, nwn_id);
        nwn.online(&owner_cap, &clock);
        ts::return_shared(nwn);
    };
    character.return_owner_cap(owner_cap, receipt);

    ts::next_tx(ts, user);
    {
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
        let mut nwn = ts::take_shared_by_id<NetworkNode>(ts, nwn_id);
        let energy_config = ts::take_shared<EnergyConfig>(ts);
        let (owner_cap, receipt) = character.borrow_owner_cap<StorageUnit>(
            ts::most_recent_receiving_ticket<OwnerCap<StorageUnit>>(&character_id), ts.ctx(),
        );
        storage_unit.online(&mut nwn, &energy_config, &owner_cap);
        assert!(storage_unit.status().status_to_u8() == STATUS_ONLINE, 0);
        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(storage_unit);
        ts::return_shared(nwn);
        ts::return_shared(energy_config);
    };
    ts::return_shared(character);
    clock.destroy_for_testing();
}

fun mint_token<T: key>(
    ts: &mut ts::Scenario, storage_id: ID, character_id: ID, user: address,
    item_id: u64, type_id: u64, volume: u64, quantity: u32,
) {
    ts::next_tx(ts, user);
    {
        let mut character = ts::take_shared_by_id<Character>(ts, character_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<T>(
            ts::most_recent_receiving_ticket<OwnerCap<T>>(&character_id), ts.ctx(),
        );
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
        storage_unit.game_item_to_chain_inventory_test<T>(
            &character, &owner_cap, item_id, type_id, volume, quantity, ts.ctx(),
        );
        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
    };
}

fun character_owner_cap_id(ts: &mut ts::Scenario, character_id: ID): ID {
    ts::next_tx(ts, admin());
    let character = ts::take_shared_by_id<Character>(ts, character_id);
    let id = character.owner_cap_id();
    ts::return_shared(character);
    id
}

fun storage_owner_cap_id(ts: &mut ts::Scenario, storage_id: ID): ID {
    ts::next_tx(ts, admin());
    let storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
    let id = storage_unit.owner_cap_id();
    ts::return_shared(storage_unit);
    id
}

/// Shared setup: creates SSU with liquidity, authorizes AMMAuth, returns IDs.
fun setup_pool_env(
    ts: &mut ts::Scenario,
    liq_a: u32,
    liq_b: u32,
    trader_a: u32,
    trader_b: u32,
): (ID, ID, ID, ID, ID) {
    setup_nwn(ts);

    let owner_char_id = create_character(ts, user_b(), CHARACTER_B_ITEM_ID);
    let trader_char_id = create_character(ts, user_a(), CHARACTER_A_ITEM_ID);

    let (storage_id, nwn_id) = create_storage_unit(ts, owner_char_id);
    online_storage_unit(ts, user_b(), owner_char_id, storage_id, nwn_id);

    // Seed SSU main inventory (AMM liquidity)
    if (liq_a > 0) {
        mint_token<StorageUnit>(
            ts, storage_id, owner_char_id, user_b(),
            TOKEN_A_ITEM_ID, TOKEN_A_TYPE_ID, TOKEN_A_VOLUME, liq_a,
        );
    };
    if (liq_b > 0) {
        mint_token<StorageUnit>(
            ts, storage_id, owner_char_id, user_b(),
            TOKEN_B_ITEM_ID, TOKEN_B_TYPE_ID, TOKEN_B_VOLUME, liq_b,
        );
    };

    // Seed trader's owned inventory
    if (trader_a > 0) {
        mint_token<Character>(
            ts, storage_id, trader_char_id, user_a(),
            TOKEN_A_ITEM_ID, TOKEN_A_TYPE_ID, TOKEN_A_VOLUME, trader_a,
        );
    };
    if (trader_b > 0) {
        mint_token<Character>(
            ts, storage_id, trader_char_id, user_a(),
            TOKEN_B_ITEM_ID, TOKEN_B_TYPE_ID, TOKEN_B_VOLUME, trader_b,
        );
    };

    // Authorize AMMAuth
    ts::next_tx(ts, user_b());
    {
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(ts, owner_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<StorageUnit>(
            ts::most_recent_receiving_ticket<OwnerCap<StorageUnit>>(&owner_char_id), ts.ctx(),
        );
        storage_unit.authorize_extension<AMMAuth>(&owner_cap);
        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(storage_unit);
        ts::return_shared(character);
    };

    let ssu_cap = storage_owner_cap_id(ts, storage_id);
    let trader_cap = character_owner_cap_id(ts, trader_char_id);

    (storage_id, owner_char_id, trader_char_id, ssu_cap, trader_cap)
}

// ============================================================
// Integration: Constant Product swap
// ============================================================

#[test]
/// CP pool: 100/100, 50/50 weights, 30 bps fee, 10% max impact.
/// Swap 10 A → 9 B.
fun test_cp_swap_a_for_b() {
    let mut ts = ts::begin(governor());
    let (storage_id, _, trader_char_id, ssu_cap, trader_cap) =
        setup_pool_env(&mut ts, 100, 100, 10, 0);

    // Create CP pool
    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_constant_product_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID, TOKEN_B_TYPE_ID,
            100, 100,
            SCALE / 2, SCALE / 2,
            30, 0, 1000, // 30 bps fee, 10% max impact
            utf8(b"Test CP pool"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    // Check quote
    ts::next_tx(&mut ts, user_a());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        let quote = amm::quote_a_for_b(&pool, 10);
        assert!(amm::quote_amount_out(&quote) == 9, 0);
        assert!(amm::quote_fee_amount(&quote) == 0, 1); // rounds to 0
        ts::return_shared(pool);
    };

    // Execute swap
    ts::next_tx(&mut ts, user_a());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(&ts, trader_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<Character>(
            ts::most_recent_receiving_ticket<OwnerCap<Character>>(&trader_char_id), ts.ctx(),
        );

        amm::swap_a_for_b<Character>(
            &mut pool, &mut storage_unit, &character, &owner_cap,
            10, 9, ts.ctx(),
        );

        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify
    ts::next_tx(&mut ts, admin());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        assert!(storage_unit.item_quantity(ssu_cap, TOKEN_A_TYPE_ID) == 110, 10);
        assert!(storage_unit.item_quantity(ssu_cap, TOKEN_B_TYPE_ID) == 91, 11);
        assert!(!storage_unit.contains_item(trader_cap, TOKEN_A_TYPE_ID), 12);
        assert!(storage_unit.item_quantity(trader_cap, TOKEN_B_TYPE_ID) == 9, 13);
        let pool = ts::take_shared<AMMPool>(&ts);
        assert!(amm::reserve_a(&pool) == 110, 14);
        assert!(amm::reserve_b(&pool) == 91, 15);
        ts::return_shared(pool);
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}

#[test]
/// CP pool: B→A swap with 3% fee.
fun test_cp_swap_b_for_a_with_fees() {
    let mut ts = ts::begin(governor());
    let (storage_id, _, trader_char_id, ssu_cap, trader_cap) =
        setup_pool_env(&mut ts, 1000, 1000, 0, 100);

    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_constant_product_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID, TOKEN_B_TYPE_ID,
            1000, 1000,
            SCALE / 2, SCALE / 2,
            300, 0, 1500, // 3% fee, 15% max impact
            utf8(b"Fuel/Ore pool - 3% fee"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    ts::next_tx(&mut ts, user_a());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(&ts, trader_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<Character>(
            ts::most_recent_receiving_ticket<OwnerCap<Character>>(&trader_char_id), ts.ctx(),
        );

        let quote = amm::quote_b_for_a(&pool, 100);
        assert!(amm::quote_fee_amount(&quote) == 3, 0);
        assert!(amm::quote_amount_out(&quote) == 88, 1);

        amm::swap_b_for_a<Character>(
            &mut pool, &mut storage_unit, &character, &owner_cap,
            100, 80, ts.ctx(),
        );

        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    ts::next_tx(&mut ts, admin());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        assert!(storage_unit.item_quantity(ssu_cap, TOKEN_A_TYPE_ID) == 912, 10);
        assert!(storage_unit.item_quantity(ssu_cap, TOKEN_B_TYPE_ID) == 1100, 11);
        assert!(storage_unit.item_quantity(trader_cap, TOKEN_A_TYPE_ID) == 88, 12);
        assert!(!storage_unit.contains_item(trader_cap, TOKEN_B_TYPE_ID), 13);
        let pool = ts::take_shared<AMMPool>(&ts);
        assert!(amm::reserve_a(&pool) == 912, 14);
        assert!(amm::reserve_b(&pool) == 1097, 15);
        assert!(amm::accrued_fees_b(&pool) == 3, 16);
        ts::return_shared(pool);
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}

// ============================================================
// Integration: StableSwap
// ============================================================

#[test]
/// StableSwap pool: 1000/1000, amp=100, 100 bps fee, 5% max impact.
/// Swap 100 A → ~98 B (near 1:1 after fee).
fun test_stable_swap_a_for_b() {
    let mut ts = ts::begin(governor());
    let (storage_id, _, trader_char_id, ssu_cap, trader_cap) =
        setup_pool_env(&mut ts, 1000, 1000, 100, 0);

    // Create stable pool
    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_stable_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID, TOKEN_B_TYPE_ID,
            1000, 1000,
            100,  // amp
            100,  // 1% base fee
            0,    // no imbalance factor
            500,  // 5% max impact
            utf8(b"Stable test pool"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    // Check quote — should show near-1:1 rate with small fee
    ts::next_tx(&mut ts, user_a());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        let quote = amm::quote_a_for_b(&pool, 100);
        let out = amm::quote_amount_out(&quote);
        let fee = amm::quote_fee_amount(&quote);
        let impact = amm::quote_price_impact_bps(&quote);
        // Fee = 100 * 100 / 10000 = 1
        assert!(fee == 1, 0);
        // net_in = 99, stable output ≈ 98 (99 minus rounding)
        assert!(out >= 96 && out <= 99, out);
        // Price impact should be very low for stable near peg
        assert!(impact < 200, impact); // less than 2%
        ts::return_shared(pool);
    };

    // Execute swap
    ts::next_tx(&mut ts, user_a());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(&ts, trader_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<Character>(
            ts::most_recent_receiving_ticket<OwnerCap<Character>>(&trader_char_id), ts.ctx(),
        );

        amm::swap_a_for_b<Character>(
            &mut pool, &mut storage_unit, &character, &owner_cap,
            100, 90, // generous min_out
            ts.ctx(),
        );

        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify: reserves moved, trader got tokens
    ts::next_tx(&mut ts, admin());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let pool = ts::take_shared<AMMPool>(&ts);

        // Trader should have no A and some B
        assert!(!storage_unit.contains_item(trader_cap, TOKEN_A_TYPE_ID), 10);
        let trader_b = storage_unit.item_quantity(trader_cap, TOKEN_B_TYPE_ID);
        assert!(trader_b >= 96 && trader_b <= 99, 11);

        // Pool reserves updated
        let ra = amm::reserve_a(&pool);
        let rb = amm::reserve_b(&pool);
        assert!(ra == 1099, ra); // 1000 + 99 net_in
        assert!(rb == 1000 - (trader_b as u64), rb);

        // Fee accrued
        assert!(amm::accrued_fees_a(&pool) == 1, 13);

        ts::return_shared(pool);
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}

#[test]
/// StableSwap: large ore-style swap. 5000/5000, amp=200, swap 2000 B→A.
/// With 50 bps fee. Should still give a good rate.
fun test_stable_swap_large_ore() {
    let mut ts = ts::begin(governor());
    let (storage_id, _, trader_char_id, ssu_cap, trader_cap) =
        setup_pool_env(&mut ts, 5000, 5000, 0, 2000);

    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_stable_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID, TOKEN_B_TYPE_ID,
            5000, 5000,
            200,   // amp
            50,    // 0.5% fee (targeting volume)
            0,
            1000,  // 10% max impact
            utf8(b"Iron/Copper Ore - 0.5% fee, max 500 units"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    // Check quote for 2000 B→A
    ts::next_tx(&mut ts, user_a());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        let quote = amm::quote_b_for_a(&pool, 2000);
        let out = amm::quote_amount_out(&quote);
        let fee = amm::quote_fee_amount(&quote);
        let impact = amm::quote_price_impact_bps(&quote);
        // Fee = 2000 * 50 / 10000 = 10
        assert!(fee == 10, fee);
        // Stable with amp=200, swapping 40% of reserves: should get > 1800
        assert!(out > 1800, out);
        // Impact should be moderate but under cap
        assert!(impact <= 1000, impact);
        ts::return_shared(pool);
    };

    // Execute
    ts::next_tx(&mut ts, user_a());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(&ts, trader_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<Character>(
            ts::most_recent_receiving_ticket<OwnerCap<Character>>(&trader_char_id), ts.ctx(),
        );

        amm::swap_b_for_a<Character>(
            &mut pool, &mut storage_unit, &character, &owner_cap,
            2000, 1800,
            ts.ctx(),
        );

        character.return_owner_cap(owner_cap, receipt);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify trader got a good amount of A
    ts::next_tx(&mut ts, admin());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let trader_a = storage_unit.item_quantity(trader_cap, TOKEN_A_TYPE_ID);
        assert!(trader_a > 1800, (trader_a as u64));
        assert!(!storage_unit.contains_item(trader_cap, TOKEN_B_TYPE_ID), 1);
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}

#[test]
/// Verify that the max_input quote reflects the price impact cap.
fun test_max_input_quote() {
    let mut ts = ts::begin(governor());
    let (storage_id, _, _, _, _) = setup_pool_env(&mut ts, 1000, 1000, 0, 0);

    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_constant_product_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID, TOKEN_B_TYPE_ID,
            1000, 1000,
            SCALE / 2, SCALE / 2,
            0, 0, 500, // 0 fee, 5% max impact
            utf8(b"Max input test pool"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    ts::next_tx(&mut ts, admin());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        let max_in = amm::max_input_a_for_b(&pool);
        // With 5% max impact on CP 1000/1000: max swap should be moderate
        assert!(max_in > 0 && max_in < 1000, max_in);
        // Verify that a quote at max_input is within impact bounds
        if (max_in > 0) {
            let quote = amm::quote_a_for_b(&pool, max_in);
            assert!(amm::quote_price_impact_bps(&quote) <= 500, 1);
        };
        ts::return_shared(pool);
    };

    ts::end(ts);
}
