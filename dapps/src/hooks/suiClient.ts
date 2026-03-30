import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export const suiClient = new SuiJsonRpcClient({
    url: (import.meta.env.VITE_SUI_RPC_URL as string) || "https://fullnode.testnet.sui.io:443",
    network: (import.meta.env.VITE_SUI_NETWORK as string) || "testnet",
});
