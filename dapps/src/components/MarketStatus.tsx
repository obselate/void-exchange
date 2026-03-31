import { forwardRef } from "react";
import { AmmPoolData } from "../hooks/useAmmPool";
import { itemName } from "../config";
import { DepthChart, DepthChartHandle } from "./DepthChart";

type Props = {
    poolConfig: AmmPoolData;
};

const BALANCED_THRESHOLD = 5;

export const MarketStatus = forwardRef<DepthChartHandle, Props>(
    function MarketStatus({ poolConfig }, ref) {
        const resA = Number(poolConfig.reserveA);
        const resB = Number(poolConfig.reserveB);
        const tA = Number(poolConfig.targetA) || 1;
        const tB = Number(poolConfig.targetB) || 1;
        const amp = Number(poolConfig.amp);
        const nameA = itemName(poolConfig.typeIdA);
        const nameB = itemName(poolConfig.typeIdB);

        // Imbalance for panel glow
        const actualCross = resA * tB;
        const targetCross = resB * tA;
        const crossSum = actualCross + targetCross;
        const crossDiff = Math.abs(actualCross - targetCross);
        const imbalanceBps = crossSum > 0 ? crossDiff * 10000 / crossSum : 0;
        const imbalancePct = imbalanceBps / 100;
        const aOver = actualCross > targetCross;
        const balanced = imbalancePct <= BALANCED_THRESHOLD;
        const imbF = Math.min(imbalancePct / 50, 1);

        // Panel glow class + CSS custom properties
        let glowClass = "glow-green";
        const glowVars: Record<string, string> = {};
        if (!balanced) {
            glowClass = aOver ? "glow-orange" : "glow-cyan";
            glowVars["--glow-alpha"] = (0.15 + imbF * 0.2).toFixed(2);
            glowVars["--glow-size"] = `${12 + imbF * 16}px`;
            glowVars["--glow-shadow"] = (0.03 + imbF * 0.08).toFixed(2);
            glowVars["--glow-label"] = (0.3 + imbF * 0.3).toFixed(2);
        }

        // Pricing rates
        const feePct = (Number(poolConfig.feeBps) / 100).toFixed(1);
        const surgeBps = Number(poolConfig.surgeBps);
        const bonusBps = Number(poolConfig.bonusBps);
        const effectiveSurgePct = surgeBps > 0 && imbalanceBps > 0
            ? ((imbalanceBps * surgeBps / 10000) / 100).toFixed(2) : null;
        const effectiveBonusPct = bonusBps > 0 && imbalanceBps > 0
            ? ((imbalanceBps * bonusBps / 10000) / 100).toFixed(2) : null;

        return (
            <div
                className={`terminal-panel cyan ${glowClass}`}
                data-label="Market Status"
                style={{ marginBottom: 14, transition: "border-color 0.8s, box-shadow 0.8s", ...glowVars }}
            >
                <DepthChart
                    ref={ref}
                    reserveA={resA}
                    reserveB={resB}
                    targetA={tA}
                    targetB={tB}
                    amp={amp}
                    nameA={nameA}
                    nameB={nameB}
                />

                {/* Pricing rates */}
                <div style={{
                    display: "flex", gap: 8, marginTop: 10,
                    fontSize: 10, fontFamily: '"Frontier Disket Mono", monospace',
                }}>
                    <div style={{
                        flex: 1, padding: "6px 10px",
                        background: "var(--bg-input)", border: "1px solid var(--border)",
                        display: "flex", justifyContent: "space-between",
                    }}>
                        <span style={{ color: "#555" }}>TAX</span>
                        <span style={{ color: "var(--text-bright)" }}>{feePct}%</span>
                    </div>
                    {effectiveSurgePct && (
                        <div style={{
                            flex: 1, padding: "6px 10px",
                            background: "var(--bg-input)", border: "1px solid var(--border)",
                            display: "flex", justifyContent: "space-between",
                        }}>
                            <span style={{ color: "#555" }}>SCARCITY</span>
                            <span style={{ color: "var(--red)" }}>+{effectiveSurgePct}%</span>
                        </div>
                    )}
                    {effectiveBonusPct && (
                        <div style={{
                            flex: 1, padding: "6px 10px",
                            background: "var(--bg-input)", border: "1px solid var(--border)",
                            display: "flex", justifyContent: "space-between",
                        }}>
                            <span style={{ color: "#555" }}>INCENTIVE</span>
                            <span style={{ color: "var(--green)" }}>+{effectiveBonusPct}%</span>
                        </div>
                    )}
                </div>
            </div>
        );
    },
);
