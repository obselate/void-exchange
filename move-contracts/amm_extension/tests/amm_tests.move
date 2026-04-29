/// Unit tests for AMM math + integration tests for the current swap/pool API.
#[test_only]
module amm_extension::amm_tests;

use amm_extension::amm::{Self, AMMPool, AMMAdminCap, AMMAuth};
use std::string::utf8;
use sui::{clock, test_scenario as ts};
use world::{
    access::{OwnerCap, AdminACL},
    character::{Self, Character},
    energy::EnergyConfig,
    network_node::{Self, NetworkNode},
    object_registry::ObjectRegistry,
    storage_unit::{Self, StorageUnit},
    test_helpers::{Self, governor, admin, user_a, user_b, tenant}
};

// === Constants ===
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
// StableSwap math unit tests
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
/// Balanced 1000/1000, amp=100, swap 100 net_in.
/// StableSwap near the peg -> output ~99 (near 1:1).
fun test_stable_output_balanced_small() {
    // Equal targets (1:1 peg), equal reserves
    let out = amm::stable_output_test(1000, 1000, 100, 100, 1000, 1000);
    assert!(out >= 98 && out <= 100, out);
}

#[test]
/// Balanced 1000/1000, amp=100, swap 500 (large relative to reserves).
fun test_stable_output_large_swap() {
    let out = amm::stable_output_test(1000, 1000, 100, 500, 1000, 1000);
    // Should give significantly more than constant product (which would give ~333)
    assert!(out > 450, out);
}

#[test]
/// Low amp (1) should give less favorable output than high amp.
fun test_stable_low_amp() {
    let low_amp_out = amm::stable_output_test(1000, 1000, 1, 100, 1000, 1000);
    let high_amp_out = amm::stable_output_test(1000, 1000, 100, 100, 1000, 1000);
    assert!(high_amp_out >= low_amp_out, 0);
}

#[test]
/// High amp (1000) should give near-1:1 for balanced reserves.
fun test_stable_high_amp() {
    let out = amm::stable_output_test(1000, 1000, 1000, 100, 1000, 1000);
    assert!(out >= 99, 0);
}

#[test]
/// Ore-scale quantities: 5000/5000, amp=200, swap 2000.
fun test_stable_ore_scale() {
    let out = amm::stable_output_test(5000, 5000, 200, 2000, 5000, 5000);
    assert!(out > 1800, 0);
}

