/**
 * One-shot AMM setup wizard.
 *
 * Walks the operator from "I just dropped an SSU" to "the dapp is live with
 * a freshly created, seeded, fee-configured pool" in two on-chain
 * transactions:
 *
 *   1. authorize + create_pool   — `buildAuthorizeAndCreatePoolTx`
 *   2. seed + init_fee_config    — `buildSeedAndInitFeeTx`
 *
 * Authorization is idempotent on the world side, so re-running the wizard
 * on an already-authorized SSU just skips that fragment's effect.
 *
 * The wizard prompts via `node:readline/promises` (no new deps), pre-filling
 * defaults from the root `.env`. After the on-chain dance it updates
 * `dapps/.env` with the resolved package + SSU IDs and prints localStorage
 * commands for the per-pool overrides.
 *
 * Required env (loaded up front):
 *   AMM_PACKAGE_ID                          current AMM package address
 *   WORLD_PACKAGE_ID                        EVE Frontier world package
 *   SSU_OBJECT_ID                           target Smart Storage Unit
 *   CHARACTER_OBJECT_ID                     operator's Character object
 *   PLAYER_A_PRIVATE_KEY                    operator's Sui private key
 *   AMM_REGISTRY_ID                         shared AMMRegistry object id
 *   AMM_REGISTRY_INITIAL_SHARED_VERSION     registry initial shared version
 *
 * Optional env:
 *   AMM_ORIGINAL_PACKAGE_ID  defaults to AMM_PACKAGE_ID (no upgrade yet)
 *   SUI_NETWORK / SUI_RPC_URL  per createSuiClient defaults
 */
import "dotenv/config";

import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
    createSuiClient,
    executeTx,
    findCreatedObject,
    getInitialSharedVersion,
    keypairFromEnv,
    loadEnv,
    optionalEnv,
} from "../lib";
import {
    buildAuthorizeAndCreatePoolTx,
    buildSeedAndInitFeeTx,
    type AmmPackageIds,
    type RegistryContext,
} from "../lib/amm";
import { getOwnerCap } from "../helpers/storage-unit-extension";

interface PromptDefaults {
    typeIdA: string;
    nameA: string;
    typeIdB: string;
    nameB: string;
    reserveA: string;
    reserveB: string;
    amp: string;
    feeBps: string;
    surgeBps: string;
    bonusBps: string;
}

const DEFAULTS: PromptDefaults = {
    typeIdA: "77800",
    nameA: "Feldspar",
    typeIdB: "77810",
    nameB: "Platinum",
    reserveA: "1000",
    reserveB: "1000",
    amp: "200",
    feeBps: "50",
    surgeBps: "2000",
    bonusBps: "1000",
};

async function ask(rl: Interface, label: string, fallback: string): Promise<string> {
    const answer = (await rl.question(`${label} [${fallback}]: `)).trim();
    return answer === "" ? fallback : answer;
}

async function confirm(rl: Interface, label: string): Promise<boolean> {
    const answer = (await rl.question(`${label} [Y/n]: `)).trim().toLowerCase();
    return answer === "" || answer === "y" || answer === "yes";
}

/** Update or insert a `KEY="value"` line in a dotenv-style file. */
function upsertEnv(filePath: string, updates: Record<string, string>): void {
    const text = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
    const lines = text.split("\n");
    const seen = new Set<string>();
    const out = lines.map((line) => {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=/);
        if (!m || !(m[1] in updates)) return line;
        seen.add(m[1]);
        return `${m[1]}="${updates[m[1]]}"`;
    });
    for (const [k, v] of Object.entries(updates)) {
        if (!seen.has(k)) out.push(`${k}="${v}"`);
    }
    writeFileSync(filePath, out.join("\n"));
}

