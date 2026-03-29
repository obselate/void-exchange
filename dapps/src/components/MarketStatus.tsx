import { AmmPoolData } from "../hooks/useAmmPool";
import { ITEM_NAMES } from "../config";

type Props = {
    poolConfig: AmmPoolData;
};

export function MarketStatus({ poolConfig }: Props) {
    const resA = Number(poolConfig.reserveA);
    const resB = Number(poolConfig.reserveB);
    const total = resA + resB;
    const pctA = total > 0 ? Math.round(resA / total * 100) : 50;
    const pctB = 100 - pctA;

    const nameA = ITEM_NAMES[poolConfig.typeIdA] || `#${poolConfig.typeIdA}`;
    const nameB = ITEM_NAMES[poolConfig.typeIdB] || `#${poolConfig.typeIdB}`;

    const rate = resA > 0 ? (resB / resA).toFixed(2) : "—";

    return (
        <div className="terminal-panel cyan" data-label="Market Status" style={{ marginBottom: 20 }}>
            <div style={{
                fontFamily: '"Frontier Disket Mono", monospace',
                fontSize: 16, fontWeight: 700, color: "#fff",
                letterSpacing: "3px", marginBottom: 16,
            }}>
                {nameA} <span style={{ color: "var(--accent)" }}>/</span> {nameB}
            </div>

            {/* Supply bar */}
            <div style={{ marginBottom: 6 }}>
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 10, color: "#666", letterSpacing: "2px", marginBottom: 6,
                    fontFamily: '"Frontier Disket Mono", monospace',
                }}>
                    <span>{nameA} {pctA}%</span>
                    <span>{nameB} {pctB}%</span>
                </div>
                <div className="supply-bar">
                    <div className="supply-bar-a" style={{ width: `${pctA}%` }} />
                    <div className="supply-bar-b" style={{ width: `${pctB}%` }} />
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                <Stat label="SUPPLY A" value={resA.toLocaleString()} color="var(--accent)" />
                <Stat label="RATE" value={`1 : ${rate}`} color="var(--text-bright)" />
                <Stat label="SUPPLY B" value={resB.toLocaleString()} color="var(--cyan)" />
            </div>

            {/* Market Revenue */}
            {(Number(poolConfig.feePoolA) > 0 || Number(poolConfig.feePoolB) > 0) && (
                <div style={{
                    display: "flex", justifyContent: "space-between", marginTop: 12,
                    padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)",
                    fontSize: 11, fontFamily: '"Frontier Disket Mono", monospace',
                }}>
                    <span style={{ color: "#555", letterSpacing: "2px" }}>REVENUE</span>
                    <span style={{ color: "var(--text-bright)" }}>
                        {Number(poolConfig.feePoolA) > 0 ? `${poolConfig.feePoolA} ${nameA}` : ""}
                        {Number(poolConfig.feePoolA) > 0 && Number(poolConfig.feePoolB) > 0 ? " / " : ""}
                        {Number(poolConfig.feePoolB) > 0 ? `${poolConfig.feePoolB} ${nameB}` : ""}
                    </span>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{
                fontFamily: '"Frontier Disket Mono", monospace',
                fontSize: 9, color: "#555", letterSpacing: "2px", marginBottom: 4,
            }}>{label}</div>
            <div style={{
                fontFamily: '"Frontier Disket Mono", monospace',
                fontSize: 13, fontWeight: 500, color,
            }}>{value}</div>
        </div>
    );
}
