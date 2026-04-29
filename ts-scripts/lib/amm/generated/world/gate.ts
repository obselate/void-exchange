/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module handles the functionality of in-game Smart Gates.
 * 
 * A Gate is a structure in space that enables travel across space. Gates function
 * by linking to another gate, creating a transport link for travel. To link 2
 * gates, they must be at least 20KM away from each other and owned by the same
 * character. Gates are programmable structures where the owner can define custom
 * rules through extension contracts.
 * 
 * By default, gates allow anyone to jump without requiring a ticket or pass.
 * However, if the owner configures the gate with extension logic using the typed
 * witness pattern, the gate will require a valid ticket/pass to jump. The pass
 * must be obtained from the external logic programmed by the owner. When extension
 * logic is configured, the `jump` function validates the pass/ticket before
 * allowing the jump.
 * 
 * Extension pattern:
 * https://github.com/evefrontier/world-contracts/blob/main/docs/architechture.md#layer-3-player-extensions-moddability
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
import * as in_game_id from './in_game_id.js';
import * as status_1 from './status.js';
import * as location_1 from './location.js';
import * as metadata from './metadata.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = '@local-pkg/world::gate';
export const GateConfig = new MoveStruct({ name: `${$moduleName}::GateConfig`, fields: {
        id: bcs.Address,
        max_distance_by_type: table.Table
    } });
export const Gate = new MoveStruct({ name: `${$moduleName}::Gate`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        linked_gate_id: bcs.option(bcs.Address),
        status: status_1.AssemblyStatus,
        location: location_1.Location,
        energy_source_id: bcs.option(bcs.Address),
        metadata: bcs.option(metadata.Metadata),
        extension: bcs.option(type_name.TypeName)
    } });
export const JumpPermit = new MoveStruct({ name: `${$moduleName}::JumpPermit`, fields: {
        id: bcs.Address,
        character_id: bcs.Address,
        route_hash: bcs.vector(bcs.u8()),
        expires_at_timestamp_ms: bcs.u64()
    } });
export const GateCreatedEvent = new MoveStruct({ name: `${$moduleName}::GateCreatedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        owner_cap_id: bcs.Address,
        type_id: bcs.u64(),
        location_hash: bcs.vector(bcs.u8()),
        status: status_1.Status
    } });
export const GateLinkedEvent = new MoveStruct({ name: `${$moduleName}::GateLinkedEvent`, fields: {
        source_gate_id: bcs.Address,
        source_gate_key: in_game_id.TenantItemId,
        destination_gate_id: bcs.Address,
        destination_gate_key: in_game_id.TenantItemId
    } });
export const GateUnlinkedEvent = new MoveStruct({ name: `${$moduleName}::GateUnlinkedEvent`, fields: {
        source_gate_id: bcs.Address,
        source_gate_key: in_game_id.TenantItemId,
        destination_gate_id: bcs.Address,
        destination_gate_key: in_game_id.TenantItemId
    } });
export const JumpEvent = new MoveStruct({ name: `${$moduleName}::JumpEvent`, fields: {
        source_gate_id: bcs.Address,
        source_gate_key: in_game_id.TenantItemId,
        destination_gate_id: bcs.Address,
        destination_gate_key: in_game_id.TenantItemId,
        character_id: bcs.Address,
        character_key: in_game_id.TenantItemId
    } });
export const ExtensionAuthorizedEvent = new MoveStruct({ name: `${$moduleName}::ExtensionAuthorizedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        extension_type: type_name.TypeName,
        previous_extension: bcs.option(type_name.TypeName),
        owner_cap_id: bcs.Address
    } });
