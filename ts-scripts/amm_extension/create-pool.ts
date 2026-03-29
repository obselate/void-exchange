/**
 * Create an AMM pool on a Storage Unit.
 *
 * Supports both Constant Product and StableSwap curves.
 * The SSU must already have AMMAuth authorized (run authorize-amm.ts first).
 * The SSU's main inventory must already hold the seed liquidity.
 *
 * Required env:
 *   AMM_PACKAGE_ID        — published amm_extension package
 *   WORLD_PACKAGE_ID      — world package
 *   PLAYER_A_PRIVATE_KEY  — pool creator's private key
 *   SSU_OBJECT_ID         — the StorageUnit object ID
 *
 * Pool config env (all required):
 *   POOL_CURVE_TYPE       — "stable" or "cp" (constant product)
 *   POOL_TYPE_ID_A        — type_id for token A
 *   POOL_TYPE_ID_B        — type_id for token B
 *   POOL_RESERVE_A        — initial reserve A (must match SSU inventory)
 *   POOL_RESERVE_B        — initial reserve B
 *   POOL_BASE_FEE_BPS     — base fee in basis points (e.g. 50 = 0.5%)
 *   POOL_MAX_IMPACT_BPS   — max price impact (e.g. 500 = 5%)
 *   POOL_BANNER           — message displayed to users
 *
 * StableSwap-only:
 *   POOL_AMP              — amplification factor (e.g. 100)
 *
 * Constant Product-only:
 *   POOL_WEIGHT_A         — weight A in fixed-point (e.g. 50000000 = 50%)
 *   POOL_WEIGHT_B         — weight B in fixed-point
 *
 * Optional:
 *   POOL_IMBALANCE_FACTOR — dynamic fee imbalance multiplier (default: 0)
 */
import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
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

async function main() {
    console.log("============= Create AMM Pool ==============\n");

    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_A_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        const { client, keypair, address } = ctx;
        const ammPackageId = requireAmmPackageId();
        const ssuId = requireEnv("SSU_OBJECT_ID");

        // Pool configuration
        const curveType = requireEnv("POOL_CURVE_TYPE"); // "stable" or "cp"
        const typeIdA = BigInt(requireEnv("POOL_TYPE_ID_A"));
        const typeIdB = BigInt(requireEnv("POOL_TYPE_ID_B"));
        const reserveA = BigInt(requireEnv("POOL_RESERVE_A"));
        const reserveB = BigInt(requireEnv("POOL_RESERVE_B"));
        const baseFeeBps = BigInt(requireEnv("POOL_BASE_FEE_BPS"));
        const maxImpactBps = BigInt(requireEnv("POOL_MAX_IMPACT_BPS"));
        const banner = requireEnv("POOL_BANNER");
        const imbalanceFactor = BigInt(process.env.POOL_IMBALANCE_FACTOR ?? "0");

        const tx = new Transaction();

        if (curveType === "stable") {
            const amp = BigInt(requireEnv("POOL_AMP"));

            console.log("Creating StableSwap pool:");
            console.log("  Amp:", amp.toString());

            tx.moveCall({
                target: `${ammPackageId}::${AMM_MODULE.AMM}::create_stable_pool`,
                arguments: [
                    tx.object(ssuId),
                    tx.pure.u64(typeIdA),
                    tx.pure.u64(typeIdB),
                    tx.pure.u64(reserveA),
                    tx.pure.u64(reserveB),
                    tx.pure.u64(amp),
                    tx.pure.u64(baseFeeBps),
                    tx.pure.u64(imbalanceFactor),
                    tx.pure.u64(maxImpactBps),
                    tx.pure.string(banner),
                    // ctx is implicit
                ],
            });
        } else if (curveType === "cp") {
            const weightA = BigInt(requireEnv("POOL_WEIGHT_A"));
            const weightB = BigInt(requireEnv("POOL_WEIGHT_B"));

            console.log("Creating Constant Product pool:");
            console.log("  Weights:", weightA.toString(), "/", weightB.toString());

            tx.moveCall({
                target: `${ammPackageId}::${AMM_MODULE.AMM}::create_constant_product_pool`,
                arguments: [
                    tx.object(ssuId),
                    tx.pure.u64(typeIdA),
                    tx.pure.u64(typeIdB),
                    tx.pure.u64(reserveA),
                    tx.pure.u64(reserveB),
                    tx.pure.u64(weightA),
                    tx.pure.u64(weightB),
                    tx.pure.u64(baseFeeBps),
                    tx.pure.u64(imbalanceFactor),
                    tx.pure.u64(maxImpactBps),
                    tx.pure.string(banner),
                ],
            });
        } else {
            throw new Error(`Unknown POOL_CURVE_TYPE: ${curveType}. Use "stable" or "cp".`);
        }

        console.log("  Tokens:", typeIdA.toString(), "/", typeIdB.toString());
        console.log("  Reserves:", reserveA.toString(), "/", reserveB.toString());
        console.log("  Base fee:", baseFeeBps.toString(), "bps");
        console.log("  Max impact:", maxImpactBps.toString(), "bps");
        console.log("  Banner:", banner);
        console.log();

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: { showEffects: true, showObjectChanges: true, showEvents: true },
        });

        console.log("Pool created!");
        console.log("  Digest:", result.digest);

        // Extract the created AMMPool and AMMAdminCap object IDs
        const changes = result.objectChanges ?? [];
        for (const change of changes) {
            if (change.type === "created") {
                const objType = change.objectType ?? "";
                if (objType.includes("AMMPool")) {
                    console.log("  Pool ID:", change.objectId);
                    console.log("    → Save this as AMM_POOL_ID in .env");
                } else if (objType.includes("AMMAdminCap")) {
                    console.log("  AdminCap ID:", change.objectId);
                    console.log("    → Save this as AMM_ADMIN_CAP_ID in .env");
                }
            }
        }
    } catch (error) {
        handleError(error);
    }
}

main();
