/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** This module holds all the identifiers used in-game to refer to entities */

import { MoveStruct, normalizeMoveArguments } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/world::in_game_id';
export const TenantItemId = new MoveStruct({ name: `${$moduleName}::TenantItemId`, fields: {
        item_id: bcs.u64(),
        tenant: bcs.string()
    } });
export interface ItemIdArguments {
    key: TransactionArgument;
}
export interface ItemIdOptions {
    package?: string;
    arguments: ItemIdArguments | [
        key: TransactionArgument
    ];
}
export function itemId(options: ItemIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["key"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'in_game_id',
        function: 'item_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TenantArguments {
    key: TransactionArgument;
}
export interface TenantOptions {
    package?: string;
    arguments: TenantArguments | [
        key: TransactionArgument
    ];
}
export function tenant(options: TenantOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["key"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'in_game_id',
        function: 'tenant',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}