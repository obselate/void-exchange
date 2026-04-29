import { BootScreen } from "./BootScreen";
import { GlobalMarketView } from "./GlobalMarketView";

type Props = {
    onConnect: () => void;
    market?: { tokenA: string; tokenB: string; banner: string };
    /** When true, show the cross-SSU market browser. Hidden when the
     *  user already has a specific SSU targeted via `?ssu=<id>`. */
    showGlobalMarket?: boolean;
};

export function LandingPage({ onConnect, market, showGlobalMarket }: Props) {
    return (
        <BootScreen>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div className="header">
                <h1 style={{ fontSize: 13, letterSpacing: "4px" }}>VOID EXCHANGE</h1>
                <span style={{
                    fontFamily: '"Frontier Disket Mono", monospace',
                    fontSize: 11, color: "#555", letterSpacing: "2px",
                }}>TERMINAL v0.9</span>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 48 }}>
                <div className="landing-title">VOID</div>
                <div className="landing-subtitle">
                    E X C H A N G E<span className="cursor-blink" />
                </div>
                <div className="landing-line" />
            </div>

            {/* Market Info (when a specific market is targeted) */}
            {market && (
                <div className="terminal-panel" data-label="Market" style={{ marginBottom: 40 }}>
                    <div style={{
                        fontFamily: '"Frontier Disket Mono", monospace',
                        fontSize: 14, color: "var(--accent)", letterSpacing: "3px",
                        textAlign: "center", padding: "8px 0 4px",
                    }}>
                        {market.tokenA} / {market.tokenB}
                    </div>
                    {market.banner && (
                        <div style={{
                            fontSize: 11, color: "#777", textAlign: "center",
                            padding: "4px 0 8px", lineHeight: 1.6,
                        }}>
                            {market.banner}
                        </div>
                    )}
                </div>
            )}

            {/* Cross-SSU market browser (no specific SSU targeted) */}
            {showGlobalMarket && <GlobalMarketView onConnect={onConnect} />}

            {/* System Status */}
            <div className="terminal-panel" data-label="System Status" style={{ marginBottom: 40 }}>
                <StatusRow label="STATUS" value="ONLINE" color="var(--green)" />
                <StatusRow label="NETWORK" value="STILLNESS TESTNET" color="var(--accent)" />
                <StatusRow label="MARKETS" value="ACTIVE" color="var(--green)" />
                <StatusRow label="PROTOCOL" value="STABLESWAP AMM v10" color="var(--accent)" />
            </div>

            {/* Features */}
            <div className="features-grid">
                <FeatureCard icon="[  ]" title="TRADE" desc="Buy and sell resources at any player-operated market" />
                <FeatureCard icon="[++]" title="SUPPLY" desc="Restore market balance and earn supply incentives" />
                <FeatureCard icon="[>>]" title="OPERATE" desc="Deploy your own trade post at any SSU you own" />
            </div>

            {/* CTA */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
                <button className="primary" onClick={onConnect} style={{
                    padding: "16px 48px", fontSize: 13, letterSpacing: "4px",
                }}>
                    &#9670; ACCESS TERMINAL
                </button>
            </div>

            {/* How to Get Started */}
            <details className="terminal-panel muted getting-started" style={{ marginBottom: 40 }}>
                <summary data-label="How to Get Started" style={{
                    cursor: "pointer", fontSize: 12, letterSpacing: "2px",
                    color: "var(--accent)", padding: "8px 0", listStyle: "none",
                }}>
                    <span style={{ marginRight: 8 }}>&#9670;</span>HOW TO GET STARTED
                </summary>
                <ol style={{
                    margin: "12px 0 4px", paddingLeft: 20,
                    fontSize: 11, color: "#999", lineHeight: 2.2, letterSpacing: "0.5px",
                }}>
                    <li>Online a <strong style={{ color: "#ccc" }}>Smart Storage Unit</strong> at your network node</li>
                    <li>Copy the <strong style={{ color: "#ccc" }}>Assembly ID</strong> from the SSU</li>
                    <li>Open <strong style={{ color: "#ccc" }}>Edit Assembly</strong> on the SSU</li>
                    <li>Set the dApp link to: <code style={{
                        color: "var(--accent)", background: "rgba(232,122,30,0.08)",
                        padding: "2px 6px", fontSize: 10,
                    }}>https://void-exchange.com/?ssu=&lt;ASSEMBLY_ID&gt;</code></li>
                    <li>Opening the dApp brings you to the <strong style={{ color: "#ccc" }}>New Market Wizard</strong></li>
                    <li>Follow the steps to <strong style={{ color: "#ccc" }}>configure and deploy</strong> your market</li>
                    <li>Append <code style={{
                        color: "var(--accent)", background: "rgba(232,122,30,0.08)",
                        padding: "2px 6px", fontSize: 10,
                    }}>&amp;ops</code> to the link to manage your station settings</li>
                </ol>
            </details>

            {/* How Dynamic Pricing Works */}
            <div className="terminal-panel muted" data-label="How Dynamic Pricing Works" style={{ marginBottom: 40 }}>
                <PricingRow indicator="green" label="Balanced market" value="0.5% tx tax" />
                <PricingRow indicator="amber" label="Imbalanced — worsening trade" value="up to 4.5% surcharge" />
                <PricingRow indicator="green" label="Imbalanced — restoring trade" value="0.5% tax + incentive bonus" />
                <PricingRow indicator="red" label="Incentive cap" value="max 3x trade fee" />
            </div>

            {/* Tagline */}
            <div style={{
                textAlign: "center", fontSize: 11, color: "#444", letterSpacing: "2px",
                paddingTop: 24, borderTop: "1px solid rgba(232, 122, 30, 0.1)",
            }}>
                No middlemen. No central bank. Just supply, demand, and math.
            </div>
        </div>
        </BootScreen>
    );
}

function StatusRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
            <span style={{ color: "#666", letterSpacing: "2px" }}>{label}</span>
            <span style={{ color, letterSpacing: "1px" }}>{value}</span>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="feature-card">
            <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "3px", marginBottom: 12, fontWeight: 700 }}>
                {icon}
            </div>
            <div style={{
                fontFamily: '"Frontier Disket Mono", monospace',
                fontSize: 14, fontWeight: 700, color: "#fff",
                letterSpacing: "3px", marginBottom: 10,
            }}>
                {title}
            </div>
            <div style={{ fontSize: 11, color: "#777", lineHeight: 1.6 }}>{desc}</div>
        </div>
    );
}

function PricingRow({ indicator, label, value }: { indicator: string; label: string; value: string }) {
    return (
        <div className="pricing-row">
            <span className={`pricing-indicator ${indicator}`} />
            <span style={{ color: "#999", flex: 1 }}>{label}</span>
            <span style={{ color: "var(--text-bright)", textAlign: "right", fontWeight: 500 }}>{value}</span>
        </div>
    );
}
