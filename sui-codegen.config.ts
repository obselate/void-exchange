/**
 * @mysten/codegen configuration.
 *
 * Generates type-safe Move bindings (BCS struct decoders + typed PTB
 * builders) for amm_extension and the world package types it imports.
 *
 * Output: ts-scripts/lib/amm/generated/ — committed to git, regenerated
 * via `pnpm codegen` and verified in CI (Codegen drift step).
 *
 * Reference: https://github.com/MystenLabs/ts-sdks/tree/main/packages/codegen
 */
import type { SuiCodegenConfig } from "@mysten/codegen/config";

const config: SuiCodegenConfig = {
    output: "./ts-scripts/lib/amm/generated",
    // Auto-run `sui move summary` for each local package. Requires the
    // pinned Sui CLI on PATH (see .tool-versions).
    generateSummaries: true,
    // Strip unused declarations from generated output to keep the diff small.
    prune: true,
    packages: [
        // World types referenced by amm.move (Character, StorageUnit, etc.)
        // Path is relative to this config file — assumes world-contracts is a
        // sibling of void-exchange, per docs/development.md.
        {
            path: "../world-contracts/contracts/world",
            package: "@local-pkg/world",
        },
        // The AMM itself.
        {
            path: "./move-contracts/amm_extension",
            package: "@local-pkg/amm-extension",
        },
    ],
};

export default config;
