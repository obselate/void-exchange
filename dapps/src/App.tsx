import { useState } from "react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { SwapPanel } from "./components/SwapPanel";
import { StationOps } from "./components/StationOps";
import { StatusBar } from "./components/StatusBar";
import { LandingPage } from "./components/LandingPage";
import { useAmmPool } from "./hooks/useAmmPool";
import { ITEM_NAMES } from "./config";
import { buildAuthorizeTx } from "./hooks/useAmmTransactions";

const DEFAULT_POOL_ID = localStorage.getItem("amm_pool_id") || "";
const SSU_OWNER_CAP_ID = "0x8b0924695b7fe74f06fb1e7bb1276dc6385e6506e3b9a771f1213fef8247be70";
const IS_OPS = new URLSearchParams(window.location.search).has("ops")
    || new URLSearchParams(window.location.search).has("admin");

function itemName(typeId: string): string {
    return ITEM_NAMES[typeId] || `Item #${typeId}`;
}

function App() {
    const { handleConnect, handleDisconnect } = useConnection();
    const { signAndExecuteTransaction } = useDAppKit();
    const account = useCurrentAccount();

    const [poolId, setPoolId] = useState<string>(DEFAULT_POOL_ID);
    const [authStatus, setAuthStatus] = useState<string | null>(null);
    const { data: pool, refetch: refetchPool } = useAmmPool(poolId || null);

    const handleAuthorize = async () => {
        setAuthStatus("Authorizing...");
        try {
            const tx = await buildAuthorizeTx(SSU_OWNER_CAP_ID);
            await signAndExecuteTransaction({ transaction: tx });
            setAuthStatus("Authorized!");
        } catch (e) {
            setAuthStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const handlePoolCreated = (id: string) => {
        setPoolId(id);
        localStorage.setItem("amm_pool_id", id);
    };

    if (!account) {
        return (
            <>
                <LandingPage onConnect={handleConnect} />
                <StatusBar />
            </>
        );
    }

    return (
        <>
            <div style={{ padding: "24px 16px", maxWidth: 500, margin: "0 auto" }}>
                {/* Header */}
                <div className="header">
                    <h1>XAZPOOL</h1>
                    <button onClick={() => account?.address ? handleDisconnect() : handleConnect()}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: "var(--green)", boxShadow: "0 0 8px var(--green-glow)",
                                display: "inline-block",
                            }} />
                            {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                        </span>
                    </button>
                </div>

                {poolId && pool ? (
                    <SwapPanel
                        poolId={poolId}
                        poolConfig={pool.config}
                        tokenALabel={itemName(pool.config.typeIdA)}
                        tokenBLabel={itemName(pool.config.typeIdB)}
                        onSwapComplete={() => refetchPool()}
                    />
                ) : poolId ? (
                    <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{
                            fontFamily: '"Frontier Disket Mono", monospace',
                            fontSize: 12, color: "var(--accent)",
                            letterSpacing: "0.1em", animation: "pulse 1.5s ease infinite",
                        }}>
                            // LOADING MARKET DATA...
                        </div>
                    </div>
                ) : (
                    <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{
                            fontFamily: '"Frontier Disket Mono", monospace',
                            fontSize: 12, color: "var(--text-muted)",
                            letterSpacing: "0.1em",
                        }}>
                            // NO MARKET CONFIGURED{IS_OPS ? " — CREATE ONE BELOW" : ""}
                        </div>
                    </div>
                )}

                {IS_OPS && (
                    <>
                        <div className="divider" />
                        <button onClick={handleAuthorize} style={{
                            width: "100%", marginBottom: 12,
                            borderColor: authStatus?.startsWith("Error") ? "var(--red)" : undefined,
                        }}>
                            {authStatus || "AUTHORIZE AMM EXTENSION"}
                        </button>
                        <StationOps ssuOwnerCapId={SSU_OWNER_CAP_ID} onPoolCreated={handlePoolCreated} poolConfig={pool?.config} />
                    </>
                )}
            </div>
            <StatusBar />
        </>
    );
}

export default App;
