/**
 * Authorize the AMMAuth extension on a Storage Unit.
 *
 * The SSU owner must run this before any pool can operate on that SSU.
 * This registers the AMMAuth witness type so the AMM can deposit/withdraw.
 *
 * Required env:
 *   AMM_PACKAGE_ID        — published amm_extension package
 *   WORLD_PACKAGE_ID      — world package (or via extracted-object-ids)
 *   PLAYER_A_PRIVATE_KEY  — SSU owner's private key
 *   SSU_OBJECT_ID         — the StorageUnit object ID
 *   CHARACTER_OBJECT_ID   — the owner's Character object ID
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
} from "../utils/helper";
import { getOwnerCap } from "../helpers/storage-unit-extension";

/** AMM extension module names matching the Move package. */
const AMM_MODULE = { AMM: "amm" } as const;

function requireAmmPackageId(): string {
    return requireEnv("AMM_PACKAGE_ID");
}

async function main() {
    console.log("============= Authorize AMM Extension on SSU ==============\n");

    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_A_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        const { client, keypair, config, address } = ctx;
        const ammPackageId = requireAmmPackageId();
        const ssuId = requireEnv("SSU_OBJECT_ID");
        const characterId = requireEnv("CHARACTER_OBJECT_ID");

        // Find the StorageUnit OwnerCap held by the character
        const ssuOwnerCapId = await getOwnerCap(ssuId, client, config, address);
        if (!ssuOwnerCapId) {
            throw new Error(`StorageUnit OwnerCap not found for SSU ${ssuId}`);
        }

        const authType = `${ammPackageId}::${AMM_MODULE.AMM}::AMMAuth`;
        const storageUnitType = `${config.packageId}::${MODULES.STORAGE_UNIT}::StorageUnit`;

        const tx = new Transaction();

        // Borrow the StorageUnit OwnerCap from the Character
        const [ownerCap, returnReceipt] = tx.moveCall({
            target: `${config.packageId}::${MODULES.CHARACTER}::borrow_owner_cap`,
            typeArguments: [storageUnitType],
            arguments: [tx.object(characterId), tx.object(ssuOwnerCapId)],
        });

        // Authorize AMMAuth on the StorageUnit
        tx.moveCall({
            target: `${config.packageId}::${MODULES.STORAGE_UNIT}::authorize_extension`,
            typeArguments: [authType],
            arguments: [tx.object(ssuId), ownerCap],
        });

        // Return the OwnerCap
        tx.moveCall({
            target: `${config.packageId}::${MODULES.CHARACTER}::return_owner_cap`,
            typeArguments: [storageUnitType],
            arguments: [tx.object(characterId), ownerCap, returnReceipt],
        });

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: { showEffects: true, showEvents: true },
        });

        console.log("AMMAuth extension authorized on SSU!");
        console.log("  SSU:", ssuId);
        console.log("  Auth type:", authType);
        console.log("  Digest:", result.digest);
    } catch (error) {
        handleError(error);
    }
}

main();
