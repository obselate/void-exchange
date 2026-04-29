/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module manages character creation and lifecycle with capability-based
 * access control.
 * 
 * Game characters have flexible ownership and access control beyond simple
 * wallet-based ownership. Characters are shared objects and mutable by admin and
 * the character owner using capabilities.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
import * as metadata from './metadata.js';
const $moduleName = '@local-pkg/world::character';
export const Character = new MoveStruct({ name: `${$moduleName}::Character`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        tribe_id: bcs.u32(),
        character_address: bcs.Address,
        metadata: bcs.option(metadata.Metadata),
        owner_cap_id: bcs.Address
    } });
export const PlayerProfile = new MoveStruct({ name: `${$moduleName}::PlayerProfile`, fields: {
        id: bcs.Address,
        character_id: bcs.Address
    } });
export const CharacterCreatedEvent = new MoveStruct({ name: `${$moduleName}::CharacterCreatedEvent`, fields: {
        character_id: bcs.Address,
        key: in_game_id.TenantItemId,
        tribe_id: bcs.u32(),
        character_address: bcs.Address
    } });
export interface IdArguments {
    character: RawTransactionArgument<string>;
}
export interface IdOptions {
    package?: string;
    arguments: IdArguments | [
        character: RawTransactionArgument<string>
    ];
}
export function id(options: IdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface KeyArguments {
    character: RawTransactionArgument<string>;
}
export interface KeyOptions {
    package?: string;
    arguments: KeyArguments | [
        character: RawTransactionArgument<string>
    ];
}
export function key(options: KeyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'key',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CharacterAddressArguments {
    character: RawTransactionArgument<string>;
}
export interface CharacterAddressOptions {
    package?: string;
    arguments: CharacterAddressArguments | [
        character: RawTransactionArgument<string>
    ];
}
export function characterAddress(options: CharacterAddressOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'character_address',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TenantArguments {
    character: RawTransactionArgument<string>;
}
export interface TenantOptions {
    package?: string;
    arguments: TenantArguments | [
        character: RawTransactionArgument<string>
    ];
}
export function tenant(options: TenantOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'tenant',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TribeArguments {
    character: RawTransactionArgument<string>;
}
export interface TribeOptions {
    package?: string;
    arguments: TribeArguments | [
        character: RawTransactionArgument<string>
    ];
}
export function tribe(options: TribeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'tribe',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerCapIdArguments {
    character: RawTransactionArgument<string>;
}
export interface OwnerCapIdOptions {
    package?: string;
    arguments: OwnerCapIdArguments | [
        character: RawTransactionArgument<string>
    ];
}
export function ownerCapId(options: OwnerCapIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'owner_cap_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataNameArguments {
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface UpdateMetadataNameOptions {
    package?: string;
    arguments: UpdateMetadataNameArguments | [
        character: RawTransactionArgument<string>,
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
    const parameterNames = ["character", "ownerCap", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'update_metadata_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataDescriptionArguments {
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
}
export interface UpdateMetadataDescriptionOptions {
    package?: string;
    arguments: UpdateMetadataDescriptionArguments | [
        character: RawTransactionArgument<string>,
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
    const parameterNames = ["character", "ownerCap", "description"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'update_metadata_description',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateMetadataUrlArguments {
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    url: RawTransactionArgument<string>;
}
export interface UpdateMetadataUrlOptions {
    package?: string;
    arguments: UpdateMetadataUrlArguments | [
        character: RawTransactionArgument<string>,
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
    const parameterNames = ["character", "ownerCap", "url"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'update_metadata_url',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreateCharacterArguments {
    registry: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    gameCharacterId: RawTransactionArgument<number>;
    tenant: RawTransactionArgument<string>;
    tribeId: RawTransactionArgument<number>;
    characterAddress: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
}
export interface CreateCharacterOptions {
    package?: string;
    arguments: CreateCharacterArguments | [
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        gameCharacterId: RawTransactionArgument<number>,
        tenant: RawTransactionArgument<string>,
        tribeId: RawTransactionArgument<number>,
        characterAddress: RawTransactionArgument<string>,
        name: RawTransactionArgument<string>
    ];
}
export function createCharacter(options: CreateCharacterOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u32',
        '0x1::string::String',
        'u32',
        'address',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "adminAcl", "gameCharacterId", "tenant", "tribeId", "characterAddress", "name"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'create_character',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BorrowOwnerCapArguments {
    character: RawTransactionArgument<string>;
    ownerCapTicket: TransactionArgument;
}
export interface BorrowOwnerCapOptions {
    package?: string;
    arguments: BorrowOwnerCapArguments | [
        character: RawTransactionArgument<string>,
        ownerCapTicket: TransactionArgument
    ];
    typeArguments: [
        string
    ];
}
export function borrowOwnerCap(options: BorrowOwnerCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character", "ownerCapTicket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'borrow_owner_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ReturnOwnerCapArguments {
    character: RawTransactionArgument<string>;
    ownerCap: RawTransactionArgument<string>;
    receipt: TransactionArgument;
}
export interface ReturnOwnerCapOptions {
    package?: string;
    arguments: ReturnOwnerCapArguments | [
        character: RawTransactionArgument<string>,
        ownerCap: RawTransactionArgument<string>,
        receipt: TransactionArgument
    ];
    typeArguments: [
        string
    ];
}
export function returnOwnerCap(options: ReturnOwnerCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character", "ownerCap", "receipt"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'return_owner_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ShareCharacterArguments {
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface ShareCharacterOptions {
    package?: string;
    arguments: ShareCharacterArguments | [
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
export function shareCharacter(options: ShareCharacterOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'share_character',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateTribeArguments {
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    tribeId: RawTransactionArgument<number>;
}
export interface UpdateTribeOptions {
    package?: string;
    arguments: UpdateTribeArguments | [
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        tribeId: RawTransactionArgument<number>
    ];
}
export function updateTribe(options: UpdateTribeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u32'
    ] satisfies (string | null)[];
    const parameterNames = ["character", "adminAcl", "tribeId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'update_tribe',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateAddressArguments {
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    characterAddress: RawTransactionArgument<string>;
}
export interface UpdateAddressOptions {
    package?: string;
    arguments: UpdateAddressArguments | [
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        characterAddress: RawTransactionArgument<string>
    ];
}
/**
 * Updates the character's wallet address. Note: any existing PlayerProfile remains
 * at the old wallet; clients querying by the new address will not see it until a
 * new profile is issued. TODO: Replace with transferring character ownercap to
 * wallet address later
 */
export function updateAddress(options: UpdateAddressOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["character", "adminAcl", "characterAddress"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'update_address',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdateTenantIdArguments {
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    tenant: RawTransactionArgument<string>;
}
export interface UpdateTenantIdOptions {
    package?: string;
    arguments: UpdateTenantIdArguments | [
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        tenant: RawTransactionArgument<string>
    ];
}
export function updateTenantId(options: UpdateTenantIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["character", "adminAcl", "tenant"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'update_tenant_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DeleteCharacterArguments {
    character: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface DeleteCharacterOptions {
    package?: string;
    arguments: DeleteCharacterArguments | [
        character: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Deletes the character and its metadata. PlayerProfile (if any) is wallet-owned
 * and not cleaned up here; it will be obsolete once replaced by the
 * OwnerCap-to-wallet flow.
 */
export function deleteCharacter(options: DeleteCharacterOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["character", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'character',
        function: 'delete_character',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}