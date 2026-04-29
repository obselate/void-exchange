/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module handles all the operations for generalized assemblies Basic
 * operations are anchor, unanchor, online, offline and destroy
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
import * as status_1 from './status.js';
import * as location from './location.js';
import * as metadata from './metadata.js';
const $moduleName = '@local-pkg/world::assembly';
export const Assembly = new MoveStruct({ name: `${$moduleName}::Assembly`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        status: status_1.AssemblyStatus,
        location: location.Location,
        energy_source_id: bcs.option(bcs.Address),
        metadata: bcs.option(metadata.Metadata)
    } });
export const AssemblyCreatedEvent = new MoveStruct({ name: `${$moduleName}::AssemblyCreatedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64()
    } });
export interface OnlineArguments {
    assembly: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OnlineOptions {
    package?: string;
    arguments: OnlineArguments | [
        assembly: RawTransactionArgument<string>,
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
    const parameterNames = ["assembly", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineArguments {
    assembly: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OfflineOptions {
    package?: string;
    arguments: OfflineArguments | [
        assembly: RawTransactionArgument<string>,
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
    const parameterNames = ["assembly", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'offline',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataNameArguments {
    assembly: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface UpdateMetadataNameOptions {
    package?: string;
    arguments: UpdateMetadataNameArguments | [
        assembly: RawTransactionArgument<string>,
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
    const parameterNames = ["assembly", "ownerCap", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'update_metadata_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataDescriptionArguments {
    assembly: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
}
export interface UpdateMetadataDescriptionOptions {
    package?: string;
    arguments: UpdateMetadataDescriptionArguments | [
        assembly: RawTransactionArgument<string>,
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
    const parameterNames = ["assembly", "ownerCap", "description"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'update_metadata_description',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataUrlArguments {
    assembly: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    url: RawTransactionArgument<string>;
}
export interface UpdateMetadataUrlOptions {
    package?: string;
    arguments: UpdateMetadataUrlArguments | [
        assembly: RawTransactionArgument<string>,
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
    const parameterNames = ["assembly", "ownerCap", "url"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'update_metadata_url',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevealLocationArguments {
    assembly: RawTransactionArgument<string>;
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
        assembly: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        solarsystem: RawTransactionArgument<number | bigint>,
        x: RawTransactionArgument<string>,
        y: RawTransactionArgument<string>,
        z: RawTransactionArgument<string>
    ];
}
/**
 * Reveals plain-text location (solarsystem, x, y, z) for this assembly. Admin ACL
 * only. Optional; enables dapps (e.g. route maps). Temporary: use until the
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
    const parameterNames = ["assembly", "registry", "adminAcl", "solarsystem", "x", "y", "z"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'reveal_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StatusArguments {
    assembly: RawTransactionArgument<string>;
}
export interface StatusOptions {
    package?: string;
    arguments: StatusArguments | [
        assembly: RawTransactionArgument<string>
    ];
}
export function status(options: StatusOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'status',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerCapIdArguments {
    assembly: RawTransactionArgument<string>;
}
export interface OwnerCapIdOptions {
    package?: string;
    arguments: OwnerCapIdArguments | [
        assembly: RawTransactionArgument<string>
    ];
}
export function ownerCapId(options: OwnerCapIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'owner_cap_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EnergySourceIdArguments {
    assembly: RawTransactionArgument<string>;
}
export interface EnergySourceIdOptions {
    package?: string;
    arguments: EnergySourceIdArguments | [
        assembly: RawTransactionArgument<string>
    ];
}
/** Returns the assembly's energy source (network node) ID if set */
export function energySourceId(options: EnergySourceIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'energy_source_id',
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
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "networkNode", "character", "adminAcl", "itemId", "typeId", "locationHash"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'anchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ShareAssemblyArguments {
    assembly: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface ShareAssemblyOptions {
    package?: string;
    arguments: ShareAssemblyArguments | [
        assembly: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function shareAssembly(options: ShareAssemblyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'share_assembly',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceArguments {
    assembly: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceOptions {
    package?: string;
    arguments: UpdateEnergySourceArguments | [
        assembly: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/** Updates the energy source (network node) for an assembly */
export function updateEnergySource(options: UpdateEnergySourceOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly", "networkNode", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'update_energy_source',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceConnectedAssemblyArguments {
    assembly: RawTransactionArgument<string>;
    updateEnergySources: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceConnectedAssemblyOptions {
    package?: string;
    arguments: UpdateEnergySourceConnectedAssemblyArguments | [
        assembly: RawTransactionArgument<string>,
        updateEnergySources: TransactionArgument,
        networkNode: RawTransactionArgument<string>
    ];
}
/**
 * Updates the assembly's energy source and removes it from the UpdateEnergySources
 * hot potato. Must be called for each assembly in the hot potato returned by
 * connect_assemblies.
 */
export function updateEnergySourceConnectedAssembly(options: UpdateEnergySourceConnectedAssemblyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly", "updateEnergySources", "networkNode"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'update_energy_source_connected_assembly',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineConnectedAssemblyArguments {
    assembly: RawTransactionArgument<string>;
    offlineAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineConnectedAssemblyOptions {
    package?: string;
    arguments: OfflineConnectedAssemblyArguments | [
        assembly: RawTransactionArgument<string>,
        offlineAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/**
 * Brings a connected assembly offline and removes it from the hot potato Must be
 * called for each assembly in the hot potato list Returns the updated hot potato
 * with the processed assembly removed After all assemblies are processed, call
 * destroy_offline_assemblies to consume the hot potato
 */
export function offlineConnectedAssembly(options: OfflineConnectedAssemblyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly", "offlineAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'offline_connected_assembly',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineOrphanedAssemblyArguments {
    assembly: RawTransactionArgument<string>;
    orphanedAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineOrphanedAssemblyOptions {
    package?: string;
    arguments: OfflineOrphanedAssemblyArguments | [
        assembly: RawTransactionArgument<string>,
        orphanedAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/**
 * Brings a connected assembly offline, releases energy, clears energy source, and
 * removes it from the hot potato Must be called for each assembly in the hot
 * potato returned by nwn.unanchor() Returns the updated HandleOrphanedAssemblies;
 * after all are processed, call destroy_network_node with it
 */
export function offlineOrphanedAssembly(options: OfflineOrphanedAssemblyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly", "orphanedAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'offline_orphaned_assembly',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorArguments {
    assembly: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOptions {
    package?: string;
    arguments: UnanchorArguments | [
        assembly: RawTransactionArgument<string>,
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
    const parameterNames = ["assembly", "networkNode", "energyConfig", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'unanchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorOrphanArguments {
    assembly: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOrphanOptions {
    package?: string;
    arguments: UnanchorOrphanArguments | [
        assembly: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unanchorOrphan(options: UnanchorOrphanOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assembly", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'assembly',
        function: 'unanchor_orphan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}