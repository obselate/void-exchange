import { useQuery } from "@tanstack/react-query";
import {
    fetchAllPoolMeta,
    type PoolMetaRecord,
} from "../../../ts-scripts/lib/amm";
import {
    AMM_ENV_CURRENT_PACKAGE_ID,
    AMM_ENV_ORIGINAL_PACKAGE_ID,
    AMM_REGISTRY_ID,
    AMM_REGISTRY_INITIAL_SHARED_VERSION,
} from "../config";
import { suiClient } from "./suiClient";

/**
 * Fetch every `PoolMeta` row from the registry — the data behind the
 * global market view at `void-exchange.com` (no `?ssu=`).
 *
 * Pool universe comes from `PoolRegistered` events; per-pool meta from
 * the registry's `pool_meta` view. Always pinned to the .env package IDs
 * since the registry only exists in the latest deployment.
 */
export function useAllPools(enabled = true) {
    return useQuery({
        queryKey: ["all-pools"],
        queryFn: async (): Promise<PoolMetaRecord[]> => {
            return fetchAllPoolMeta(suiClient, {
                registry: {
                    registryId: AMM_REGISTRY_ID,
                    registryIsv: AMM_REGISTRY_INITIAL_SHARED_VERSION,
                },
                ammPackageIds: {
                    current: AMM_ENV_CURRENT_PACKAGE_ID,
                    original: AMM_ENV_ORIGINAL_PACKAGE_ID,
                },
                originalPackageId: AMM_ENV_ORIGINAL_PACKAGE_ID,
                limit: 100,
            });
        },
        enabled: enabled && !!AMM_REGISTRY_ID && AMM_REGISTRY_INITIAL_SHARED_VERSION > 0,
        refetchInterval: 15_000,
        staleTime: 5_000,
    });
}
