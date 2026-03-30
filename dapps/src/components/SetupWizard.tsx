import { useReducer, useEffect, useRef } from "react";
import { useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { useSsuInventory, InventoryItem } from "../hooks/useSsuInventory";
import { itemName } from "../config";
import {
    buildAuthorizeAndCreatePoolTx,
    buildCreatePoolTx,
    buildSeedAndInitFeeTx,
    type SsuContext,
} from "../hooks/useAmmTransactions";
import { suiClient } from "../hooks/suiClient";
import { execTx } from "../hooks/execTx";
import type { SsuConfig } from "../hooks/useSsuConfig";

// === Types ===

type WizardState = {
    step: 1 | 2 | 3 | 4 | 5;
    // Step 1 output
    detectedItems: InventoryItem[];
    // Step 2 output
    tokenA: InventoryItem | null;
    tokenB: InventoryItem | null;
    // Step 3 output
    curveType: "volatile" | "stable" | "custom";
    customAmp: string;
    ratioA: string;
    ratioB: string;
    sliderPct: number; // 0-100
    // Step 4 output
    feeBps: string;
    surgeBps: string;
    bonusBps: string;
    // Step 5 state
    deploying: boolean;
    deployed: boolean;
    txStatus: [TxStatus, TxStatus];
    deployError: string | null;
};

type TxStatus = "waiting" | "signing" | "confirmed" | "failed";

type Action =
    | { type: "SET_ITEMS"; items: InventoryItem[] }
    | { type: "SELECT_TOKEN_A"; item: InventoryItem | null }
    | { type: "SELECT_TOKEN_B"; item: InventoryItem | null }
    | { type: "SET_CURVE"; curveType: "volatile" | "stable" | "custom" }
    | { type: "SET_CUSTOM_AMP"; amp: string }
    | { type: "SET_RATIO"; ratioA: string; ratioB: string }
    | { type: "SET_SLIDER"; pct: number }
    | { type: "SET_FEE"; feeBps: string }
    | { type: "SET_SURGE"; surgeBps: string }
    | { type: "SET_BONUS"; bonusBps: string }
    | { type: "NEXT_STEP" }
    | { type: "PREV_STEP" }
    | { type: "START_DEPLOY" }
    | { type: "TX_STATUS"; index: 0 | 1; status: TxStatus }
    | { type: "DEPLOY_ERROR"; error: string }
    | { type: "DEPLOY_DONE" };

const initialState: WizardState = {
    step: 1,
    detectedItems: [],
    tokenA: null,
    tokenB: null,
    curveType: "volatile",
    customAmp: "50",
    ratioA: "1",
    ratioB: "1",
    sliderPct: 100,
    feeBps: "50",
    surgeBps: "250",
    bonusBps: "150",
    deploying: false,
    deployed: false,
    txStatus: ["waiting", "waiting"],
    deployError: null,
};

function reducer(state: WizardState, action: Action): WizardState {
    switch (action.type) {
        case "SET_ITEMS": {
            const items = action.items;
            // Only auto-select when no tokens are chosen yet (avoid resetting on refetch)
            if (state.tokenA || state.tokenB) {
                return { ...state, detectedItems: items };
            }
            if (items.length === 2) {
                return { ...state, detectedItems: items, tokenA: items[0], tokenB: items[1] };
            }
            return { ...state, detectedItems: items };
        }
        case "SELECT_TOKEN_A":
            return { ...state, tokenA: action.item };
        case "SELECT_TOKEN_B":
            return { ...state, tokenB: action.item };
        case "SET_CURVE":
            return { ...state, curveType: action.curveType };
        case "SET_CUSTOM_AMP":
            return { ...state, customAmp: action.amp };
        case "SET_RATIO":
            return { ...state, ratioA: action.ratioA, ratioB: action.ratioB };
        case "SET_SLIDER":
            return { ...state, sliderPct: action.pct };
        case "SET_FEE":
            return { ...state, feeBps: action.feeBps };
        case "SET_SURGE":
            return { ...state, surgeBps: action.surgeBps };
        case "SET_BONUS":
            return { ...state, bonusBps: action.bonusBps };
        case "NEXT_STEP":
            return { ...state, step: Math.min(state.step + 1, 5) as WizardState["step"] };
        case "PREV_STEP":
            return { ...state, step: Math.max(state.step - 1, 1) as WizardState["step"] };
        case "START_DEPLOY":
            return { ...state, deploying: true, deployed: false, deployError: null, txStatus: ["waiting", "waiting"] };
        case "TX_STATUS": {
            const txStatus = [...state.txStatus] as [TxStatus, TxStatus];
            txStatus[action.index] = action.status;
            return { ...state, txStatus };
        }
        case "DEPLOY_ERROR":
            return { ...state, deploying: false, deployError: action.error };
        case "DEPLOY_DONE":
            return { ...state, deploying: false, deployed: true };
        default:
            return state;
    }
}

// === Helpers ===


function computeReserves(state: WizardState): { reserveA: bigint; reserveB: bigint } {
    if (!state.tokenA || !state.tokenB) return { reserveA: 0n, reserveB: 0n };
    const rA = Number(state.ratioA) || 1;
    const rB = Number(state.ratioB) || 1;
    const maxA = state.tokenA.quantity;
    const maxB = state.tokenB.quantity;
    // Find the max scale factor that fits both sides
    const scaleA = maxA / rA;
    const scaleB = maxB / rB;
    const maxScale = Math.min(scaleA, scaleB);
    const scale = maxScale * (state.sliderPct / 100);
    return {
        reserveA: BigInt(Math.floor(rA * scale)),
        reserveB: BigInt(Math.floor(rB * scale)),
    };
}

function getAmp(state: WizardState): bigint {
    if (state.curveType === "stable") return 200n;
    if (state.curveType === "custom") return BigInt(Math.max(1, Number(state.customAmp) || 1));
    return 1n;
}

/**
 * Shows how much the price moves for a 10% trade at the given amp.
 * Uses the StableSwap invariant approximation:
 *   amp=1 → constant product → ~17% price impact for 10% trade
 *   amp=200 → stableswap → ~0.1% price impact for 10% trade
 */
function PriceImpactPreview({ amp }: { amp: bigint }) {
    // Simulate a 10% trade on equal reserves (1000/1000) using the invariant.
    // For constant product: output = y * dx / (x + dx), new_price = (y-dy)/(x+dx)
    // For stableswap: the amp reduces curvature proportionally.
    // Approximation: impact ≈ constantProductImpact / (1 + (amp-1) * blendFactor)
    const a = Number(amp);
    const tradeSize = 0.10; // 10%
    // Constant product impact for 10% trade: 1 - (1-f)/(1+f) where f=0.1 → ~17.4%
    const cpImpact = 1 - (1 - tradeSize) / (1 + tradeSize);
    // Blend: higher amp → impact approaches zero
    const impact = cpImpact / (1 + (a - 1) * 0.5);
    const impactPct = Math.max(0.01, impact * 100);

    // Visual bar: 20 chars wide, filled proportional to impact (max ~18%)
    const maxImpact = 18;
    const filled = Math.min(20, Math.round((impactPct / maxImpact) * 20));
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(20 - filled);

    const color = impactPct > 10 ? "var(--accent)" : impactPct > 2 ? "var(--yellow, #c90)" : "var(--green)";

    return (
        <div style={{
            padding: "8px 12px", marginBottom: 16,
            background: "rgba(10,13,18,0.6)", border: "1px solid var(--border)",
        }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "1px", marginBottom: 6 }}>
                PRICE IMPACT — if a trader buys 10% of reserves:
            </div>
            <div style={{ fontFamily: '"Frontier Disket Mono", monospace', fontSize: 12, letterSpacing: "1px" }}>
                <span style={{ color }}>{bar}</span>
                <span style={{ color, marginLeft: 8, fontWeight: 700 }}>
                    {impactPct < 0.1 ? "<0.1" : impactPct.toFixed(1)}%
                </span>
            </div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>
                {impactPct > 10
                    ? "Large swings — good for scarce/valuable items"
                    : impactPct > 2
                        ? "Moderate movement — balanced for most pairs"
                        : "Minimal movement — prices stay near the set ratio"
                }
            </div>
        </div>
    );
}

