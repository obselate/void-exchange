/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module handles the in-game Network Node functionality
 * 
 * The Network node is an energy source for all the assemblies connected to it It
 * can be fuelled and burn fuel to produce energy in GJ This energy can be used by
 * the assemblies to perform actions like online, bridging items, etc Assemblies
 * have to be connected to a network node to reserve and release energy
 * 
 * Future: There might be multiple power sources connected together to generate
 * more energy that can be used by assemblies in the base
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
import * as status from './status.js';
import * as location from './location.js';
import * as fuel from './fuel.js';
import * as energy from './energy.js';
import * as metadata from './metadata.js';
const $moduleName = '@local-pkg/world::network_node';
export const OfflineAssemblies = new MoveStruct({ name: `${$moduleName}::OfflineAssemblies`, fields: {
        assembly_ids: bcs.vector(bcs.Address)
    } });
export const HandleOrphanedAssemblies = new MoveStruct({ name: `${$moduleName}::HandleOrphanedAssemblies`, fields: {
        assembly_ids: bcs.vector(bcs.Address)
    } });
export const UpdateEnergySources = new MoveStruct({ name: `${$moduleName}::UpdateEnergySources`, fields: {
        assembly_ids: bcs.vector(bcs.Address)
    } });
export const NetworkNode = new MoveStruct({ name: `${$moduleName}::NetworkNode`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        status: status.AssemblyStatus,
        location: location.Location,
        fuel: fuel.Fuel,
        energy_source: energy.EnergySource,
        metadata: bcs.option(metadata.Metadata),
        connected_assembly_ids: bcs.vector(bcs.Address)
    } });
export const NetworkNodeCreatedEvent = new MoveStruct({ name: `${$moduleName}::NetworkNodeCreatedEvent`, fields: {
        network_node_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        fuel_max_capacity: bcs.u64(),
        fuel_burn_rate_in_ms: bcs.u64(),
        max_energy_production: bcs.u64()
    } });
