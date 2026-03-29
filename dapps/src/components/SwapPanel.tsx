import { useState, useEffect } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAmmQuote } from "../hooks/useAmmQuote";
import { AmmPoolData } from "../hooks/useAmmPool";
import { buildSwapTx, type SsuContext, type PoolContext } from "../hooks/useAmmTransactions";
import type { SsuInventory } from "../hooks/useSsuInventory";
import { MarketStatus } from "./MarketStatus";
import { RecentActivity } from "./RecentActivity";

type Props = {
    poolId: string;
    poolConfig: AmmPoolData;
    poolCtx: PoolContext;
    ssuCtx: SsuContext;
    tokenALabel: string;
    tokenBLabel: string;
    onSwapComplete: () => void;
};

export function SwapPanel({
    poolId,
    poolConfig,
    poolCtx,
    ssuCtx,
    tokenALabel,
    tokenBLabel,
    onSwapComplete,
}: Props) {
    const [direction, setDirection] = useState<"a_for_b" | "b_for_a">("a_for_b");
    const [amountStr, setAmountStr] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingWithdraw, setPendingWithdraw] = useState<{ amount: string; token: string } | null>(null);

    const { signAndExecuteTransaction } = useDAppKit();
    const queryClient = useQueryClient();

    const amountIn = BigInt(amountStr || "0");
    const { data: quote } = useAmmQuote(poolConfig, direction, amountIn);

    const inLabel = direction === "a_for_b" ? tokenALabel : tokenBLabel;
    const outLabel = direction === "a_for_b" ? tokenBLabel : tokenALabel;
    const typeIdIn = BigInt(direction === "a_for_b" ? poolConfig.typeIdA : poolConfig.typeIdB);

    useEffect(() => { setError(null); }, [amountStr, direction]);

    const handleSwap = async () => {
        if (!quote || amountIn <= 0n) return;
        setSubmitting(true);
        setError(null);
        setPendingWithdraw(null);
        try {
            const minOut = (quote.totalOutput * 99n) / 100n;
            const tx = buildSwapTx(poolCtx, ssuCtx, { typeIdIn, amountIn, minOut });
            await signAndExecuteTransaction({ transaction: tx });
            setPendingWithdraw({ amount: quote.totalOutput.toString(), token: outLabel });
            setAmountStr("");
            onSwapComplete();

            // Optimistically update inventory: input left main, output arrived in main
            const typeIdOut = BigInt(direction === "a_for_b" ? poolConfig.typeIdB : poolConfig.typeIdA);
            queryClient.setQueryData<SsuInventory | null>(
                ["ssu-inventory", ssuCtx.ssuId],
                (old) => {
                    if (!old) return old;
                    const mainItems = old.main.map((item) => {
                        if (item.typeId === String(typeIdIn)) {
                            return { ...item, quantity: Math.max(0, item.quantity - Number(amountIn)) };
                        }
                        return item;
                    }).filter((item) => item.quantity > 0);

                    // Add output to main (or increment existing)
                    const outId = String(typeIdOut);
                    const totalOut = Number(quote.totalOutput);
                    const existing = mainItems.find((item) => item.typeId === outId);
                    if (existing) {
                        existing.quantity += totalOut;
                    } else {
                        mainItems.push({ typeId: outId, quantity: totalOut, volume: 0 });
                    }

                    return { ...old, main: mainItems };
                },
            );
            // Also refetch in background to converge with chain state
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] }), 3000);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Swap failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <MarketStatus poolConfig={poolConfig} />

            <div className="terminal-panel" data-label="Place Order">
                {/* Direction toggle */}
                <div className="direction-toggle" style={{ marginBottom: 12 }}>
                    <button
                        className={direction === "a_for_b" ? "active" : ""}
                        onClick={() => setDirection("a_for_b")}
                    >
                        SELL {tokenALabel}
                    </button>
                    <button
                        className={direction === "b_for_a" ? "active" : ""}
                        onClick={() => setDirection("b_for_a")}
                    >
                        SELL {tokenBLabel}
                    </button>
                </div>

                {/* Amount input */}
                <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
                    <input
                        className="input-lg"
                        type="number" min="1"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder="0"
                        style={{ borderRight: "none" }}
                    />
                    {quote && quote.maxInput > 0n && (
                        <button onClick={() => setAmountStr(quote.maxInput.toString())}
                            style={{ whiteSpace: "nowrap", padding: "14px 16px", fontSize: 11 }}>
                            MAX
                        </button>
                    )}
                </div>

                {/* Order Preview */}
                {amountIn > 0n && quote && (
                    <div style={{
                        border: "1px solid rgba(232, 122, 30, 0.1)",
                        padding: 12, marginBottom: 12,
                        background: "rgba(10, 13, 18, 0.6)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                            <span style={{ color: "#666" }}>You send</span>
                            <span style={{ color: "var(--text-bright)", fontWeight: 500 }}>{amountIn.toString()} {inLabel}</span>
                        </div>
                        <div style={{ height: 1, background: "rgba(232, 122, 30, 0.1)", margin: "8px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                            <span style={{ color: "#666" }}>You receive</span>
                            <span style={{
                                color: "#fff", fontWeight: 500, fontSize: 16,
                                fontFamily: '"Frontier Disket Mono", monospace',
                            }}>{quote.totalOutput.toString()} {outLabel}</span>
                        </div>
                        <div style={{ height: 1, background: "rgba(232, 122, 30, 0.1)", margin: "8px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                            <span style={{ color: "#666" }}>Tx Tax</span>
                            <span style={{ color: "var(--text-bright)", fontWeight: 500 }}>
                                {quote.feeAmount.toString()} ({(Number(quote.effectiveFeeBps) / 100).toFixed(1)}%)
                            </span>
                        </div>
                        {!quote.isRebalancing && quote.effectiveFeeBps > BigInt(poolConfig.feeBps) && (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                                <span style={{ color: "#666" }}>Scarcity Surcharge</span>
                                <span style={{ color: "var(--red)", fontWeight: 500 }}>
                                    +{(Number(quote.effectiveFeeBps - BigInt(poolConfig.feeBps)) / 100).toFixed(1)}%
                                </span>
                            </div>
                        )}
                        {quote.bonus > 0n && (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                                <span style={{ color: "#666" }}>Supply Incentive</span>
                                <span style={{ color: "var(--green)", fontWeight: 500 }}>+{quote.bonus.toString()} {outLabel}</span>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                            <span style={{ color: "#666" }}>Market Impact</span>
                            <span style={{ color: "var(--text-bright)", fontWeight: 500 }}>
                                {(Number(quote.priceImpactBps) / 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Context message */}
                {amountIn > 0n && quote && (
                    <div className={`order-context ${quote.isRebalancing ? "bonus" : "warning"}`}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{quote.isRebalancing ? "+" : "!"}</span>
                        <span>
                            {quote.isRebalancing
                                ? "This trade restores balance. Supply incentive earned."
                                : "This trade increases imbalance. Scarcity surcharge applied."
                            }
                        </span>
                    </div>
                )}

                {/* Steps */}
                <div className="steps">
                    1. Deposit {inLabel} into this SSU from your ship<br />
                    2. Execute trade below<br />
                    3. Withdraw {outLabel} from this SSU to your ship
                </div>

                {/* Execute button */}
                <button
                    className="primary"
                    onClick={handleSwap}
                    disabled={submitting || !quote || amountIn <= 0n}
                    style={{ width: "100%", padding: "14px 16px", fontSize: 13 }}
                >
                    {submitting ? "EXECUTING..." : `\u25C6 EXECUTE TRADE`}
                </button>

                {error && <div className="error">{error}</div>}

                {pendingWithdraw && (
                    <div className="withdraw-notice">
                        <div className="title">// Order executed</div>
                        <div className="amount">
                            +{pendingWithdraw.amount} {pendingWithdraw.token}
                        </div>
                        <div className="sub">Withdraw from this SSU to your ship cargo</div>
                        <button onClick={() => setPendingWithdraw(null)} style={{ width: "100%" }}>
                            CONFIRM
                        </button>
                    </div>
                )}
            </div>

            <RecentActivity poolId={poolId} typeIdA={poolConfig.typeIdA} typeIdB={poolConfig.typeIdB} />
        </>
    );
}