// === Props ===

type Props = {
    ssuConfig: SsuConfig;
    onComplete: () => void;
};

// === Component ===

export function SetupWizard({ ssuConfig, onComplete }: Props) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { signAndExecuteTransaction } = useDAppKit();
    const account = useCurrentAccount();
    const { data: inventory } = useSsuInventory(ssuConfig.ssuId);

    // Sync detected items from inventory
    useEffect(() => {
        if (!inventory) return;
        // Items in main inventory (deposited by the owner)
        const items = inventory.main.filter(i => i.quantity > 0);
        dispatch({ type: "SET_ITEMS", items });
    }, [inventory]);

    const ctx: SsuContext = {
        ssuId: ssuConfig.ssuId,
        ssuIsv: ssuConfig.ssuIsv,
        characterId: ssuConfig.characterId,
        characterIsv: ssuConfig.characterIsv,
    };

    // Persisted across retries so we can resume from where we left off
    const deployState = useRef<{ poolId?: string; poolIsv?: number; adminCapId?: string }>({});

    const handleDeploy = async () => {
        if (!state.tokenA || !state.tokenB) return;
        dispatch({ type: "START_DEPLOY" });

        const { reserveA, reserveB } = computeReserves(state);
        const amp = getAmp(state);
        const feeBps = BigInt(state.feeBps);
        const banner = `${itemName(state.tokenA.typeId)} / ${itemName(state.tokenB.typeId)}`;

        const runTx = (buildFn: () => ReturnType<typeof buildCreatePoolTx>, label: string) =>
            execTx(signAndExecuteTransaction, buildFn, { label, maxRetries: 5 });

        try {
            // TX 1: Authorize & Create Pool — batched into a single PTB.
            if (!deployState.current.poolId) {
                dispatch({ type: "TX_STATUS", index: 0, status: "signing" });

                const poolParams = {
                    typeIdA: BigInt(state.tokenA.typeId),
                    typeIdB: BigInt(state.tokenB.typeId),
                    reserveA, reserveB, amp, feeBps, banner,
                    sender: account!.address,
                };

                let createResult: any;
                try {
                    createResult = await runTx(() => buildAuthorizeAndCreatePoolTx(ctx, ssuConfig.ownerCapId, poolParams), "Authorize & Create Pool");
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    if (msg.includes("rejected by wallet")) throw e;
                    // Already authorized → retry with create_pool only
                    console.warn("[Wizard] Combined tx failed, retrying create-only:", msg);
                    createResult = await runTx(() => buildCreatePoolTx(ctx, poolParams), "Create Pool");
                }

                const digest = createResult.digest;
                const txDetail = await suiClient.waitForTransaction({
                    digest,
                    options: { showObjectChanges: true },
                });
                let newPoolId = "";
                let adminCapId = "";
                for (const change of txDetail?.objectChanges || []) {
                    if (change.type === "created") {
                        if (change.objectType?.includes("AMMPool")) {
                            newPoolId = change.objectId;
                        } else if (change.objectType?.includes("AMMAdminCap")) {
                            adminCapId = change.objectId;
                        }
                    }
                }

                if (!newPoolId || !adminCapId) {
                    throw new Error(
                        `Pool created on-chain (tx: ${digest}) but could not extract object IDs. ` +
                        `Check transaction on explorer and set amm_pool_id / amm_admin_cap_id in localStorage.`
                    );
                }

                const poolObj = await suiClient.getObject({ id: newPoolId, options: { showOwner: true } });
                const poolIsv = Number((poolObj.data?.owner as any)?.Shared?.initial_shared_version);
                if (!poolIsv) throw new Error(`Pool ${newPoolId} created but ISV could not be resolved. Check explorer.`);

                deployState.current = { poolId: newPoolId, poolIsv, adminCapId };
                localStorage.setItem("amm_pool_id", newPoolId);
                localStorage.setItem("amm_pool_isv", String(poolIsv));
                localStorage.setItem("amm_admin_cap_id", adminCapId);
                // Clear auto-detected packages so the new pool's packages get resolved fresh
                localStorage.removeItem("amm_original_package_id");
                localStorage.removeItem("amm_package_id");
                dispatch({ type: "TX_STATUS", index: 0, status: "confirmed" });
            } else {
                dispatch({ type: "TX_STATUS", index: 0, status: "confirmed" });
            }

            const { poolId: newPoolId, poolIsv, adminCapId } = deployState.current;

            // TX 2: Seed liquidity for both tokens + init fee config
            dispatch({ type: "TX_STATUS", index: 1, status: "signing" });
            const seedFeeParams = {
                adminCapId: adminCapId!,
                typeIdA: BigInt(state.tokenA.typeId), amountA: Number(reserveA),
                typeIdB: BigInt(state.tokenB.typeId), amountB: Number(reserveB),
                surgeBps: BigInt(state.surgeBps), bonusBps: BigInt(state.bonusBps),
            };
            await runTx(() => buildSeedAndInitFeeTx(
                { poolId: newPoolId!, poolIsv: poolIsv! }, ctx, seedFeeParams,
            ), "Seed & Init Fees");
            dispatch({ type: "TX_STATUS", index: 1, status: "confirmed" });

            dispatch({ type: "DEPLOY_DONE" });
            setTimeout(onComplete, 1500);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch({ type: "DEPLOY_ERROR", error: msg });
        }
    };

    const { reserveA, reserveB } = computeReserves(state);
    const canAdvanceStep1 = state.detectedItems.length >= 2;
    const canAdvanceStep2 = !!state.tokenA && !!state.tokenB;
    const canAdvanceStep3 = reserveA > 0n && reserveB > 0n;
    const canAdvanceStep4 = Number(state.feeBps) > 0;

    return (
        <div style={{ padding: "12px 10px", maxWidth: 540, margin: "0 auto" }}>
            {/* Header */}
            <div className="header">
                <h1 style={{ fontSize: 13, letterSpacing: "4px" }}>VOID EXCHANGE</h1>
                <span style={{
                    fontFamily: '"Frontier Disket Mono", monospace',
                    fontSize: 10, color: "#555", letterSpacing: "2px",
                }}>ESTABLISH MARKET</span>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} style={{
                        flex: 1, height: 2,
                        background: n < state.step ? "var(--green)"
                            : n === state.step ? "var(--accent)"
                            : "var(--border)",
                        boxShadow: n === state.step ? "0 0 6px var(--accent-glow)" : "none",
                        transition: "all 0.3s ease",
                    }} />
                ))}
            </div>

            {/* Step content */}
            {state.step === 1 && (
                <StepStock
                    items={state.detectedItems}
                    canAdvance={canAdvanceStep1}
                    onNext={() => dispatch({ type: "NEXT_STEP" })}
                />
            )}
            {state.step === 2 && (
                <StepPair
                    items={state.detectedItems}
                    tokenA={state.tokenA}
                    tokenB={state.tokenB}
                    onSelectA={(item) => dispatch({ type: "SELECT_TOKEN_A", item })}
                    onSelectB={(item) => dispatch({ type: "SELECT_TOKEN_B", item })}
                    canAdvance={canAdvanceStep2}
                    onNext={() => dispatch({ type: "NEXT_STEP" })}
                    onBack={() => dispatch({ type: "PREV_STEP" })}
                />
            )}
            {state.step === 3 && (
                <StepReserves
                    state={state}
                    reserveA={reserveA}
                    reserveB={reserveB}
                    onCurve={(c) => dispatch({ type: "SET_CURVE", curveType: c })}
                    onCustomAmp={(a) => dispatch({ type: "SET_CUSTOM_AMP", amp: a })}
                    onRatio={(a, b) => dispatch({ type: "SET_RATIO", ratioA: a, ratioB: b })}
                    onSlider={(pct) => dispatch({ type: "SET_SLIDER", pct })}
                    canAdvance={canAdvanceStep3}
                    onNext={() => dispatch({ type: "NEXT_STEP" })}
                    onBack={() => dispatch({ type: "PREV_STEP" })}
                />
            )}
            {state.step === 4 && (
                <StepFees
                    feeBps={state.feeBps}
                    onFee={(bps) => dispatch({ type: "SET_FEE", feeBps: bps })}
                    canAdvance={canAdvanceStep4}
                    onNext={() => dispatch({ type: "NEXT_STEP" })}
                    onBack={() => dispatch({ type: "PREV_STEP" })}
                />
            )}
            {state.step === 5 && (
                <StepDeploy
                    state={state}
                    reserveA={reserveA}
                    reserveB={reserveB}
                    onDeploy={handleDeploy}
                    onBack={() => dispatch({ type: "PREV_STEP" })}
                />
            )}
        </div>
    );
}

