/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, MoveEnum, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
import * as in_game_id from './in_game_id.js';
const $moduleName = '@local-pkg/world::fuel';
export const FuelConfig = new MoveStruct({ name: `${$moduleName}::FuelConfig`, fields: {
        id: bcs.Address,
        fuel_efficiency: table.Table
    } });
export const Fuel = new MoveStruct({ name: `${$moduleName}::Fuel`, fields: {
        max_capacity: bcs.u64(),
        burn_rate_in_ms: bcs.u64(),
        type_id: bcs.option(bcs.u64()),
        unit_volume: bcs.option(bcs.u64()),
        quantity: bcs.u64(),
        is_burning: bcs.bool(),
        previous_cycle_elapsed_time: bcs.u64(),
        burn_start_time: bcs.u64(),
        last_updated: bcs.u64()
    } });
export const Action = new MoveEnum({ name: `${$moduleName}::Action`, fields: {
        DEPOSITED: null,
        WITHDRAWN: null,
        BURNING_STARTED: null,
        BURNING_STOPPED: null,
        BURNING_UPDATED: null,
        DELETED: null
    } });
export const FuelEvent = new MoveStruct({ name: `${$moduleName}::FuelEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        type_id: bcs.u64(),
        old_quantity: bcs.u64(),
        new_quantity: bcs.u64(),
        is_burning: bcs.bool(),
        action: Action
    } });
export const FuelEfficiencySetEvent = new MoveStruct({ name: `${$moduleName}::FuelEfficiencySetEvent`, fields: {
        fuel_type_id: bcs.u64(),
        efficiency: bcs.u64()
    } });
export const FuelEfficiencyRemovedEvent = new MoveStruct({ name: `${$moduleName}::FuelEfficiencyRemovedEvent`, fields: {
        fuel_type_id: bcs.u64()
    } });
export interface FuelEfficiencyArguments {
    fuelConfig: RawTransactionArgument<string>;
    fuelTypeId: RawTransactionArgument<number | bigint>;
}
export interface FuelEfficiencyOptions {
    package?: string;
    arguments: FuelEfficiencyArguments | [
        fuelConfig: RawTransactionArgument<string>,
        fuelTypeId: RawTransactionArgument<number | bigint>
    ];
}
export function fuelEfficiency(options: FuelEfficiencyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["fuelConfig", "fuelTypeId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'fuel_efficiency',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface QuantityArguments {
    fuel: TransactionArgument;
}
export interface QuantityOptions {
    package?: string;
    arguments: QuantityArguments | [
        fuel: TransactionArgument
    ];
}
export function quantity(options: QuantityOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["fuel"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'quantity',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TypeIdArguments {
    fuel: TransactionArgument;
}
export interface TypeIdOptions {
    package?: string;
    arguments: TypeIdArguments | [
        fuel: TransactionArgument
    ];
}
export function typeId(options: TypeIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["fuel"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'type_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VolumeArguments {
    fuel: TransactionArgument;
}
export interface VolumeOptions {
    package?: string;
    arguments: VolumeArguments | [
        fuel: TransactionArgument
    ];
}
export function volume(options: VolumeOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["fuel"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'volume',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsBurningArguments {
    fuel: TransactionArgument;
}
export interface IsBurningOptions {
    package?: string;
    arguments: IsBurningArguments | [
        fuel: TransactionArgument
    ];
}
export function isBurning(options: IsBurningOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["fuel"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'is_burning',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HasEnoughFuelArguments {
    fuel: TransactionArgument;
    fuelConfig: RawTransactionArgument<string>;
}
export interface HasEnoughFuelOptions {
    package?: string;
    arguments: HasEnoughFuelArguments | [
        fuel: TransactionArgument,
        fuelConfig: RawTransactionArgument<string>
    ];
}
/**
 * Checks if fuel has enough quantity to cover units that would be consumed at
 * current time
 */
export function hasEnoughFuel(options: HasEnoughFuelOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["fuel", "fuelConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'has_enough_fuel',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface NeedUpdateArguments {
    fuel: TransactionArgument;
    fuelConfig: RawTransactionArgument<string>;
}
export interface NeedUpdateOptions {
    package?: string;
    arguments: NeedUpdateArguments | [
        fuel: TransactionArgument,
        fuelConfig: RawTransactionArgument<string>
    ];
}
/**
 * Checks if fuel state needs to be updated based on elapsed time since last
 * update. Returns true if there are any fuel units needs to be consumed, false
 * otherwise. Useful for cron jobs to determine if `update()` should be called.
 */
export function needUpdate(options: NeedUpdateOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["fuel", "fuelConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'need_update',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetFuelEfficiencyArguments {
    fuelConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    fuelTypeId: RawTransactionArgument<number | bigint>;
    fuelEfficiency: RawTransactionArgument<number | bigint>;
}
export interface SetFuelEfficiencyOptions {
    package?: string;
    arguments: SetFuelEfficiencyArguments | [
        fuelConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        fuelTypeId: RawTransactionArgument<number | bigint>,
        fuelEfficiency: RawTransactionArgument<number | bigint>
    ];
}
/** Sets or updates the fuel efficiency percentage for a fuel type (10-100%) */
export function setFuelEfficiency(options: SetFuelEfficiencyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["fuelConfig", "adminAcl", "fuelTypeId", "fuelEfficiency"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'set_fuel_efficiency',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnsetFuelEfficiencyArguments {
    fuelConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    fuelTypeId: RawTransactionArgument<number | bigint>;
}
export interface UnsetFuelEfficiencyOptions {
    package?: string;
    arguments: UnsetFuelEfficiencyArguments | [
        fuelConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        fuelTypeId: RawTransactionArgument<number | bigint>
    ];
}
/** Removes the fuel efficiency configuration for a fuel type */
export function unsetFuelEfficiency(options: UnsetFuelEfficiencyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["fuelConfig", "adminAcl", "fuelTypeId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'fuel',
        function: 'unset_fuel_efficiency',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}