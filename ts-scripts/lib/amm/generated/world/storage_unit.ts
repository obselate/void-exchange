/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module handles the functionality of the in-game Storage Unit Assembly
 * 
 * The Storage Unit is a programmable, on-chain storage structure. It can allow
 * players to store, withdraw, and manage items under rules they design themselves.
 * The behaviour of a Storage Unit can be customized by registering a custom
 * contract using the typed witness pattern.
 * https://github.com/evefrontier/world-contracts/blob/main/docs/architechture.md#layer-3-player-extensions-moddability
 * 
 * Storage Units support three access modes to enable player-to-player
 * interactions:
 * 
 * 1.  **Extension-based access** (Main inventory):
 *     - Functions: `deposit_item<Auth>`, `withdraw_item<Auth>`
 *     - Allows 3rd party contracts to handle inventory operations on behalf of the
 *       owner
 * 
 * 2.  **Extension-to-owned deposit**:
 *     - Function: `deposit_to_owned<Auth>`
 *     - Allows extensions to push items into a player's owned inventory
 *     - Target is validated as an existing Character (owner_cap_id derived
 *       on-chain)
 *     - Target player does NOT need to be the transaction sender
 *     - Source inventory depends on extension logic (main or owned)
 *     - Enables async trading, guild hangars, automated rewards
 * 
 * 3.  **Owner-direct access** (Owned inventory)
 *     - Functions: `deposit_by_owner`, `withdraw_by_owner`
 *     - Allows the owner to deposit/withdraw from their owned inventory
 *     - Requires OwnerCap + sender == character address
 * 
 * Future pattern: Storage Units (extension-controlled), Ships (owner-controlled)
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
import * as status_1 from './status.js';
import * as location_1 from './location.js';
import * as metadata from './metadata.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = '@local-pkg/world::storage_unit';
export const StorageUnit = new MoveStruct({ name: `${$moduleName}::StorageUnit`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        status: status_1.AssemblyStatus,
        location: location_1.Location,
        inventory_keys: bcs.vector(bcs.Address),
        energy_source_id: bcs.option(bcs.Address),
        metadata: bcs.option(metadata.Metadata),
        extension: bcs.option(type_name.TypeName)
    } });
export const StorageUnitCreatedEvent = new MoveStruct({ name: `${$moduleName}::StorageUnitCreatedEvent`, fields: {
        storage_unit_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        max_capacity: bcs.u64(),
        location_hash: bcs.vector(bcs.u8()),
        status: status_1.Status
    } });