// === Step Components ===

function StepStock({ items, canAdvance, onNext }: {
    items: InventoryItem[];
    canAdvance: boolean;
    onNext: () => void;
}) {
    return (
        <div className="terminal-panel cyan" data-label="Step 1 / 5">
            <div style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>
                STOCK YOUR SSU
            </div>
            <div className="hint" style={{ fontSize: 11, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
                Deposit the <strong style={{ color: "var(--text-bright)" }}>two item types</strong> you want to trade into this SSU from your ship cargo.
            </div>

            {items.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#555", fontSize: 11 }}>
                    Waiting for items...
                </div>
            )}
            {items.length === 1 && (
                <>
                    <ItemSlot item={items[0]} detected />
                    <div className="error" style={{ marginTop: 8 }}>
                        You need a second item type to create a trading pair.
                    </div>
                </>
            )}
            {items.length >= 2 && items.map(item => (
                <ItemSlot key={item.typeId} item={item} detected />
            ))}
            {items.length >= 2 && items.length <= 2 && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                    background: "var(--green-dim)", border: "1px solid var(--green-glow)",
                    marginTop: 12, fontSize: 10, color: "var(--green)",
                }}>
                    <span style={{ fontSize: 14 }}>&#10003;</span>
                    <span>Trade pair detected. Ready to continue.</span>
                </div>
            )}

            {/* Scan animation */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                background: "var(--cyan-dim)", border: "1px solid rgba(0,212,255,0.1)",
                marginTop: 12,
            }}>
                <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)",
                    animation: "pulse 1.5s ease infinite",
                }} />
                <span style={{ fontSize: 10, color: "var(--cyan)", letterSpacing: "1px" }}>
                    Scanning SSU inventory...
                </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button className="primary" disabled={!canAdvance} onClick={onNext}
                    style={{ padding: "10px 24px", fontSize: 11 }}>
                    NEXT &rarr;
                </button>
            </div>
        </div>
    );
}

