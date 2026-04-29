/**
 * Authorize the AMMAuth extension on a Storage Unit.
 *
 * The SSU owner must run this once before any pool can operate on that SSU.
 * The 3-call PTB borrows the SSU OwnerCap from the Character, calls
 * `authorize_extension<AMMAuth>`, and returns the cap — same shape as the
 * dapp's authorize flow, sharing the builder in `lib/amm`.
 *
 * Required env:
 *   AMM_PACKAGE_ID            — current AMM package address (function calls).
 *   AMM_ORIGINAL_PACKAGE_ID   — original AMM package address (AMMAuth type).
 *                               Optional; falls back to AMM_PACKAGE_ID if the
 *                               package has not been upgraded.
 *   WORLD_PACKAGE_ID          — world package address.
 *   SUI_NETWORK               — localnet/testnet/devnet/mainnet.
 *   SUI_RPC_URL               — optional, overrides the default fullnode.
 *   PLAYER_A_PRIVATE_KEY      — SSU owner's private key (Sui suiprivkey…).
 *   SSU_OBJECT_ID             — the StorageUnit object ID.
 *   CHARACTER_OBJECT_ID       — the owner's Character object ID.
 */
import "dotenv/config";

import {
    createSuiClient,
    keypairFromEnv,
    executeTx,
    loadEnv,
    optionalEnv,
    getInitialSharedVersion,
} from "../lib";
import { buildAuthorizeTx, type AmmPackageIds } from "../lib/amm";
import { getOwnerCap } from "../helpers/storage-unit-extension";

async function main() {
    const env = loadEnv([
        "AMM_PACKAGE_ID",
        "WORLD_PACKAGE_ID",
        "SSU_OBJECT_ID",
        "CHARACTER_OBJECT_ID",
    ] as const);
    const ammPackageIds: AmmPackageIds = {
        current: env.AMM_PACKAGE_ID,
        original: optionalEnv("AMM_ORIGINAL_PACKAGE_ID", env.AMM_PACKAGE_ID),
    };

    const client = createSuiClient();
    const keypair = keypairFromEnv("PLAYER_A_PRIVATE_KEY");
    const sender = keypair.getPublicKey().toSuiAddress();

    // Find the SSU's OwnerCap ticket — the world's `Character::borrow_owner_cap`
    // consumes this object to mint a borrowed cap inside the PTB.
    const ownerCapTicketId = await getOwnerCap(
        env.SSU_OBJECT_ID,
        client,
        // Legacy helper still expects the WorldConfig-shaped argument.
        { packageId: env.WORLD_PACKAGE_ID } as Parameters<typeof getOwnerCap>[2],
        sender
    );
    if (!ownerCapTicketId) {
        throw new Error(`SSU ${env.SSU_OBJECT_ID} has no OwnerCap ticket — is the SSU online?`);
    }

    // Resolve initial shared versions so the PTB can be built without an
    // additional RPC round-trip at execution time.
    const [ssuIsv, characterIsv] = await Promise.all([
        getInitialSharedVersion(client, env.SSU_OBJECT_ID),
        getInitialSharedVersion(client, env.CHARACTER_OBJECT_ID),
    ]);

    const tx = buildAuthorizeTx({
        ssu: {
            ssuId: env.SSU_OBJECT_ID,
            ssuIsv,
            characterId: env.CHARACTER_OBJECT_ID,
            characterIsv,
        },
        ownerCapTicketId,
        worldPackageId: env.WORLD_PACKAGE_ID,
        ammPackageIds,
    });

    const result = await executeTx(client, keypair, tx);

    console.log("AMMAuth authorized on SSU.");
    console.log(`  ssu:       ${env.SSU_OBJECT_ID}`);
    console.log(`  authType:  ${ammPackageIds.original}::amm::AMMAuth`);
    console.log(`  digest:    ${result.digest}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
