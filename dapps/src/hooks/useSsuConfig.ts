import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { suiClient } from "./suiClient";
import { AMM_ENV_ORIGINAL_PACKAGE_ID } from "../config";

export type SsuConfig = {
    ssuId: string;
    ssuIsv: number;
    characterId: string;
    characterIsv: number;
    ownerCapId: string;
    isOwner: boolean;
    poolIds: string[];
    adminCapId: string | null;
};

async function resolveIsv(objectId: string): Promise<number> {
    const obj = await suiClient.getObject({ id: objectId, options: { showOwner: true } });
    const owner = obj.data?.owner as any;
    const isv = owner?.Shared?.initial_shared_version;
    if (!isv) throw new Error(`Cannot resolve ISV for ${objectId}`);
    return Number(isv);
}

async function resolveSsuFields(ssuId: string): Promise<{ ownerCapId: string; characterId: string }> {
    const ssu = await suiClient.getObject({ id: ssuId, options: { showContent: true } });
    const fields = (ssu.data?.content as any)?.fields;
    if (!fields) throw new Error(`SSU not found: ${ssuId}`);

    const ownerCapId: string = fields.owner_cap_id;

    // The SSU's OwnerCap is owned by the Character object.
    // Fetch the OwnerCap to find which Character owns this SSU.
    const capObj = await suiClient.getObject({ id: ownerCapId, options: { showOwner: true } });
    const capOwner = (capObj.data?.owner as any)?.AddressOwner;
    if (!capOwner) throw new Error(`Cannot resolve Character from OwnerCap ${ownerCapId}`);

    return { ownerCapId, characterId: capOwner };
}

async function checkOwnership(characterId: string, walletAddress: string): Promise<boolean> {
    // The Character object has a `character_address` field = the player's wallet address
    try {
        const obj = await suiClient.getObject({ id: characterId, options: { showContent: true } });
        const fields = (obj.data?.content as any)?.fields;
        return fields?.character_address === walletAddress;
    } catch {
        return false;
    }
}

type PoolDiscovery = { poolIds: string[]; adminCapId: string | null };


async function discoverPools(ssuId: string, walletAddress?: string): Promise<PoolDiscovery> {
    // Try admin cap discovery first (works for pool owners)
    if (walletAddress) {
        const adminCapType = `${AMM_ENV_ORIGINAL_PACKAGE_ID}::amm::AMMAdminCap`;
        const owned = await suiClient.getOwnedObjects({
            owner: walletAddress,
            filter: { StructType: adminCapType },
            options: { showContent: true },
        });

        const capMap = new Map<string, string>();
        for (const item of owned.data || []) {
            const capFields = (item.data?.content as any)?.fields;
            const poolId = capFields?.pool_id;
            if (poolId) capMap.set(poolId, item.data!.objectId);
        }

        if (capMap.size > 0) {
            const poolObjs = await suiClient.multiGetObjects({
                ids: [...capMap.keys()],
                options: { showContent: true },
            });

            let bestPool: { poolId: string; adminCapId: string; version: bigint } | null = null;
            for (const poolObj of poolObjs) {
                const poolFields = (poolObj.data?.content as any)?.fields;
                if (poolFields?.ssu_id === ssuId) {
                    const v = BigInt(poolObj.data!.version);
                    if (!bestPool || v > bestPool.version) {
                        bestPool = {
                            poolId: poolObj.data!.objectId,
                            adminCapId: capMap.get(poolObj.data!.objectId)!,
                            version: v,
                        };
                    }
                }
            }

            if (bestPool) {
                return { poolIds: [bestPool.poolId], adminCapId: bestPool.adminCapId };
            }
        }
    }

    // Fallback for traders: check localStorage for a previously-known pool
    // (set by ?pool= URL param or a prior owner session on this browser)
    const cachedPoolId = localStorage.getItem("amm_pool_id");
    if (cachedPoolId) {
        try {
            const poolObj = await suiClient.getObject({ id: cachedPoolId, options: { showContent: true } });
            const poolFields = (poolObj.data?.content as any)?.fields;
            if (poolFields?.ssu_id === ssuId) {
                return { poolIds: [cachedPoolId], adminCapId: null };
            }
        } catch { /* cached pool no longer exists, ignore */ }
    }

    return { poolIds: [], adminCapId: null };
}

export function useSsuConfig(ssuId: string | null) {
    const account = useCurrentAccount();
    const walletAddress = account?.address;

    return useQuery({
        queryKey: ["ssu-config", ssuId, walletAddress],
        queryFn: async (): Promise<SsuConfig> => {
            if (!ssuId) throw new Error("No SSU ID");

            const [ssuIsv, ssuFields] = await Promise.all([
                resolveIsv(ssuId),
                resolveSsuFields(ssuId),
            ]);

            const [characterIsv, isOwner, discovery] = await Promise.all([
                resolveIsv(ssuFields.characterId),
                walletAddress ? checkOwnership(ssuFields.characterId, walletAddress) : false,
                discoverPools(ssuId, walletAddress),
            ]);

            return {
                ssuId,
                ssuIsv,
                characterId: ssuFields.characterId,
                characterIsv,
                ownerCapId: ssuFields.ownerCapId,
                isOwner,
                poolIds: discovery.poolIds,
                adminCapId: discovery.adminCapId,
            };
        },
        enabled: !!ssuId,
        refetchInterval: 10_000,
        staleTime: 5_000,
    });
}
