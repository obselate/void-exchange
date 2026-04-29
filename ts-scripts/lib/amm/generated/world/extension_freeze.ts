/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Shared types and event for freezing assembly extension configuration. Used by
 * Gate, Turret, and StorageUnit so the owner cannot change the extension after
 * freeze (no rugpull).
 * 
 * **Tradeoff:** Once frozen, the assembly cannot be re-authorised to a different
 * or fixed extension package. If a bug is found in the extension code, the owner
 * cannot point this assembly at a fixed version; they would need to use a new
 * assembly (e.g. anchor a new gate) and authorise the fixed extension there.
 * Freeze only after the extension is audited/tested and you are comfortable with
 * this permanence.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/world::extension_freeze';
export const ExtensionFrozenKey = new MoveStruct({ name: `${$moduleName}::ExtensionFrozenKey`, fields: {
        dummy_field: bcs.bool()
    } });
export const ExtensionFrozen = new MoveStruct({ name: `${$moduleName}::ExtensionFrozen`, fields: {
        dummy_field: bcs.bool()
    } });
export const ExtensionConfigFrozenEvent = new MoveStruct({ name: `${$moduleName}::ExtensionConfigFrozenEvent`, fields: {
        assembly_id: bcs.Address
    } });
export interface IsExtensionFrozenArguments {
    object: RawTransactionArgument<string>;
}
export interface IsExtensionFrozenOptions {
    package?: string;
    arguments: IsExtensionFrozenArguments | [
        object: RawTransactionArgument<string>
    ];
}
/**
 * Returns true if the given object has its extension config frozen (dynamic field
 * present).
 */
export function isExtensionFrozen(options: IsExtensionFrozenOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["object"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'extension_freeze',
        function: 'is_extension_frozen',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}