export interface DepositFuelArguments {
    nwn: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    volume: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number | bigint>;
}
export interface DepositFuelOptions {
    package?: string;
    arguments: DepositFuelArguments | [
        nwn: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        volume: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number | bigint>
    ];
}
export function depositFuel(options: DepositFuelOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "adminAcl", "ownerCap", "typeId", "volume", "quantity"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'deposit_fuel',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface WithdrawFuelArguments {
    nwn: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    quantity: RawTransactionArgument<number | bigint>;
}
export interface WithdrawFuelOptions {
    package?: string;
    arguments: WithdrawFuelArguments | [
        nwn: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        quantity: RawTransactionArgument<number | bigint>
    ];
}
export function withdrawFuel(options: WithdrawFuelOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "adminAcl", "ownerCap", "typeId", "quantity"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'withdraw_fuel',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OnlineArguments {
    nwn: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OnlineOptions {
    package?: string;
    arguments: OnlineArguments | [
        nwn: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
export function online(options: OnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineArguments {
    nwn: RawTransactionArgument<string>;
    fuelConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OfflineOptions {
    package?: string;
    arguments: OfflineArguments | [
        nwn: RawTransactionArgument<string>,
        fuelConfig: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
/**
 * Takes the network node offline and returns a hot potato that must be consumed by
 * bringing all connected assemblies offline in the same transaction
 */
export function offline(options: OfflineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "fuelConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'offline',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataNameArguments {
    nwn: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface UpdateMetadataNameOptions {
    package?: string;
    arguments: UpdateMetadataNameArguments | [
        nwn: RawTransactionArgument<string>,
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
    const parameterNames = ["nwn", "ownerCap", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'update_metadata_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataDescriptionArguments {
    nwn: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
}
export interface UpdateMetadataDescriptionOptions {
    package?: string;
    arguments: UpdateMetadataDescriptionArguments | [
        nwn: RawTransactionArgument<string>,
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
    const parameterNames = ["nwn", "ownerCap", "description"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'update_metadata_description',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataUrlArguments {
    nwn: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    url: RawTransactionArgument<string>;
}
export interface UpdateMetadataUrlOptions {
    package?: string;
    arguments: UpdateMetadataUrlArguments | [
        nwn: RawTransactionArgument<string>,
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
    const parameterNames = ["nwn", "ownerCap", "url"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'update_metadata_url',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ConnectedAssembliesArguments {
    nwn: RawTransactionArgument<string>;
}
export interface ConnectedAssembliesOptions {
    package?: string;
    arguments: ConnectedAssembliesArguments | [
        nwn: RawTransactionArgument<string>
    ];
}
/** Returns the list of connected assembly IDs */
export function connectedAssemblies(options: ConnectedAssembliesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'connected_assemblies',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsAssemblyConnectedArguments {
    nwn: RawTransactionArgument<string>;
    assemblyId: RawTransactionArgument<string>;
}
export interface IsAssemblyConnectedOptions {
    package?: string;
    arguments: IsAssemblyConnectedArguments | [
        nwn: RawTransactionArgument<string>,
        assemblyId: RawTransactionArgument<string>
    ];
}
/** Checks if an assembly is connected to this network node */
export function isAssemblyConnected(options: IsAssemblyConnectedOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "assemblyId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'is_assembly_connected',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsNetworkNodeOnlineArguments {
    nwn: RawTransactionArgument<string>;
}
export interface IsNetworkNodeOnlineOptions {
    package?: string;
    arguments: IsNetworkNodeOnlineArguments | [
        nwn: RawTransactionArgument<string>
    ];
}
export function isNetworkNodeOnline(options: IsNetworkNodeOnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'is_network_node_online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerCapIdArguments {
    nwn: RawTransactionArgument<string>;
}
export interface OwnerCapIdOptions {
    package?: string;
    arguments: OwnerCapIdArguments | [
        nwn: RawTransactionArgument<string>
    ];
}
export function ownerCapId(options: OwnerCapIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'owner_cap_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface FuelQuantityArguments {
    nwn: RawTransactionArgument<string>;
}
export interface FuelQuantityOptions {
    package?: string;
    arguments: FuelQuantityArguments | [
        nwn: RawTransactionArgument<string>
    ];
}
export function fuelQuantity(options: FuelQuantityOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'fuel_quantity',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IdsLengthArguments {
    offlineAssemblies: TransactionArgument;
}
export interface IdsLengthOptions {
    package?: string;
    arguments: IdsLengthArguments | [
        offlineAssemblies: TransactionArgument
    ];
}
export function idsLength(options: IdsLengthOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["offlineAssemblies"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'ids_length',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OrphanedAssembliesLengthArguments {
    orphanedAssemblies: TransactionArgument;
}
export interface OrphanedAssembliesLengthOptions {
    package?: string;
    arguments: OrphanedAssembliesLengthArguments | [
        orphanedAssemblies: TransactionArgument
    ];
}
export function orphanedAssembliesLength(options: OrphanedAssembliesLengthOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["orphanedAssemblies"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'orphaned_assemblies_length',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourcesIdsLengthArguments {
    updateEnergySources: TransactionArgument;
}
export interface UpdateEnergySourcesIdsLengthOptions {
    package?: string;
    arguments: UpdateEnergySourcesIdsLengthArguments | [
        updateEnergySources: TransactionArgument
    ];
}
export function updateEnergySourcesIdsLength(options: UpdateEnergySourcesIdsLengthOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["updateEnergySources"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'update_energy_sources_ids_length',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface NeedUpdateArguments {
    nwn: RawTransactionArgument<string>;
    fuelConfig: RawTransactionArgument<string>;
}
export interface NeedUpdateOptions {
    package?: string;
    arguments: NeedUpdateArguments | [
        nwn: RawTransactionArgument<string>,
        fuelConfig: RawTransactionArgument<string>
    ];
}
export function needUpdate(options: NeedUpdateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "fuelConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'need_update',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevealLocationArguments {
    nwn: RawTransactionArgument<string>;
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
        nwn: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        solarsystem: RawTransactionArgument<number | bigint>,
        x: RawTransactionArgument<string>,
        y: RawTransactionArgument<string>,
        z: RawTransactionArgument<string>
    ];
}
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
    const parameterNames = ["nwn", "registry", "adminAcl", "solarsystem", "x", "y", "z"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'reveal_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AnchorArguments {
    registry: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    itemId: RawTransactionArgument<number | bigint>;
    typeId: RawTransactionArgument<number | bigint>;
    locationHash: RawTransactionArgument<Array<number>>;
    fuelMaxCapacity: RawTransactionArgument<number | bigint>;
    fuelBurnRateInMs: RawTransactionArgument<number | bigint>;
    maxEnergyProduction: RawTransactionArgument<number | bigint>;
}
export interface AnchorOptions {
    package?: string;
    arguments: AnchorArguments | [
        registry: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        itemId: RawTransactionArgument<number | bigint>,
        typeId: RawTransactionArgument<number | bigint>,
        locationHash: RawTransactionArgument<Array<number>>,
        fuelMaxCapacity: RawTransactionArgument<number | bigint>,
        fuelBurnRateInMs: RawTransactionArgument<number | bigint>,
        maxEnergyProduction: RawTransactionArgument<number | bigint>
    ];
}
export function anchor(options: AnchorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        'vector<u8>',
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "character", "adminAcl", "itemId", "typeId", "locationHash", "fuelMaxCapacity", "fuelBurnRateInMs", "maxEnergyProduction"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'anchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ShareNetworkNodeArguments {
    nwn: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface ShareNetworkNodeOptions {
    package?: string;
    arguments: ShareNetworkNodeArguments | [
        nwn: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function shareNetworkNode(options: ShareNetworkNodeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'share_network_node',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ConnectAssembliesArguments {
    nwn: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    assemblyIds: RawTransactionArgument<Array<string>>;
}
export interface ConnectAssembliesOptions {
    package?: string;
    arguments: ConnectAssembliesArguments | [
        nwn: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        assemblyIds: RawTransactionArgument<Array<string>>
    ];
}
/**
 * Connects assemblies to the network node and returns a hot potato that must be
 * consumed by updating each assembly's energy source in the same transaction. For
 * each assembly, call assembly::update_energy_source_connected_assembly or
 * storage_unit::update_energy_source_connected_storage_unit, then
 * destroy_update_energy_sources. Note: UpdateEnergySources hot potato enforces
 * that all connected assemblies have their energy sources updated before the
 * transaction completes.
 */
export function connectAssemblies(options: ConnectAssembliesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'vector<0x2::object::ID>'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "adminAcl", "assemblyIds"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'connect_assemblies',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorArguments {
    nwn: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOptions {
    package?: string;
    arguments: UnanchorArguments | [
        nwn: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Unanchors the network node and returns HandleOrphanedAssemblies hot potato that
 * must be consumed by processing each connected assembly in the same transaction.
 * For each assembly call unanchor_connected_assembly or
 * unanchor_connected_storage_unit (brings offline, releases energy, clears energy
 * source). After all assemblies are processed, call destroy_network_node with the
 * hot potato to destroy the network node.
 */
export function unanchor(options: UnanchorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'unanchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DestroyNetworkNodeArguments {
    nwn: RawTransactionArgument<string>;
    orphanedAssemblies: TransactionArgument;
    adminAcl: RawTransactionArgument<string>;
}
export interface DestroyNetworkNodeOptions {
    package?: string;
    arguments: DestroyNetworkNodeArguments | [
        nwn: RawTransactionArgument<string>,
        orphanedAssemblies: TransactionArgument,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Destroys the network node after all connected assemblies have been processed
 * (offline + energy source cleared) Must be called after processing all assemblies
 * from the hot potato returned by unanchor
 */
export function destroyNetworkNode(options: DestroyNetworkNodeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "orphanedAssemblies", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'destroy_network_node',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateFuelArguments {
    nwn: RawTransactionArgument<string>;
    fuelConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UpdateFuelOptions {
    package?: string;
    arguments: UpdateFuelArguments | [
        nwn: RawTransactionArgument<string>,
        fuelConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Updates fuel and returns a hot potato if the network node goes offline due to
 * fuel depletion The client must bring all connected assemblies offline using the
 * hot potato
 */
export function updateFuel(options: UpdateFuelOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["nwn", "fuelConfig", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'update_fuel',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DestroyOfflineAssembliesArguments {
    offlineAssemblies: TransactionArgument;
}
export interface DestroyOfflineAssembliesOptions {
    package?: string;
    arguments: DestroyOfflineAssembliesArguments | [
        offlineAssemblies: TransactionArgument
    ];
}
/**
 * Destroys the hot potato, ensuring all assemblies have been processed Must be
 * called at the end of the transaction after all assemblies are offline The hot
 * potato itself serves as authorization since it can only be obtained from capped
 * functions
 */
export function destroyOfflineAssemblies(options: DestroyOfflineAssembliesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["offlineAssemblies"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'destroy_offline_assemblies',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DestroyUpdateEnergySourcesArguments {
    updateEnergySources: TransactionArgument;
}
export interface DestroyUpdateEnergySourcesOptions {
    package?: string;
    arguments: DestroyUpdateEnergySourcesArguments | [
        updateEnergySources: TransactionArgument
    ];
}
/**
 * Destroys the UpdateEnergySources hot potato; call after updating energy source
 * for each connected assembly
 */
export function destroyUpdateEnergySources(options: DestroyUpdateEnergySourcesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["updateEnergySources"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'destroy_update_energy_sources',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DestroyOrphanedAssembliesArguments {
    orphanedAssemblies: TransactionArgument;
}
export interface DestroyOrphanedAssembliesOptions {
    package?: string;
    arguments: DestroyOrphanedAssembliesArguments | [
        orphanedAssemblies: TransactionArgument
    ];
}
/**
 * Destroys the HandleOrphanedAssemblies hot potato; call after processing each
 * assembly with unanchor_connected_assembly
 */
export function destroyOrphanedAssemblies(options: DestroyOrphanedAssembliesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["orphanedAssemblies"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'network_node',
        function: 'destroy_orphaned_assemblies',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}