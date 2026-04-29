/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Location verification module for validating proximity using signature
 * verification.
 * 
 * This module provides location hash storage and validation functionality that can
 * be attached to any game structure (e.g., inventory, item, ship, etc.). It
 * enables proximity-based access control by verifying that a player is in
 * proximity to a structure before allowing interactions.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
import * as in_game_id from './in_game_id.js';
const $moduleName = '@local-pkg/world::location';
export const Location = new MoveStruct({ name: `${$moduleName}::Location`, fields: {
        location_hash: bcs.vector(bcs.u8())
    } });
export const LocationProofMessage = new MoveStruct({ name: `${$moduleName}::LocationProofMessage`, fields: {
        server_address: bcs.Address,
        player_address: bcs.Address,
        source_structure_id: bcs.Address,
        source_location_hash: bcs.vector(bcs.u8()),
        target_structure_id: bcs.Address,
        target_location_hash: bcs.vector(bcs.u8()),
        distance: bcs.u64(),
        data: bcs.vector(bcs.u8()),
        deadline_ms: bcs.u64()
    } });
export const LocationProof = new MoveStruct({ name: `${$moduleName}::LocationProof`, fields: {
        message: LocationProofMessage,
        signature: bcs.vector(bcs.u8())
    } });
export const LocationRegistry = new MoveStruct({ name: `${$moduleName}::LocationRegistry`, fields: {
        id: bcs.Address,
        locations: table.Table
    } });
export const Coordinates = new MoveStruct({ name: `${$moduleName}::Coordinates`, fields: {
        solarsystem: bcs.u64(),
        x: bcs.string(),
        y: bcs.string(),
        z: bcs.string()
    } });
