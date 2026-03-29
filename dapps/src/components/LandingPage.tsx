type Props = {
    onConnect: () => void;
};

export function LandingPage({ onConnect }: Props) {
    return (
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

            {/* System Status */}
            <div className="terminal-panel" data-label="System Status" style={{ marginBottom: 40 }}>
                <StatusRow label="STATUS" value="ONLINE" color="var(--green)" />
                <StatusRow label="NETWORK" value="STILLNESS TESTNET" color="var(--accent)" />
                <StatusRow label="MARKETS" value="ACTIVE" color="var(--green)" />
                <StatusRow label="PROTOCOL" value="STABLESWAP AMM v9" color="var(--accent)" />
            </div>

            {/* System Brief */}
            <div className="terminal-panel cyan" data-label="System Brief" style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 13, lineHeight: 1.8, color: "#999" }}>
                    Player-operated resource markets deployed at any{" "}
                    <strong style={{ color: "var(--text-bright)", fontWeight: 400 }}>Smart Storage Unit</strong>.
                    Prices respond to supply and demand. Trades that worsen imbalance pay a{" "}
                    <strong style={{ color: "var(--text-bright)", fontWeight: 400 }}>scarcity surcharge</strong>.
                    Trades that restore balance earn{" "}
                    <strong style={{ color: "var(--text-bright)", fontWeight: 400 }}>supply incentives</strong>.
                    The market heals itself.
                </p>
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
