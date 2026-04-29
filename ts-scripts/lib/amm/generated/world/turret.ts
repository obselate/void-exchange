/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module handles the functionality of in-game Smart Turrets.
 * 
 * A Turret is a programmable structure in space that projects offensive or
 * defensive power over a fixed location. Anchored to another owned Smart Assembly,
 * it operates under builder-defined rules enforced on chain for targeting
 * priorities.
 * 
 * Builders control two key behaviours: InProximity (reacts to ships entering
 * range) and Aggression (responds to hostile actions like starting to attack the
 * base or stopping to attack the base) A configurable on-chain priority queue
 * determines how targets are ranked and attacked. The owner can define custom
 * logic through extension contracts using the typed witness pattern to control the
 * target priority queue.
 * 
 * By default the game calls `world::turret::get_target_priority_list` to get the
 * priority list of targets to attack. If an extension is configured via the auth
 * witness pattern (`authorize_extension`), the game resolves the package id from
 * the configured/authorised type name and calls the `get_target_priority_list`
 * function in the extension package where that auth type is defined.
 */

import { MoveStruct, MoveEnum, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
import * as status_1 from './status.js';
import * as location_1 from './location.js';
import * as metadata from './metadata.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = '@local-pkg/world::turret';
export const Turret = new MoveStruct({ name: `${$moduleName}::Turret`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        status: status_1.AssemblyStatus,
        location: location_1.Location,
        energy_source_id: bcs.option(bcs.Address),
        metadata: bcs.option(metadata.Metadata),
        extension: bcs.option(type_name.TypeName)
    } });
/**
 * Reason for invoking get_target_priority_list; the game sends exactly one per
 * target candidate.
 */
export const BehaviourChangeReason = new MoveEnum({ name: `${$moduleName}::BehaviourChangeReason`, fields: {
        UNSPECIFIED: null,
        ENTERED: null,
        STARTED_ATTACK: null,
        STOPPED_ATTACK: null
    } });
export const TargetCandidate = new MoveStruct({ name: `${$moduleName}::TargetCandidate`, fields: {
        item_id: bcs.u64(),
        type_id: bcs.u64(),
        group_id: bcs.u64(),
        character_id: bcs.u32(),
        character_tribe: bcs.u32(),
        hp_ratio: bcs.u64(),
        shield_ratio: bcs.u64(),
        armor_ratio: bcs.u64(),
        is_aggressor: bcs.bool(),
        priority_weight: bcs.u64(),
        behaviour_change: BehaviourChangeReason
    } });
export const ReturnTargetPriorityList = new MoveStruct({ name: `${$moduleName}::ReturnTargetPriorityList`, fields: {
        target_item_id: bcs.u64(),
        priority_weight: bcs.u64()
    } });
export const OnlineReceipt = new MoveStruct({ name: `${$moduleName}::OnlineReceipt`, fields: {
        turret_id: bcs.Address
    } });
export const TurretCreatedEvent = new MoveStruct({ name: `${$moduleName}::TurretCreatedEvent`, fields: {
        turret_id: bcs.Address,
        turret_key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64()
    } });
export const PriorityListUpdatedEvent = new MoveStruct({ name: `${$moduleName}::PriorityListUpdatedEvent`, fields: {
        turret_id: bcs.Address,
        priority_list: bcs.vector(TargetCandidate)
    } });