async function main() {
    const env = loadEnv([
        "AMM_PACKAGE_ID",
        "WORLD_PACKAGE_ID",
        "SSU_OBJECT_ID",
        "CHARACTER_OBJECT_ID",
        "AMM_REGISTRY_ID",
        "AMM_REGISTRY_INITIAL_SHARED_VERSION",
    ] as const);
    const ammPackageIds: AmmPackageIds = {
        current: env.AMM_PACKAGE_ID,
        original: optionalEnv("AMM_ORIGINAL_PACKAGE_ID", env.AMM_PACKAGE_ID),
    };
    const registry: RegistryContext = {
        registryId: env.AMM_REGISTRY_ID,
        registryIsv: Number(env.AMM_REGISTRY_INITIAL_SHARED_VERSION),
    };

    const client = createSuiClient();
    const keypair = keypairFromEnv("PLAYER_A_PRIVATE_KEY");
    const sender = keypair.getPublicKey().toSuiAddress();

    const rl = createInterface({ input, output });
    let dappStarted = false;
    try {
        console.log("\n=== AMM Setup Wizard ===\n");
        console.log(`SSU:        ${env.SSU_OBJECT_ID}`);
        console.log(`Character:  ${env.CHARACTER_OBJECT_ID}`);
        console.log(`Sender:     ${sender}`);
        console.log(`Package:    ${ammPackageIds.current}`);
        console.log(`Registry:   ${registry.registryId}\n`);

        const typeIdA = await ask(rl, "Token A type ID", DEFAULTS.typeIdA);
        const nameA = await ask(rl, "Token A name", DEFAULTS.nameA);
        const typeIdB = await ask(rl, "Token B type ID", DEFAULTS.typeIdB);
        const nameB = await ask(rl, "Token B name", DEFAULTS.nameB);
        const reserveA = await ask(rl, "Reserve A (initial seed amount)", DEFAULTS.reserveA);
        const reserveB = await ask(rl, "Reserve B (initial seed amount)", DEFAULTS.reserveB);
        const amp = await ask(rl, "Amplification factor", DEFAULTS.amp);
        const feeBps = await ask(rl, "Base fee BPS", DEFAULTS.feeBps);
        const surgeBps = await ask(rl, "Surge BPS", DEFAULTS.surgeBps);
        const bonusBps = await ask(rl, "Bonus BPS", DEFAULTS.bonusBps);
        const banner = await ask(rl, "Pool banner", `${nameA} <-> ${nameB}`);

        console.log("\n--- Summary ---");
        console.log(`  Pair:      ${nameA} (${typeIdA}) <-> ${nameB} (${typeIdB})`);
        console.log(`  Reserves:  ${reserveA} / ${reserveB}`);
        console.log(`  Amp:       ${amp}`);
        console.log(`  Fees:      base=${feeBps} surge=${surgeBps} bonus=${bonusBps} (BPS)`);
        console.log(`  Banner:    ${banner}\n`);

        if (!(await confirm(rl, "Proceed?"))) {
            console.log("Aborted.");
            return;
        }

        // --- Resolve shared-object versions + owner cap ticket ---
        const [ssuIsv, characterIsv, ownerCapTicketId] = await Promise.all([
            getInitialSharedVersion(client, env.SSU_OBJECT_ID),
            getInitialSharedVersion(client, env.CHARACTER_OBJECT_ID),
            getOwnerCap(
                env.SSU_OBJECT_ID,
                client,
                { packageId: env.WORLD_PACKAGE_ID } as Parameters<typeof getOwnerCap>[2],
                sender
            ),
        ]);
        if (!ownerCapTicketId) {
            throw new Error(`SSU ${env.SSU_OBJECT_ID} has no OwnerCap ticket — is it online?`);
        }

        const ssuCtx = {
            ssuId: env.SSU_OBJECT_ID,
            ssuIsv,
            characterId: env.CHARACTER_OBJECT_ID,
            characterIsv,
        };

        // --- Step 1: authorize + create_pool ---
        console.log("\n[1/2] Authorize + create pool...");
        const createTx = buildAuthorizeAndCreatePoolTx({
            ssu: ssuCtx,
            registry,
            ownerCapTicketId,
            worldPackageId: env.WORLD_PACKAGE_ID,
            ammPackageIds,
            pool: {
                typeIdA: BigInt(typeIdA),
                typeIdB: BigInt(typeIdB),
                reserveA: BigInt(reserveA),
                reserveB: BigInt(reserveB),
                amp: BigInt(amp),
                feeBps: BigInt(feeBps),
                banner,
            },
            sender,
        });
        const createResult = await executeTx(client, keypair, createTx);
        const createdPool = findCreatedObject(createResult, "::amm::AMMPool");
        const createdCap = findCreatedObject(createResult, "::amm::AMMAdminCap");
        if (!createdPool || !createdCap) {
            throw new Error(
                `Could not find AMMPool / AMMAdminCap in create_pool effects. ` +
                    `digest=${createResult.digest}`
            );
        }
        const poolId = createdPool.objectId;
        const adminCapId = createdCap.objectId;
        console.log(`  digest:     ${createResult.digest}`);
        console.log(`  pool:       ${poolId}`);
        console.log(`  adminCap:   ${adminCapId}`);

        // Wait for the pool object to be queryable, then read its ISV.
        await client.waitForTransaction({ digest: createResult.digest });
        const poolIsv = await getInitialSharedVersion(client, poolId);
        console.log(`  poolIsv:    ${poolIsv}`);

        // --- Step 2: seed + init_fee_config ---
        console.log("\n[2/2] Seed liquidity + init fee config...");
        const seedTx = buildSeedAndInitFeeTx({
            pool: { poolId, poolIsv },
            ssu: ssuCtx,
            adminCapId,
            ammPackageIds,
            seed: {
                typeIdA: BigInt(typeIdA),
                amountA: Number(reserveA),
                typeIdB: BigInt(typeIdB),
                amountB: Number(reserveB),
                surgeBps: BigInt(surgeBps),
                bonusBps: BigInt(bonusBps),
            },
        });
        const seedResult = await executeTx(client, keypair, seedTx);
        console.log(`  digest:     ${seedResult.digest}`);

        // --- Step 3: write dapp .env ---
        const dappEnv = resolve(process.cwd(), "dapps/.env");
        upsertEnv(dappEnv, {
            VITE_EVE_WORLD_PACKAGE_ID: env.WORLD_PACKAGE_ID,
            VITE_AMM_PACKAGE_ID: ammPackageIds.current,
            VITE_AMM_ORIGINAL_PACKAGE_ID: ammPackageIds.original,
            VITE_AMM_REGISTRY_ID: registry.registryId,
            VITE_AMM_REGISTRY_INITIAL_SHARED_VERSION: String(registry.registryIsv),
        });
        console.log(`\nUpdated ${dappEnv}`);

        console.log("\n=== Pool live ===");
        console.log(`  pool:       ${poolId}`);
        console.log(`  poolIsv:    ${poolIsv}`);
        console.log(`  adminCap:   ${adminCapId}`);
        console.log(`  ssu:        ${env.SSU_OBJECT_ID}`);
        console.log("\nFor in-browser pool override (admin panel only):");
        console.log(`  localStorage.setItem("amm_pool_id", "${poolId}");`);
        console.log(`  localStorage.setItem("amm_pool_isv", "${poolIsv}");`);
        console.log(`  localStorage.setItem("amm_admin_cap_id", "${adminCapId}");`);
        console.log(`  localStorage.setItem("amm_package_id", "${ammPackageIds.current}");`);
        console.log(`\nDirect URL:`);
        console.log(`  http://localhost:5173/?ssu=${env.SSU_OBJECT_ID}\n`);

        if (await confirm(rl, "Start dApp dev server (`pnpm --filter ./dapps dev`)?")) {
            dappStarted = true;
            rl.close();
            spawn("pnpm", ["--filter", "./dapps", "dev"], {
                stdio: "inherit",
                shell: false,
            });
        }
    } finally {
        if (!dappStarted) rl.close();
    }
}

main().catch((error) => {
    console.error("\n[setup-wizard] FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
