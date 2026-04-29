/**
 * Public entry point for the shared Sui workflow library.
 *
 * Scripts and the dapp should import from `ts-scripts/lib` (or its subpaths)
 * rather than reaching into `ts-scripts/utils`. The `utils/` directory holds
 * the legacy helpers used by the smart-gate scripts and will be migrated into
 * `lib/` in Phase 1.
 */
export { createSuiClient, DEFAULT_RPC_URLS } from "./sui/client";
export type { SuiNetwork, SuiClientOptions } from "./sui/client";

export { keypairFromPrivateKey, keypairFromEnv } from "./sui/keypair";

export { executeTx, parseMoveAbort, TransactionExecutionError } from "./sui/execute";
export type { ExecutedTransaction, MoveAbortInfo } from "./sui/execute";

export { findEvent, findEvents, findCreatedObject, findCreatedObjects } from "./sui/events";

export { getInitialSharedVersion } from "./sui/object";

export { requireEnv, optionalEnv, loadEnv } from "./env";
