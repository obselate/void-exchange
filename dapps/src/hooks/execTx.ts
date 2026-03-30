import type { Transaction } from "@mysten/sui/transactions";

/**
 * Execute a Sui transaction with automatic retries and fresh gas coin on each attempt.
 * Returns the raw wallet result on success (caller extracts digest/objects as needed).
 *
 * - Rebuilds the transaction on each attempt so object refs (gas coin) stay fresh.
 * - Detects FailedTransaction union results that the wallet returns without throwing.
 * - Aborts immediately on explicit user rejection (no retry).
 */
export async function execTx(
    signAndExecuteTransaction: (opts: { transaction: Transaction }) => Promise<unknown>,
    buildFn: () => Transaction,
    opts: { label?: string; maxRetries?: number } = {},
): Promise<Record<string, any>> {
    const { label = "tx", maxRetries = 5 } = opts;
    let lastError = "";

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const tx = buildFn();
            const result = await signAndExecuteTransaction({ transaction: tx });
            const r = result as any;

            // Check for FailedTransaction result (wallet returns failure, doesn't throw)
            if (r?.$kind === "FailedTransaction" || r?.FailedTransaction) {
                const ft = r.FailedTransaction ?? r;
                const errMsg = ft?.status?.error?.message || ft?.status?.error || JSON.stringify(ft?.status);
                lastError = `Transaction failed: ${errMsg}`;
            } else {
                // Success — extract digest (wallet may nest it under .Transaction)
                const digest = r?.digest || r?.Transaction?.digest;
                if (digest) return { ...r, digest };

                // No digest but no explicit failure — treat as error
                lastError = r?.message || r?.error || (r ? JSON.stringify(r) : "Empty response from wallet");
            }
        } catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
        }

        // Don't retry user rejections
        if (/\bRejected\b|\bdenied\b/i.test(lastError) && !lastError.includes("validators")) {
            throw new Error("Transaction rejected by wallet");
        }

        // Don't retry deterministic contract failures — they'll never succeed
        if (/MoveAbort|InsufficientCoinBalance|CommandArgument/i.test(lastError)) {
            throw new Error(lastError);
        }

        if (attempt < maxRetries - 1) {
            console.warn(`[${label}] attempt ${attempt + 1}/${maxRetries} failed, retrying:`, lastError);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    throw new Error(lastError || `${label} failed after retries`);
}