function StepPair({ items, tokenA, tokenB, onSelectA, onSelectB, canAdvance, onNext, onBack }: {
    items: InventoryItem[];
    tokenA: InventoryItem | null;
    tokenB: InventoryItem | null;
    onSelectA: (item: InventoryItem | null) => void;
    onSelectB: (item: InventoryItem | null) => void;
    canAdvance: boolean;
    onNext: () => void;
    onBack: () => void;
}) {
    const isAutoSelected = items.length === 2;

    const handleItemClick = (item: InventoryItem) => {
        if (isAutoSelected) return; // Can't change when exactly 2
        if (tokenA && tokenA.typeId === item.typeId) {
            onSelectA(null);
            return;
        }
        if (tokenB && tokenB.typeId === item.typeId) {
            onSelectB(null);
            return;
        }
        // Select into first empty slot, or replace oldest
        if (!tokenA) { onSelectA(item); return; }
        if (!tokenB) { onSelectB(item); return; }
        // Both filled — replace A (oldest), shift B to A
        onSelectA(tokenB);
        onSelectB(item);
    };

    return (
        <div className="terminal-panel cyan" data-label="Step 2 / 5">
            <div style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>
                {isAutoSelected ? "YOUR TRADE PAIR" : "SELECT TRADE PAIR"}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
                {isAutoSelected
                    ? "Confirm your trading pair. This cannot be changed after deployment."
                    : "Select the two items you want to pair for trading."
                }
            </div>

            {isAutoSelected && tokenA && tokenB ? (
                <div style={{
                    display: "flex", alignItems: "center", gap: 12, justifyContent: "center",
                    padding: 16, border: "1px solid rgba(232,122,30,0.2)", background: "rgba(232,122,30,0.04)",
                    marginBottom: 12,
                }}>
                    <span style={{
                        padding: "6px 16px", fontWeight: 700, fontSize: 12,
                        color: "var(--accent)", border: "1px solid rgba(232,122,30,0.3)",
                        background: "rgba(232,122,30,0.08)",
                        fontFamily: '"Frontier Disket Mono", monospace',
                    }}>{itemName(tokenA.typeId)}</span>
                    <span style={{ color: "#555", fontSize: 14 }}>/</span>
                    <span style={{
                        padding: "6px 16px", fontWeight: 700, fontSize: 12,
                        color: "var(--cyan)", border: "1px solid rgba(0,212,255,0.3)",
                        background: "rgba(0,212,255,0.08)",
                        fontFamily: '"Frontier Disket Mono", monospace',
                    }}>{itemName(tokenB.typeId)}</span>
                </div>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {items.map(item => {
                        const isA = tokenA?.typeId === item.typeId;
                        const isB = tokenB?.typeId === item.typeId;
                        const selected = isA || isB;
                        return (
                            <div key={item.typeId} onClick={() => handleItemClick(item)} style={{
                                flex: "1 1 calc(50% - 4px)", padding: "10px 12px",
                                border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                                background: selected ? "var(--accent-dim)" : "var(--bg-input)",
                                cursor: "pointer", textAlign: "center",
                                transition: "all 0.2s ease",
                            }}>
                                <div style={{
                                    fontSize: 12, fontWeight: 700,
                                    color: selected ? "var(--accent-bright)" : "var(--text-bright)",
                                    fontFamily: '"Frontier Disket Mono", monospace',
                                }}>{itemName(item.typeId)}</div>
                                <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                                    {item.quantity.toLocaleString()} units
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {tokenA && tokenB && (
                <div style={{
                    padding: "10px 12px", background: "rgba(10,13,18,0.5)", border: "1px solid var(--border)",
                    fontSize: 11, marginBottom: 12,
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#555" }}>Available {itemName(tokenA.typeId)}</span>
                        <span style={{ color: "var(--accent)" }}>{tokenA.quantity.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#555" }}>Available {itemName(tokenB.typeId)}</span>
                        <span style={{ color: "var(--cyan)" }}>{tokenB.quantity.toLocaleString()}</span>
                    </div>
                </div>
            )}

            <StepNav canAdvance={canAdvance} onNext={onNext} onBack={onBack} />
        </div>
    );
}

function StepReserves({ state, reserveA, reserveB, onCurve, onCustomAmp, onRatio, onSlider, canAdvance, onNext, onBack }: {
    state: WizardState;
    reserveA: bigint;
    reserveB: bigint;
    onCurve: (c: "volatile" | "stable" | "custom") => void;
    onCustomAmp: (amp: string) => void;
    onRatio: (a: string, b: string) => void;
    onSlider: (pct: number) => void;
    canAdvance: boolean;
    onNext: () => void;
    onBack: () => void;
}) {
    const nameA = state.tokenA ? itemName(state.tokenA.typeId) : "Token A";
    const nameB = state.tokenB ? itemName(state.tokenB.typeId) : "Token B";

    const curveOptions: { key: "volatile" | "stable" | "custom"; label: string; desc: string }[] = [
        { key: "volatile", label: "VOLATILE", desc: "Prices shift with every trade. Best when items have very different values." },
        { key: "stable", label: "STABLE", desc: "Prices stay close to the set ratio. Best when items have similar value." },
        { key: "custom", label: "CUSTOM", desc: "Set the amplification factor yourself. Higher = more stable pricing." },
    ];

    return (
        <div className="terminal-panel cyan" data-label="Step 3 / 5">
            <div style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>
                PRICING &amp; RESERVES
            </div>

            {/* Curve type */}
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "2px", marginBottom: 8, borderBottom: "1px solid rgba(232,122,30,0.1)", paddingBottom: 4 }}>
                MARKET TYPE
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: state.curveType === "custom" ? 8 : 16 }}>
                {curveOptions.map(opt => {
                    const selected = state.curveType === opt.key;
                    return (
                        <button key={opt.key} onClick={() => onCurve(opt.key)} style={{
                            flex: 1, padding: "10px 10px 8px", textAlign: "left", cursor: "pointer",
                            border: selected ? "1px solid var(--cyan)" : "1px solid var(--border)",
                            background: selected ? "var(--cyan-dim)" : "rgba(10,13,18,0.4)",
                        }}>
                            <div style={{
                                fontSize: 11, fontWeight: 700, letterSpacing: "2px", marginBottom: 6,
                                color: selected ? "var(--cyan)" : "#555",
                            }}>
                                {selected ? "\u25c6 " : "\u25c7 "}{opt.label}
                            </div>
                            <div style={{ fontSize: 9, color: selected ? "#999" : "#555", lineHeight: 1.5 }}>
                                {opt.desc}
                            </div>
                        </button>
                    );
                })}
            </div>
            {state.curveType === "custom" && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                    border: "1px solid var(--border)", background: "rgba(10,13,18,0.4)", marginBottom: 8,
                }}>
                    <span style={{ fontSize: 10, color: "#555", letterSpacing: "1px", whiteSpace: "nowrap" }}>AMP FACTOR</span>
                    <input type="number" min="1" max="10000" value={state.customAmp}
                        onChange={e => onCustomAmp(e.target.value)}
                        style={{ width: 80, padding: "6px 8px", fontSize: 12, textAlign: "right" }} />
                    <span style={{ fontSize: 9, color: "#555" }}>1 = volatile &middot; 200+ = stable</span>
                </div>
            )}

            {/* Price impact preview */}
            <PriceImpactPreview amp={getAmp(state)} />

            {/* Ratio */}
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "2px", marginBottom: 8, borderBottom: "1px solid rgba(232,122,30,0.1)", paddingBottom: 4 }}>
                PRICE RATIO
            </div>
            <div style={{ fontSize: 10, color: "#666", marginBottom: 10 }}>
                Set the starting exchange rate between your two items. 1:1 means equal value.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#666", letterSpacing: "1px", marginBottom: 4 }}>{nameA}</div>
                    <input type="number" min="1" value={state.ratioA}
                        onChange={e => onRatio(e.target.value, state.ratioB)}
                        style={{ textAlign: "center", fontSize: 16, fontWeight: 700 }} />
                </div>
                <span style={{ color: "#555", fontSize: 20, fontWeight: 700, marginTop: 14 }}>:</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#666", letterSpacing: "1px", marginBottom: 4 }}>{nameB}</div>
                    <input type="number" min="1" value={state.ratioB}
                        onChange={e => onRatio(state.ratioA, e.target.value)}
                        style={{ textAlign: "center", fontSize: 16, fontWeight: 700 }} />
                </div>
            </div>

            {/* Slider */}
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "2px", marginBottom: 8, marginTop: 16, borderBottom: "1px solid rgba(232,122,30,0.1)", paddingBottom: 4 }}>
                RESERVE SIZE
            </div>
            <div style={{ fontSize: 10, color: "#666", marginBottom: 10 }}>
                How much of your inventory to put into the market. More = less price impact per trade.
            </div>
            <input type="range" min="10" max="100" value={state.sliderPct}
                onChange={e => onSlider(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
                <span>10%</span>
                <span>{state.sliderPct}%</span>
                <span>100%</span>
            </div>

            {/* Preview */}
            <div style={{
                display: "flex", justifyContent: "space-between", padding: "10px 12px",
                background: "rgba(10,13,18,0.6)", border: "1px solid var(--border)", marginTop: 10,
                fontSize: 11, fontFamily: '"Frontier Disket Mono", monospace',
            }}>
                <span><span style={{ color: "var(--accent)" }}>{reserveA.toLocaleString()}</span> <span style={{ color: "#666" }}>{nameA}</span></span>
                <span style={{ color: "#555" }}>+</span>
                <span><span style={{ color: "var(--cyan)" }}>{reserveB.toLocaleString()}</span> <span style={{ color: "#666" }}>{nameB}</span></span>
            </div>
            <div style={{ textAlign: "center", fontSize: 9, color: "#555", marginTop: 6 }}>
                Remaining inventory stays in SSU storage
            </div>

            <StepNav canAdvance={canAdvance} onNext={onNext} onBack={onBack} />
        </div>
    );
}

