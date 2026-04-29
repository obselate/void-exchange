/**
 * Helpers for reading events and object changes off an `ExecutedTransaction`.
 *
 * Sui event types are fully-qualified: `<package>::<module>::<EventStruct>`.
 * Callers usually only know the module + struct, hence the `endsWith` lookup.
 *
 * Reference: https://docs.sui.io/concepts/events
 */
import type { SuiEvent, SuiObjectChange } from "@mysten/sui/jsonRpc";

export interface EventLike {
    events: SuiEvent[];
}
export interface ObjectChangesLike {
    objectChanges: SuiObjectChange[];
}

/**
 * Find the first emitted event whose type ends with `suffix`.
 *
 * @param suffix - either the bare struct name (e.g. `SwapWithBonusEvent`) or
 *                 a `module::Struct` suffix for disambiguation.
 *
 * @example
 *   const e = findEvent<{ amount_in: string }>(result, "::amm::SwapWithBonusEvent");
 */
export function findEvent<T = unknown>(result: EventLike, suffix: string): T | null {
    const event = result.events.find((e) => e.type.endsWith(suffix));
    return (event?.parsedJson as T | undefined) ?? null;
}

/**
 * Find all emitted events whose type ends with `suffix`. Useful when a single
 * PTB triggers multiple events of the same type (e.g. a batch of swaps).
 */
export function findEvents<T = unknown>(result: EventLike, suffix: string): T[] {
    return result.events.filter((e) => e.type.endsWith(suffix)).map((e) => e.parsedJson as T);
}

/**
 * Find the first `created` object change whose `objectType` contains
 * `typeContains` (substring match — accepts `"AMMPool"`, `"::amm::AMMPool"`,
 * or the fully qualified type).
 */
export function findCreatedObject(
    result: ObjectChangesLike,
    typeContains: string
): { objectId: string; objectType: string } | null {
    for (const change of result.objectChanges) {
        if (change.type !== "created") continue;
        if (!change.objectType.includes(typeContains)) continue;
        return { objectId: change.objectId, objectType: change.objectType };
    }
    return null;
}

/**
 * Find all `created` object changes matching `typeContains`.
 */
export function findCreatedObjects(
    result: ObjectChangesLike,
    typeContains: string
): Array<{ objectId: string; objectType: string }> {
    const out: Array<{ objectId: string; objectType: string }> = [];
    for (const change of result.objectChanges) {
        if (change.type !== "created") continue;
        if (!change.objectType.includes(typeContains)) continue;
        out.push({ objectId: change.objectId, objectType: change.objectType });
    }
    return out;
}
