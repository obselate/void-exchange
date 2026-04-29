import { useMemo, useState } from "react";
import { useAllPools } from "../hooks/useAllPools";
import { itemName } from "../config";
import type { PoolMetaRecord } from "../../../ts-scripts/lib/amm";

type Props = {
    onConnect: () => void;
};

type SortKey = "newest" | "amp" | "pair";

/**
 * Cross-SSU market browser. Renders every pool from the registry; each row
 * links to `?ssu=<id>` so the trader lands directly on that station's
 * trading UI.
 */
export function GlobalMarketView({ onConnect }: Props) {
    const { data: pools, isLoading, error } = useAllPools();
    const [sort, setSort] = useState<SortKey>("newest");
    const [showDelisted, setShowDelisted] = useState(false);

    const visible = useMemo(() => {
        if (!pools) return [];
        const filtered = pools.filter((p) => showDelisted || !p.delisted);
        const cmp = (a: PoolMetaRecord, b: PoolMetaRecord) => {
            switch (sort) {
                case "amp":
                    return Number(b.amp - a.amp);
                case "pair":
                    return pairLabel(a).localeCompare(pairLabel(b));
                case "newest":
                default:
                    return Number(b.createdAtMs - a.createdAtMs);
            }
        };
        return [...filtered].sort(cmp);
    }, [pools, sort, showDelisted]);

    return (
        <div className="terminal-panel" data-label="Global Market" style={{ marginBottom: 40 }}>
            <div style={{
                display: "flex", gap: 8, alignItems: "center",
                marginBottom: 12, flexWrap: "wrap",
            }}>
                <span style={{ fontSize: 11, color: "#777", letterSpacing: "2px", marginRight: "auto" }}>
                    {pools ? `${visible.length} VENUES` : ""}
                </span>
                <SortToggle current={sort} onChange={setSort} />
                <label style={{
                    fontSize: 10, color: "#777", letterSpacing: "1px",
                    display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                }}>
                    <input
                        type="checkbox"
                        checked={showDelisted}
                        onChange={(e) => setShowDelisted(e.target.checked)}
                    />
                    SHOW DELISTED
                </label>
            </div>

            {error && (
                <div className="error" style={{ marginBottom: 8 }}>
                    {error instanceof Error ? error.message : "Failed to load markets"}
                </div>
            )}

            {isLoading && !pools && (
                <div style={{
                    fontFamily: '"Frontier Disket Mono", monospace',
                    fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em",
                    textAlign: "center", padding: "24px 0",
                    animation: "pulse 1.5s ease infinite",
                }}>
                    // SCANNING REGISTRY...
                </div>
            )}

            {pools && visible.length === 0 && (
                <div style={{
                    fontSize: 11, color: "#666", textAlign: "center", padding: "24px 0",
                    fontFamily: '"Frontier Disket Mono", monospace', letterSpacing: "0.1em",
                }}>
                    // NO ACTIVE MARKETS
                </div>
            )}

            {visible.map((p) => <PoolRow key={p.poolId} pool={p} onConnect={onConnect} />)}
        </div>
    );
}

function PoolRow({ pool, onConnect }: { pool: PoolMetaRecord; onConnect: () => void }) {
    const status = pool.delisted ? "DELISTED" : pool.paused ? "PAUSED" : "LIVE";
    const statusColor = pool.delisted ? "#666" : pool.paused ? "var(--amber, #d4a017)" : "var(--green)";
    const href = `?ssu=${pool.ssuId}`;
    return (
        <a
            href={href}
            onClick={(e) => {
                // Let the browser navigate; auto-trigger connect prompt on the SSU page.
                onConnect();
                // Allow default navigation
                void e;
            }}
            style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", marginBottom: 6,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                textDecoration: "none", color: "inherit",
            }}
        >
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                    fontFamily: '"Frontier Disket Mono", monospace',
                    fontSize: 13, color: "var(--accent)", letterSpacing: "1px",
                }}>
                    {pairLabel(pool)}
                </div>
                <div style={{
                    fontSize: 10, color: "#666", letterSpacing: "1px", marginTop: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    SSU {pool.ssuId.slice(0, 10)}…{pool.ssuId.slice(-4)} · A={pool.amp.toString()}
                </div>
            </div>
            <span style={{
                fontSize: 10, color: statusColor, letterSpacing: "2px",
                fontFamily: '"Frontier Disket Mono", monospace', marginLeft: 12,
            }}>
                {status}
            </span>
        </a>
    );
}

function SortToggle({ current, onChange }: { current: SortKey; onChange: (s: SortKey) => void }) {
    const opts: Array<[SortKey, string]> = [["newest", "NEW"], ["amp", "AMP"], ["pair", "PAIR"]];
    return (
        <div style={{ display: "flex", gap: 0 }}>
            {opts.map(([key, label], i) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    style={{
                        padding: "4px 10px", fontSize: 10, letterSpacing: "1px",
                        borderLeft: i === 0 ? undefined : "none",
                        ...(current === key ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}),
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function pairLabel(p: PoolMetaRecord): string {
    return `${itemName(p.pair.lo.toString())} / ${itemName(p.pair.hi.toString())}`;
}
