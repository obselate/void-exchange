import { useCurrentAccount } from "@mysten/dapp-kit-react";

export function StatusBar() {
    const account = useCurrentAccount();

    return (
        <div className="status-bar">
            <span>
                <span className={`status-dot ${account ? "" : "disconnected"}`} />
                <span style={{ color: account ? "var(--green)" : "#555" }}>
                    {account ? "DOCKED" : "DISCONNECTED"}
                </span>
                {" — STILLNESS TESTNET"}
            </span>
            {account && (
                <span>{`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}</span>
            )}
            <span>VOID EXCHANGE v0.9</span>
        </div>
    );
}