function StepFees({ feeBps, onFee, canAdvance, onNext, onBack }: {
    feeBps: string;
    onFee: (bps: string) => void;
    canAdvance: boolean;
    onNext: () => void;
    onBack: () => void;
}) {
    const presets = [
        { label: "LOW", bps: "25", rate: "0.25%", desc: "high traffic" },
        { label: "STANDARD", bps: "50", rate: "0.5%", desc: "recommended" },
        { label: "PREMIUM", bps: "100", rate: "1%", desc: "scarce goods" },
    ];

    return (
        <div className="terminal-panel cyan" data-label="Step 4 / 5">
            <div style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>
                SET YOUR FEE
            </div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
                You earn a fee on every trade. Higher fees mean more revenue but fewer traders.
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
                {presets.map(p => (
                    <div key={p.bps} onClick={() => onFee(p.bps)} style={{
                        flex: 1, padding: "12px 8px", textAlign: "center", cursor: "pointer",
                        border: `1px solid ${feeBps === p.bps ? "rgba(232,122,30,0.4)" : "var(--border)"}`,
                        background: feeBps === p.bps ? "var(--accent-dim)" : "var(--bg-input)",
                        borderLeft: p.bps !== "25" ? "none" : undefined,
                    }}>
                        <div style={{ fontSize: 10, color: feeBps === p.bps ? "var(--accent)" : "#555", letterSpacing: "1px", marginBottom: 2 }}>
                            {p.label}
                        </div>
                        <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: feeBps === p.bps ? "var(--accent)" : "#888",
                            fontFamily: '"Frontier Disket Mono", monospace',
                        }}>{p.rate}</div>
                        <div style={{ fontSize: 9, color: feeBps === p.bps ? "#888" : "#444", marginTop: 2 }}>{p.desc}</div>
                    </div>
                ))}
            </div>

            <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                border: "1px solid var(--border)", background: "rgba(10,13,18,0.4)",
            }}>
                <span style={{ fontSize: 10, color: "#555", letterSpacing: "1px", whiteSpace: "nowrap" }}>CUSTOM</span>
                <input type="number" min="1" max="1000" value={feeBps}
                    onChange={e => onFee(e.target.value)}
                    style={{ width: 80, padding: "6px 8px", fontSize: 12, textAlign: "right" }} />
                <span style={{ fontSize: 10, color: "#555" }}>BPS</span>
                <span style={{ fontSize: 10, color: "#555", marginLeft: 4 }}>
                    = {(Number(feeBps) / 100).toFixed(2)}%
                </span>
            </div>

            <div style={{
                marginTop: 14, padding: "10px 12px",
                background: "var(--cyan-dim)", border: "1px solid rgba(0,212,255,0.1)",
                fontSize: 10, color: "#888", lineHeight: 1.6,
            }}>
                <strong style={{ color: "var(--cyan)" }}>Dynamic pricing</strong> is enabled by default.
                Trades that worsen supply imbalance pay a surcharge. Trades that restore balance earn a bonus.
                This keeps your market healthy automatically.
            </div>

            <StepNav canAdvance={canAdvance} onNext={onNext} onBack={onBack} />
        </div>
    );
}

