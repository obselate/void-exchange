import { useId } from "react";
import { AmmPoolData } from "../hooks/useAmmPool";
import { itemName } from "../config";

type Props = {
    poolConfig: AmmPoolData;
};

export function MarketStatus({ poolConfig }: Props) {
    const resA = Number(poolConfig.reserveA);
    const resB = Number(poolConfig.reserveB);
    const total = resA + resB;

    // Visual position: 0.5 = at target ratio, skews as it drifts
    // Normalize reserves by target ratio so equal = balanced
    const tA = Number(poolConfig.targetA) || 1;
    const tB = Number(poolConfig.targetB) || 1;
    const normA = resA / tA;
    const normB = resB / tB;
    const normTotal = normA + normB;
    const pctA = normTotal > 0 ? normA / normTotal : 0.5;

    const nameA = itemName(poolConfig.typeIdA);
    const nameB = itemName(poolConfig.typeIdB);

    // Target ratio from pool config
    const targetA = Number(poolConfig.targetA);
    const targetB = Number(poolConfig.targetB);

    // Ratio formatted as X:Y, normalized so the smaller side is 1
    const ratioRaw = resA > 0 && resB > 0 ? resA / resB : 1;
    const aDominant = ratioRaw >= 1;
    const fmtRatio = (v: number) => v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(1) : v.toFixed(2);
    const ratioDisplay = aDominant
        ? `${fmtRatio(ratioRaw)}:1`
        : `1:${fmtRatio(1 / ratioRaw)}`;
    const ratioColor = aDominant ? "#e87a1e" : "#00d4ff";

    // Imbalance relative to target ratio — mirrors contract cross-product logic
    const actualCross = resA * targetB;
    const targetCross = resB * targetA;
    const crossSum = actualCross + targetCross;
    const crossDiff = Math.abs(actualCross - targetCross);
    const imbalanceBps = crossSum > 0 ? crossDiff * 10000 / crossSum : 0;

    const feePct = (Number(poolConfig.feeBps) / 100).toFixed(1);
    // Effective rates = imbalanceBps * configuredBps / 10000, converted to %
    const surgeBps = Number(poolConfig.surgeBps);
    const bonusBps = Number(poolConfig.bonusBps);
    const effectiveSurgePct = surgeBps > 0 && imbalanceBps > 0 ? ((imbalanceBps * surgeBps / 10000) / 100).toFixed(2) : null;
    const effectiveBonusPct = bonusBps > 0 && imbalanceBps > 0 ? ((imbalanceBps * bonusBps / 10000) / 100).toFixed(2) : null;

    return (
        <div className="terminal-panel cyan" data-label="Market Status" style={{ marginBottom: 14 }}>
            <DepthChart pctA={pctA} nameA={nameA} nameB={nameB} resA={resA} resB={resB} ratioDisplay={ratioDisplay} ratioColor={ratioColor} targetPctA={targetA + targetB > 0 ? targetA / (targetA + targetB) : 0.5} imbalancePct={(imbalanceBps / 100).toFixed(1)} />

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
}

function DepthChart({ pctA, nameA, nameB, resA, resB, ratioDisplay, ratioColor, targetPctA, imbalancePct }: {
    pctA: number; nameA: string; nameB: string; resA: number; resB: number;
    ratioDisplay: string; ratioColor: string; targetPctA: number; imbalancePct: string;
}) {
    const uid = useId();
    const bidId = `bidFill-${uid}`;
    const askId = `askFill-${uid}`;
    const w = 320;
    const h = 80;
    const midX = w * pctA;

    // Build bid (A) side — rises from left edge to midpoint
    const aHeight = h * 0.85;
    const aPath = `M0,${h} L0,${h - aHeight * 0.15} Q${midX * 0.3},${h - aHeight * 0.4} ${midX * 0.6},${h - aHeight * 0.7} Q${midX * 0.8},${h - aHeight * 0.9} ${midX},${h - aHeight} L${midX},${h} Z`;

    // Build ask (B) side — rises from right edge to midpoint
    const bHeight = h * 0.85;
    const bPath = `M${w},${h} L${w},${h - bHeight * 0.15} Q${w - (w - midX) * 0.3},${h - bHeight * 0.4} ${w - (w - midX) * 0.6},${h - bHeight * 0.7} Q${w - (w - midX) * 0.8},${h - bHeight * 0.9} ${midX},${h - bHeight} L${midX},${h} Z`;

    return (
        <div className="depth-chart">
            {/* Ratio centered above the chart */}
            <div style={{
                textAlign: "center", marginBottom: 4,
                fontFamily: '"Frontier Disket Mono", monospace',
            }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: ratioColor, letterSpacing: "0.05em" }}>
                    {ratioDisplay}
                </span>
                {Number(imbalancePct) > 0.5 && (
                    <span style={{ fontSize: 9, color: Number(imbalancePct) > 10 ? "var(--red)" : "#444", marginLeft: 6 }}>
                        {imbalancePct}% off
                    </span>
                )}
            </div>

            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 80, display: "block" }}>
                <defs>
                    <linearGradient id={bidId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e87a1e" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#e87a1e" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id={askId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(y => (
                    <line key={y} x1={0} y1={h * y} x2={w} y2={h * y}
                        stroke="#1a2332" strokeWidth="0.5" strokeDasharray="2,4" />
                ))}

                {/* Depth areas */}
                <path d={aPath} fill={`url(#${bidId})`} />
                <path d={bPath} fill={`url(#${askId})`} />

                {/* Edge lines on each curve */}
                <path d={aPath} fill="none" stroke="#e87a1e" strokeWidth="1.5" opacity="0.8"
                    style={{ filter: "drop-shadow(0 0 3px rgba(232,122,30,0.6))" }} />
                <path d={bPath} fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.8"
                    style={{ filter: "drop-shadow(0 0 3px rgba(0,212,255,0.6))" }} />

                {/* Target ratio marker */}
                <line x1={w * targetPctA} y1={0} x2={w * targetPctA} y2={h}
                    stroke="#fff" strokeWidth="0.5" opacity="0.15" strokeDasharray="1,6" />

                {/* Spread line at actual midpoint */}
                <line x1={midX} y1={0} x2={midX} y2={h}
                    stroke="#fff" strokeWidth="0.5" opacity="0.2" strokeDasharray="2,3" />
            </svg>

            {/* Reserve counts below */}
            <div className="depth-chart-labels">
                <span className="depth-label-a">{resA.toLocaleString()} {nameA}</span>
                <span className="depth-label-b">{resB.toLocaleString()} {nameB}</span>
            </div>
        </div>
    );
}
