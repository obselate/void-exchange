/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
const $moduleName = '@local-pkg/world::energy';
export const EnergyConfig = new MoveStruct({ name: `${$moduleName}::EnergyConfig`, fields: {
        id: bcs.Address,
        assembly_energy: table.Table
    } });
export const EnergySource = new MoveStruct({ name: `${$moduleName}::EnergySource`, fields: {
        max_energy_production: bcs.u64(),
        current_energy_production: bcs.u64(),
        total_reserved_energy: bcs.u64()
    } });
export const StartEnergyProductionEvent = new MoveStruct({ name: `${$moduleName}::StartEnergyProductionEvent`, fields: {
        energy_source_id: bcs.Address,
        current_energy_production: bcs.u64()
    } });
export const StopEnergyProductionEvent = new MoveStruct({ name: `${$moduleName}::StopEnergyProductionEvent`, fields: {
        energy_source_id: bcs.Address
    } });
export const EnergyReservedEvent = new MoveStruct({ name: `${$moduleName}::EnergyReservedEvent`, fields: {
        energy_source_id: bcs.Address,
        assembly_type_id: bcs.u64(),
        energy_reserved: bcs.u64(),
        total_reserved_energy: bcs.u64()
    } });
export const EnergyReleasedEvent = new MoveStruct({ name: `${$moduleName}::EnergyReleasedEvent`, fields: {
        energy_source_id: bcs.Address,
        assembly_type_id: bcs.u64(),
        energy_released: bcs.u64(),
        total_reserved_energy: bcs.u64()
    } });
export interface AssemblyEnergyArguments {
    energyConfig: RawTransactionArgument<string>;
    typeId: RawTransactionArgument<number | bigint>;
}
export interface AssemblyEnergyOptions {
    package?: string;
    arguments: AssemblyEnergyArguments | [
        energyConfig: RawTransactionArgument<string>,
        typeId: RawTransactionArgument<number | bigint>
    ];
}
/** Returns the energy required for an assembly type id */
export function assemblyEnergy(options: AssemblyEnergyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["energyConfig", "typeId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'assembly_energy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TotalReservedEnergyArguments {
    energySource: TransactionArgument;
}
export interface TotalReservedEnergyOptions {
    package?: string;
    arguments: TotalReservedEnergyArguments | [
        energySource: TransactionArgument
    ];
}
/** Returns the total reserved energy for an energy source */
export function totalReservedEnergy(options: TotalReservedEnergyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["energySource"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'total_reserved_energy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AvailableEnergyArguments {
    energySource: TransactionArgument;
}
export interface AvailableEnergyOptions {
    package?: string;
    arguments: AvailableEnergyArguments | [
        energySource: TransactionArgument
    ];
}
/** Returns the available energy (current production - reserved) */
export function availableEnergy(options: AvailableEnergyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["energySource"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'available_energy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CurrentEnergyProductionArguments {
    energySource: TransactionArgument;
}
export interface CurrentEnergyProductionOptions {
    package?: string;
    arguments: CurrentEnergyProductionArguments | [
        energySource: TransactionArgument
    ];
}
/** Returns the current energy production */
export function currentEnergyProduction(options: CurrentEnergyProductionOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["energySource"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'current_energy_production',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MaxEnergyProductionArguments {
    energySource: TransactionArgument;
}
export interface MaxEnergyProductionOptions {
    package?: string;
    arguments: MaxEnergyProductionArguments | [
        energySource: TransactionArgument
    ];
}
/** Returns the max energy production */
export function maxEnergyProduction(options: MaxEnergyProductionOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["energySource"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'max_energy_production',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetEnergyConfigArguments {
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    assemblyTypeId: RawTransactionArgument<number | bigint>;
    energyRequired: RawTransactionArgument<number | bigint>;
}
export interface SetEnergyConfigOptions {
    package?: string;
    arguments: SetEnergyConfigArguments | [
        energyConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        assemblyTypeId: RawTransactionArgument<number | bigint>,
        energyRequired: RawTransactionArgument<number | bigint>
    ];
}
/** Sets or updates the energy requirement for an assembly type id */
export function setEnergyConfig(options: SetEnergyConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["energyConfig", "adminAcl", "assemblyTypeId", "energyRequired"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'set_energy_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RemoveEnergyConfigArguments {
    energyConfig: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    assemblyTypeId: RawTransactionArgument<number | bigint>;
}
export interface RemoveEnergyConfigOptions {
    package?: string;
    arguments: RemoveEnergyConfigArguments | [
        energyConfig: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        assemblyTypeId: RawTransactionArgument<number | bigint>
    ];
}
/** Removes the energy configuration for an assembly type id */
export function removeEnergyConfig(options: RemoveEnergyConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["energyConfig", "adminAcl", "assemblyTypeId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'energy',
        function: 'remove_energy_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}