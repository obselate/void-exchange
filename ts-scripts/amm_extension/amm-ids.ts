import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { requireEnv } from "../utils/helper";
import { AMM_MODULE } from "./modules";

export function requireAmmPackageId(): string {
    return requireEnv("AMM_PACKAGE_ID");
}

/**
 * Find the AMMAdminCap owned by a given address.
 */
export async function findAdminCap(
    client: SuiJsonRpcClient,
    ownerAddress: string
): Promise<string | null> {
    const ammPackageId = requireAmmPackageId();
    const adminCapType = `${ammPackageId}::${AMM_MODULE.AMM}::AMMAdminCap`;
    const result = await client.getOwnedObjects({
        owner: ownerAddress,
        filter: { StructType: adminCapType },
        limit: 1,
    });
    return result.data[0]?.data?.objectId ?? null;
}

/**
 * Find all AMMPool shared objects. Uses a type query.
 */
export async function findPoolId(
    client: SuiJsonRpcClient,
    poolId: string
): Promise<string | null> {
    try {
        const obj = await client.getObject({
            id: poolId,
            options: { showContent: true },
        });
        return obj.data?.objectId ?? null;
    } catch {
        return null;
    }
}