export interface AuthorizeExtensionArguments {
    gate: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface AuthorizeExtensionOptions {
    package?: string;
    arguments: AuthorizeExtensionArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'authorize_extension',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface FreezeExtensionConfigArguments {
    gate: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface FreezeExtensionConfigOptions {
    package?: string;
    arguments: FreezeExtensionConfigArguments | [
        gate: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>
    ];
}
/**
 * Freezes the gate's extension configuration so the owner can no longer change it
 * (builds user trust). Requires an extension to be configured. One-time; cannot be
 * undone.
 */
export function freezeExtensionConfig(options: FreezeExtensionConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'freeze_extension_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OnlineArguments {
    gate: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OnlineOptions {
    package?: string;
    arguments: OnlineArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineArguments {
    gate: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
}
export interface OfflineOptions {
    package?: string;
    arguments: OfflineArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "networkNode", "energyConfig", "ownerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'offline',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LinkGatesArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    gateConfig: RawTransactionArgument<string>;
    serverRegistry: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    sourceGateOwnerCap: RawTransactionArgument<string>;
    destinationGateOwnerCap: RawTransactionArgument<string>;
    distanceProof: RawTransactionArgument<Array<number>>;
}
export interface LinkGatesOptions {
    package?: string;
    arguments: LinkGatesArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        gateConfig: RawTransactionArgument<string>,
        serverRegistry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        sourceGateOwnerCap: RawTransactionArgument<string>,
        destinationGateOwnerCap: RawTransactionArgument<string>,
        distanceProof: RawTransactionArgument<Array<number>>
    ];
}
export function linkGates(options: LinkGatesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'vector<u8>',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "gateConfig", "serverRegistry", "adminAcl", "sourceGateOwnerCap", "destinationGateOwnerCap", "distanceProof"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'link_gates',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnlinkGatesArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    sourceGateOwnerCap: RawTransactionArgument<string>;
    destinationGateOwnerCap: RawTransactionArgument<string>;
}
export interface UnlinkGatesOptions {
    package?: string;
    arguments: UnlinkGatesArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        sourceGateOwnerCap: RawTransactionArgument<string>,
        destinationGateOwnerCap: RawTransactionArgument<string>
    ];
}
export function unlinkGates(options: UnlinkGatesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "sourceGateOwnerCap", "destinationGateOwnerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'unlink_gates',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IssueJumpPermitArguments<Auth extends BcsType<any>> {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    _: RawTransactionArgument<Auth>;
    expiresAtTimestampMs: RawTransactionArgument<number | bigint>;
}
export interface IssueJumpPermitOptions<Auth extends BcsType<any>> {
    package?: string;
    arguments: IssueJumpPermitArguments<Auth> | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        _: RawTransactionArgument<Auth>,
        expiresAtTimestampMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function issueJumpPermit<Auth extends BcsType<any>>(options: IssueJumpPermitOptions<Auth>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        `${options.typeArguments[0]}`,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "character", "_", "expiresAtTimestampMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'issue_jump_permit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface JumpArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface JumpOptions {
    package?: string;
    arguments: JumpArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Default jump from one gate to another (no permit required). Only allowed when no
 * extension logic is configured.
 */
export function jump(options: JumpOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "character", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'jump',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface JumpWithPermitArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    character: RawTransactionArgument<string>;
    jumpPermit: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface JumpWithPermitOptions {
    package?: string;
    arguments: JumpWithPermitArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        character: RawTransactionArgument<string>,
        jumpPermit: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Jump from one gate to another using a jump permit. Requires extension logic to
 * be configured and a valid Auth witness type from that extension.
 */
export function jumpWithPermit(options: JumpWithPermitOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "character", "jumpPermit", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'jump_with_permit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceConnectedGateArguments {
    gate: RawTransactionArgument<string>;
    updateEnergySources: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceConnectedGateOptions {
    package?: string;
    arguments: UpdateEnergySourceConnectedGateArguments | [
        gate: RawTransactionArgument<string>,
        updateEnergySources: TransactionArgument,
        networkNode: RawTransactionArgument<string>
    ];
}
/**
 * Updates the gate's energy source and removes it from the UpdateEnergySources hot
 * potato. Must be called for each gate in the hot potato returned by
 * connect_assemblies.
 */
export function updateEnergySourceConnectedGate(options: UpdateEnergySourceConnectedGateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate", "updateEnergySources", "networkNode"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'update_energy_source_connected_gate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineConnectedGateArguments {
    gate: RawTransactionArgument<string>;
    offlineAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineConnectedGateOptions {
    package?: string;
    arguments: OfflineConnectedGateArguments | [
        gate: RawTransactionArgument<string>,
        offlineAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/** Brings a connected gate offline and removes it from the hot potato */
export function offlineConnectedGate(options: OfflineConnectedGateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate", "offlineAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'offline_connected_gate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OfflineOrphanedGateArguments {
    gate: RawTransactionArgument<string>;
    orphanedAssemblies: TransactionArgument;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
}
export interface OfflineOrphanedGateOptions {
    package?: string;
    arguments: OfflineOrphanedGateArguments | [
        gate: RawTransactionArgument<string>,
        orphanedAssemblies: TransactionArgument,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>
    ];
}
/**
 * Brings a connected gate offline, releases energy, clears energy source, and
 * removes it from the hot potato Must be called for each gate in the hot potato
 * returned by nwn.unanchor() Returns the updated HandleOrphanedAssemblies; after
 * all are processed, call destroy_network_node with it
 */
export function offlineOrphanedGate(options: OfflineOrphanedGateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate", "orphanedAssemblies", "networkNode", "energyConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'offline_orphaned_gate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataNameArguments {
    gate: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface UpdateMetadataNameOptions {
    package?: string;
    arguments: UpdateMetadataNameArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "ownerCap", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'update_metadata_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataDescriptionArguments {
    gate: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
}
export interface UpdateMetadataDescriptionOptions {
    package?: string;
    arguments: UpdateMetadataDescriptionArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "ownerCap", "description"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'update_metadata_description',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataUrlArguments {
    gate: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    url: RawTransactionArgument<string>;
}
export interface UpdateMetadataUrlOptions {
    package?: string;
    arguments: UpdateMetadataUrlArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "ownerCap", "url"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'update_metadata_url',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevealLocationArguments {
    gate: RawTransactionArgument<string>;
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
        gate: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        solarsystem: RawTransactionArgument<number | bigint>,
        x: RawTransactionArgument<string>,
        y: RawTransactionArgument<string>,
        z: RawTransactionArgument<string>
    ];
}
/**
 * Reveals plain-text location (solarsystem, x, y, z) for this gate. Admin ACL
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
    const parameterNames = ["gate", "registry", "adminAcl", "solarsystem", "x", "y", "z"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'reveal_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StatusArguments {
    gate: RawTransactionArgument<string>;
}
export interface StatusOptions {
    package?: string;
    arguments: StatusArguments | [
        gate: RawTransactionArgument<string>
    ];
}
export function status(options: StatusOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'status',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LocationArguments {
    gate: RawTransactionArgument<string>;
}
export interface LocationOptions {
    package?: string;
    arguments: LocationArguments | [
        gate: RawTransactionArgument<string>
    ];
}
export function location(options: LocationOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsOnlineArguments {
    gate: RawTransactionArgument<string>;
}
export interface IsOnlineOptions {
    package?: string;
    arguments: IsOnlineArguments | [
        gate: RawTransactionArgument<string>
    ];
}
export function isOnline(options: IsOnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'is_online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AreGatesLinkedArguments {
    gateA: RawTransactionArgument<string>;
    gateB: RawTransactionArgument<string>;
}
export interface AreGatesLinkedOptions {
    package?: string;
    arguments: AreGatesLinkedArguments | [
        gateA: RawTransactionArgument<string>,
        gateB: RawTransactionArgument<string>
    ];
}
export function areGatesLinked(options: AreGatesLinkedOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gateA", "gateB"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'are_gates_linked',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LinkedGateIdArguments {
    gate: RawTransactionArgument<string>;
}
export interface LinkedGateIdOptions {
    package?: string;
    arguments: LinkedGateIdArguments | [
        gate: RawTransactionArgument<string>
    ];
}
export function linkedGateId(options: LinkedGateIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'linked_gate_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerCapIdArguments {
    gate: RawTransactionArgument<string>;
}
export interface OwnerCapIdOptions {
    package?: string;
    arguments: OwnerCapIdArguments | [
        gate: RawTransactionArgument<string>
    ];
}
export function ownerCapId(options: OwnerCapIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'owner_cap_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EnergySourceIdArguments {
    gate: RawTransactionArgument<string>;
}
export interface EnergySourceIdOptions {
    package?: string;
    arguments: EnergySourceIdArguments | [
        gate: RawTransactionArgument<string>
    ];
}
/** Returns the gate's energy source (network node) ID if set */
export function energySourceId(options: EnergySourceIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'energy_source_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ExtensionTypeArguments {
    gate: RawTransactionArgument<string>;
}
export interface ExtensionTypeOptions {
    package?: string;
    arguments: ExtensionTypeArguments | [
        gate: RawTransactionArgument<string>
    ];
}
/** Returns the configured extension type (if any) */
export function extensionType(options: ExtensionTypeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'extension_type',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsExtensionConfiguredArguments {
    gate: RawTransactionArgument<string>;
}
export interface IsExtensionConfiguredOptions {
    package?: string;
    arguments: IsExtensionConfiguredArguments | [
        gate: RawTransactionArgument<string>
    ];
}
/** Returns true if the gate is configured with extension logic */
export function isExtensionConfigured(options: IsExtensionConfiguredOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'is_extension_configured',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsExtensionFrozenArguments {
    gate: RawTransactionArgument<string>;
}
export interface IsExtensionFrozenOptions {
    package?: string;
    arguments: IsExtensionFrozenArguments | [
        gate: RawTransactionArgument<string>
    ];
}
/**
 * Returns true if the gate's extension configuration is frozen (owner cannot
 * change extension).
 */
export function isExtensionFrozen(options: IsExtensionFrozenOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'is_extension_frozen',
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
        module: 'gate',
        function: 'anchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ShareGateArguments {
    gate: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface ShareGateOptions {
    package?: string;
    arguments: ShareGateArguments | [
        gate: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function shareGate(options: ShareGateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'share_gate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateEnergySourceArguments {
    gate: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UpdateEnergySourceOptions {
    package?: string;
    arguments: UpdateEnergySourceArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "networkNode", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'update_energy_source',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorArguments {
    gate: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOptions {
    package?: string;
    arguments: UnanchorArguments | [
        gate: RawTransactionArgument<string>,
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
    const parameterNames = ["gate", "networkNode", "energyConfig", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'unanchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnanchorOrphanArguments {
    gate: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnanchorOrphanOptions {
    package?: string;
    arguments: UnanchorOrphanArguments | [
        gate: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unanchorOrphan(options: UnanchorOrphanOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["gate", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'unanchor_orphan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnlinkAndUnanchorArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    networkNode: RawTransactionArgument<string>;
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnlinkAndUnanchorOptions {
    package?: string;
    arguments: UnlinkAndUnanchorArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        networkNode: RawTransactionArgument<string>,
        energyConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unlinkAndUnanchor(options: UnlinkAndUnanchorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "networkNode", "energyConfig", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'unlink_and_unanchor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnlinkAndUnanchorOrphanArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnlinkAndUnanchorOrphanOptions {
    package?: string;
    arguments: UnlinkAndUnanchorOrphanArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Unlink source from destination, then unanchor the source gate as an orphan (no
 * energy source). Use when the source gate is not connected to a network node.
 */
export function unlinkAndUnanchorOrphan(options: UnlinkAndUnanchorOrphanOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'unlink_and_unanchor_orphan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetMaxDistanceArguments {
    gateConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
    maxDistance: RawTransactionArgument<number | bigint>;
}
export interface SetMaxDistanceOptions {
    package?: string;
    arguments: SetMaxDistanceArguments | [
        gateConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>,
        maxDistance: RawTransactionArgument<number | bigint>
    ];
}
export function setMaxDistance(options: SetMaxDistanceOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["gateConfig", "adminAcl", "typeId", "maxDistance"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'set_max_distance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnlinkGatesByAdminArguments {
    sourceGate: RawTransactionArgument<string>;
    destinationGate: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface UnlinkGatesByAdminOptions {
    package?: string;
    arguments: UnlinkGatesByAdminArguments | [
        sourceGate: RawTransactionArgument<string>,
        destinationGate: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function unlinkGatesByAdmin(options: UnlinkGatesByAdminOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["sourceGate", "destinationGate", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'gate',
        function: 'unlink_gates_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}