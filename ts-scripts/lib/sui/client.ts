/**
 * Typed Sui RPC client factory.
 *
 * Single source of truth for which network and RPC endpoint a script connects
 * to. Scripts should not call `new SuiJsonRpcClient` directly — go through
 * `createSuiClient` so the network/url resolution stays consistent.
 *
 * Reference: https://sdk.mystenlabs.com/typescript/sui-client
 */
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export type SuiNetwork = "localnet" | "testnet" | "devnet" | "mainnet";

/** Public Mysten fullnodes per network. Override with SUI_RPC_URL env var. */
export const DEFAULT_RPC_URLS: Record<SuiNetwork, string> = {
    localnet: "http://127.0.0.1:9000",
    testnet: "https://fullnode.testnet.sui.io:443",
    devnet: "https://fullnode.devnet.sui.io:443",
    mainnet: "https://fullnode.mainnet.sui.io:443",
};

export interface SuiClientOptions {
    network?: SuiNetwork;
    /** Overrides the default RPC URL for the given network. */
    rpcUrl?: string;
}

/**
 * Build a `SuiJsonRpcClient`. Network defaults to `SUI_NETWORK` env var
 * (falling back to `localnet`); URL defaults to `SUI_RPC_URL` env var
 * (falling back to the public fullnode for the network).
 */
export function createSuiClient(opts: SuiClientOptions = {}): SuiJsonRpcClient {
    const network: SuiNetwork =
        opts.network ?? ((process.env.SUI_NETWORK as SuiNetwork) || "localnet");
    const url = opts.rpcUrl ?? process.env.SUI_RPC_URL ?? DEFAULT_RPC_URLS[network];
    return new SuiJsonRpcClient({ url, network });
}
