import { useState, useCallback, useEffect } from "react";
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
import { itemName } from "./config";

// Parse URL params: ?ssu=0xABC...&pool=0xDEF...&ops&setup
const _params = new URLSearchParams(window.location.search);
const SSU_ID = _params.get("ssu");
const POOL_OVERRIDE = _params.get("pool");
const IS_OPS = _params.has("ops") || _params.has("admin");
const FORCE_SETUP = _params.has("setup");

function App() {
    const { handleConnect, handleDisconnect } = useConnection();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();

    const [showLanding, setShowLanding] = useState(true);

    // Resolve all SSU config from chain
    const { data: ssuConfig, isLoading: ssuLoading, error: ssuError } = useSsuConfig(SSU_ID);

    // Use first discovered pool, with URL override for direct linking
    const activePoolId = POOL_OVERRIDE || ssuConfig?.poolIds?.[0] || "";
    // Persist pool ID so traders can rediscover it without the URL param
    useEffect(() => {
        if (activePoolId) localStorage.setItem("amm_pool_id", activePoolId);
    }, [activePoolId]);
    const { data: pool, refetch: refetchPool } = useAmmPool(activePoolId || null);

    const handleEnterTerminal = () => {
        setShowLanding(false);
        if (!account) handleConnect();
    };

    const handleWizardComplete = useCallback(() => {
        // Refetch SSU config to pick up the new pool
        queryClient.invalidateQueries({ queryKey: ["ssu-config"] });
        queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
    }, [queryClient]);

    // Landing page (always shown first, or when no SSU/account)
    if (!SSU_ID || showLanding || !account) {
        const market = pool ? {
            tokenA: itemName(pool.config.typeIdA),
            tokenB: itemName(pool.config.typeIdB),
            banner: pool.config.banner,
        } : undefined;
        return (
            <>
                <LandingPage onConnect={handleEnterTerminal} market={market} />
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
                            fontSize: 12, color: ssuError ? "var(--red)" : "var(--accent)",
                            letterSpacing: "0.1em", animation: ssuError ? "none" : "pulse 1.5s ease infinite",
                        }}>
                            {ssuError
                                ? `// ERROR: ${ssuError instanceof Error ? ssuError.message : "Failed to connect"}`
                                : "// CONNECTING TO STATION..."
                            }
                        </div>
                    </div>
                </div>
                <StatusBar />
            </>
        );
    }

    // No pool exists (or forced setup mode)
    if (!activePoolId || !pool || FORCE_SETUP) {
        // Owner → show wizard
        if (ssuConfig.isOwner) {
            return (
                <>
                    {FORCE_SETUP && pool && (
                        <div style={{
                            margin: "12px 10px 0", maxWidth: 540, padding: "10px 14px",
                            background: "rgba(255, 50, 50, 0.08)", border: "1px solid rgba(255, 50, 50, 0.3)",
                            fontSize: 11, color: "var(--red)", fontFamily: '"Frontier Disket Mono", monospace',
                            letterSpacing: "0.05em",
                        }}>
                            WARNING: A market already exists at this station. Deploying again will create a duplicate pool and spend gas.
                        </div>
                    )}
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
                        />
                    </>
                )}
            </div>
            <StatusBar />
        </>
    );
}

export default App;