export const ExtensionAuthorizedEvent = new MoveStruct({ name: `${$moduleName}::ExtensionAuthorizedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        extension_type: type_name.TypeName,
        previous_extension: bcs.option(type_name.TypeName),
        owner_cap_id: bcs.Address
    } });
export interface AuthorizeExtensionArguments {
    storageUnit: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface AuthorizeExtensionOptions {
    package?: string;
    arguments: AuthorizeExtensionArguments | [
        storageUnit: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function authorizeExtension(options: AuthorizeExtensionOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'authorize_extension',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface FreezeExtensionConfigArguments {
    storageUnit: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface FreezeExtensionConfigOptions {
    package?: string;
    arguments: FreezeExtensionConfigArguments | [
        storageUnit: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
/**
 * Freezes the storage unit's extension configuration so the owner can no longer
 * change it (builds user trust). Requires an extension to be configured. One-time;
 * cannot be undone.
 */
export function freezeExtensionConfig(options: FreezeExtensionConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'freeze_extension_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OnlineArguments {
    storageUnit: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OnlineOptions {
    package?: string;
    arguments: OnlineArguments | [
        storageUnit: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
export function online(options: OnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineArguments {
    storageUnit: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OfflineOptions {
    package?: string;
    arguments: OfflineArguments | [
        storageUnit: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
export function offline(options: OfflineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'offline',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ChainItemToGameInventoryArguments {
    storageUnit: RawTransactionArgument<string>;
    serverRegistry: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number>;
    locationProof: RawTransactionArgument<Array<number>>;
}
export interface ChainItemToGameInventoryOptions {
    package?: string;
    arguments: ChainItemToGameInventoryArguments | [
        storageUnit: RawTransactionArgument<string>,
        serverRegistry: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number>,
        locationProof: RawTransactionArgument<Array<number>>
    ];
    typeArguments: [
        string
    ];
}
/** Bridges items from chain to game inventory */
export function chainItemToGameInventory(options: ChainItemToGameInventoryOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'u64',
        'u32',
        'vector<u8>',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "serverRegistry", "character", "ownerCap", "typeId", "quantity", "locationProof"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'chain_item_to_game_inventory',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositItemArguments<Auth extends BcsType<any>> {
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    item: RawTransactionArgument<string>;
    _: RawTransactionArgument<Auth>;
}
export interface DepositItemOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: DepositItemArguments<Auth> | [
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        item: RawTransactionArgument<string>,
        _: RawTransactionArgument<Auth>
    ];
    typeArguments: [
        string
    ];
}
export function depositItem<Auth extends BcsType<any>>(options: DepositItemOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "character", "item", "_"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'deposit_item',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawItemArguments<Auth extends BcsType<any>> {
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    _: RawTransactionArgument<Auth>;
    typeId: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number>;
}
export interface WithdrawItemOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: WithdrawItemArguments<Auth> | [
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        _: RawTransactionArgument<Auth>,
        typeId: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number>
    ];
    typeArguments: [
        string
    ];
}
export function withdrawItem<Auth extends BcsType<any>>(options: WithdrawItemOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        `${options.typeArguments[0]}`,
        'u64',
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "character", "_", "typeId", "quantity"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'withdraw_item',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositToOpenInventoryArguments<Auth extends BcsType<any>> {
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    item: RawTransactionArgument<string>;
    _: RawTransactionArgument<Auth>;
}
export interface DepositToOpenInventoryOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: DepositToOpenInventoryArguments<Auth> | [
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        item: RawTransactionArgument<string>,
        _: RawTransactionArgument<Auth>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Extension-only deposit into open storage (contract-controlled). Owners and
 * players can withdraw only via `withdraw_from_open_inventory`, i.e. through
 * extension logic, not directly. Creates the open inventory on first use. Only the
 * registered extension can call this.
 */
export function depositToOpenInventory<Auth extends BcsType<any>>(options: DepositToOpenInventoryOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "character", "item", "_"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'deposit_to_open_inventory',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawFromOpenInventoryArguments<Auth extends BcsType<any>> {
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    _: RawTransactionArgument<Auth>;
    typeId: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number>;
}
export interface WithdrawFromOpenInventoryOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: WithdrawFromOpenInventoryArguments<Auth> | [
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        _: RawTransactionArgument<Auth>,
        typeId: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Extension-only withdraw from open storage. Only the registered extension can
 * call this. Aborts with EOpenStorageNotInitialized if open storage has never been
 * used (no prior deposit_to_open_inventory).
 */
export function withdrawFromOpenInventory<Auth extends BcsType<any>>(options: WithdrawFromOpenInventoryOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        `${options.typeArguments[0]}`,
        'u64',
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "character", "_", "typeId", "quantity"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'withdraw_from_open_inventory',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositToOwnedArguments<Auth extends BcsType<any>> {
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    item: RawTransactionArgument<string>;
    _: RawTransactionArgument<Auth>;
}
export interface DepositToOwnedOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: DepositToOwnedArguments<Auth> | [
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        item: RawTransactionArgument<string>,
        _: RawTransactionArgument<Auth>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Extension-authorized deposit into a player's owned inventory. Unlike
 * `deposit_by_owner`, the recipient (the `character` argument) does NOT need to be
 * the transaction sender. The recipient's owned inventory is derived from
 * `character.owner_cap_id()`, ensuring the character is a valid, existing
 * Character. Creates the owned inventory if it doesn't exist yet.
 */
export function depositToOwned<Auth extends BcsType<any>>(options: DepositToOwnedOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "character", "item", "_"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'deposit_to_owned',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositByOwnerArguments {
    storageUnit: RawTransactionArgument<string>;
    item: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface DepositByOwnerOptions {
    package?: string;
    arguments: DepositByOwnerArguments | [
        storageUnit: RawTransactionArgument<string>,
        item: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function depositByOwner(options: DepositByOwnerOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "item", "character", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'deposit_by_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawByOwnerArguments {
    storageUnit: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number>;
}
export interface WithdrawByOwnerOptions {
    package?: string;
    arguments: WithdrawByOwnerArguments | [
        storageUnit: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number>
    ];
    typeArguments: [
        string
    ];
}
export function withdrawByOwner(options: WithdrawByOwnerOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "character", "ownerCap", "typeId", "quantity"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'withdraw_by_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UpdateMetadataNameArguments {
    storageUnit: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface UpdateMetadataNameOptions {
    package?: string;
    arguments: UpdateMetadataNameArguments | [
        storageUnit: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        name: RawTransactionArgument<string>
    ];
}
export function updateMetadataName(options: UpdateMetadataNameOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "ownerCap", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'update_metadata_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataDescriptionArguments {
    storageUnit: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
}
export interface UpdateMetadataDescriptionOptions {
    package?: string;
    arguments: UpdateMetadataDescriptionArguments | [
        storageUnit: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        description: RawTransactionArgument<string>
    ];
}
export function updateMetadataDescription(options: UpdateMetadataDescriptionOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "ownerCap", "description"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'update_metadata_description',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataUrlArguments {
    storageUnit: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    url: RawTransactionArgument<string>;
}
export interface UpdateMetadataUrlOptions {
    package?: string;
    arguments: UpdateMetadataUrlArguments | [
        storageUnit: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        url: RawTransactionArgument<string>
    ];
}
export function updateMetadataUrl(options: UpdateMetadataUrlOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "ownerCap", "url"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'update_metadata_url',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevealLocationArguments {
    storageUnit: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    solarsystem: RawTransactionArgument<number | bigint>;
    x: RawTransactionArgument<string>;
    y: RawTransactionArgument<string>;
    z: RawTransactionArgument<string>;
}
export interface RevealLocationOptions {
    package?: string;
    arguments: RevealLocationArguments | [
        storageUnit: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        solarsystem: RawTransactionArgument<number | bigint>,
        x: RawTransactionArgument<string>,
        y: RawTransactionArgument<string>,
        z: RawTransactionArgument<string>
    ];
}
/**
 * Reveals plain-text location (solarsystem, x, y, z) for this storage unit. Admin
 * ACL only. Optional; enables dapps (e.g. route maps). Temporary: use until the
 * offchain location reveal service is ready.
 */
export function revealLocation(options: RevealLocationOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        '0x1::string::String',
        '0x1::string::String',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "registry", "adminAcl", "solarsystem", "x", "y", "z"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'reveal_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StatusArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface StatusOptions {
    package?: string;
    arguments: StatusArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
export function status(options: StatusOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'status',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LocationArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface LocationOptions {
    package?: string;
    arguments: LocationArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
export function location(options: LocationOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface InventoryArguments {
    storageUnit: RawTransactionArgument<string>;
    ownerCapId: RawTransactionArgument<string>;
}
export interface InventoryOptions {
    package?: string;
    arguments: InventoryArguments | [
        storageUnit: RawTransactionArgument<string>,
        ownerCapId: RawTransactionArgument<string>
    ];
}
export function inventory(options: InventoryOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "ownerCapId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'inventory',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerCapIdArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface OwnerCapIdOptions {
    package?: string;
    arguments: OwnerCapIdArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
export function ownerCapId(options: OwnerCapIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'owner_cap_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EnergySourceIdArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface EnergySourceIdOptions {
    package?: string;
    arguments: EnergySourceIdArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
/** Returns the storage unit's energy source (network node) ID if set */
export function energySourceId(options: EnergySourceIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'energy_source_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsExtensionFrozenArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface IsExtensionFrozenOptions {
    package?: string;
    arguments: IsExtensionFrozenArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
/**
 * Returns true if the storage unit's extension configuration is frozen (owner
 * cannot change extension).
 */
export function isExtensionFrozen(options: IsExtensionFrozenOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'is_extension_frozen',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OpenStorageKeyArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface OpenStorageKeyOptions {
    package?: string;
    arguments: OpenStorageKeyArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
/**
 * Returns the dynamic field key for open storage (contract-only; no owner or
 * player control). Clients can use this to identify the open slot in
 * inventory_keys and display it separately.
 */
export function openStorageKey(options: OpenStorageKeyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'open_storage_key',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HasOpenStorageArguments {
    storageUnit: RawTransactionArgument<string>;
}
export interface HasOpenStorageOptions {
    package?: string;
    arguments: HasOpenStorageArguments | [
        storageUnit: RawTransactionArgument<string>
    ];
}
/**
 * Returns true if this storage unit has open storage (always true for SSUs
 * anchored with open storage).
 */
export function hasOpenStorage(options: HasOpenStorageOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'has_open_storage',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AnchorArguments {
    registry: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    itemId: RawTransactionArgument<number | bigint>;
    typeId: RawTransactionArgument<number | bigint>;
    maxCapacity: RawTransactionArgument<number | bigint>;
    locationHash: RawTransactionArgument<Array<number>>;
}
export interface AnchorOptions {
    package?: string;
    arguments: AnchorArguments | [
        registry: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        itemId: RawTransactionArgument<number | bigint>,
        typeId: RawTransactionArgument<number | bigint>,
        maxCapacity: RawTransactionArgument<number | bigint>,
        locationHash: RawTransactionArgument<Array<number>>
    ];
}
export function anchor(options: AnchorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'u64',
        'u64',
        'u64',
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "networkNode", "character", "adminAcl", "itemId", "typeId", "maxCapacity", "locationHash"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'anchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ShareStorageUnitArguments {
    storageUnit: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface ShareStorageUnitOptions {
    package?: string;
    arguments: ShareStorageUnitArguments | [
        storageUnit: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function shareStorageUnit(options: ShareStorageUnitOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'share_storage_unit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceArguments {
    storageUnit: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceOptions {
    package?: string;
    arguments: UpdateEnergySourceArguments | [
        storageUnit: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function updateEnergySource(options: UpdateEnergySourceOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "networkNode", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'update_energy_source',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceConnectedStorageUnitArguments {
    storageUnit: RawTransactionArgument<string>;
    updateEnergySources: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceConnectedStorageUnitOptions {
    package?: string;
    arguments: UpdateEnergySourceConnectedStorageUnitArguments | [
        storageUnit: RawTransactionArgument<string>,
        updateEnergySources: TransactionArgument,
        networkNode: RawTransactionArgument<string>
    ];
}
/**
 * Updates the storage unit's energy source and removes it from the
 * UpdateEnergySources hot potato. Must be called for each storage unit in the hot
 * potato returned by connect_assemblies.
 */
export function updateEnergySourceConnectedStorageUnit(options: UpdateEnergySourceConnectedStorageUnitOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "updateEnergySources", "networkNode"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'update_energy_source_connected_storage_unit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineConnectedStorageUnitArguments {
    storageUnit: RawTransactionArgument<string>;
    offlineAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineConnectedStorageUnitOptions {
    package?: string;
    arguments: OfflineConnectedStorageUnitArguments | [
        storageUnit: RawTransactionArgument<string>,
        offlineAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/**
 * Brings a connected storage unit offline and removes it from the hot potato Must
 * be called for each storage unit in the hot potato list Returns the updated hot
 * potato with the processed storage unit removed After all storage units are
 * processed, call destroy_offline_assemblies to consume the hot potato Used for
 * nwn.offline() flow; keeps the energy source so the storage unit can go online
 * again with the same NWN.
 */
export function offlineConnectedStorageUnit(options: OfflineConnectedStorageUnitOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "offlineAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'offline_connected_storage_unit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineOrphanedStorageUnitArguments {
    storageUnit: RawTransactionArgument<string>;
    orphanedAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineOrphanedStorageUnitOptions {
    package?: string;
    arguments: OfflineOrphanedStorageUnitArguments | [
        storageUnit: RawTransactionArgument<string>,
        orphanedAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/**
 * Brings a connected storage unit offline, releases energy, clears energy source,
 * and removes it from the hot potato Must be called for each storage unit in the
 * hot potato returned by nwn.unanchor() Returns the updated
 * HandleOrphanedAssemblies; after all are processed, call destroy_network_node
 * with it
 */
export function offlineOrphanedStorageUnit(options: OfflineOrphanedStorageUnitOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "orphanedAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'offline_orphaned_storage_unit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorArguments {
    storageUnit: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOptions {
    package?: string;
    arguments: UnanchorArguments | [
        storageUnit: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unanchor(options: UnanchorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "networkNode", "energyConfig", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'unanchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorOrphanArguments {
    storageUnit: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOrphanOptions {
    package?: string;
    arguments: UnanchorOrphanArguments | [
        storageUnit: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unanchorOrphan(options: UnanchorOrphanOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'unanchor_orphan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GameItemToChainInventoryArguments {
    storageUnit: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    itemId: RawTransactionArgument<number | bigint>;
    typeId: RawTransactionArgument<number | bigint>;
    volume: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number>;
}
export interface GameItemToChainInventoryOptions {
    package?: string;
    arguments: GameItemToChainInventoryArguments | [
        storageUnit: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        itemId: RawTransactionArgument<number | bigint>,
        typeId: RawTransactionArgument<number | bigint>,
        volume: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number>
    ];
    typeArguments: [
        string
    ];
}
/** Bridges items from game to chain inventory */
export function gameItemToChainInventory(options: GameItemToChainInventoryOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'u64',
        'u64',
        'u64',
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["storageUnit", "adminAcl", "character", "ownerCap", "itemId", "typeId", "volume", "quantity"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'storage_unit',
        function: 'game_item_to_chain_inventory',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}