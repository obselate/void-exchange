import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export const suiClient = new SuiJsonRpcClient({
    url: "https://fullnode.testnet.sui.io:443",
    network: "testnet",
});
