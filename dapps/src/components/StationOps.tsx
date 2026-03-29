import { useState } from "react";
import { useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { buildCreatePoolTx, buildSeedTx, buildSetReservesTx, buildInitFeeConfigTx, buildUpdateFeeConfigTx, buildWithdrawFeesTx, buildRollFeesToReservesTx, setPoolInfo } from "../hooks/useAmmTransactions";
import { getAmmPackageId, setAmmPackageId, ITEM_NAMES } from "../config";
import { useSsuInventory, InventoryItem } from "../hooks/useSsuInventory";

import { AmmPoolData } from "../hooks/useAmmPool";

type Props = {
    ssuOwnerCapId: string | null;
    onPoolCreated: (poolId: string) => void;
    poolConfig?: AmmPoolData | null;
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
                        <span style={{ color: "var(--text-muted)" }}>{ITEM_NAMES[item.typeId] || `#${item.typeId}`}</span>
                        <span>{item.quantity}</span>
                    </div>
                ))
            }
        </div>
    );
}

export function StationOps({ ssuOwnerCapId, onPoolCreated, poolConfig }: Props) {
    const { signAndExecuteTransaction } = useDAppKit();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Pool config / IDs
    const [poolIdInput, setPoolIdInput] = useState(localStorage.getItem("amm_pool_id") || "");
    const [poolIsvInput, setPoolIsvInput] = useState(localStorage.getItem("amm_pool_isv") || "");
    const [adminCapId, setAdminCapId] = useState(localStorage.getItem("amm_admin_cap_id") || "");
    const [packageId, setPackageId] = useState(getAmmPackageId());

    // Create pool params
    const [typeIdA, setTypeIdA] = useState("77800");
    const [typeIdB, setTypeIdB] = useState("77810");
    const [initReserveA, setInitReserveA] = useState("100");
    const [initReserveB, setInitReserveB] = useState("100");
    const [amp, setAmp] = useState("200");
    const [feeBps, setFeeBps] = useState("50");
    const [banner, setBanner] = useState("Feldspar / Platinum \u2014 0.5% fee");

    // Seed amounts (separate from pool creation)
    const [seedAmountA, setSeedAmountA] = useState("");
    const [seedAmountB, setSeedAmountB] = useState("");

    // Set reserves
    const [setResA, setSetResA] = useState("");
    const [setResB, setSetResB] = useState("");

    // Fee config
    const [surgeBps, setSurgeBps] = useState("250");
    const [bonusBps, setBonusBps] = useState("150");

    // Fee management
    const [feeAction, setFeeAction] = useState<"withdraw" | "roll">("withdraw");
    const [feeAmountMode, setFeeAmountMode] = useState<"amount" | "pct">("pct");
    const [feeAmountVal, setFeeAmountVal] = useState("100");

    const { data: inventory } = useSsuInventory();

    const handleInitFeeConfig = async () => {
        if (!adminCapId) { setError("Set AdminCap ID first"); return; }
        setStatus("Initializing fee config..."); setError(null);
        try {
            const tx = buildInitFeeConfigTx({ adminCapId, surgeBps: BigInt(surgeBps), bonusBps: BigInt(bonusBps) });
            await signAndExecuteTransaction({ transaction: tx });
            setStatus("Fee config initialized!");
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed"); setStatus(null);
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
        if (!adminCapId) { setError("Set AdminCap ID first"); return; }
        const amount = resolveFeeAmount(typeId);
        if (amount <= 0n) { setError("Nothing to " + feeAction); return; }
        const actionLabel = feeAction === "withdraw" ? "Withdrawing" : "Rolling";
        setStatus(`${actionLabel} ${amount} ${label} fees...`); setError(null);
        try {
            const tx = feeAction === "withdraw"
                ? buildWithdrawFeesTx({ adminCapId, typeId: BigInt(typeId), amount })
                : buildRollFeesToReservesTx({ adminCapId, typeId: BigInt(typeId), amount });
            await signAndExecuteTransaction({ transaction: tx });
            setStatus(`${feeAction === "withdraw" ? "Withdrawn" : "Rolled"} ${amount} ${label}`);
            queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed"); setStatus(null);
        }
    };

    const handleUpdateFeeConfig = async () => {
        if (!adminCapId) { setError("Set AdminCap ID first"); return; }
        setStatus("Updating fee config..."); setError(null);
        try {
            const tx = buildUpdateFeeConfigTx({ adminCapId, surgeBps: BigInt(surgeBps), bonusBps: BigInt(bonusBps) });
            await signAndExecuteTransaction({ transaction: tx });
            setStatus("Fee config updated!");
            queryClient.invalidateQueries({ queryKey: ["amm-pool"] });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed"); setStatus(null);
        }
    };

    const saveConfig = () => {
        if (poolIdInput && poolIsvInput) {
            setPoolInfo(poolIdInput, Number(poolIsvInput));
            localStorage.setItem("amm_pool_id", poolIdInput);
            localStorage.setItem("amm_pool_isv", poolIsvInput);
        }
        if (adminCapId) localStorage.setItem("amm_admin_cap_id", adminCapId);
        if (packageId) setAmmPackageId(packageId);
        setStatus("Config saved. Reload to apply.");
    };

    const handleCreatePool = async () => {
        const sender = account?.address;
        if (!sender) { setError("Wallet not connected"); return; }
        setStatus("Creating pool..."); setError(null);
        try {
            const tx = buildCreatePoolTx({
                typeIdA: BigInt(typeIdA), typeIdB: BigInt(typeIdB),
                reserveA: BigInt(initReserveA), reserveB: BigInt(initReserveB),
                amp: BigInt(amp), feeBps: BigInt(feeBps), banner, sender,
            });
            await signAndExecuteTransaction({ transaction: tx });
            setStatus("Pool created! Grab Pool ID + ISV from Suiscan.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed"); setStatus(null);
        }
    };

    const handleSeed = async (typeId: string, amount: string, label: string) => {
        if (!adminCapId) { setError("Set AdminCap ID first"); return; }
        if (!amount || Number(amount) <= 0) { setError("Enter a seed amount"); return; }
        setStatus(`Seeding ${label}...`); setError(null);
        try {
            const tx = buildSeedTx({ adminCapId, typeId: BigInt(typeId), amount: Number(amount) });
            await signAndExecuteTransaction({ transaction: tx });
            setStatus(`${label} seeded: ${amount}`);
            queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Seed failed"); setStatus(null);
        }
    };

    const handleSetReserves = async () => {
        if (!adminCapId) { setError("Set AdminCap ID first"); return; }
        if (!setResA || !setResB) { setError("Enter both reserve values"); return; }
        setStatus("Setting reserves..."); setError(null);
        try {
            const tx = buildSetReservesTx({ adminCapId, reserveA: BigInt(setResA), reserveB: BigInt(setResB) });
            await signAndExecuteTransaction({ transaction: tx });
            setStatus(`Reserves set: ${setResA} / ${setResB}`);
            queryClient.invalidateQueries({ queryKey: ["ssu-inventory"] });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed"); setStatus(null);
        }
    };

    const tokenAName = ITEM_NAMES[typeIdA] || `#${typeIdA}`;
    const tokenBName = ITEM_NAMES[typeIdB] || `#${typeIdB}`;

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
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label={`Reserve A (${tokenAName})`}>
                            <input type="number" value={setResA} onChange={(e) => setSetResA(e.target.value)} placeholder="0" />
                        </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label={`Reserve B (${tokenBName})`}>
                            <input type="number" value={setResB} onChange={(e) => setSetResB(e.target.value)} placeholder="0" />
                        </Field>
                    </div>
                </Row>
                <button onClick={handleSetReserves} style={{ width: "100%" }}>SET SUPPLY</button>
            </Section>

            {/* Pricing controls */}
            <Section title="Pricing Controls" defaultOpen={false}>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label="Scarcity Rate (BPS)">
                            <input type="number" value={surgeBps} onChange={(e) => setSurgeBps(e.target.value)} placeholder="250" />
                        </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label="Incentive Rate (BPS)">
                            <input type="number" value={bonusBps} onChange={(e) => setBonusBps(e.target.value)} placeholder="150" />
                        </Field>
                    </div>
                </Row>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleInitFeeConfig} style={{ flex: 1 }}>INIT PRICING</button>
                    <button onClick={handleUpdateFeeConfig} style={{ flex: 1 }}>UPDATE</button>
                </div>
            </Section>

            {/* Revenue */}
            <Section title="Revenue" defaultOpen={false}>
                {poolConfig && (
                    <>
                        <div style={{
                            fontSize: 11, padding: "10px 10px",
                            background: "var(--bg-input)", border: "1px solid var(--border)",
                            fontFamily: '"Frontier Disket Mono", monospace',
                            marginBottom: 10,
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ color: "var(--text-muted)" }}>Revenue {tokenAName}</span>
                                <span>{poolConfig.feePoolA}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-muted)" }}>Revenue {tokenBName}</span>
                                <span>{poolConfig.feePoolB}</span>
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

            {/* Create pool — one-time action, collapsed by default */}
            <Section title="Establish Market" defaultOpen={false}>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label="Token A ID"><input value={typeIdA} onChange={(e) => setTypeIdA(e.target.value)} /></Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label="Token B ID"><input value={typeIdB} onChange={(e) => setTypeIdB(e.target.value)} /></Field>
                    </div>
                </Row>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label="Initial Reserve A"><input type="number" value={initReserveA} onChange={(e) => setInitReserveA(e.target.value)} /></Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label="Initial Reserve B"><input type="number" value={initReserveB} onChange={(e) => setInitReserveB(e.target.value)} /></Field>
                    </div>
                </Row>
                <Row>
                    <div style={{ flex: 1 }}>
                        <Field label="Amplification"><input type="number" value={amp} onChange={(e) => setAmp(e.target.value)} /></Field>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Field label="Fee (BPS)"><input type="number" value={feeBps} onChange={(e) => setFeeBps(e.target.value)} /></Field>
                    </div>
                </Row>
                <Field label="Banner"><input value={banner} onChange={(e) => setBanner(e.target.value)} /></Field>
                <button onClick={handleCreatePool} className="primary" style={{ width: "100%", marginTop: 4 }}>ESTABLISH MARKET</button>
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
                <button onClick={saveConfig} style={{ width: "100%" }}>SAVE CONFIG</button>
            </Section>

            {/* Status / errors */}
            {status && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 4 }}>{status}</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
}
