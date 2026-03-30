import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { suiClient } from "./suiClient";
import { getAmmOriginalPackageId } from "../config";

/**
 * Resolve the AMMAdminCap for a specific pool from the connected wallet.
 * Queries all admin caps owned by the wallet and returns the one whose
 * pool_id matches the given poolId.
 */
export function useAdminCap(poolId: string | null) {
    const account = useCurrentAccount();
    const walletAddress = account?.address;

    return useQuery({
        queryKey: ["admin-cap", poolId, walletAddress],
        queryFn: async (): Promise<string | null> => {
            if (!poolId || !walletAddress) return null;

            const adminCapType = `${getAmmOriginalPackageId()}::amm::AMMAdminCap`;
            const owned = await suiClient.getOwnedObjects({
                owner: walletAddress,
                filter: { StructType: adminCapType },
                options: { showContent: true },
            });

            for (const item of owned.data || []) {
                const fields = (item.data?.content as any)?.fields;
                if (fields?.pool_id === poolId) {
                    return item.data!.objectId;
                }
            }

            return null;
        },
        enabled: !!poolId && !!walletAddress,
        staleTime: 5_000,
    });
}
