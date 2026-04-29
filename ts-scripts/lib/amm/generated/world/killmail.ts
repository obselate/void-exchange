/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Killmail tracking system for EVE Frontier kills. Emits killmail events for
 * indexer-based queries. Killmails are immutable records of player-vs-player
 * combat losses.
 */

import { MoveEnum, MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as in_game_id from './in_game_id.js';
const $moduleName = '@local-pkg/world::killmail';
/** Represents the type of loss in a killmail */
export const LossType = new MoveEnum({ name: `${$moduleName}::LossType`, fields: {
        SHIP: null,
        STRUCTURE: null
    } });
export const Killmail = new MoveStruct({ name: `${$moduleName}::Killmail`, fields: {
        id: bcs.Address,
        key: in_game_id.TenantItemId,
        killer_id: in_game_id.TenantItemId,
        victim_id: in_game_id.TenantItemId,
        reported_by_character_id: in_game_id.TenantItemId,
        kill_timestamp: bcs.u64(),
        loss_type: LossType,
        solar_system_id: in_game_id.TenantItemId
    } });
export const KillmailCreatedEvent = new MoveStruct({ name: `${$moduleName}::KillmailCreatedEvent`, fields: {
        key: in_game_id.TenantItemId,
        killer_id: in_game_id.TenantItemId,
        victim_id: in_game_id.TenantItemId,
        reported_by_character_id: in_game_id.TenantItemId,
        loss_type: LossType,
        kill_timestamp: bcs.u64(),
        solar_system_id: in_game_id.TenantItemId
    } });
export interface ShipOptions {
    package?: string;
    arguments?: [
    ];
}
/** Returns the SHIP variant of LossType */
export function ship(options: ShipOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/world';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'killmail',
        function: 'ship',
    });
}
export interface StructureOptions {
    package?: string;
    arguments?: [
    ];
}
/** Returns the STRUCTURE variant of LossType */
export function structure(options: StructureOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/world';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'killmail',
        function: 'structure',
    });
}
export interface CreateKillmailArguments {
    registry: RawTransactionArgument<string>;
    adminAcl: RawTransactionArgument<string>;
    itemId: RawTransactionArgument<number | bigint>;
    killerId: RawTransactionArgument<number | bigint>;
    victimId: RawTransactionArgument<number | bigint>;
    reportedByCharacter: RawTransactionArgument<string>;
    killTimestamp: RawTransactionArgument<number | bigint>;
    lossType: RawTransactionArgument<number>;
    solarSystemId: RawTransactionArgument<number | bigint>;
}
export interface CreateKillmailOptions {
    package?: string;
    arguments: CreateKillmailArguments | [
        registry: RawTransactionArgument<string>,
        adminAcl: RawTransactionArgument<string>,
        itemId: RawTransactionArgument<number | bigint>,
        killerId: RawTransactionArgument<number | bigint>,
        victimId: RawTransactionArgument<number | bigint>,
        reportedByCharacter: RawTransactionArgument<string>,
        killTimestamp: RawTransactionArgument<number | bigint>,
        lossType: RawTransactionArgument<number>,
        solarSystemId: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Creates a new killmail as a shared object on-chain Only authorized admin can
 * create killmails
 */
export function createKillmail(options: CreateKillmailOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        null,
        null,
        'u64',
        'u64',
        'u64',
        null,
        'u64',
        'u8',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["registry", "adminAcl", "itemId", "killerId", "victimId", "reportedByCharacter", "killTimestamp", "lossType", "solarSystemId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'killmail',
        function: 'create_killmail',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}