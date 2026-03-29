import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { suiClient } from "./useDevInspect";
import { getAmmPackageId } from "../config";

export type SsuConfig = {
    ssuId: string;
    ssuIsv: number;
    characterId: string;
    characterIsv: number;
    ownerCapId: string;
    isOwner: boolean;
    poolIds: string[];
};

async function resolveIsv(objectId: string): Promise<number> {
    const obj = await suiClient.getObject({ id: objectId });
    const owner = obj.data?.owner as any;
    const isv = owner?.Shared?.initial_shared_version;
    if (!isv) throw new Error(`Cannot resolve ISV for ${objectId}`);
    return Number(isv);
}

async function resolveSsuFields(ssuId: string): Promise<{ ownerCapId: string; characterId: string }> {
    const ssu = await suiClient.getObject({ id: ssuId, options: { showContent: true } });
    const fields = (ssu.data?.content as any)?.fields;
    if (!fields) throw new Error(`SSU not found: ${ssuId}`);
    return {
        ownerCapId: fields.owner_cap_id,
        characterId: fields.character_id,
    };
}

async function checkOwnership(ownerCapId: string, walletAddress: string): Promise<boolean> {
    try {
        const obj = await suiClient.getObject({ id: ownerCapId, options: { showOwner: true } });
        const owner = obj.data?.owner as any;
        return owner?.AddressOwner === walletAddress;
    } catch {
        return false;
    }
}

async function discoverPools(ssuId: string): Promise<string[]> {
    // Fallback: check localStorage for a known pool and verify it belongs to this SSU
    const storedPoolId = localStorage.getItem("amm_pool_id");
    if (storedPoolId) {
        try {
            const poolObj = await suiClient.getObject({ id: storedPoolId, options: { showContent: true } });
            const poolFields = (poolObj.data?.content as any)?.fields;
            if (poolFields?.ssu_id === ssuId) {
                return [storedPoolId];
            }
        } catch {
            // Stored pool doesn't exist or doesn't belong to this SSU
        }
    }

    // Try event-based discovery
    try {
        const pkg = getAmmPackageId();
        const eventTypes = [`${pkg}::amm::SwapWithBonusEvent`, `${pkg}::amm::SwapEvent`];
        for (const eventType of eventTypes) {
            const result = await suiClient.queryEvents({
                query: { MoveEventType: eventType },
                order: "descending",
                limit: 25,
            });
            const poolIds: string[] = [];
            for (const ev of result.data || []) {
                const parsed = ev.parsedJson as any;
                if (parsed?.pool_id && !poolIds.includes(parsed.pool_id)) {
                    const poolObj = await suiClient.getObject({ id: parsed.pool_id, options: { showContent: true } });
                    const poolFields = (poolObj.data?.content as any)?.fields;
                    if (poolFields?.ssu_id === ssuId) {
                        poolIds.push(parsed.pool_id);
                    }
                }
            }
            if (poolIds.length > 0) return poolIds;
        }
    } catch {
        // Fall through
    }

    return [];
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

            const [characterIsv, isOwner, poolIds] = await Promise.all([
                resolveIsv(ssuFields.characterId),
                walletAddress ? checkOwnership(ssuFields.ownerCapId, walletAddress) : false,
                discoverPools(ssuId),
            ]);

            return {
                ssuId,
                ssuIsv,
                characterId: ssuFields.characterId,
                characterIsv,
                ownerCapId: ssuFields.ownerCapId,
                isOwner,
                poolIds,
            };
        },
        enabled: !!ssuId,
        refetchInterval: 10_000,
        staleTime: 5_000,
    });
}
