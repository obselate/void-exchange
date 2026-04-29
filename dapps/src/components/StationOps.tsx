import { useState, useEffect, useRef } from "react";
import { useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import {
    buildSeedTx, buildSetReservesTx,
    buildInitFeeConfigTx, buildUpdateFeeConfigTx, buildUpdateFeeBpsTx,
    buildWithdrawFeesTx, buildRollFeesToReservesTx, buildRescueItemsTx,
    buildPausePoolTransaction, buildUnpausePoolTransaction,
    buildDelistPoolTransaction, buildRelistPoolTransaction,
    type SsuContext, type PoolContext,
} from "../hooks/useAmmTransactions";
import { usePoolMeta } from "../hooks/usePoolMeta";
import { getAmmPackageId, setAmmPackageId, getAmmOriginalPackageId, itemName } from "../config";
import { execTx } from "../hooks/execTx";
import { useSsuInventory, InventoryItem } from "../hooks/useSsuInventory";
import type { SsuConfig } from "../hooks/useSsuConfig";
import { useAdminCap } from "../hooks/useAdminCap";

import { AmmPoolData } from "../hooks/useAmmPool";

type Props = {
    ssuConfig: SsuConfig;
    ssuCtx: SsuContext;
    poolCtx: PoolContext;
    poolConfig: AmmPoolData | null;
};

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ marginBottom: 12 }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%", textAlign: "left", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    background: "var(--bg-input)", border: "1px solid var(--border)",
                    padding: "8px 12px", marginBottom: open ? 10 : 0,
                }}
            >
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }}>
                    {title}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{open ? "\u25B2" : "\u25BC"}</span>
            </button>
            {open && <div style={{ padding: "0 2px" }}>{children}</div>}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 8 }}>
            <div className="label">{label}</div>
            {children}
        </div>
    );
}

