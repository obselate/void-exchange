import { useQuery } from "@tanstack/react-query";
import { suiClient } from "./useDevInspect";

export type AmmPoolData = {
    reserveA: string;
    reserveB: string;
    typeIdA: string;
    typeIdB: string;
    banner: string;
    amp: string;
    feeBps: string;
    // Dynamic fee fields (optional — may not exist on older pools)
    surgeBps: string;
    bonusBps: string;
    feePoolA: string;
    feePoolB: string;
};

export function useAmmPool(poolId: string | null) {
    return useQuery({
        queryKey: ["amm-pool", poolId],
        queryFn: async (): Promise<{ poolId: string; poolIsv: number; config: AmmPoolData } | null> => {
            if (!poolId) return null;
            try {
                // Get pool's initial shared version for transactions
                const poolObj = await suiClient.getObject({ id: poolId, options: { showOwner: true } });
                if (!poolObj.data) return null;
                const owner = poolObj.data.owner as any;
                const isv = owner?.Shared?.initial_shared_version;

                // Read dynamic fields
                const dfList = await suiClient.getDynamicFields({ parentId: poolId });
                if (!dfList.data?.length) return null;

                // Find Config and FeeConfig
                let configJson: any = null;
                let feeConfigJson: any = null;

                for (const f of dfList.data) {
                    const typeName = f.name?.type || "";
                    const obj = await suiClient.getDynamicFieldObject({
                        parentId: poolId,
                        name: f.name,
                    });
                    const fields = (obj.data?.content as any)?.fields?.value?.fields;
                    if (!fields) continue;

                    if (typeName.includes("ConfigKey") && !typeName.includes("FeeConfigKey")) {
                        configJson = fields;
                    } else if (typeName.includes("FeeConfigKey")) {
                        feeConfigJson = fields;
                    }
                }

                if (!configJson) return null;

                return {
                    poolId,
                    poolIsv: Number(isv) || 0,
                    config: {
                        reserveA: configJson.reserve_a || "0",
                        reserveB: configJson.reserve_b || "0",
                        typeIdA: configJson.type_id_a || "0",
                        typeIdB: configJson.type_id_b || "0",
                        banner: configJson.banner || "",
                        amp: configJson.amp || "0",
                        feeBps: configJson.fee_bps || "0",
                        surgeBps: feeConfigJson?.surge_bps || "0",
                        bonusBps: feeConfigJson?.bonus_bps || "0",
                        feePoolA: feeConfigJson?.fee_pool_a || "0",
                        feePoolB: feeConfigJson?.fee_pool_b || "0",
                    },
                };
            } catch (e) {
                console.error("Pool fetch error:", e);
                return null;
            }
        },
        enabled: !!poolId,
        refetchInterval: 5_000,
        staleTime: 0,
    });
}
