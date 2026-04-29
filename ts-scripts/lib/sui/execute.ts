/**
 * Sign-and-execute helper with structured error parsing.
 *
 * Why this exists: scripts and the dapp both call `signAndExecuteTransaction`
 * directly and parse the result ad-hoc. Failures surface as opaque strings
 * like `MoveAbort(MoveLocation { ... }, 3) in command 0`, which is unreadable
 * without manually cross-referencing the Move source. This helper:
 *
 *   1. Always requests `showEffects` + `showEvents` + `showObjectChanges`,
 *      so callers don't have to remember the right options bag.
 *   2. Inspects `effects.status` and throws a typed `TransactionExecutionError`
 *      with the parsed module / function / abort code on failure.
 *   3. Returns a narrowed `ExecutedTransaction` that is guaranteed to have
 *      effects/events/objectChanges populated.
 *
 * Reference: https://docs.sui.io/sui-api-ref#sui_executeTransactionBlock
 *            https://move-book.com/programmability/transaction-context.html
 */
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import type {
    SuiTransactionBlockResponse,
    SuiObjectChange,
    SuiEvent,
    TransactionEffects,
} from "@mysten/sui/jsonRpc";

export interface ExecutedTransaction {
    digest: string;
    effects: TransactionEffects;
    events: SuiEvent[];
    objectChanges: SuiObjectChange[];
}

export interface MoveAbortInfo {
    module: string | null;
    function: string | null;
    code: number | null;
}

/**
 * Thrown when on-chain execution fails. `abort` is populated for `MoveAbort`
 * failures; for non-abort failures (e.g. gas exhaustion, type errors) the
 * raw status string is available on `cause`.
 */
export class TransactionExecutionError extends Error {
    readonly digest: string;
    readonly cause: string;
    readonly abort: MoveAbortInfo | null;

    constructor(digest: string, cause: string, abort: MoveAbortInfo | null) {
        const detail = abort
            ? `MoveAbort code=${abort.code} module=${abort.module ?? "?"} fn=${abort.function ?? "?"}`
            : cause;
        super(`Transaction ${digest} failed: ${detail}`);
        this.name = "TransactionExecutionError";
        this.digest = digest;
        this.cause = cause;
        this.abort = abort;
    }
}

/**
 * Parse the `effects.status.error` string emitted by the fullnode for
 * `MoveAbort` failures.
 *
 * Format (per Sui core executor):
 *   `MoveAbort(MoveLocation { module: ModuleId { address: ..., name: Identifier("MOD") }, function: N, instruction: M, function_name: Some("FN") }, CODE) in command K`
 */
export function parseMoveAbort(error: string): MoveAbortInfo | null {
    if (!error.startsWith("MoveAbort")) return null;
    const moduleMatch = error.match(/name:\s*Identifier\("([^"]+)"\)/);
    const fnMatch = error.match(/function_name:\s*Some\("([^"]+)"\)/);
    const codeMatch = error.match(/\},\s*(\d+)\s*\)\s*in command/);
    return {
        module: moduleMatch?.[1] ?? null,
        function: fnMatch?.[1] ?? null,
        code: codeMatch ? Number(codeMatch[1]) : null,
    };
}

/**
 * Sign and execute a transaction. Throws `TransactionExecutionError` on
 * non-success status. Returns a result with all effects/events populated.
 */
export async function executeTx(
    client: SuiJsonRpcClient,
    signer: Ed25519Keypair,
    transaction: Transaction
): Promise<ExecutedTransaction> {
    const response: SuiTransactionBlockResponse = await client.signAndExecuteTransaction({
        transaction,
        signer,
        options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
        },
    });

    const effects = response.effects;
    if (!effects) {
        throw new TransactionExecutionError(response.digest, "missing effects in response", null);
    }
    if (effects.status.status !== "success") {
        const cause = effects.status.error ?? "unknown failure";
        throw new TransactionExecutionError(response.digest, cause, parseMoveAbort(cause));
    }

    return {
        digest: response.digest,
        effects,
        events: response.events ?? [],
        objectChanges: response.objectChanges ?? [],
    };
}
