import { useQuery } from "@tanstack/react-query";
import {
    fetchPoolMeta,
    type PoolMetaRecord,
} from "../../../ts-scripts/lib/amm";
import {
    AMM_ENV_CURRENT_PACKAGE_ID,
    AMM_ENV_ORIGINAL_PACKAGE_ID,
    AMM_REGISTRY_ID,
    AMM_REGISTRY_INITIAL_SHARED_VERSION,
} from "../config";
import { suiClient } from "./suiClient";

/** Live `paused` / `delisted` / pair-summary view for a single pool. */
export function usePoolMeta(poolId: string | null) {
    return useQuery({
        queryKey: ["pool-meta", poolId],
        queryFn: async (): Promise<PoolMetaRecord | null> => {
            if (!poolId) return null;
            try {
                return await fetchPoolMeta(suiClient, {
                    registry: {
                        registryId: AMM_REGISTRY_ID,
                        registryIsv: AMM_REGISTRY_INITIAL_SHARED_VERSION,
                    },
                    ammPackageIds: {
                        current: AMM_ENV_CURRENT_PACKAGE_ID,
                        original: AMM_ENV_ORIGINAL_PACKAGE_ID,
                    },
                    poolId,
                });
            } catch {
                // Pool predates the registry (no entry) — surface as "not registered".
                return null;
            }
        },
        enabled: !!poolId && !!AMM_REGISTRY_ID && AMM_REGISTRY_INITIAL_SHARED_VERSION > 0,
        refetchInterval: 8_000,
        staleTime: 0,
    });
}
