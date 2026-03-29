import { useState, useEffect } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAmmQuote } from "../hooks/useAmmQuote";
import { AmmPoolData } from "../hooks/useAmmPool";
import { buildSwapTx } from "../hooks/useAmmTransactions";
import { SSU_OBJECT_ID } from "../config";
import type { SsuInventory } from "../hooks/useSsuInventory";

type Props = {
    poolId: string;
    poolConfig: AmmPoolData;
    tokenALabel: string;
    tokenBLabel: string;
    banner: string;
    onSwapComplete: () => void;
};

export function SwapPanel({
    poolId,
    poolConfig,
    tokenALabel,
    tokenBLabel,
    banner,
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
            const tx = buildSwapTx({ typeIdIn, amountIn, minOut });
            await signAndExecuteTransaction({ transaction: tx });
            setPendingWithdraw({ amount: quote.totalOutput.toString(), token: outLabel });
            setAmountStr("");
            onSwapComplete();

            // Optimistically update inventory: input left main, output arrived in main
            const typeIdOut = BigInt(direction === "a_for_b" ? poolConfig.typeIdB : poolConfig.typeIdA);
            queryClient.setQueryData<SsuInventory | null>(
                ["ssu-inventory", SSU_OBJECT_ID],
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

    const resA = Number(poolConfig.reserveA);
    const resB = Number(poolConfig.reserveB);
    const rate = amountIn > 0n && quote
        ? (Math.floor(Number(quote.totalOutput) * 1000 / Number(amountIn)) / 1000).toFixed(3)
        : null;

    // Determine which direction is incentivized
    const aIsAbundant = resA > resB;
    const isBalanced = resA === resB;

    // Compute live fee/bonus rates for each direction
    const total = resA + resB;
    const diff = Math.abs(resA - resB);
    const imbalanceBps = total > 0 ? Math.floor(diff * 10000 / total) : 0;
    const baseFee = Number(poolConfig.feeBps);
    const surgeBps = Number(poolConfig.surgeBps);
    const bonusBps = Number(poolConfig.bonusBps);

    // A→B: selling A. Worsening if A is abundant (resA >= resB)
    const aToB_worsening = resA >= resB;
    const aToB_fee = aToB_worsening ? baseFee + Math.floor(imbalanceBps * surgeBps / 10000) : baseFee;
    const aToB_bonus = !aToB_worsening ? Math.floor(imbalanceBps * bonusBps / 10000) : 0;

    // B→A: selling B. Worsening if B is abundant (resB >= resA)
    const bToA_worsening = resB >= resA;
    const bToA_fee = bToA_worsening ? baseFee + Math.floor(imbalanceBps * surgeBps / 10000) : baseFee;
    const bToA_bonus = !bToA_worsening ? Math.floor(imbalanceBps * bonusBps / 10000) : 0;

    return (
        <div className="panel">
            {/* Dynamic rate cards */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{
                    flex: 1, padding: "10px 12px",
                    background: aToB_bonus > 0 ? "var(--green-dim)" : aToB_worsening && !isBalanced ? "var(--red-dim)" : "var(--bg-input)",
                    border: `1px solid ${aToB_bonus > 0 ? "var(--green-glow)" : "var(--border)"}`,
                }}>
                    <div className="label" style={{ marginBottom: 4 }}>{tokenALabel} &rarr; {tokenBLabel}</div>
                    <div style={{
                        fontFamily: '"Frontier Disket Mono", monospace', fontSize: 14, fontWeight: 700,
                        color: aToB_bonus > 0 ? "var(--green)" : "var(--text-bright)",
                    }}>
                        {aToB_bonus > 0
                            ? `+${(aToB_bonus / 100).toFixed(2)}% BONUS`
                            : `${(aToB_fee / 100).toFixed(2)}% FEE`
                        }
                    </div>
                </div>
                <div style={{
                    flex: 1, padding: "10px 12px",
                    background: bToA_bonus > 0 ? "var(--green-dim)" : bToA_worsening && !isBalanced ? "var(--red-dim)" : "var(--bg-input)",
                    border: `1px solid ${bToA_bonus > 0 ? "var(--green-glow)" : "var(--border)"}`,
                }}>
                    <div className="label" style={{ marginBottom: 4 }}>{tokenBLabel} &rarr; {tokenALabel}</div>
                    <div style={{
                        fontFamily: '"Frontier Disket Mono", monospace', fontSize: 14, fontWeight: 700,
                        color: bToA_bonus > 0 ? "var(--green)" : "var(--text-bright)",
                    }}>
                        {bToA_bonus > 0
                            ? `+${(bToA_bonus / 100).toFixed(2)}% BONUS`
                            : `${(bToA_fee / 100).toFixed(2)}% FEE`
                        }
                    </div>
                </div>
            </div>

            {/* Liquidity bar */}
            <div style={{
                display: "flex", gap: 1, marginBottom: 20, height: 4,
                background: "var(--bg-input)", overflow: "hidden",
            }}>
                <div style={{
                    width: `${resA / (resA + resB) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent-bright))",
                    transition: "width 0.5s ease",
                }} />
                <div style={{
                    flex: 1,
                    background: "linear-gradient(90deg, var(--cyan), rgba(0, 212, 255, 0.5))",
                    transition: "width 0.5s ease",
                }} />
            </div>

            {/* Reserves display */}
            <div style={{
                display: "flex", justifyContent: "space-between", marginBottom: 20,
                padding: "12px 14px", background: "var(--bg-input)", border: "1px solid var(--border)",
            }}>
                <div>
                    <div className="label" style={{ color: "var(--accent)", marginBottom: 2 }}>{tokenALabel}</div>
                    <div style={{
                        fontFamily: '"Frontier Disket Mono", monospace',
                        fontSize: 18, fontWeight: 700, color: "var(--text-bright)",
                    }}>{resA.toLocaleString()}</div>
                </div>
                <div style={{
                    display: "flex", alignItems: "center",
                    color: "var(--text-muted)", fontSize: 16, padding: "0 12px",
                }}>/</div>
                <div style={{ textAlign: "right" }}>
                    <div className="label" style={{ color: "var(--cyan)", marginBottom: 2 }}>{tokenBLabel}</div>
                    <div style={{
                        fontFamily: '"Frontier Disket Mono", monospace',
                        fontSize: 18, fontWeight: 700, color: "var(--text-bright)",
                    }}>{resB.toLocaleString()}</div>
                </div>
            </div>

            {/* Direction toggle */}
            <div className="direction-toggle">
                <button
                    className={direction === "a_for_b" ? "active" : ""}
                    onClick={() => setDirection("a_for_b")}
                >
                    {tokenALabel} &rarr; {tokenBLabel}
                </button>
                <button
                    className={direction === "b_for_a" ? "active" : ""}
                    onClick={() => setDirection("b_for_a")}
                >
                    {tokenBLabel} &rarr; {tokenALabel}
                </button>
            </div>

            {/* Amount input */}
            <div style={{ marginBottom: 16 }}>
                <div className="label">Deposit {inLabel}</div>
                <div style={{ display: "flex", gap: 0 }}>
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
                            style={{
                                whiteSpace: "nowrap", padding: "14px 16px",
                                borderLeft: "1px solid var(--border)",
                                fontSize: 11,
                            }}>
                            MAX
                        </button>
                    )}
                </div>
            </div>

            {/* Quote output */}
            {amountIn > 0n && quote && (
                <div style={{
                    marginBottom: 16, padding: "14px",
                    background: quote.isRebalancing ? "var(--green-dim)" : "var(--accent-dim)",
                    border: `1px solid ${quote.isRebalancing ? "var(--green-glow)" : "var(--border-glow)"}`,
                    animation: "fadeIn 0.2s ease",
                }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "baseline",
                        marginBottom: 8,
                    }}>
                        <div className="label" style={{ marginBottom: 0 }}>You receive</div>
                        <div style={{
                            fontFamily: '"Frontier Disket Mono", monospace',
                            fontSize: 22, fontWeight: 700,
                            color: quote.isRebalancing ? "var(--green)" : "var(--accent-bright)",
                            textShadow: quote.isRebalancing ? "0 0 20px var(--green-glow)" : "0 0 20px var(--accent-glow)",
                        }}>
                            {quote.totalOutput.toString()}{" "}
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{outLabel}</span>
                        </div>
                    </div>

                    {/* Bonus breakdown */}
                    {quote.bonus > 0n && (
                        <div style={{
                            marginBottom: 8, padding: "6px 10px",
                            background: "rgba(0, 255, 136, 0.06)",
                            border: "1px solid rgba(0, 255, 136, 0.15)",
                            fontSize: 11, fontFamily: '"Frontier Disket Mono", monospace',
                            display: "flex", justifyContent: "space-between",
                            color: "var(--green)",
                        }}>
                            <span>REBALANCE BONUS</span>
                            <span>+{quote.bonus.toString()} {outLabel}</span>
                        </div>
                    )}

                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: 11, color: "var(--text-muted)",
                        fontFamily: '"Frontier Disket Mono", monospace',
                    }}>
                        <span>
                            Fee: {quote.feeAmount.toString()} {inLabel}{" "}
                            ({(Number(quote.effectiveFeeBps) / 100).toFixed(2)}%)
                        </span>
                        <span>Rate: 1:{rate}</span>
                    </div>
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
                {submitting ? "EXECUTING TRADE..." : `TRADE ${inLabel} \u2192 ${outLabel}`}
            </button>

            {error && <div className="error">{error}</div>}

            {pendingWithdraw && (
                <div className="withdraw-notice">
                    <div className="title">// Trade executed</div>
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
    );
}
