/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Registry for deriving killmail object IDs. Killmails use a dedicated registry so
 * their IDs are independent of the main ObjectRegistry.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/world::killmail_registry';
export const KillmailRegistry = new MoveStruct({ name: `${$moduleName}::KillmailRegistry`, fields: {
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
        module: 'killmail_registry',
        function: 'object_exists',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}