export const LocationRevealedEvent = new MoveStruct({ name: `${$moduleName}::LocationRevealedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        type_id: bcs.u64(),
        owner_cap_id: bcs.Address,
        location_hash: bcs.vector(bcs.u8()),
        solarsystem: bcs.u64(),
        x: bcs.string(),
        y: bcs.string(),
        z: bcs.string()
    } });
export interface CreateLocationProofArguments {
    serverAddress: RawTransactionArgument<string>;
    playerAddress: RawTransactionArgument<string>;
    sourceStructureId: RawTransactionArgument<string>;
    sourceLocationHash: RawTransactionArgument<Array<number>>;
    targetStructureId: RawTransactionArgument<string>;
    targetLocationHash: RawTransactionArgument<Array<number>>;
    distance: RawTransactionArgument<number | bigint>;
    data: RawTransactionArgument<Array<number>>;
    deadlineMs: RawTransactionArgument<number | bigint>;
    signature: RawTransactionArgument<Array<number>>;
}
export interface CreateLocationProofOptions {
    package?: string;
    arguments: CreateLocationProofArguments | [
        serverAddress: RawTransactionArgument<string>,
        playerAddress: RawTransactionArgument<string>,
        sourceStructureId: RawTransactionArgument<string>,
        sourceLocationHash: RawTransactionArgument<Array<number>>,
        targetStructureId: RawTransactionArgument<string>,
        targetLocationHash: RawTransactionArgument<Array<number>>,
        distance: RawTransactionArgument<number | bigint>,
        data: RawTransactionArgument<Array<number>>,
        deadlineMs: RawTransactionArgument<number | bigint>,
        signature: RawTransactionArgument<Array<number>>
    ];
}
export function createLocationProof(options: CreateLocationProofOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'address',
        'address',
        '0x2::object::ID',
        'vector<u8>',
        '0x2::object::ID',
        'vector<u8>',
        'u64',
        'vector<u8>',
        'u64',
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["serverAddress", "playerAddress", "sourceStructureId", "sourceLocationHash", "targetStructureId", "targetLocationHash", "distance", "data", "deadlineMs", "signature"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'create_location_proof',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VerifyProximityArguments {
    location: TransactionArgument;
    proof: TransactionArgument;
    serverRegistry: RawTransactionArgument<string>;
}
export interface VerifyProximityOptions {
    package?: string;
    arguments: VerifyProximityArguments | [
        location: TransactionArgument,
        proof: TransactionArgument,
        serverRegistry: RawTransactionArgument<string>
    ];
}
/**
 * Verify that a server-signed proof attesting a player is near a structure This
 * function gets `proof` LocationProof as struct
 */
export function verifyProximity(options: VerifyProximityOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["location", "proof", "serverRegistry"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'verify_proximity',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VerifyProximityProofFromBytesArguments {
    serverRegistry: RawTransactionArgument<string>;
    location: TransactionArgument;
    proofBytes: RawTransactionArgument<Array<number>>;
}
export interface VerifyProximityProofFromBytesOptions {
    package?: string;
    arguments: VerifyProximityProofFromBytesArguments | [
        serverRegistry: RawTransactionArgument<string>,
        location: TransactionArgument,
        proofBytes: RawTransactionArgument<Array<number>>
    ];
}
/**
 * Verify that a server-signed proof attesting a player is in proximity the
 * structure. This function gets `proof_bytes` the LocationProof as bytes
 */
export function verifyProximityProofFromBytes(options: VerifyProximityProofFromBytesOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'vector<u8>',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["serverRegistry", "location", "proofBytes"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'verify_proximity_proof_from_bytes',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VerifyDistanceArguments {
    location: TransactionArgument;
    serverRegistry: RawTransactionArgument<string>;
    proofBytes: RawTransactionArgument<Array<number>>;
    maxDistance: RawTransactionArgument<number | bigint>;
}
export interface VerifyDistanceOptions {
    package?: string;
    arguments: VerifyDistanceArguments | [
        location: TransactionArgument,
        serverRegistry: RawTransactionArgument<string>,
        proofBytes: RawTransactionArgument<Array<number>>,
        maxDistance: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Verify that a server-signed proof attesting two structures are under a certain
 * distance.
 */
export function verifyDistance(options: VerifyDistanceOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'vector<u8>',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["location", "serverRegistry", "proofBytes", "maxDistance"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'verify_distance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VerifySameLocationArguments {
    locationAHash: RawTransactionArgument<Array<number>>;
    locationBHash: RawTransactionArgument<Array<number>>;
}
export interface VerifySameLocationOptions {
    package?: string;
    arguments: VerifySameLocationArguments | [
        locationAHash: RawTransactionArgument<Array<number>>,
        locationBHash: RawTransactionArgument<Array<number>>
    ];
}
/**
 * Verifies if two locations are in proximity based on their hashes.
 *
 * It is used for ephemeral storage operations where both inventory are in the same
 * location
 */
export function verifySameLocation(options: VerifySameLocationOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>',
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["locationAHash", "locationBHash"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'verify_same_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HashArguments {
    location: TransactionArgument;
}
export interface HashOptions {
    package?: string;
    arguments: HashArguments | [
        location: TransactionArgument
    ];
}
export function hash(options: HashOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["location"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'hash',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GetLocationArguments {
    registry: RawTransactionArgument<string>;
    assemblyId: RawTransactionArgument<string>;
}
export interface GetLocationOptions {
    package?: string;
    arguments: GetLocationArguments | [
        registry: RawTransactionArgument<string>,
        assemblyId: RawTransactionArgument<string>
    ];
}
export function getLocation(options: GetLocationOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "assemblyId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'get_location',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SolarsystemArguments {
    data: TransactionArgument;
}
export interface SolarsystemOptions {
    package?: string;
    arguments: SolarsystemArguments | [
        data: TransactionArgument
    ];
}
export function solarsystem(options: SolarsystemOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["data"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'solarsystem',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface XArguments {
    data: TransactionArgument;
}
export interface XOptions {
    package?: string;
    arguments: XArguments | [
        data: TransactionArgument
    ];
}
export function x(options: XOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["data"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'x',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YArguments {
    data: TransactionArgument;
}
export interface YOptions {
    package?: string;
    arguments: YArguments | [
        data: TransactionArgument
    ];
}
export function y(options: YOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["data"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'y',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ZArguments {
    data: TransactionArgument;
}
export interface ZOptions {
    package?: string;
    arguments: ZArguments | [
        data: TransactionArgument
    ];
}
export function z(options: ZOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["data"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'z',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateArguments {
    location: TransactionArgument;
    adminAcl: RawTransactionArgument<string>;
    locationHash: RawTransactionArgument<Array<number>>;
}
export interface UpdateOptions {
    package?: string;
    arguments: UpdateArguments | [
        location: TransactionArgument,
        adminAcl: RawTransactionArgument<string>,
        locationHash: RawTransactionArgument<Array<number>>
    ];
}
export function update(options: UpdateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["location", "adminAcl", "locationHash"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'location',
        function: 'update',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}