function StepDeploy({ state, reserveA, reserveB, onDeploy, onBack }: {
    state: WizardState;
    reserveA: bigint;
    reserveB: bigint;
    onDeploy: () => void;
    onBack: () => void;
}) {
    const nameA = state.tokenA ? itemName(state.tokenA.typeId) : "—";
    const nameB = state.tokenB ? itemName(state.tokenB.typeId) : "—";

    const txLabels = [
        { title: "Authorize & Create Pool", detail: "Grants AMM permission on this SSU and deploys the trading pool with your price ratio." },
        { title: "Seed Reserves & Enable Pricing", detail: "Moves items from SSU storage into market reserves and activates dynamic pricing." },
    ];

    return (
        <div className="terminal-panel cyan" data-label="Step 5 / 5">
            <div style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>
                REVIEW &amp; DEPLOY
            </div>

            {/* Config summary */}
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "2px", marginBottom: 8, borderBottom: "1px solid rgba(232,122,30,0.1)", paddingBottom: 4 }}>
                MARKET CONFIGURATION
            </div>
            {[
                ["Trade Pair", `${nameA} / ${nameB}`],
                ["Market Type", state.curveType === "stable" ? "Stable" : state.curveType === "volatile" ? "Volatile" : `Custom (amp ${state.customAmp})`],
                ["Price Ratio", `${state.ratioA} : ${state.ratioB}`],
                ["Starting Reserves", `${reserveA.toLocaleString()} / ${reserveB.toLocaleString()}`],
                ["Base Fee", `${(Number(state.feeBps) / 100).toFixed(2)}% (${state.feeBps} BPS)`],
                ["Dynamic Pricing", "Enabled"],
            ].map(([label, value]) => (
                <div key={label} style={{
                    display: "flex", justifyContent: "space-between", padding: "6px 0",
                    borderBottom: "1px solid rgba(26,35,50,0.5)", fontSize: 11,
                }}>
                    <span style={{ color: "#555" }}>{label}</span>
                    <span style={{ color: label === "Dynamic Pricing" ? "var(--green)" : "var(--text-bright)", fontWeight: 500 }}>{value}</span>
                </div>
            ))}

            {/* Transaction breakdown */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                background: "rgba(232,122,30,0.06)", border: "1px solid rgba(232,122,30,0.15)",
                margin: "14px 0 10px", fontSize: 10, color: "#888",
            }}>
                <span style={{ color: "var(--accent)", fontSize: 14, flexShrink: 0 }}>&#9888;</span>
                <span>You will be asked to sign <strong style={{ color: "var(--text-bright)" }}>2 transactions</strong> in your wallet.</span>
            </div>

            {txLabels.map((tx, i) => (
                <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "8px 10px", marginBottom: 4,
                    background: "rgba(10,13,18,0.5)", border: "1px solid var(--border)",
                }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 12, width: 20, flexShrink: 0 }}>
                        {i + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "var(--text-bright)", marginBottom: 2 }}>{tx.title}</div>
                        <div style={{ fontSize: 9, color: "#555", lineHeight: 1.4 }}>{tx.detail}</div>
                    </div>
                    {(state.deploying || state.deployed) && (
                        <TxStatusBadge status={state.txStatus[i]} />
                    )}
                </div>
            ))}

            {state.deployError && (
                <div className="error" style={{ marginTop: 8 }}>{state.deployError}</div>
            )}

            {state.deployed && (
                <div style={{
                    marginTop: 12, padding: "14px 16px", textAlign: "center",
                    background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)",
                }}>
                    <div style={{
                        fontSize: 13, fontWeight: 700, letterSpacing: "3px",
                        color: "var(--green)", marginBottom: 4,
                    }}>
                        MARKET ONLINE
                    </div>
                    <div style={{ fontSize: 10, color: "#888" }}>
                        Loading trading terminal...
                    </div>
                </div>
            )}

            <div style={{ marginTop: 14 }}>
                {!state.deploying && !state.deployed ? (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={onBack} style={{ padding: "10px 16px", fontSize: 10, letterSpacing: "1px" }}>
                            &larr; BACK
                        </button>
                        <button className="primary" onClick={onDeploy}
                            style={{ flex: 1, padding: "12px 16px", fontSize: 12, letterSpacing: "3px" }}>
                            &#9670; DEPLOY MARKET
                        </button>
                    </div>
                ) : state.deployError ? (
                    <button className="primary" onClick={onDeploy}
                        style={{ width: "100%", padding: "12px 16px", fontSize: 12, letterSpacing: "3px" }}>
                        RETRY
                    </button>
                ) : null}
            </div>
        </div>
    );
}

