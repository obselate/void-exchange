/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module manages issuing capabilities for world objects for access control.
 * 
 * The module defines three levels of capabilities:
 * 
 * - `GovernorCap`: Top-level capability (defined in world module)
 * - `AdminACL`: Shared object with a table of authorized sponsor addresses
 * - `OwnerCap`: Object-level capability that can be created by authorized sponsors
 * 
 * This hierarchy allows for delegation of permissions:
 * 
 * - Governor can add/remove sponsors in AdminACL
 * - Authorized sponsors can create/transfer/delete OwnerCaps Future: Capability
 *   registry to support multi party access/shared control. (eg: A capability for
 *   corporation/tribe with multiple members) Capabilities based on different
 *   roles/permission in a corporation/tribe.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
const $moduleName = '@local-pkg/world::access';
export const ReturnOwnerCapReceipt = new MoveStruct({ name: `${$moduleName}::ReturnOwnerCapReceipt`, fields: {
        owner_id: bcs.Address,
        owner_cap_id: bcs.Address
    } });
export const AdminACL = new MoveStruct({ name: `${$moduleName}::AdminACL`, fields: {
        id: bcs.Address,
        authorized_sponsors: table.Table
    } });
export const OwnerCap = new MoveStruct({ name: `${$moduleName}::OwnerCap<phantom T>`, fields: {
        id: bcs.Address,
        authorized_object_id: bcs.Address
    } });
export const ServerAddressRegistry = new MoveStruct({ name: `${$moduleName}::ServerAddressRegistry`, fields: {
        id: bcs.Address,
        authorized_address: table.Table
    } });
export const OwnerCapCreatedEvent = new MoveStruct({ name: `${$moduleName}::OwnerCapCreatedEvent`, fields: {
        owner_cap_id: bcs.Address,
        authorized_object_id: bcs.Address
    } });
export const OwnerCapTransferred = new MoveStruct({ name: `${$moduleName}::OwnerCapTransferred`, fields: {
        owner_cap_id: bcs.Address,
        authorized_object_id: bcs.Address,
        previous_owner: bcs.Address,
        owner: bcs.Address
    } });