export const ExtensionAuthorizedEvent = new MoveStruct({ name: `${$moduleName}::ExtensionAuthorizedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        extension_type: type_name.TypeName,
        previous_extension: bcs.option(type_name.TypeName),
        owner_cap_id: bcs.Address
    } });
export interface AuthorizeExtensionArguments {
    turret: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface AuthorizeExtensionOptions {
    package?: string;
    arguments: AuthorizeExtensionArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'authorize_extension',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface FreezeExtensionConfigArguments {
    turret: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface FreezeExtensionConfigOptions {
    package?: string;
    arguments: FreezeExtensionConfigArguments | [
        turret: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
/**
 * Freezes the turret's extension configuration so the owner can no longer change
 * it (builds user trust). Requires an extension to be configured. One-time; cannot
 * be undone.
 */
export function freezeExtensionConfig(options: FreezeExtensionConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'freeze_extension_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OnlineArguments {
    turret: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OnlineOptions {
    package?: string;
    arguments: OnlineArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineArguments {
    turret: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OfflineOptions {
    package?: string;
    arguments: OfflineArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'offline',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceConnectedTurretArguments {
    turret: RawTransactionArgument<string>;
    updateEnergySources: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceConnectedTurretOptions {
    package?: string;
    arguments: UpdateEnergySourceConnectedTurretArguments | [
        turret: RawTransactionArgument<string>,
        updateEnergySources: TransactionArgument,
        networkNode: RawTransactionArgument<string>
    ];
}
/**
 * Updates the turret's energy source and removes it from the UpdateEnergySources
 * hot potato. Must be called for each turret in the hot potato returned by
 * connect_assemblies.
 */
export function updateEnergySourceConnectedTurret(options: UpdateEnergySourceConnectedTurretOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "updateEnergySources", "networkNode"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'update_energy_source_connected_turret',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineConnectedTurretArguments {
    turret: RawTransactionArgument<string>;
    offlineAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineConnectedTurretOptions {
    package?: string;
    arguments: OfflineConnectedTurretArguments | [
        turret: RawTransactionArgument<string>,
        offlineAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/** Brings a connected turret offline and removes it from the hot potato */
export function offlineConnectedTurret(options: OfflineConnectedTurretOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "offlineAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'offline_connected_turret',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineOrphanedTurretArguments {
    turret: RawTransactionArgument<string>;
    orphanedAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineOrphanedTurretOptions {
    package?: string;
    arguments: OfflineOrphanedTurretArguments | [
        turret: RawTransactionArgument<string>,
        orphanedAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/**
 * Brings a connected turret offline, releases energy, clears energy source, and
 * removes it from the hot potato Must be called for each turret in the hot potato
 * returned by nwn.unanchor() Returns the updated HandleOrphanedAssemblies; after
 * all are processed, call destroy_network_node with it
 */
export function offlineOrphanedTurret(options: OfflineOrphanedTurretOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "orphanedAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'offline_orphaned_turret',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VerifyOnlineArguments {
    turret: RawTransactionArgument<string>;
}
export interface VerifyOnlineOptions {
    package?: string;
    arguments: VerifyOnlineArguments | [
        turret: RawTransactionArgument<string>
    ];
}
/** Returns a receipt proving the turret is online. Aborts if turret is offline. */
export function verifyOnline(options: VerifyOnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'verify_online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GetTargetPriorityListArguments {
    turret: RawTransactionArgument<string>;
    ownerCharacter: RawTransactionArgument<string>;
    targetCandidateList: RawTransactionArgument<Array<number>>;
    receipt: TransactionArgument;
}
export interface GetTargetPriorityListOptions {
    package?: string;
    arguments: GetTargetPriorityListArguments | [
        turret: RawTransactionArgument<string>,
        ownerCharacter: RawTransactionArgument<string>,
        targetCandidateList: RawTransactionArgument<Array<number>>,
        receipt: TransactionArgument
    ];
}
/**
 * Called by the game whenever target behaviour changes (e.g. a ship enters range,
 * starts or stops attacking). The game sends exactly one behaviour_change per
 * candidate; if both ENTERED and STARTED_ATTACK apply, the game sends
 * STARTED_ATTACK (higher priority). This function applies the rules and returns
 * which targets to shoot and at what priority weight.
 *
 * - `turret`: the programmable turret.
 * - `owner_character`: the character that owns the turret.
 * - `target_candidate_list`: BCS of vector<TargetCandidate> (targets in proximity,
 *   each with one behaviour_change). Returns BCS of
 *   vector<ReturnTargetPriorityList> (target_item_id, priority_weight). The game
 *   shoots the target with the highest priority weight, if it has the same
 *   priority weight, it will shoot the first one in the list.
 */
export function getTargetPriorityList(options: GetTargetPriorityListOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'vector<u8>',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "ownerCharacter", "targetCandidateList", "receipt"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'get_target_priority_list',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DestroyOnlineReceiptArguments<Auth extends BcsType<any>> {
    receipt: TransactionArgument;
    _: RawTransactionArgument<Auth>;
}
export interface DestroyOnlineReceiptOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: DestroyOnlineReceiptArguments<Auth> | [
        receipt: TransactionArgument,
        _: RawTransactionArgument<Auth>
    ];
    typeArguments: [
        string
    ];
}
export function destroyOnlineReceipt<Auth extends BcsType<any>>(options: DestroyOnlineReceiptOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["receipt", "_"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'destroy_online_receipt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UnpackCandidateListArguments {
    candidateListBytes: RawTransactionArgument<Array<number>>;
}
export interface UnpackCandidateListOptions {
    package?: string;
    arguments: UnpackCandidateListArguments | [
        candidateListBytes: RawTransactionArgument<Array<number>>
    ];
}
/** Deserializes vector<TargetCandidate> from BCS bytes. */
export function unpackCandidateList(options: UnpackCandidateListOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["candidateListBytes"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'unpack_candidate_list',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnpackPriorityListArguments {
    candidateListBytes: RawTransactionArgument<Array<number>>;
}
export interface UnpackPriorityListOptions {
    package?: string;
    arguments: UnpackPriorityListArguments | [
        candidateListBytes: RawTransactionArgument<Array<number>>
    ];
}
/** Alias for unpack_candidate_list (e.g. for extensions). */
export function unpackPriorityList(options: UnpackPriorityListOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["candidateListBytes"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'unpack_priority_list',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnpackReturnPriorityListArguments {
    returnBytes: RawTransactionArgument<Array<number>>;
}
export interface UnpackReturnPriorityListOptions {
    package?: string;
    arguments: UnpackReturnPriorityListArguments | [
        returnBytes: RawTransactionArgument<Array<number>>
    ];
}
/** Deserializes vector<ReturnTargetPriorityList> from BCS bytes. */
export function unpackReturnPriorityList(options: UnpackReturnPriorityListOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["returnBytes"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'unpack_return_priority_list',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PeelTargetCandidateArguments {
    candidateBytes: RawTransactionArgument<Array<number>>;
}
export interface PeelTargetCandidateOptions {
    package?: string;
    arguments: PeelTargetCandidateArguments | [
        candidateBytes: RawTransactionArgument<Array<number>>
    ];
}
/**
 * Deserializes a TargetCandidate from BCS bytes (field order: item_id, type_id,
 * group_id, character_id, character_tribe, hp_ratio, shield_ratio, armor_ratio,
 * is_aggressor, priority_weight, behaviour_change u8).
 */
export function peelTargetCandidate(options: PeelTargetCandidateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["candidateBytes"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'peel_target_candidate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataNameArguments {
    turret: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface UpdateMetadataNameOptions {
    package?: string;
    arguments: UpdateMetadataNameArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "ownerCap", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'update_metadata_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataDescriptionArguments {
    turret: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
}
export interface UpdateMetadataDescriptionOptions {
    package?: string;
    arguments: UpdateMetadataDescriptionArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "ownerCap", "description"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'update_metadata_description',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataUrlArguments {
    turret: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    url: RawTransactionArgument<string>;
}
export interface UpdateMetadataUrlOptions {
    package?: string;
    arguments: UpdateMetadataUrlArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "ownerCap", "url"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'update_metadata_url',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevealLocationArguments {
    turret: RawTransactionArgument<string>;
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
        turret: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        solarsystem: RawTransactionArgument<number | bigint>,
        x: RawTransactionArgument<string>,
        y: RawTransactionArgument<string>,
        z: RawTransactionArgument<string>
    ];
}
/**
 * Reveals plain-text location (solarsystem, x, y, z) for this turret. Admin ACL
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
    const parameterNames = ["turret", "registry", "adminAcl", "solarsystem", "x", "y", "z"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'reveal_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StatusArguments {
    turret: RawTransactionArgument<string>;
}
export interface StatusOptions {
    package?: string;
    arguments: StatusArguments | [
        turret: RawTransactionArgument<string>
    ];
}
export function status(options: StatusOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'status',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LocationArguments {
    turret: RawTransactionArgument<string>;
}
export interface LocationOptions {
    package?: string;
    arguments: LocationArguments | [
        turret: RawTransactionArgument<string>
    ];
}
export function location(options: LocationOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsOnlineArguments {
    turret: RawTransactionArgument<string>;
}
export interface IsOnlineOptions {
    package?: string;
    arguments: IsOnlineArguments | [
        turret: RawTransactionArgument<string>
    ];
}
export function isOnline(options: IsOnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'is_online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerCapIdArguments {
    turret: RawTransactionArgument<string>;
}
export interface OwnerCapIdOptions {
    package?: string;
    arguments: OwnerCapIdArguments | [
        turret: RawTransactionArgument<string>
    ];
}
export function ownerCapId(options: OwnerCapIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'owner_cap_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EnergySourceIdArguments {
    turret: RawTransactionArgument<string>;
}
export interface EnergySourceIdOptions {
    package?: string;
    arguments: EnergySourceIdArguments | [
        turret: RawTransactionArgument<string>
    ];
}
/** Returns the turret's energy source (network node) ID if set */
export function energySourceId(options: EnergySourceIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'energy_source_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ExtensionTypeArguments {
    turret: RawTransactionArgument<string>;
}
export interface ExtensionTypeOptions {
    package?: string;
    arguments: ExtensionTypeArguments | [
        turret: RawTransactionArgument<string>
    ];
}
/** if its authorized, return the configured extension type (if any) */
export function extensionType(options: ExtensionTypeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'extension_type',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsExtensionConfiguredArguments {
    turret: RawTransactionArgument<string>;
}
export interface IsExtensionConfiguredOptions {
    package?: string;
    arguments: IsExtensionConfiguredArguments | [
        turret: RawTransactionArgument<string>
    ];
}
/** Returns true if the turret is configured with extension logic */
export function isExtensionConfigured(options: IsExtensionConfiguredOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'is_extension_configured',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsExtensionFrozenArguments {
    turret: RawTransactionArgument<string>;
}
export interface IsExtensionFrozenOptions {
    package?: string;
    arguments: IsExtensionFrozenArguments | [
        turret: RawTransactionArgument<string>
    ];
}
/**
 * Returns true if the turret's extension configuration is frozen (owner cannot
 * change extension).
 */
export function isExtensionFrozen(options: IsExtensionFrozenOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'is_extension_frozen',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TypeIdArguments {
    turret: RawTransactionArgument<string>;
}
export interface TypeIdOptions {
    package?: string;
    arguments: TypeIdArguments | [
        turret: RawTransactionArgument<string>
    ];
}
export function typeId(options: TypeIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'type_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsAggressorArguments {
    candidate: TransactionArgument;
}
export interface IsAggressorOptions {
    package?: string;
    arguments: IsAggressorArguments | [
        candidate: TransactionArgument
    ];
}
/** Returns whether the target is an aggressor. */
export function isAggressor(options: IsAggressorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'is_aggressor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ItemIdArguments {
    candidate: TransactionArgument;
}
export interface ItemIdOptions {
    package?: string;
    arguments: ItemIdArguments | [
        candidate: TransactionArgument
    ];
}
export function itemId(options: ItemIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'item_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TargetTypeIdArguments {
    candidate: TransactionArgument;
}
export interface TargetTypeIdOptions {
    package?: string;
    arguments: TargetTypeIdArguments | [
        candidate: TransactionArgument
    ];
}
/** Returns the target's type id (ship/NPC type). */
export function targetTypeId(options: TargetTypeIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'target_type_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GroupIdArguments {
    candidate: TransactionArgument;
}
export interface GroupIdOptions {
    package?: string;
    arguments: GroupIdArguments | [
        candidate: TransactionArgument
    ];
}
export function groupId(options: GroupIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'group_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CharacterIdArguments {
    candidate: TransactionArgument;
}
export interface CharacterIdOptions {
    package?: string;
    arguments: CharacterIdArguments | [
        candidate: TransactionArgument
    ];
}
export function characterId(options: CharacterIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'character_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CharacterTribeArguments {
    candidate: TransactionArgument;
}
export interface CharacterTribeOptions {
    package?: string;
    arguments: CharacterTribeArguments | [
        candidate: TransactionArgument
    ];
}
export function characterTribe(options: CharacterTribeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'character_tribe',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PriorityWeightArguments {
    candidate: TransactionArgument;
}
export interface PriorityWeightOptions {
    package?: string;
    arguments: PriorityWeightArguments | [
        candidate: TransactionArgument
    ];
}
export function priorityWeight(options: PriorityWeightOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'priority_weight',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BehaviourChangeArguments {
    candidate: TransactionArgument;
}
export interface BehaviourChangeOptions {
    package?: string;
    arguments: BehaviourChangeArguments | [
        candidate: TransactionArgument
    ];
}
export function behaviourChange(options: BehaviourChangeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["candidate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'behaviour_change',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ReturnTargetItemIdArguments {
    entry: TransactionArgument;
}
export interface ReturnTargetItemIdOptions {
    package?: string;
    arguments: ReturnTargetItemIdArguments | [
        entry: TransactionArgument
    ];
}
/** Returns the target item id from a ReturnTargetPriorityList entry. */
export function returnTargetItemId(options: ReturnTargetItemIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["entry"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'return_target_item_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ReturnPriorityWeightArguments {
    entry: TransactionArgument;
}
export interface ReturnPriorityWeightOptions {
    package?: string;
    arguments: ReturnPriorityWeightArguments | [
        entry: TransactionArgument
    ];
}
/** Returns the priority weight from a ReturnTargetPriorityList entry. */
export function returnPriorityWeight(options: ReturnPriorityWeightOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["entry"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'return_priority_weight',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface NewReturnTargetPriorityListArguments {
    targetItemId: RawTransactionArgument<number | bigint>;
    priorityWeight: RawTransactionArgument<number | bigint>;
}
export interface NewReturnTargetPriorityListOptions {
    package?: string;
    arguments: NewReturnTargetPriorityListArguments | [
        targetItemId: RawTransactionArgument<number | bigint>,
        priorityWeight: RawTransactionArgument<number | bigint>
    ];
}
/** Constructs a ReturnTargetPriorityList entry (for extensions and tests). */
export function newReturnTargetPriorityList(options: NewReturnTargetPriorityListOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["targetItemId", "priorityWeight"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'new_return_target_priority_list',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TurretIdArguments {
    receipt: TransactionArgument;
}
export interface TurretIdOptions {
    package?: string;
    arguments: TurretIdArguments | [
        receipt: TransactionArgument
    ];
}
/** Returns the turret ID from an OnlineReceipt. */
export function turretId(options: TurretIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["receipt"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'turret_id',
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
        module: 'turret',
        function: 'anchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ShareTurretArguments {
    turret: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface ShareTurretOptions {
    package?: string;
    arguments: ShareTurretArguments | [
        turret: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function shareTurret(options: ShareTurretOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'share_turret',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceArguments {
    turret: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceOptions {
    package?: string;
    arguments: UpdateEnergySourceArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "networkNode", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'update_energy_source',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorArguments {
    turret: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOptions {
    package?: string;
    arguments: UnanchorArguments | [
        turret: RawTransactionArgument<string>,
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
    const parameterNames = ["turret", "networkNode", "energyConfig", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'unanchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorOrphanArguments {
    turret: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOrphanOptions {
    package?: string;
    arguments: UnanchorOrphanArguments | [
        turret: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unanchorOrphan(options: UnanchorOrphanOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["turret", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'turret',
        function: 'unanchor_orphan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}