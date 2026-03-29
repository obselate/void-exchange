import { useState, useCallback } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { SwapPanel } from "./components/SwapPanel";
import { StationOps } from "./components/StationOps";
import { StatusBar } from "./components/StatusBar";
import { LandingPage } from "./components/LandingPage";
import { SetupWizard } from "./components/SetupWizard";
import { useAmmPool } from "./hooks/useAmmPool";
import { useSsuConfig } from "./hooks/useSsuConfig";
import { ITEM_NAMES } from "./config";

// Parse SSU ID from URL: ?ssu=0xABC...
const SSU_ID = new URLSearchParams(window.location.search).get("ssu");
const IS_OPS = new URLSearchParams(window.location.search).has("ops")
    || new URLSearchParams(window.location.search).has("admin");

function itemName(typeId: string): string {
    return ITEM_NAMES[typeId] || `Item #${typeId}`;
}

function App() {
    const { handleConnect, handleDisconnect } = useConnection();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();

    const [showLanding, setShowLanding] = useState(() => !SSU_ID && !localStorage.getItem("void_exchange_visited"));

    // Resolve all SSU config from chain
    const { data: ssuConfig, isLoading: ssuLoading } = useSsuConfig(SSU_ID);

    // Use first discovered pool (future: pool selector)
    const activePoolId = ssuConfig?.poolIds?.[0] || localStorage.getItem("amm_pool_id") || "";
    const { data: pool, refetch: refetchPool } = useAmmPool(activePoolId || null);

    const handleEnterTerminal = () => {
        localStorage.setItem("void_exchange_visited", "1");
        setShowLanding(false);
        if (!account) handleConnect();
    };

    const handleWizardComplete = useCallback(() => {
        // Refetch SSU config to pick up the new pool
        queryClient.invalidateQueries({ queryKey: ["ssu-config"] });
        queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
    }, [queryClient]);

    // No SSU ID in URL → landing page
    if (!SSU_ID || showLanding || !account) {
        return (
            <>
                <LandingPage onConnect={handleEnterTerminal} />
                <StatusBar />
            </>
        );
    }

    // SSU ID present but still loading config
    if (ssuLoading || !ssuConfig) {
        return (
            <>
                <div style={{ padding: "12px 10px", maxWidth: 540, margin: "0 auto" }}>
                    <div className="header">
                        <h1 style={{ fontSize: 13, letterSpacing: "4px" }}>VOID EXCHANGE</h1>
                    </div>
                    <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{
                            fontFamily: '"Frontier Disket Mono", monospace',
                            fontSize: 12, color: "var(--accent)",
                            letterSpacing: "0.1em", animation: "pulse 1.5s ease infinite",
                        }}>
                            // CONNECTING TO STATION...
                        </div>
                    </div>
                </div>
                <StatusBar />
            </>
        );
    }

    // No pool exists
    if (!activePoolId || !pool) {
        // Owner → show wizard
        if (ssuConfig.isOwner) {
            return (
                <>
                    <SetupWizard ssuConfig={ssuConfig} onComplete={handleWizardComplete} />
                    <StatusBar />
                </>
            );
        }
        // Trader → no market message
        return (
            <>
                <div style={{ padding: "12px 10px", maxWidth: 540, margin: "0 auto" }}>
                    <div className="header">
                        <h1 style={{ fontSize: 13, letterSpacing: "4px" }}>VOID EXCHANGE</h1>
                    </div>
                    <div className="terminal-panel" data-label="Market Terminal" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{
                            fontFamily: '"Frontier Disket Mono", monospace',
                            fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em",
                        }}>
                            NO MARKET AT THIS STATION
                        </div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>
                            The station owner has not deployed a market yet.
                        </div>
                    </div>
                </div>
                <StatusBar />
            </>
        );
    }

    // Pool exists → trading UI
    const ssuCtx = {
        ssuId: ssuConfig.ssuId,
        ssuIsv: ssuConfig.ssuIsv,
        characterId: ssuConfig.characterId,
        characterIsv: ssuConfig.characterIsv,
    };
    const poolCtx = { poolId: activePoolId, poolIsv: pool.poolIsv };

    return (
        <>
            <div style={{ padding: "12px 10px", maxWidth: 540, margin: "0 auto" }}>
                {/* Header */}
                <div className="header">
                    <h1 style={{ fontSize: 13, letterSpacing: "4px" }}>VOID EXCHANGE</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: "var(--green)", boxShadow: "0 0 8px var(--green-glow)",
                                display: "inline-block",
                            }} />
                            <button onClick={handleDisconnect} style={{
                                padding: "4px 8px", fontSize: 10, letterSpacing: "2px",
                                color: "var(--green)",
                            }}>
                                DOCKED
                            </button>
                        </span>
                    </div>
                </div>

                <SwapPanel
                    poolId={activePoolId}
                    poolConfig={pool.config}
                    poolCtx={poolCtx}
                    ssuCtx={ssuCtx}
                    tokenALabel={itemName(pool.config.typeIdA)}
                    tokenBLabel={itemName(pool.config.typeIdB)}
                    onSwapComplete={() => refetchPool()}
                />

                {IS_OPS && ssuConfig.isOwner && (
                    <>
                        <div className="divider" />
                        <StationOps
                            ssuConfig={ssuConfig}
                            ssuCtx={ssuCtx}
                            poolCtx={poolCtx}
                            poolConfig={pool.config}
                            onPoolCreated={() => handleWizardComplete()}
                        />
                    </>
                )}
            </div>
            <StatusBar />
        </>
    );
}

export default App;