#[test]
/// Non-1:1 target ratio (e.g., 3:1 peg).
fun test_stable_output_weighted() {
    // Target ratio 3000:1000 = 3:1 peg. Reserves at balance.
    let out = amm::stable_output_test(3000, 1000, 100, 300, 3000, 1000);
    // Swapping 10% of reserve_a, at 3:1 peg should yield ~100
    assert!(out >= 90 && out <= 105, out);
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
        &mut registry,
        &admin_acl,
        item_id,
        tenant(),
        100,
        user,
        utf8(b"name"),
        ts::ctx(ts),
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
        &mut registry,
        &character,
        &admin_acl,
        NWN_ITEM_ID,
        NWN_TYPE_ID,
        LOCATION_HASH,
        FUEL_MAX_CAPACITY,
        FUEL_BURN_RATE_IN_MS,
        MAX_PRODUCTION,
        ts.ctx(),
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
            &mut registry,
            &mut nwn,
            &character,
            &admin_acl,
            STORAGE_ITEM_ID,
            STORAGE_TYPE_ID,
            MAX_CAPACITY,
            LOCATION_HASH,
            ts.ctx(),
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
    ts: &mut ts::Scenario,
    user: address,
    character_id: ID,
    storage_id: ID,
    nwn_id: ID,
) {
    let clock = clock::create_for_testing(ts.ctx());
    ts::next_tx(ts, user);
    let mut character = ts::take_shared_by_id<Character>(ts, character_id);
    let (owner_cap, receipt) = character.borrow_owner_cap<NetworkNode>(
        ts::most_recent_receiving_ticket<OwnerCap<NetworkNode>>(&character_id),
        ts.ctx(),
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
            ts::most_recent_receiving_ticket<OwnerCap<StorageUnit>>(&character_id),
            ts.ctx(),
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
    ts: &mut ts::Scenario,
    storage_id: ID,
    character_id: ID,
    user: address,
    item_id: u64,
    type_id: u64,
    volume: u64,
    quantity: u32,
) {
    ts::next_tx(ts, user);
    {
        let mut character = ts::take_shared_by_id<Character>(ts, character_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<T>(
            ts::most_recent_receiving_ticket<OwnerCap<T>>(&character_id),
            ts.ctx(),
        );
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
        storage_unit.game_item_to_chain_inventory_test<T>(
            &character,
            &owner_cap,
            item_id,
            type_id,
            volume,
            quantity,
            ts.ctx(),
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

    // Seed SSU main inventory (AMM liquidity — keyed by SSU owner cap)
    if (liq_a > 0) {
        mint_token<StorageUnit>(
            ts,
            storage_id,
            owner_char_id,
            user_b(),
            TOKEN_A_ITEM_ID,
            TOKEN_A_TYPE_ID,
            TOKEN_A_VOLUME,
            liq_a,
        );
    };
    if (liq_b > 0) {
        mint_token<StorageUnit>(
            ts,
            storage_id,
            owner_char_id,
            user_b(),
            TOKEN_B_ITEM_ID,
            TOKEN_B_TYPE_ID,
            TOKEN_B_VOLUME,
            liq_b,
        );
    };

    // Seed trader tokens in SSU main inventory (swap's withdraw_item reads from main)
    // In production, the trader deposits via game UI which puts items in main inventory.
    if (trader_a > 0) {
        mint_token<StorageUnit>(
            ts,
            storage_id,
            owner_char_id,
            user_b(),
            TOKEN_A_ITEM_ID,
            TOKEN_A_TYPE_ID,
            TOKEN_A_VOLUME,
            trader_a,
        );
    };
    if (trader_b > 0) {
        mint_token<StorageUnit>(
            ts,
            storage_id,
            owner_char_id,
            user_b(),
            TOKEN_B_ITEM_ID,
            TOKEN_B_TYPE_ID,
            TOKEN_B_VOLUME,
            trader_b,
        );
    };

    // Authorize AMMAuth
    ts::next_tx(ts, user_b());
    {
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(ts, owner_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<StorageUnit>(
            ts::most_recent_receiving_ticket<OwnerCap<StorageUnit>>(&owner_char_id),
            ts.ctx(),
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

/// Helper: create pool. Tokens are already in SSU main inventory from setup_pool_env.
/// The pool tracks reserves but actual items stay in main inventory until swap moves them.
/// For swap tests, the trader deposits to main via game UI, swap moves main→open (input) and open→main (output).
/// We seed the open inventory by depositing items directly via the owner cap.
fun create_test_pool(
    ts: &mut ts::Scenario,
    storage_id: ID,
    owner_char_id: ID,
    reserve_a: u64,
    reserve_b: u64,
    amp: u64,
    fee_bps: u64,
): ID {
    // Create the pool object
    ts::next_tx(ts, user_b());
    let storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
    let admin_cap = amm::create_pool(
        &storage_unit,
        TOKEN_A_TYPE_ID,
        TOKEN_B_TYPE_ID,
        reserve_a,
        reserve_b,
        amp,
        fee_bps,
        utf8(b"Test pool"),
        ts.ctx(),
    );
    let admin_cap_id = object::id(&admin_cap);
    transfer::public_transfer(admin_cap, user_b());
    ts::return_shared(storage_unit);

    // Seed the open inventory with liquidity tokens using the owner's character.
    // add_liquidity moves main → open, which requires items in the SSU's character-keyed main inventory.
    // The setup_pool_env minted items via game_item_to_chain_inventory_test which puts them in the
    // SSU owner cap's slot. We need to use that same path.
    ts::next_tx(ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(ts, storage_id);
        let character = ts::take_shared_by_id<Character>(ts, owner_char_id);

        amm::add_liquidity(
            &mut pool,
            &admin_cap,
            &mut storage_unit,
            &character,
            TOKEN_A_TYPE_ID,
            (reserve_a as u32),
            ts.ctx(),
        );
        amm::add_liquidity(
            &mut pool,
            &admin_cap,
            &mut storage_unit,
            &character,
            TOKEN_B_TYPE_ID,
            (reserve_b as u32),
            ts.ctx(),
        );

        // add_liquidity increments reserves on top of create_pool's initial values, so reset
        amm::set_reserves(&mut pool, &admin_cap, reserve_a, reserve_b);

        ts::return_to_sender(ts, admin_cap);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    admin_cap_id
}

// ============================================================
// Integration: swap A→B
// ============================================================

#[test]
/// Stable pool: 100/100, amp=50, 30 bps fee. Swap 10 A → B.
/// Full flow: deposit_for_swap → swap → withdraw_from_swap.
fun test_swap_a_for_b() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _trader_char_id, _ssu_cap, _trader_cap) = setup_pool_env(
        &mut ts,
        100,
        100,
        10,
        0,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    // Step 1: deposit_for_swap — lock 10 A from SSU owner inventory into open
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let character = ts::take_shared_by_id<Character>(&ts, owner_char_id);

        amm::deposit_for_swap(
            &mut pool,
            &mut storage_unit,
            &character,
            TOKEN_A_TYPE_ID,
            10,
            ts.ctx(),
        );

        // Verify deposit balance
        let (ba, bb) = amm::player_deposit(&pool, user_b());
        assert!(ba == 10, ba);
        assert!(bb == 0, bb);

        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Step 2: swap — debit 10 A, credit output B
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);

        amm::swap(
            &mut pool,
            TOKEN_A_TYPE_ID,
            10,
            1,
            ts.ctx(),
        );

        // Verify deposit balance updated: A debited, B credited
        let (ba, bb) = amm::player_deposit(&pool, user_b());
        assert!(ba == 0, ba);
        assert!(bb > 0, bb);

        ts::return_shared(pool);
    };

    // Step 3: withdraw_from_swap — collect B output
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let character = ts::take_shared_by_id<Character>(&ts, owner_char_id);

        let (_, bb) = amm::player_deposit(&pool, user_b());
        amm::withdraw_from_swap(
            &mut pool,
            &mut storage_unit,
            &character,
            TOKEN_B_TYPE_ID,
            bb,
            ts.ctx(),
        );

        // Verify deposit fully withdrawn
        let (ba2, bb2) = amm::player_deposit(&pool, user_b());
        assert!(ba2 == 0, ba2);
        assert!(bb2 == 0, bb2);

        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify reserves changed
    ts::next_tx(&mut ts, admin());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        let ra = amm::reserve_a(&pool);
        let rb = amm::reserve_b(&pool);
        assert!(ra > 100, ra);
        assert!(rb < 100, rb);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Integration: swap B→A
// ============================================================

#[test]
/// Stable pool: 1000/1000, amp=100, 300 bps fee. Swap 100 B → A.
fun test_swap_b_for_a_with_fees() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _trader_char_id, _ssu_cap, _trader_cap) = setup_pool_env(
        &mut ts,
        1000,
        1000,
        0,
        100,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 1000, 1000, 100, 300);

    // deposit → swap → withdraw
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let character = ts::take_shared_by_id<Character>(&ts, owner_char_id);

        amm::deposit_for_swap(
            &mut pool,
            &mut storage_unit,
            &character,
            TOKEN_B_TYPE_ID,
            100,
            ts.ctx(),
        );

        amm::swap(&mut pool, TOKEN_B_TYPE_ID, 100, 1, ts.ctx());

        let (ba, _) = amm::player_deposit(&pool, user_b());
        amm::withdraw_from_swap(
            &mut pool,
            &mut storage_unit,
            &character,
            TOKEN_A_TYPE_ID,
            ba,
            ts.ctx(),
        );

        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify reserves shifted
    ts::next_tx(&mut ts, admin());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        let ra = amm::reserve_a(&pool);
        let rb = amm::reserve_b(&pool);
        assert!(ra < 1000, ra);
        assert!(rb > 1000, rb);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Integration: fee config + dynamic fees
// ============================================================

#[test]
/// Pool with dynamic fees: worsening trades pay surge, rebalancing gets bonus.
fun test_dynamic_fees_and_bonus() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _trader_char_id, _ssu_cap, _trader_cap) = setup_pool_env(
        &mut ts,
        1000,
        1000,
        200,
        200,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 1000, 1000, 100, 100);

    // Init fee config: 500 bps surge, 300 bps bonus
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(&ts);
        amm::init_fee_config(&mut pool, &admin_cap, 500, 300);
        ts::return_to_sender(&ts, admin_cap);
        ts::return_shared(pool);
    };

    // First swap: A→B (at balance, this is worsening — pushes A up)
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let character = ts::take_shared_by_id<Character>(&ts, owner_char_id);

        amm::deposit_for_swap(
            &mut pool,
            &mut storage_unit,
            &character,
            TOKEN_A_TYPE_ID,
            100,
            ts.ctx(),
        );
        amm::swap(&mut pool, TOKEN_A_TYPE_ID, 100, 1, ts.ctx());

        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify fees accumulated
    ts::next_tx(&mut ts, admin());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        // After A→B swap, fee collected in token A
        let fpa = amm::fee_pool_a(&pool);
        assert!(fpa > 0, fpa);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Integration: add_liquidity
// ============================================================

#[test]
/// Admin adds more liquidity after pool creation.
fun test_add_liquidity() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, trader_char_id, ssu_cap, trader_cap) = setup_pool_env(
        &mut ts,
        200,
        200,
        0,
        0,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    // Add 50 more of token A
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let mut character = ts::take_shared_by_id<Character>(&ts, owner_char_id);
        let (owner_cap, receipt) = character.borrow_owner_cap<StorageUnit>(
            ts::most_recent_receiving_ticket<OwnerCap<StorageUnit>>(&owner_char_id),
            ts.ctx(),
        );

        amm::add_liquidity(
            &mut pool,
            &admin_cap,
            &mut storage_unit,
            &character,
            TOKEN_A_TYPE_ID,
            50,
            ts.ctx(),
        );

        character.return_owner_cap(owner_cap, receipt);
        ts::return_to_sender(&ts, admin_cap);
        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    // Verify reserve_a increased
    ts::next_tx(&mut ts, admin());
    {
        let pool = ts::take_shared<AMMPool>(&ts);
        assert!(amm::reserve_a(&pool) == 150, 0);
        assert!(amm::reserve_b(&pool) == 100, 1);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Integration: set_reserves
// ============================================================

#[test]
/// Admin syncs reserves with actual inventory.
fun test_set_reserves() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(&ts);
        amm::set_reserves(&mut pool, &admin_cap, 500, 500);
        assert!(amm::reserve_a(&pool) == 500, 0);
        assert!(amm::reserve_b(&pool) == 500, 1);
        ts::return_to_sender(&ts, admin_cap);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Integration: admin config updates
// ============================================================

#[test]
/// Admin updates fee bps.
fun test_update_fee_bps() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(&ts);
        amm::update_fee_bps(&mut pool, &admin_cap, 500);
        assert!(amm::fee_bps(&pool) == 500, 0);
        ts::return_to_sender(&ts, admin_cap);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

#[test]
/// Admin updates target ratio.
fun test_update_target_ratio() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(&ts);
        amm::update_target_ratio(&mut pool, &admin_cap, 3000, 1000);
        assert!(amm::target_a(&pool) == 3000, 0);
        assert!(amm::target_b(&pool) == 1000, 1);
        ts::return_to_sender(&ts, admin_cap);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

#[test]
/// Admin updates banner.
fun test_update_banner() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let admin_cap = ts::take_from_sender<AMMAdminCap>(&ts);
        amm::update_banner(&mut pool, &admin_cap, utf8(b"New banner"));
        assert!(amm::banner(&pool) == utf8(b"New banner"), 0);
        ts::return_to_sender(&ts, admin_cap);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Negative tests: access control
// ============================================================

#[test]
#[expected_failure(abort_code = amm::ENotOwner)]
/// Non-owner cannot set reserves.
fun test_set_reserves_not_owner() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    // Create a second pool to get a different admin cap
    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let wrong_cap = amm::create_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID,
            TOKEN_B_TYPE_ID,
            50,
            50,
            10,
            0,
            utf8(b"Other pool"),
            ts.ctx(),
        );

        // Try to use wrong cap on the first pool — should abort
        let mut pool = ts::take_shared<AMMPool>(&ts);
        amm::set_reserves(&mut pool, &wrong_cap, 999, 999);

        transfer::public_transfer(wrong_cap, user_b());
        ts::return_shared(pool);
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}

#[test]
#[expected_failure(abort_code = amm::EInvalidTypeId)]
/// Swap with invalid type_id should abort.
fun test_swap_invalid_type_id() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _trader_char_id, _, _) = setup_pool_env(
        &mut ts,
        100,
        100,
        10,
        0,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);

        // Use a bogus type_id — should abort with EInvalidTypeId
        amm::swap(&mut pool, 99999, 10, 1, ts.ctx());

        ts::return_shared(pool);
    };

    ts::end(ts);
}