// === Shared UI ===

function ItemSlot({ item, detected }: { item: InventoryItem; detected?: boolean }) {
    return (
        <div style={{
            border: `1px ${detected ? "solid" : "dashed"} ${detected ? "rgba(0,255,136,0.3)" : "rgba(232,122,30,0.2)"}`,
            background: detected ? "rgba(0,255,136,0.05)" : "rgba(10,13,18,0.5)",
            padding: "12px 14px", marginBottom: 8, textAlign: "center",
        }}>
            <div style={{ fontSize: 9, color: detected ? "var(--green)" : "#555", letterSpacing: "2px", marginBottom: 4 }}>
                {detected ? "DETECTED" : "WAITING"}
            </div>
            <div style={{
                fontSize: 13, fontWeight: 700, color: "var(--text-bright)",
                fontFamily: '"Frontier Disket Mono", monospace',
            }}>{itemName(item.typeId)}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{item.quantity.toLocaleString()} units deposited</div>
        </div>
    );
}

function StepNav({ canAdvance, onNext, onBack }: { canAdvance: boolean; onNext: () => void; onBack?: () => void }) {
    return (
        <div style={{ display: "flex", justifyContent: onBack ? "space-between" : "flex-end", marginTop: 16 }}>
            {onBack && (
                <button onClick={onBack} style={{ padding: "10px 16px", fontSize: 10, letterSpacing: "1px" }}>
                    &larr; BACK
                </button>
            )}
            <button className="primary" disabled={!canAdvance} onClick={onNext}
                style={{ padding: "10px 24px", fontSize: 11 }}>
                NEXT &rarr;
            </button>
        </div>
    );
}

function TxStatusBadge({ status }: { status: TxStatus }) {
    const styles: Record<TxStatus, { color: string; text: string }> = {
        waiting: { color: "#555", text: "WAITING" },
        signing: { color: "var(--accent)", text: "SIGNING..." },
        confirmed: { color: "var(--green)", text: "OK" },
        failed: { color: "var(--red)", text: "FAILED" },
    };
    const s = styles[status];
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: s.color,
            animation: status === "signing" ? "pulse 1.5s ease infinite" : "none",
            flexShrink: 0,
        }}>{s.text}</span>
    );
}
