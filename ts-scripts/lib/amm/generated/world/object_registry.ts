/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Unified registry to derive all in-game object ids for game assets
 * 
 * All game assets (characters, assemblies, network nodes, etc) derive their
 * deterministic object IDs from this single registry using TenantItemId (item_id +
 * tenant) as the derivation key. This guarantees that each in-game item ID can
 * only be used once across all object types.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/world::object_registry';
export const ObjectRegistry = new MoveStruct({ name: `${$moduleName}::ObjectRegistry`, fields: {
        id: bcs.Address
    } });
export interface ObjectExistsArguments {
    registry: RawTransactionArgument<string>;
    key: TransactionArgument;
}
export interface ObjectExistsOptions {
    package?: string;
    arguments: ObjectExistsArguments | [
        registry: RawTransactionArgument<string>,
        key: TransactionArgument
    ];
}
export function objectExists(options: ObjectExistsOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "key"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'object_registry',
        function: 'object_exists',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}