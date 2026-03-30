import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "./suiClient";
import { getAmmPackageId, getAmmOriginalPackageId, setAmmOriginalPackageId, setAmmPackageId } from "../config";

export type AmmPoolData = {
    reserveA: string;
    reserveB: string;
    targetA: string;
    targetB: string;
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
    _debugErr?: string;
};

async function readPoolU64(poolId: string, isv: number, fnName: string, errors: string[]): Promise<string | null> {
    try {
        const pkg = getAmmPackageId();
        const tx = new Transaction();
        tx.moveCall({
            target: `${pkg}::amm::${fnName}`,
            arguments: [tx.sharedObjectRef({ objectId: poolId, initialSharedVersion: isv, mutable: false })],
        });
        const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        });
        const returnValues = result.results?.[0]?.returnValues;
        if (!returnValues?.length) {
            errors.push(`${fnName}:no-return`);
            return null;
        }
        // u64 is returned as BCS bytes (8 bytes little-endian)
        const bytes = returnValues[0][0];
        const buf = typeof bytes === "string"
            ? Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0))
            : new Uint8Array(bytes);
        let val = 0n;
        for (let i = 0; i < 8; i++) val |= BigInt(buf[i]) << BigInt(i * 8);
        return val.toString();
    } catch (e: any) {
        errors.push(`${fnName}:${e?.message?.slice(0, 80) || "unknown"}`);
        return null;
    }
}

export function useAmmPool(poolId: string | null) {
    return useQuery({
        queryKey: ["amm-pool", poolId],
        queryFn: async (): Promise<{ poolId: string; poolIsv: number; config: AmmPoolData } | null> => {
            if (!poolId) return null;
            try {
                // Get pool's initial shared version + type for package resolution
                const poolObj = await suiClient.getObject({
                    id: poolId,
                    options: { showOwner: true, showType: true, showPreviousTransaction: true },
                });
                if (!poolObj.data) return null;
                const owner = poolObj.data.owner as any;
                const isv = owner?.Shared?.initial_shared_version;
                if (!isv) {
                    console.error("[useAmmPool] Pool missing initial_shared_version — not a shared object?", poolId);
                    return null;
                }

                // Auto-resolve package IDs from the pool's on-chain type
                // e.g. "0xabc123::amm::AMMPool" → original package = "0xabc123"
                const poolType = poolObj.data.type;
                if (poolType) {
                    const originalPkg = poolType.split("::")[0];
                    if (originalPkg && originalPkg !== getAmmOriginalPackageId()) {
                        console.log("[useAmmPool] Detected pool package mismatch, updating:", originalPkg);
                        setAmmOriginalPackageId(originalPkg);
                    }
                }

                // Resolve current (callable) package from the pool's last transaction
                const prevTx = poolObj.data.previousTransaction;
                if (prevTx) {
                    try {
                        const txBlock = await suiClient.getTransactionBlock({
                            digest: prevTx,
                            options: { showInput: true },
                        });
                        const txns = (txBlock.transaction?.data?.transaction as any)?.transactions;
                        if (txns) {
                            for (const t of txns) {
                                const pkg = t?.MoveCall?.package;
                                if (pkg && t.MoveCall?.module === "amm") {
                                    if (pkg !== getAmmPackageId()) {
                                        console.log("[useAmmPool] Detected callable package from prev tx:", pkg);
                                        setAmmPackageId(pkg);
                                    }
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("[useAmmPool] Could not resolve current package from prev tx:", e);
                    }
                }

                // Read dynamic fields (fetch all in parallel to avoid N+1)
                const dfList = await suiClient.getDynamicFields({ parentId: poolId });
                if (!dfList.data?.length) return null;

                let configJson: any = null;
                let feeConfigJson: any = null;

                const dfObjects = await Promise.all(
                    dfList.data.map(f => suiClient.getDynamicFieldObject({ parentId: poolId, name: f.name })
                        .then(obj => ({ typeName: f.name?.type || "", obj })))
                );
                for (const { typeName, obj } of dfObjects) {
                    const fields = (obj.data?.content as any)?.fields?.value?.fields;
                    if (!fields) continue;

                    if (typeName.includes("ConfigKey") && !typeName.includes("FeeConfigKey")) {
                        configJson = fields;
                    } else if (typeName.includes("FeeConfigKey")) {
                        feeConfigJson = fields;
                    }
                }

                if (!configJson) return null;

                // If targets are missing from the dynamic field JSON (old pool layout),
                // try devInspect; if that also fails, fall back to current reserves
                // so imbalance reads 0% instead of a bogus number.
                let targetA = configJson.target_a;
                let targetB = configJson.target_b;
                const devInspectErrors: string[] = [];
                if (targetA == null || targetB == null) {
                    const [tA, tB] = await Promise.all([
                        readPoolU64(poolId, Number(isv), "target_a", devInspectErrors),
                        readPoolU64(poolId, Number(isv), "target_b", devInspectErrors),
                    ]);
                    targetA = tA;
                    targetB = tB;
                }

                const resA = configJson.reserve_a || "0";
                const resB = configJson.reserve_b || "0";

                return {
                    poolId,
                    poolIsv: Number(isv),
                    config: {
                        reserveA: resA,
                        reserveB: resB,
                        targetA: targetA ?? "1",
                        targetB: targetB ?? "1",
                        typeIdA: configJson.type_id_a || "0",
                        typeIdB: configJson.type_id_b || "0",
                        banner: configJson.banner || "",
                        amp: configJson.amp || "0",
                        feeBps: configJson.fee_bps || "0",
                        surgeBps: feeConfigJson?.surge_bps || "0",
                        bonusBps: feeConfigJson?.bonus_bps || "0",
                        feePoolA: feeConfigJson?.fee_pool_a || "0",
                        feePoolB: feeConfigJson?.fee_pool_b || "0",
                        _debugErr: devInspectErrors.length ? devInspectErrors.join(" ") : undefined,
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
