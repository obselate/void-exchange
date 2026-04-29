/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as vec_map from './deps/sui/vec_map.js';
import * as location from './location.js';
import * as in_game_id from './in_game_id.js';
const $moduleName = '@local-pkg/world::inventory';
export const ItemEntry = new MoveStruct({ name: `${$moduleName}::ItemEntry`, fields: {
        tenant: bcs.string(),
        type_id: bcs.u64(),
        item_id: bcs.u64(),
        volume: bcs.u64(),
        quantity: bcs.u32()
    } });
export const Inventory = new MoveStruct({ name: `${$moduleName}::Inventory`, fields: {
        max_capacity: bcs.u64(),
        used_capacity: bcs.u64(),
        items: vec_map.VecMap(bcs.u64(), ItemEntry)
    } });
export const Item = new MoveStruct({ name: `${$moduleName}::Item`, fields: {
        id: bcs.Address,
        parent_id: bcs.Address,
        tenant: bcs.string(),
        type_id: bcs.u64(),
        item_id: bcs.u64(),
        volume: bcs.u64(),
        quantity: bcs.u32(),
        location: location.Location
    } });
export const ItemMintedEvent = new MoveStruct({ name: `${$moduleName}::ItemMintedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        character_id: bcs.Address,
        character_key: in_game_id.TenantItemId,
        item_id: bcs.u64(),
        type_id: bcs.u64(),
        quantity: bcs.u32()
    } });
export const ItemBurnedEvent = new MoveStruct({ name: `${$moduleName}::ItemBurnedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        character_id: bcs.Address,
        character_key: in_game_id.TenantItemId,
        item_id: bcs.u64(),
        type_id: bcs.u64(),
        quantity: bcs.u32()
    } });
export const ItemDepositedEvent = new MoveStruct({ name: `${$moduleName}::ItemDepositedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        character_id: bcs.Address,
        character_key: in_game_id.TenantItemId,
        item_id: bcs.u64(),
        type_id: bcs.u64(),
        quantity: bcs.u32()
    } });
export const ItemWithdrawnEvent = new MoveStruct({ name: `${$moduleName}::ItemWithdrawnEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        character_id: bcs.Address,
        character_key: in_game_id.TenantItemId,
        item_id: bcs.u64(),
        type_id: bcs.u64(),
        quantity: bcs.u32()
    } });
export const ItemDestroyedEvent = new MoveStruct({ name: `${$moduleName}::ItemDestroyedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        item_id: bcs.u64(),
        type_id: bcs.u64(),
        quantity: bcs.u32()
    } });
export interface TenantArguments {
    item: RawTransactionArgument<string>;
}
export interface TenantOptions {
    package?: string;
    arguments: TenantArguments | [
        item: RawTransactionArgument<string>
    ];
}
export function tenant(options: TenantOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["item"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'tenant',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ContainsItemArguments {
    inventory: TransactionArgument;
    typeId: RawTransactionArgument<number | bigint>;
}
export interface ContainsItemOptions {
    package?: string;
    arguments: ContainsItemArguments | [
        inventory: TransactionArgument,
        typeId: RawTransactionArgument<number | bigint>
    ];
}
export function containsItem(options: ContainsItemOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["inventory", "typeId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'contains_item',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GetItemLocationHashArguments {
    item: RawTransactionArgument<string>;
}
export interface GetItemLocationHashOptions {
    package?: string;
    arguments: GetItemLocationHashArguments | [
        item: RawTransactionArgument<string>
    ];
}
/**
 * Returns the location hash from the transit Item (metadata only, not used for
 * deposit validation — parent_id is used instead).
 */
export function getItemLocationHash(options: GetItemLocationHashOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["item"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'get_item_location_hash',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ParentIdArguments {
    item: RawTransactionArgument<string>;
}
export interface ParentIdOptions {
    package?: string;
    arguments: ParentIdArguments | [
        item: RawTransactionArgument<string>
    ];
}
/** Returns the object ID of the assembly this item was withdrawn from. */
export function parentId(options: ParentIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["item"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'parent_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MaxCapacityArguments {
    inventory: TransactionArgument;
}
export interface MaxCapacityOptions {
    package?: string;
    arguments: MaxCapacityArguments | [
        inventory: TransactionArgument
    ];
}
export function maxCapacity(options: MaxCapacityOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["inventory"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'max_capacity',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TypeIdArguments {
    item: RawTransactionArgument<string>;
}
export interface TypeIdOptions {
    package?: string;
    arguments: TypeIdArguments | [
        item: RawTransactionArgument<string>
    ];
}
export function typeId(options: TypeIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["item"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'type_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuantityArguments {
    item: RawTransactionArgument<string>;
}
export interface QuantityOptions {
    package?: string;
    arguments: QuantityArguments | [
        item: RawTransactionArgument<string>
    ];
}
export function quantity(options: QuantityOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["item"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'inventory',
        function: 'quantity',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}