import { useState, useEffect, useRef } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAmmQuote } from "../hooks/useAmmQuote";
import { AmmPoolData } from "../hooks/useAmmPool";
import { buildSwapTx, type SsuContext, type PoolContext } from "../hooks/useAmmTransactions";
import { execTx } from "../hooks/execTx";
import type { SsuInventory } from "../hooks/useSsuInventory";
import { MarketStatus } from "./MarketStatus";
import type { DepthChartHandle } from "./DepthChart";
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
    const [pendingWithdraw, setPendingWithdraw] = useState<{ amount: string; token: string; digest?: string } | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const depthChartRef = useRef<DepthChartHandle>(null);

    const { signAndExecuteTransaction } = useDAppKit();
    const queryClient = useQueryClient();

    const amountIn = (() => { try { return BigInt(amountStr || "0"); } catch { return 0n; } })();
    const { data: quote } = useAmmQuote(poolConfig, direction, amountIn);

    const inLabel = direction === "a_for_b" ? tokenALabel : tokenBLabel;
    const outLabel = direction === "a_for_b" ? tokenBLabel : tokenALabel;
    const typeIdIn = BigInt(direction === "a_for_b" ? poolConfig.typeIdA : poolConfig.typeIdB);

    useEffect(() => { setError(null); }, [amountStr, direction]);

    const handleSwap = async () => {
        if (!quote || amountIn <= 0n) return;

        // Capture values before async ops — quote/poolConfig may change during await
        const minOut = (quote.amountOut * 99n) / 100n;
        const capturedQuote = quote;
        const capturedAmountIn = amountIn;
        const capturedDirection = direction;
        const typeIdOut = BigInt(capturedDirection === "a_for_b" ? poolConfig.typeIdB : poolConfig.typeIdA);
        const capturedTotalOutput = quote.totalOutput;
        const debugInfo = `amountIn=${amountIn} amountOut=${quote.amountOut} minOut=${minOut} fee=${quote.feeAmount} bonus=${quote.bonus} reserves=${poolConfig.reserveA}/${poolConfig.reserveB} targets=${poolConfig.targetA}/${poolConfig.targetB} amp=${poolConfig.amp} dir=${direction} err=${poolConfig._debugErr || "none"}`;

        setSubmitting(true);
        setError(null);
        setPendingWithdraw(null);
        try {
            const result = await execTx(
                signAndExecuteTransaction,
                () => buildSwapTx(poolCtx, ssuCtx, { typeIdIn, amountIn: capturedAmountIn, minOut, typeIdOut, totalOutput: capturedTotalOutput }),
                { label: "swap" },
            );
            setPendingWithdraw({ amount: capturedQuote.totalOutput.toString(), token: outLabel, digest: result.digest });
            // Flash the depth chart — compute reserve deltas
            const isAForB = capturedDirection === "a_for_b";
            const deltaA = isAForB ? Number(capturedAmountIn) : -Number(capturedQuote.totalOutput);
            const deltaB = isAForB ? -Number(capturedQuote.totalOutput) : Number(capturedAmountIn);
            depthChartRef.current?.flash(isAForB ? "a" : "b", deltaA, deltaB);
            setAmountStr("");
            onSwapComplete();

            // Optimistically update inventory: input left main, output arrived in main
            queryClient.setQueryData<SsuInventory | null>(
                ["ssu-inventory", ssuCtx.ssuId],
                (old) => {
                    if (!old) return old;
                    const mainItems = old.main.map((item) => {
                        if (item.typeId === String(typeIdIn)) {
                            return { ...item, quantity: Math.max(0, item.quantity - Number(capturedAmountIn)) };
                        }
                        return item;
                    }).filter((item) => item.quantity > 0);

                    // Add output to main (or increment existing) — immutable update
                    const outId = String(typeIdOut);
                    const totalOut = Number(capturedQuote.totalOutput);
                    const hasExisting = mainItems.some((item) => item.typeId === outId);
                    const updatedMain = hasExisting
                        ? mainItems.map(item => item.typeId === outId ? { ...item, quantity: item.quantity + totalOut } : item)
                        : [...mainItems, { typeId: outId, quantity: totalOut, volume: 0 }];

                    return { ...old, main: updatedMain };
                },
            );
            // Also refetch in background to converge with chain state
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] }), 3000);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(`${msg}\n[debug] ${debugInfo}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <MarketStatus ref={depthChartRef} poolConfig={poolConfig} />

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

                {/* Minimum input hint — shown when no quote but we can compute minimum */}
                {amountIn > 0n && !quote && (() => {
                    // Compute minInput independently for hint display
                    const isAForB = direction === "a_for_b";
                    const resIn = BigInt(isAForB ? poolConfig.reserveA : poolConfig.reserveB);
                    const baseFee = BigInt(poolConfig.feeBps);
                    const minNeeded = baseFee > 0n ? (10_000n / (10_000n - baseFee)) + 1n : 1n;
                    if (amountIn < minNeeded || amountIn < resIn / 10_000n) {
                        return (
                            <div className="swap-min-hint">
                                Amount too small to produce output. Try a larger amount.
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Compact order preview */}
                {amountIn > 0n && quote && (
                    <div className="swap-receipt">
                        {/* One-line summary */}
                        <div className="swap-receipt-summary">
                            <span className="swap-receipt-label">Receive</span>
                            <span className="swap-receipt-output">{quote.totalOutput.toString()} {outLabel}</span>
                            <span className="swap-receipt-for">for {amountIn.toString()} {inLabel}</span>
                            <span className="swap-receipt-fee">
                                &minus; {quote.feeAmount.toString()} fee
                                {quote.bonus > 0n && <span className="swap-receipt-bonus"> + {quote.bonus.toString()} bonus</span>}
                            </span>
                        </div>

                        {/* Expandable detail breakdown */}
                        <button
                            className="swap-receipt-toggle"
                            onClick={() => setDetailsOpen(o => !o)}
                            type="button"
                        >
                            {detailsOpen ? "hide details" : "details"}
                            <span className={`swap-receipt-chevron ${detailsOpen ? "open" : ""}`}>&#x25B8;</span>
                        </button>

                        {detailsOpen && (
                            <div className="swap-receipt-details">
                                <div className="swap-receipt-row">
                                    <span>Tx Tax</span>
                                    <span>{quote.feeAmount.toString()} ({(Number(quote.effectiveFeeBps) / 100).toFixed(1)}%)</span>
                                </div>
                                {!quote.isRebalancing && quote.effectiveFeeBps > BigInt(poolConfig.feeBps) && (
                                    <div className="swap-receipt-row">
                                        <span>Scarcity Surcharge</span>
                                        <span style={{ color: "var(--red)" }}>
                                            +{(Number(quote.effectiveFeeBps - BigInt(poolConfig.feeBps)) / 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                                {quote.bonus > 0n && (
                                    <div className="swap-receipt-row">
                                        <span>Supply Incentive</span>
                                        <span style={{ color: "var(--green)" }}>+{quote.bonus.toString()} {outLabel}</span>
                                    </div>
                                )}
                                <div className="swap-receipt-row">
                                    <span>Market Impact</span>
                                    <span>{(Number(quote.priceImpactBps) / 100).toFixed(1)}%</span>
                                </div>
                                <div className="swap-receipt-row">
                                    <span>Min Trade</span>
                                    <span>{quote.minInput > 0n ? `${quote.minInput.toString()} ${inLabel}` : "—"}</span>
                                </div>
                            </div>
                        )}

                        {/* Inline context badges */}
                        {quote.isRebalancing && (
                            <span className="swap-receipt-badge bonus">+ rebalancing bonus</span>
                        )}
                        {!quote.isRebalancing && quote.priceImpactBps > 500n && (
                            <span className="swap-receipt-badge warning">! high impact — surcharge applied</span>
                        )}
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
                        {pendingWithdraw.digest && (
                            <a
                                className="swap-tx-link"
                                href={`https://suiscan.xyz/mainnet/tx/${pendingWithdraw.digest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View transaction &rarr; {pendingWithdraw.digest.slice(0, 8)}...{pendingWithdraw.digest.slice(-6)}
                            </a>
                        )}
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