export interface TransferOwnerCapArguments {
    ownerCap: RawTransactionArgument<string>;
    owner: RawTransactionArgument<string>;
}
export interface TransferOwnerCapOptions {
    package?: string;
    arguments: TransferOwnerCapArguments | [
        ownerCap: RawTransactionArgument<string>,
        owner: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Transfers an OwnerCap to a new owner.
 *
 * Security: Ownership is enforced by the Sui runtime. Only the current owner of
 * the OwnerCap can call this function - if a non-owner attempts to move the
 * object, the transaction will be rejected by the runtime before this function is
 * even called.
 */
export function transferOwnerCap(options: TransferOwnerCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["ownerCap", "owner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'transfer_owner_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TransferOwnerCapToAddressArguments {
    ownerCap: RawTransactionArgument<string>;
    newOwner: RawTransactionArgument<string>;
}
export interface TransferOwnerCapToAddressOptions {
    package?: string;
    arguments: TransferOwnerCapToAddressArguments | [
        ownerCap: RawTransactionArgument<string>,
        newOwner: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function transferOwnerCapToAddress(options: TransferOwnerCapToAddressOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["ownerCap", "newOwner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'transfer_owner_cap_to_address',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ReturnOwnerCapToObjectArguments {
    ownerCap: RawTransactionArgument<string>;
    receipt: TransactionArgument;
    ownerId: RawTransactionArgument<string>;
}
export interface ReturnOwnerCapToObjectOptions {
    package?: string;
    arguments: ReturnOwnerCapToObjectArguments | [
        ownerCap: RawTransactionArgument<string>,
        receipt: TransactionArgument,
        ownerId: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Returns a borrowed owner cap to the object it was borrowed from. Consumes the
 * receipt.
 */
export function returnOwnerCapToObject(options: ReturnOwnerCapToObjectOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["ownerCap", "receipt", "ownerId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'return_owner_cap_to_object',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TransferOwnerCapWithReceiptArguments {
    ownerCap: RawTransactionArgument<string>;
    receipt: TransactionArgument;
    newOwner: RawTransactionArgument<string>;
}
export interface TransferOwnerCapWithReceiptOptions {
    package?: string;
    arguments: TransferOwnerCapWithReceiptArguments | [
        ownerCap: RawTransactionArgument<string>,
        receipt: TransactionArgument,
        newOwner: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Transfers a borrowed owner cap to an address, consuming the return receipt. */
export function transferOwnerCapWithReceipt(options: TransferOwnerCapWithReceiptOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["ownerCap", "receipt", "newOwner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'transfer_owner_cap_with_receipt',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface IsAuthorizedServerAddressArguments {
    serverAddressRegistry: RawTransactionArgument<string>;
    address: RawTransactionArgument<string>;
}
export interface IsAuthorizedServerAddressOptions {
    package?: string;
    arguments: IsAuthorizedServerAddressArguments | [
        serverAddressRegistry: RawTransactionArgument<string>,
        address: RawTransactionArgument<string>
    ];
}
/** Checks if an address is an authorized server address. */
export function isAuthorizedServerAddress(options: IsAuthorizedServerAddressOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["serverAddressRegistry", "address"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'is_authorized_server_address',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsAuthorizedArguments {
    ownerCap: RawTransactionArgument<string>;
    objectId: RawTransactionArgument<string>;
}
export interface IsAuthorizedOptions {
    package?: string;
    arguments: IsAuthorizedArguments | [
        ownerCap: RawTransactionArgument<string>,
        objectId: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Returns true iff the `OwnerCap` has mutation access for the specified object. */
export function isAuthorized(options: IsAuthorizedOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["ownerCap", "objectId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'is_authorized',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface VerifySponsorArguments {
    adminAcl: RawTransactionArgument<string>;
}
export interface VerifySponsorOptions {
    package?: string;
    arguments: VerifySponsorArguments | [
        adminAcl: RawTransactionArgument<string>
    ];
}
/**
 * Verifies that the transaction is from an authorized address. Checks the sponsor
 * if the transaction is sponsored, otherwise falls back to the sender.
 */
export function verifySponsor(options: VerifySponsorOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'verify_sponsor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AddSponsorToAclArguments {
    adminAcl: RawTransactionArgument<string>;
    _: RawTransactionArgument<string>;
    sponsor: RawTransactionArgument<string>;
}
export interface AddSponsorToAclOptions {
    package?: string;
    arguments: AddSponsorToAclArguments | [
        adminAcl: RawTransactionArgument<string>,
        _: RawTransactionArgument<string>,
        sponsor: RawTransactionArgument<string>
    ];
}
export function addSponsorToAcl(options: AddSponsorToAclOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["adminAcl", "_", "sponsor"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'add_sponsor_to_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreateOwnerCapArguments<T extends BcsType<any>> {
    adminAcl: RawTransactionArgument<string>;
    obj: RawTransactionArgument<T>;
}
export interface CreateOwnerCapOptions<T extends BcsType<any>> {
    package?: string;
    arguments: CreateOwnerCapArguments<T> | [
        adminAcl: RawTransactionArgument<string>,
        obj: RawTransactionArgument<T>
    ];
    typeArguments: [
        string
    ];
}
export function createOwnerCap<T extends BcsType<any>>(options: CreateOwnerCapOptions<T>) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        `${options.typeArguments[0]}`
    ] satisfies (string | null)[];
    const parameterNames = ["adminAcl", "obj"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'create_owner_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreateOwnerCapByIdArguments {
    objectId: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface CreateOwnerCapByIdOptions {
    package?: string;
    arguments: CreateOwnerCapByIdArguments | [
        objectId: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function createOwnerCapById(options: CreateOwnerCapByIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        '0x2::object::ID',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["objectId", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'create_owner_cap_by_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RegisterServerAddressArguments {
    serverAddressRegistry: RawTransactionArgument<string>;
    _: RawTransactionArgument<string>;
    serverAddress: RawTransactionArgument<string>;
}
export interface RegisterServerAddressOptions {
    package?: string;
    arguments: RegisterServerAddressArguments | [
        serverAddressRegistry: RawTransactionArgument<string>,
        _: RawTransactionArgument<string>,
        serverAddress: RawTransactionArgument<string>
    ];
}
export function registerServerAddress(options: RegisterServerAddressOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["serverAddressRegistry", "_", "serverAddress"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'register_server_address',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RemoveServerAddressArguments {
    serverAddressRegistry: RawTransactionArgument<string>;
    _: RawTransactionArgument<string>;
    serverAddress: RawTransactionArgument<string>;
}
export interface RemoveServerAddressOptions {
    package?: string;
    arguments: RemoveServerAddressArguments | [
        serverAddressRegistry: RawTransactionArgument<string>,
        _: RawTransactionArgument<string>,
        serverAddress: RawTransactionArgument<string>
    ];
}
export function removeServerAddress(options: RemoveServerAddressOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["serverAddressRegistry", "_", "serverAddress"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'remove_server_address',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DeleteOwnerCapArguments {
    ownerCap: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
}
export interface DeleteOwnerCapOptions {
    package?: string;
    arguments: DeleteOwnerCapArguments | [
        ownerCap: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function deleteOwnerCap(options: DeleteOwnerCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["ownerCap", "adminAcl"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'access',
        function: 'delete_owner_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}