function Row({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) {
    return <div style={{ display: "flex", gap, marginBottom: 8 }}>{children}</div>;
}

function InvCol({ title, items }: { title: string; items: InventoryItem[] }) {
    return (
        <div style={{
            flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
            padding: "8px 10px", fontSize: 12,
        }}>
            <div className="label" style={{ marginBottom: 6 }}>{title}</div>
            {items.length === 0
                ? <div style={{ color: "var(--text-muted)" }}>Empty</div>
                : items.map((item) => (
                    <div key={item.typeId} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>{itemName(item.typeId)}</span>
                        <span>{item.quantity}</span>
                    </div>
                ))
            }
        </div>
    );
}

export function StationOps({ ssuConfig, ssuCtx, poolCtx, poolConfig }: Props) {
    const { signAndExecuteTransaction } = useDAppKit();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showStatus = (msg: string) => {
        setStatus(msg);
        setError(null);
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setStatus(null), 4000);
    };
    const showError = (msg: string) => {
        setError(msg);
        setStatus(null);
        if (statusTimer.current) clearTimeout(statusTimer.current);
    };

    // Resolve admin cap for the ACTIVE pool (not just any discovered pool)
    const { data: resolvedAdminCap } = useAdminCap(poolCtx.poolId);

    // Live pause/delist state from the registry — drives the lifecycle UI.
    const { data: poolMeta } = usePoolMeta(poolCtx.poolId);

    // Pool config / IDs
    const [poolIdInput, setPoolIdInput] = useState(localStorage.getItem("amm_pool_id") || "");
    const [poolIsvInput, setPoolIsvInput] = useState(localStorage.getItem("amm_pool_isv") || "");
    const [adminCapId, setAdminCapId] = useState(localStorage.getItem("amm_admin_cap_id") || "");
    const [packageId, setPackageId] = useState(getAmmPackageId());

    // Auto-update admin cap when chain lookup resolves (only on new resolution, not on user edits)
    useEffect(() => {
        if (resolvedAdminCap) {
            setAdminCapId(resolvedAdminCap);
            localStorage.setItem("amm_admin_cap_id", resolvedAdminCap);
        }
    }, [resolvedAdminCap]);

    // Derive token IDs from pool config
    const typeIdA = poolConfig?.typeIdA || "77800";
    const typeIdB = poolConfig?.typeIdB || "77810";

    // Seed amounts
    const [seedAmountA, setSeedAmountA] = useState("");
    const [seedAmountB, setSeedAmountB] = useState("");

    // Set reserves
    const [setResA, setSetResA] = useState("");
    const [setResB, setSetResB] = useState("");

    // Fee config — sync from on-chain values when they first load
    const hasFeeConfig = poolConfig && (poolConfig.surgeBps !== "0" || poolConfig.bonusBps !== "0" || poolConfig.feePoolA !== "0" || poolConfig.feePoolB !== "0");
    const [feeBps, setFeeBps] = useState(poolConfig?.feeBps || "50");
    const [surgeBps, setSurgeBps] = useState(poolConfig?.surgeBps && poolConfig.surgeBps !== "0" ? poolConfig.surgeBps : "250");
    const [bonusBps, setBonusBps] = useState(poolConfig?.bonusBps && poolConfig.bonusBps !== "0" ? poolConfig.bonusBps : "150");
    const feeConfigSynced = useRef(false);
    useEffect(() => {
        if (feeConfigSynced.current || !poolConfig) return;
        feeConfigSynced.current = true;
        setFeeBps(poolConfig.feeBps);
        if (poolConfig.surgeBps && poolConfig.surgeBps !== "0") setSurgeBps(poolConfig.surgeBps);
        if (poolConfig.bonusBps && poolConfig.bonusBps !== "0") setBonusBps(poolConfig.bonusBps);
    }, [poolConfig]);

    // Fee management
    const [feeAction, setFeeAction] = useState<"withdraw" | "roll">("withdraw");
    const [feeAmountMode, setFeeAmountMode] = useState<"amount" | "pct">("pct");
    const [feeAmountVal, setFeeAmountVal] = useState("100");

    const { data: inventory } = useSsuInventory(ssuConfig.ssuId);

    const runTx = async (buildFn: () => ReturnType<typeof buildInitFeeConfigTx>, label: string) => {
        await execTx(signAndExecuteTransaction, buildFn, { label });
    };

    const handleInitFeeConfig = async () => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        setStatus("Initializing fee config..."); setError(null);
        try {
            await runTx(
                () => buildInitFeeConfigTx(poolCtx, { adminCapId, surgeBps: BigInt(surgeBps), bonusBps: BigInt(bonusBps) }),
                "Init fee config",
            );
            showStatus("Fee config initialized!");
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Failed");
        }
    };

    const resolveFeeAmount = (typeId: string): bigint => {
        const pool = poolConfig;
        if (!pool) return 0n;
        const feePool = typeId === typeIdA ? BigInt(pool.feePoolA) : BigInt(pool.feePoolB);
        if (feeAmountMode === "pct") {
            const pct = BigInt(feeAmountVal || "0");
            return feePool * pct / 100n;
        }
        const amt = BigInt(feeAmountVal || "0");
        return amt > feePool ? feePool : amt;
    };

    const handleFeeAction = async (typeId: string, label: string) => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        const amount = resolveFeeAmount(typeId);
        if (amount <= 0n) { showError("Nothing to " + feeAction); return; }
        const actionLabel = feeAction === "withdraw" ? "Withdrawing" : "Rolling";
        setStatus(`${actionLabel} ${amount} ${label} fees...`); setError(null);
        try {
            await runTx(
                () => feeAction === "withdraw"
                    ? buildWithdrawFeesTx(poolCtx, ssuCtx, { adminCapId, typeId: BigInt(typeId), amount })
                    : buildRollFeesToReservesTx(poolCtx, { adminCapId, typeId: BigInt(typeId), amount }),
                `${feeAction} fees ${label}`,
            );
            showStatus(`${feeAction === "withdraw" ? "Withdrawn" : "Rolled"} ${amount} ${label}`);
            queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Failed");
        }
    };

    const handleUpdateFeeBps = async () => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        setStatus("Updating base fee..."); setError(null);
        try {
            await runTx(
                () => buildUpdateFeeBpsTx(poolCtx, { adminCapId, feeBps: BigInt(feeBps) }),
                "Update fee BPS",
            );
            showStatus("Base fee updated!");
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Failed");
        }
    };

    const handleUpdateFeeConfig = async () => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        setStatus("Updating fee config..."); setError(null);
        try {
            await runTx(
                () => buildUpdateFeeConfigTx(poolCtx, { adminCapId, surgeBps: BigInt(surgeBps), bonusBps: BigInt(bonusBps) }),
                "Update fee config",
            );
            showStatus("Fee config updated!");
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Failed");
        }
    };

    const saveConfig = () => {
        if (poolIdInput && poolIsvInput) {
            localStorage.setItem("amm_pool_id", poolIdInput);
            localStorage.setItem("amm_pool_isv", poolIsvInput);
        }
        if (adminCapId) localStorage.setItem("amm_admin_cap_id", adminCapId);
        if (packageId) setAmmPackageId(packageId);
        showStatus("Config saved. Reload to apply.");
    };

    const handleSeed = async (typeId: string, amount: string, label: string) => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        if (!amount || Number(amount) <= 0) { showError("Enter a seed amount"); return; }
        setStatus(`Seeding ${label}...`); setError(null);
        try {
            await runTx(
                () => buildSeedTx(poolCtx, ssuCtx, { adminCapId, ownerCapId: ssuConfig.ownerCapId, typeId: BigInt(typeId), amount: Number(amount) }),
                `Seed ${label}`,
            );
            showStatus(`${label} seeded: ${amount}`);
            queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Seed failed");
        }
    };

    const handleSetReserves = async () => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        if (!setResA || !setResB) { showError("Enter both reserve values"); return; }
        setStatus("Setting reserves..."); setError(null);
        try {
            await runTx(
                () => buildSetReservesTx(poolCtx, { adminCapId, reserveA: BigInt(setResA), reserveB: BigInt(setResB) }),
                "Set reserves",
            );
            showStatus(`Reserves set: ${setResA} / ${setResB}`);
            queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Failed");
        }
    };

    const handleLifecycle = async (
        kind: "pause" | "unpause" | "delist" | "relist",
    ) => {
        if (!adminCapId) { showError("Set AdminCap ID first"); return; }
        const builder = {
            pause: buildPausePoolTransaction,
            unpause: buildUnpausePoolTransaction,
            delist: buildDelistPoolTransaction,
            relist: buildRelistPoolTransaction,
        }[kind];
        const verb = { pause: "Pausing", unpause: "Resuming", delist: "Delisting", relist: "Relisting" }[kind];
        setStatus(`${verb} market...`); setError(null);
        try {
            await runTx(() => builder(poolCtx, adminCapId), `${kind} pool`);
            showStatus(`Market ${kind === "unpause" ? "resumed" : kind === "relist" ? "relisted" : kind + "d"}.`);
            queryClient.invalidateQueries({ queryKey: ["pool-meta"] });
            queryClient.invalidateQueries({ queryKey: ["all-pools"] });
        } catch (e) {
            showError(e instanceof Error ? e.message : "Failed");
        }
    };

    const tokenAName = itemName(typeIdA);
    const tokenBName = itemName(typeIdB);

    return (
        <div className="panel">
            {/* Live inventory — always visible */}
            <div style={{ marginBottom: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>Station Inventory</div>
                {inventory ? (
                    <div style={{ display: "flex", gap: 8 }}>
                        <InvCol title="Station Cargo" items={inventory.main} />
                        <InvCol title="Market Supply" items={inventory.open} />
                    </div>
                ) : (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading...</div>
                )}
            </div>

            {/* Rescue items from open inventory (e.g., drain old pool) */}
            {inventory && inventory.open.length > 0 && (
                <>
                    <div style={{ marginBottom: 12 }}>
                        <button
                            onClick={async () => {
                                const items = inventory.open
                                    .filter(i => i.quantity > 0)
                                    .map(i => ({ typeId: BigInt(i.typeId), amount: i.quantity }));
                                if (!items.length) return;
                                setStatus("Rescuing items..."); setError(null);
                                try {
                                    await runTx(
                                        () => buildRescueItemsTx(poolCtx, ssuCtx, adminCapId, items),
                                        "Rescue items",
                                    );
                                    showStatus("Items rescued!");
                                    queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
                                } catch (e: any) {
                                    showError(e?.message || "Rescue failed");
                                }
                            }}
                            style={{ width: "100%" }}
                        >
                            RESCUE ALL FROM OPEN INVENTORY
                        </button>
                        <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
                            Moves all items from Market Supply back to Station Cargo.
                        </div>
                    </div>
                </>
            )}

            <div className="divider" />

            {/* Seed liquidity — most used action */}
            <Section title="Restock Market" defaultOpen={true}>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label={tokenAName}>
                            <div style={{ display: "flex", gap: 0 }}>
                                <input
                                    type="number" min="1" value={seedAmountA}
                                    onChange={(e) => setSeedAmountA(e.target.value)}
                                    placeholder="amount"
                                    style={{ borderRight: "none" }}
                                />
                                <button
                                    onClick={() => handleSeed(typeIdA, seedAmountA, tokenAName)}
                                    disabled={!seedAmountA}
                                    style={{ whiteSpace: "nowrap", padding: "8px 12px" }}
                                >
                                    RESTOCK
                                </button>
                            </div>
                        </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label={tokenBName}>
                            <div style={{ display: "flex", gap: 0 }}>
                                <input
                                    type="number" min="1" value={seedAmountB}
                                    onChange={(e) => setSeedAmountB(e.target.value)}
                                    placeholder="amount"
                                    style={{ borderRight: "none" }}
                                />
                                <button
                                    onClick={() => handleSeed(typeIdB, seedAmountB, tokenBName)}
                                    disabled={!seedAmountB}
                                    style={{ whiteSpace: "nowrap", padding: "8px 12px" }}
                                >
                                    RESTOCK
                                </button>
                            </div>
                        </Field>
                    </div>
                </Row>
            </Section>

            {/* Set reserves */}
            <Section title="Adjust Supply" defaultOpen={false}>
                {poolConfig && (
                    <div style={{
                        fontSize: 11, padding: "8px 10px", marginBottom: 10,
                        background: "var(--bg-input)", border: "1px solid var(--border)",
                        fontFamily: '"Frontier Disket Mono", monospace',
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ color: "var(--text-muted)" }}>Current {tokenAName}</span>
                            <span>{poolConfig.reserveA}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Current {tokenBName}</span>
                            <span>{poolConfig.reserveB}</span>
                        </div>
                    </div>
                )}
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label={`New ${tokenAName}`}>
                            <input type="number" value={setResA} onChange={(e) => setSetResA(e.target.value)} placeholder={poolConfig?.reserveA || "0"} />
                        </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label={`New ${tokenBName}`}>
                            <input type="number" value={setResB} onChange={(e) => setSetResB(e.target.value)} placeholder={poolConfig?.reserveB || "0"} />
                        </Field>
                    </div>
                </Row>
                <button onClick={handleSetReserves} style={{ width: "100%" }}>SET SUPPLY</button>
            </Section>

            {/* Lifecycle: pause / delist (registry-driven) */}
            <Section title="Market Lifecycle" defaultOpen={false}>
                <div style={{
                    fontSize: 11, padding: "8px 10px", marginBottom: 10,
                    background: "var(--bg-input)", border: "1px solid var(--border)",
                    fontFamily: '"Frontier Disket Mono", monospace',
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "var(--text-muted)" }}>Trading</span>
                        <span style={{ color: poolMeta?.paused ? "var(--amber, #d4a017)" : "var(--green)" }}>
                            {poolMeta == null ? "—" : poolMeta.paused ? "PAUSED" : "LIVE"}
                        </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>Discovery</span>
                        <span style={{ color: poolMeta?.delisted ? "#777" : "var(--green)" }}>
                            {poolMeta == null ? "—" : poolMeta.delisted ? "DELISTED" : "LISTED"}
                        </span>
                    </div>
                </div>
                <Row>
                    <button
                        onClick={() => handleLifecycle(poolMeta?.paused ? "unpause" : "pause")}
                        style={{ flex: 1 }}
                        disabled={!adminCapId}
                    >
                        {poolMeta?.paused ? "RESUME TRADING" : "PAUSE TRADING"}
                    </button>
                    <button
                        onClick={() => handleLifecycle(poolMeta?.delisted ? "relist" : "delist")}
                        style={{ flex: 1 }}
                        disabled={!adminCapId}
                    >
                        {poolMeta?.delisted ? "RELIST MARKET" : "DELIST MARKET"}
                    </button>
                </Row>
                <div style={{ fontSize: 10, color: "#666", marginTop: 4, lineHeight: 1.5 }}>
                    Pause halts new swaps; withdrawals and admin ops still work.
                    Delist hides the pool from global discovery and frees the (pair, station) slot.
                </div>
            </Section>

            {/* Pricing controls */}
            <Section title="Pricing Controls" defaultOpen={false}>
                <Field label={`Base Tax (BPS) — current: ${poolConfig?.feeBps || "0"}`}>
                    <div style={{ display: "flex", gap: 0 }}>
                        <input type="number" value={feeBps} onChange={(e) => setFeeBps(e.target.value)} placeholder={poolConfig?.feeBps || "50"} style={{ borderRight: "none" }} />
                        <button onClick={handleUpdateFeeBps} style={{ whiteSpace: "nowrap", padding: "8px 12px" }}>UPDATE</button>
                    </div>
                </Field>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label={`Scarcity Rate (BPS)${hasFeeConfig ? ` — current: ${poolConfig!.surgeBps}` : ""}`}>
                            <input type="number" value={surgeBps} onChange={(e) => setSurgeBps(e.target.value)} placeholder={poolConfig?.surgeBps || "250"} />
                        </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label={`Incentive Rate (BPS)${hasFeeConfig ? ` — current: ${poolConfig!.bonusBps}` : ""}`}>
                            <input type="number" value={bonusBps} onChange={(e) => setBonusBps(e.target.value)} placeholder={poolConfig?.bonusBps || "150"} />
                        </Field>
                    </div>
                </Row>
                {hasFeeConfig ? (
                    <button onClick={handleUpdateFeeConfig} style={{ width: "100%" }}>UPDATE DYNAMIC PRICING</button>
                ) : (
                    <button onClick={handleInitFeeConfig} style={{ width: "100%" }}>INIT DYNAMIC PRICING</button>
                )}

                {/* Profitability forecast */}
                {poolConfig && (() => {
                    const resA = Number(poolConfig.reserveA);
                    const resB = Number(poolConfig.reserveB);
                    const tA = Number(poolConfig.targetA) || 1;
                    const tB = Number(poolConfig.targetB) || 1;
                    const fee = Number(feeBps);
                    const surge = Number(surgeBps);
                    const bonus = Number(bonusBps);

                    // Current imbalance (cross-product, mirrors contract)
                    const actualCross = resA * tB;
                    const targetCross = resB * tA;
                    const crossSum = actualCross + targetCross;
                    const imbalBps = crossSum > 0 ? Math.abs(actualCross - targetCross) * 10000 / crossSum : 0;

                    // Effective fee/bonus rates at current imbalance (in bps)
                    const surgeFee = imbalBps * surge / 10000;
                    const worseningFeeBps = fee + surgeFee;
                    const rebalFeeBps = fee;
                    const bonusRate = imbalBps * bonus / 10000;
                    // Bonus capped at 3x the fee (normalized to output units via target ratio)
                    const bonusCapBps = rebalFeeBps * 3;
                    const bonusPaidBps = Math.min(bonusRate, bonusCapBps);

                    // Net per trade: average of worsening fee earned and (rebal fee earned - bonus paid)
                    const roundTripBps = worseningFeeBps + rebalFeeBps - bonusPaidBps;
                    const netPct = (roundTripBps / 2 / 100).toFixed(2);

                    const isProfitable = roundTripBps > 0;
                    const isBreakEven = roundTripBps === 0;

                    return (
                        <div style={{
                            marginTop: 10, padding: "8px 10px",
                            background: isProfitable ? "rgba(0, 200, 100, 0.04)" : "rgba(255, 50, 50, 0.04)",
                            border: `1px solid ${isProfitable ? "rgba(0, 200, 100, 0.15)" : "rgba(255, 50, 50, 0.15)"}`,
                            fontSize: 10, fontFamily: '"Frontier Disket Mono", monospace',
                        }}>
                            <div style={{ color: "#555", letterSpacing: "0.1em", marginBottom: 6, fontSize: 9 }}>PROFIT FORECAST</div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ color: "var(--text-muted)" }}>Worsening trade fee</span>
                                <span style={{ color: "var(--green)" }}>+{(worseningFeeBps / 100).toFixed(2)}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ color: "var(--text-muted)" }}>Rebalancing trade fee</span>
                                <span style={{ color: "var(--green)" }}>+{(rebalFeeBps / 100).toFixed(2)}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ color: "var(--text-muted)" }}>Incentive payout</span>
                                <span style={{ color: bonusPaidBps > 0 ? "var(--red)" : "var(--text-muted)" }}>-{(bonusPaidBps / 100).toFixed(2)}%</span>
                            </div>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "5px 0" }} />
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-bright)" }}>Net per trade (avg)</span>
                                <span style={{
                                    fontWeight: 700,
                                    color: isProfitable ? "var(--green)" : isBreakEven ? "var(--text-muted)" : "var(--red)",
                                }}>
                                    {isProfitable ? "+" : ""}{netPct}%
                                </span>
                            </div>
                            {imbalBps > 0 && (
                                <div style={{ color: "#444", marginTop: 4, fontSize: 9 }}>
                                    at {(imbalBps / 100).toFixed(1)}% current imbalance
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Section>

            {/* Revenue */}
            <Section title="Revenue" defaultOpen={false}>
                {poolConfig && (
                    <>
                        {/* Profit summary */}
                        <div style={{
                            padding: "10px 12px", marginBottom: 10,
                            background: "rgba(0, 212, 255, 0.04)", border: "1px solid rgba(0, 212, 255, 0.15)",
                            fontFamily: '"Frontier Disket Mono", monospace',
                        }}>
                            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 6 }}>UNCOLLECTED PROFIT</div>
                            <div style={{ display: "flex", gap: 16 }}>
                                {Number(poolConfig.feePoolA) > 0 && (
                                    <div>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{Number(poolConfig.feePoolA).toLocaleString()}</span>
                                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>{tokenAName}</span>
                                    </div>
                                )}
                                {Number(poolConfig.feePoolB) > 0 && (
                                    <div>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{Number(poolConfig.feePoolB).toLocaleString()}</span>
                                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>{tokenBName}</span>
                                    </div>
                                )}
                                {Number(poolConfig.feePoolA) === 0 && Number(poolConfig.feePoolB) === 0 && (
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No fees collected yet</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
                                <button
                                    onClick={() => setFeeAction("withdraw")}
                                    style={{ flex: 1, ...(feeAction === "withdraw" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}
                                >COLLECT</button>
                                <button
                                    onClick={() => setFeeAction("roll")}
                                    style={{ flex: 1, borderLeft: "none", ...(feeAction === "roll" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}
                                >REINVEST</button>
                            </div>
                            <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
                                <button
                                    onClick={() => setFeeAmountMode("pct")}
                                    style={{ flex: 1, ...(feeAmountMode === "pct" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}
                                >%</button>
                                <button
                                    onClick={() => setFeeAmountMode("amount")}
                                    style={{ flex: 1, borderLeft: "none", ...(feeAmountMode === "amount" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}
                                >AMOUNT</button>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                                <input
                                    type="number" value={feeAmountVal}
                                    onChange={(e) => setFeeAmountVal(e.target.value)}
                                    placeholder={feeAmountMode === "pct" ? "% (e.g. 50)" : "amount"}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handleFeeAction(typeIdA, tokenAName)} style={{ flex: 1 }}>
                                    {feeAction === "withdraw" ? "COLLECT" : "REINVEST"} {tokenAName}
                                </button>
                                <button onClick={() => handleFeeAction(typeIdB, tokenBName)} style={{ flex: 1 }}>
                                    {feeAction === "withdraw" ? "COLLECT" : "REINVEST"} {tokenBName}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </Section>

            {/* Config — rarely changed */}
            <Section title="Terminal Config" defaultOpen={false}>
                <Field label="AMM Package ID">
                    <input value={packageId} onChange={(e) => setPackageId(e.target.value)} placeholder="0x..." />
                </Field>
                <Field label="Market ID">
                    <input value={poolIdInput} onChange={(e) => setPoolIdInput(e.target.value)} placeholder="0x..." />
                </Field>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label="Market ISV"><input value={poolIsvInput} onChange={(e) => setPoolIsvInput(e.target.value)} placeholder="ISV" /></Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label="AdminCap ID"><input value={adminCapId} onChange={(e) => setAdminCapId(e.target.value)} placeholder="0x..." /></Field>
                    </div>
                </Row>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveConfig} style={{ flex: 1 }}>SAVE CONFIG</button>
                    <button onClick={() => {
                        localStorage.removeItem("amm_pool_id");
                        localStorage.removeItem("amm_pool_isv");
                        localStorage.removeItem("amm_admin_cap_id");
                        localStorage.removeItem("amm_package_id");
                        localStorage.removeItem("amm_original_package_id");
                        queryClient.invalidateQueries({ queryKey: ["ssu-config"] });
                        queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
                        showStatus("Pool config cleared. Rediscovering...");
                        setTimeout(() => window.location.reload(), 1000);
                    }} style={{ flex: 1, background: "var(--red)", color: "#fff" }}>RESET POOL CONFIG</button>
                </div>
                <div style={{ fontSize: 10, marginTop: 8, wordBreak: "break-all", color: "var(--text-muted)" }}>
                    <div>Wallet: {account?.address || "not connected"}</div>
                    <div>Active Pool: {poolCtx.poolId}</div>
                    <div style={{ color: resolvedAdminCap ? "var(--green)" : "var(--red)" }}>
                        AdminCap: {resolvedAdminCap || "none found for this pool"}
                    </div>
                    {poolConfig && (
                        <div style={{ marginTop: 4, padding: "4px 0", borderTop: "1px solid #333" }}>
                            <div>Reserves: {poolConfig.reserveA}/{poolConfig.reserveB}</div>
                            <div style={{ color: poolConfig.targetA === "1" ? "var(--red)" : "var(--green)" }}>
                                Targets: {poolConfig.targetA}/{poolConfig.targetB}
                                {poolConfig.targetA === "1" && " (FALLBACK — old pool, no targets)"}
                            </div>
                            <div>Amp: {poolConfig.amp} | Fee: {poolConfig.feeBps}bps | Surge: {poolConfig.surgeBps}bps</div>
                            <div>Pkg: {getAmmPackageId().slice(0, 12)}... | Orig: {getAmmOriginalPackageId().slice(0, 12)}...</div>
                            <div>{poolConfig._debugErr ? `Err: ${poolConfig._debugErr}` : ""}</div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Status / errors */}
            {status && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 4 }}>{status}</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
}
