/**
 * Execute a swap on an AMM pool (for testing / CLI usage).
 *
 * Builds a PTB that borrows the player's Character OwnerCap, calls swap,
 * and returns the cap — matching the on-chain test flow.
 *
 * Required env:
 *   AMM_PACKAGE_ID        — published amm_extension package
 *   WORLD_PACKAGE_ID      — world package
 *   PLAYER_A_PRIVATE_KEY  — trader's private key
 *   SSU_OBJECT_ID         — the StorageUnit object ID
 *   AMM_POOL_ID           — the AMMPool object ID
 *   CHARACTER_OBJECT_ID   — the trader's Character object ID
 *
 * Swap config env:
 *   SWAP_DIRECTION        — "a_for_b" or "b_for_a"
 *   SWAP_AMOUNT_IN        — amount to swap
 *   SWAP_MIN_OUT          — minimum acceptable output (slippage protection)
 */
import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import { MODULES } from "../utils/config";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
    extractEvent,
} from "../utils/helper";
import { requireAmmPackageId } from "./amm-ids";
import { AMM_MODULE } from "./modules";
import { getCharacterOwnerCap } from "../helpers/character";

async function main() {
    console.log("============= AMM Swap ==============\n");

    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_A_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        const { client, keypair, config, address } = ctx;
        const ammPackageId = requireAmmPackageId();
        const ssuId = requireEnv("SSU_OBJECT_ID");
        const poolId = requireEnv("AMM_POOL_ID");
        const characterId = requireEnv("CHARACTER_OBJECT_ID");

        const direction = requireEnv("SWAP_DIRECTION"); // "a_for_b" or "b_for_a"
        const amountIn = BigInt(requireEnv("SWAP_AMOUNT_IN"));
        const minOut = BigInt(requireEnv("SWAP_MIN_OUT"));

        // Look up the player's Character OwnerCap
        const characterOwnerCapId = await getCharacterOwnerCap(
            characterId, client, config, address,
        );
        if (!characterOwnerCapId) {
            throw new Error(`Character OwnerCap not found for ${characterId}`);
        }

        const characterType = `${config.packageId}::${MODULES.CHARACTER}::Character`;
        const swapFn = direction === "a_for_b" ? "swap_a_for_b" : "swap_b_for_a";

        console.log("Swap:", direction);
        console.log("  Amount in:", amountIn.toString());
        console.log("  Min out:", minOut.toString());
        console.log("  Pool:", poolId);
        console.log();

        const tx = new Transaction();

        // Borrow the Character's OwnerCap
        const [ownerCap, returnReceipt] = tx.moveCall({
            target: `${config.packageId}::${MODULES.CHARACTER}::borrow_owner_cap`,
            typeArguments: [characterType],
            arguments: [tx.object(characterId), tx.object(characterOwnerCapId)],
        });

        // Execute the swap (T = Character)
        tx.moveCall({
            target: `${ammPackageId}::${AMM_MODULE.AMM}::${swapFn}`,
            typeArguments: [characterType],
            arguments: [
                tx.object(poolId),
                tx.object(ssuId),
                tx.object(characterId),
                ownerCap,
                tx.pure.u64(amountIn),
                tx.pure.u64(minOut),
            ],
        });

        // Return the OwnerCap
        tx.moveCall({
            target: `${config.packageId}::${MODULES.CHARACTER}::return_owner_cap`,
            typeArguments: [characterType],
            arguments: [tx.object(characterId), ownerCap, returnReceipt],
        });

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: { showEffects: true, showEvents: true },
        });

        console.log("Swap executed!");
        console.log("  Digest:", result.digest);

        // Print swap event details
        const swapEvent = extractEvent<{
            amount_in: string;
            amount_out: string;
            fee_amount: string;
            price_impact_bps: string;
        }>(result, `::${AMM_MODULE.AMM}::SwapEvent`);

        if (swapEvent) {
            console.log("  Amount in:", swapEvent.amount_in);
            console.log("  Amount out:", swapEvent.amount_out);
            console.log("  Fee:", swapEvent.fee_amount);
            console.log("  Price impact:", swapEvent.price_impact_bps, "bps");
        }
    } catch (error) {
        handleError(error);
    }
}

main();