#[test]
#[expected_failure(abort_code = amm::EInsufficientOutput)]
/// Swap with min_out too high should abort.
fun test_swap_min_out_too_high() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _trader_char_id, _, _) = setup_pool_env(
        &mut ts,
        100,
        100,
        10,
        0,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    // Deposit first so the swap reaches the output check
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);
        let mut storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let character = ts::take_shared_by_id<Character>(&ts, owner_char_id);

        amm::deposit_for_swap(
            &mut pool,
            &mut storage_unit,
            &character,
            TOKEN_A_TYPE_ID,
            10,
            ts.ctx(),
        );

        // min_out = 999 is impossibly high
        amm::swap(&mut pool, TOKEN_A_TYPE_ID, 10, 999, ts.ctx());

        ts::return_shared(character);
        ts::return_shared(storage_unit);
        ts::return_shared(pool);
    };

    ts::end(ts);
}

#[test]
#[expected_failure(abort_code = amm::EZeroAmount)]
/// Swap with amount_in = 0 should abort.
fun test_swap_zero_amount() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _trader_char_id, _, _) = setup_pool_env(
        &mut ts,
        100,
        100,
        10,
        0,
    );

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);

        amm::swap(&mut pool, TOKEN_A_TYPE_ID, 0, 0, ts.ctx());

        ts::return_shared(pool);
    };

    ts::end(ts);
}

