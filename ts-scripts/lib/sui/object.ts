/**
 * Object metadata helpers.
 *
 * Shared objects on Sui have an `initialSharedVersion` baked into their
 * `owner` field. Knowing this version lets us build a `sharedObjectRef`
 * input to a transaction up front — Sui can then schedule the tx without
 * an RPC round-trip to fetch the latest version. For PTBs that touch the
 * same SSU/Pool repeatedly (e.g. seed-and-init, swap), the saving is
 * tangible.
 *
 * Reference:
 * https://docs.sui.io/concepts/object-ownership/shared
 */
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

/**
 * Fetch the `initialSharedVersion` for a shared object. Throws if the
 * object is not shared (no recovery path — caller probably passed the
 * wrong id).
 */
export async function getInitialSharedVersion(
    client: SuiJsonRpcClient,
    objectId: string
): Promise<number> {
    const response = await client.getObject({
        id: objectId,
        options: { showOwner: true },
    });
    const owner = response.data?.owner;
    if (!owner || typeof owner === "string" || !("Shared" in owner)) {
        throw new Error(
            `Object ${objectId} is not a shared object (owner: ${JSON.stringify(owner)})`
        );
    }
    // The fullnode returns this as a string; numeric for our shared-ref helper.
    return Number(owner.Shared.initial_shared_version);
}
