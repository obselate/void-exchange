import { useQuery } from "@tanstack/react-query";
import { suiClient } from "./useDevInspect";
import { getAmmPackageId } from "../config";

export type SwapEvent = {
    direction: "sell_a" | "sell_b";
    amountIn: number;
    amountOut: number;
    fee: number;
    bonus: number;
    timestamp: number;
};

export function useSwapEvents(poolId: string | null) {
    return useQuery({
        queryKey: ["swap-events", poolId],
        queryFn: async (): Promise<SwapEvent[]> => {
            if (!poolId) return [];
            const pkg = getAmmPackageId();
            const eventTypes = [
                `${pkg}::amm::SwapWithBonusEvent`,
                `${pkg}::amm::SwapEvent`,
            ];

            for (const eventType of eventTypes) {
                try {
                    const result = await suiClient.queryEvents({
                        query: { MoveEventType: eventType },
                        order: "descending",
                        limit: 25,
                    });

                    if (!result.data?.length) continue;

                    return result.data
                        .filter((ev: any) => {
                            const parsed = ev.parsedJson as any;
                            return parsed?.pool_id === poolId;
                        })
                        .map((ev: any) => {
                            const p = ev.parsedJson as any;
                            const isAForB = p.type_id_in === p.type_id_a;
                            return {
                                direction: isAForB ? "sell_a" : "sell_b",
                                amountIn: Number(p.amount_in || 0),
                                amountOut: Number(p.amount_out || 0),
                                fee: Number(p.fee || 0),
                                bonus: Number(p.bonus || 0),
                                timestamp: Number(ev.timestampMs || 0),
                            } as SwapEvent;
                        });
                } catch {
                    continue;
                }
            }
            return [];
        },
        enabled: !!poolId,
        refetchInterval: 15_000,
        staleTime: 10_000,
    });
}
