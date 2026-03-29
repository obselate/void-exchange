/**
 * Fetch a swap quote from an AMM pool (read-only, no transaction).
 *
 * Uses devInspectTransactionBlock to call the quote function off-chain.
 * Displays all the info a UI would show to a user before they confirm.
 *
 * Required env:
 *   AMM_PACKAGE_ID        — published amm_extension package
 *   WORLD_PACKAGE_ID      — world package
 *   ADMIN_PRIVATE_KEY     — any key (needed for devInspect sender)
 *   AMM_POOL_ID           — the AMMPool object ID
 *
 * Quote config env:
 *   SWAP_DIRECTION        — "a_for_b" or "b_for_a"
 *   SWAP_AMOUNT_IN        — amount to quote
 */
import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
} from "../utils/helper";
import { requireAmmPackageId } from "./amm-ids";
import { AMM_MODULE } from "./modules";

// BCS layout matching the SwapQuote struct
const SwapQuote = bcs.struct("SwapQuote", {
    amount_out: bcs.u64(),
    fee_amount: bcs.u64(),
    fee_bps: bcs.u64(),
    price_impact_bps: bcs.u64(),
    max_input: bcs.u64(),
});

async function main() {
    console.log("============= AMM Quote ==============\n");

    try {
        const env = getEnvConfig();
        const ctx = initializeContext(env.network, env.adminExportedKey);
        await hydrateWorldConfig(ctx);

        const { client, address } = ctx;
        const ammPackageId = requireAmmPackageId();
        const poolId = requireEnv("AMM_POOL_ID");

        const direction = requireEnv("SWAP_DIRECTION");
        const amountIn = BigInt(requireEnv("SWAP_AMOUNT_IN"));

        const quoteFn =
            direction === "a_for_b" ? "quote_a_for_b" : "quote_b_for_a";

        // Also fetch the banner
        const bannerTx = new Transaction();
        bannerTx.moveCall({
            target: `${ammPackageId}::${AMM_MODULE.AMM}::banner`,
            arguments: [bannerTx.object(poolId)],
        });

        const bannerResult = await client.devInspectTransactionBlock({
            sender: address,
            transactionBlock: bannerTx,
        });

        let bannerText = "";
        const bannerReturnValues = bannerResult.results?.[0]?.returnValues;
        if (bannerReturnValues?.length) {
            const [bytes] = bannerReturnValues[0];
            bannerText = bcs.string().parse(Uint8Array.from(bytes));
        }

        // Fetch the quote
        const tx = new Transaction();
        tx.moveCall({
            target: `${ammPackageId}::${AMM_MODULE.AMM}::${quoteFn}`,
            arguments: [tx.object(poolId), tx.pure.u64(amountIn)],
        });

        const result = await client.devInspectTransactionBlock({
            sender: address,
            transactionBlock: tx,
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error("Quote call failed: " + JSON.stringify(result.effects?.status));
        }

        const returnValues = result.results?.[0]?.returnValues;
        if (!returnValues?.length) {
            throw new Error("No return values from quote call");
        }

        const [quoteBytes] = returnValues[0];
        const quote = SwapQuote.parse(Uint8Array.from(quoteBytes));

        // Display
        if (bannerText) {
            console.log(`  "${bannerText}"\n`);
        }

        console.log(`  Direction: ${direction}`);
        console.log(`  Amount in: ${amountIn}`);
        console.log(`  ─────────────────────────`);
        console.log(`  You receive: ${quote.amount_out}`);
        console.log(`  Fee: ${quote.fee_amount} (${Number(quote.fee_bps) / 100}%)`);
        console.log(`  Price impact: ${Number(quote.price_impact_bps) / 100}%`);
        console.log(`  Max single trade: ${quote.max_input}`);

        if (amountIn > BigInt(quote.max_input)) {
            console.log(`\n  ⚠ Amount exceeds max trade size! Reduce to ${quote.max_input} or less.`);
        }
    } catch (error) {
        handleError(error);
    }
}

main();
