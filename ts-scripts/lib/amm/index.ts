/**
 * Public AMM workflow surface.
 *
 * - `operations`: framework-neutral PTB builders. Use these from CLI
 *   scripts and dapp hooks.
 * - `generated.amm`: low-level Move bindings for `amm_extension::amm`.
 *   Use these only for one-off PTB calls not covered by `operations`,
 *   or for `MoveStruct` BCS decoders (event/object parsing).
 * - `generated.character`, `generated.storageUnit`: world bindings the
 *   AMM workflow consumes.
 *
 * Do not import from `./generated/**` directly — go through this barrel
 * so a future codegen-output relocation is a one-line change.
 */
export * from "./operations";

export * as amm from "./generated/amm_extension/amm";
export * as character from "./generated/world/character";
export * as storageUnit from "./generated/world/storage_unit";
