/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module manages the lifecycle of a assembly in the world.
 * 
 * Basic AssemblyStatus are: Anchor, Unanchor/Destroy, Online and Offline assembly.
 * AssemblyStatus is mutable by admin and the assembly owner using capabilities.
 */

import { MoveEnum, MoveStruct, normalizeMoveArguments } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
const $moduleName = '@local-pkg/world::status';
export const Status = new MoveEnum({ name: `${$moduleName}::Status`, fields: {
        NULL: null,
        OFFLINE: null,
        ONLINE: null
    } });
export const AssemblyStatus = new MoveStruct({ name: `${$moduleName}::AssemblyStatus`, fields: {
        status: Status
    } });
export const Action = new MoveEnum({ name: `${$moduleName}::Action`, fields: {
        ANCHORED: null,
        ONLINE: null,
        OFFLINE: null,
        UNANCHORED: null
    } });
export const StatusChangedEvent = new MoveStruct({ name: `${$moduleName}::StatusChangedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        status: Status,
        action: Action
    } });
export interface StatusArguments {
    assemblyStatus: TransactionArgument;
}
export interface StatusOptions {
    package?: string;
    arguments: StatusArguments | [
        assemblyStatus: TransactionArgument
    ];
}
export function status(options: StatusOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assemblyStatus"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'status',
        function: 'status',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsOnlineArguments {
    assemblyStatus: TransactionArgument;
}
export interface IsOnlineOptions {
    package?: string;
    arguments: IsOnlineArguments | [
        assemblyStatus: TransactionArgument
    ];
}
export function isOnline(options: IsOnlineOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["assemblyStatus"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'status',
        function: 'is_online',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}