#[test]
#[expected_failure(abort_code = amm::EInsufficientDeposit)]
/// Swap without deposit should abort.
fun test_swap_without_deposit() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 10, 0);

    create_test_pool(&mut ts, storage_id, owner_char_id, 100, 100, 50, 30);

    // Try to swap without depositing first
    ts::next_tx(&mut ts, user_b());
    {
        let mut pool = ts::take_shared<AMMPool>(&ts);

        // deposit_for_swap never called — should fail with EInsufficientDeposit
        amm::swap(&mut pool, TOKEN_A_TYPE_ID, 10, 1, ts.ctx());

        ts::return_shared(pool);
    };

    ts::end(ts);
}

// ============================================================
// Negative tests: pool creation
// ============================================================

#[test]
#[expected_failure(abort_code = amm::EInvalidAmp)]
/// amp = 0 should fail.
fun test_create_pool_zero_amp() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID,
            TOKEN_B_TYPE_ID,
            100,
            100,
            0,
            30,
            utf8(b"Bad pool"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}

#[test]
#[expected_failure(abort_code = amm::EInvalidFee)]
/// fee_bps > 10000 should fail.
fun test_create_pool_fee_too_high() {
    let mut ts = ts::begin(governor());
    let (storage_id, owner_char_id, _, _, _) = setup_pool_env(&mut ts, 100, 100, 0, 0);

    ts::next_tx(&mut ts, user_b());
    {
        let storage_unit = ts::take_shared_by_id<StorageUnit>(&ts, storage_id);
        let admin_cap = amm::create_pool(
            &storage_unit,
            TOKEN_A_TYPE_ID,
            TOKEN_B_TYPE_ID,
            100,
            100,
            50,
            10001,
            utf8(b"Bad pool"),
            ts.ctx(),
        );
        transfer::public_transfer(admin_cap, user_b());
        ts::return_shared(storage_unit);
    };

    ts::end(ts);
}
