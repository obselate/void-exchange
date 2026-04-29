# TypeScript scripts

Operational scripts for the Void Exchange AMM. The scripts are CLI entry
points that build a Sui Programmable Transaction Block (PTB), sign it with
a key from the environment, and submit it.

## Prerequisites

1. World contracts deployed and configured — see
   [`setup-world/`](../setup-world/readme.md).
2. AMM extension package published — see
   [`move-contracts/amm_extension`](../move-contracts/amm_extension/).
3. `deployments/` artifacts and `test-resources.json` (if using the world
   helpers) copied to this repo's root.

## Setup

```bash
# From repo root
cp .env.example .env    # fill in keys + package IDs
pnpm install
```

Required env vars per script are documented at the top of each script's
file. Run with:

```bash
pnpm authorize-amm                                 # named entry
# or
tsx ts-scripts/amm_extension/<script-name>.ts      # any script
```

## Layout

- [`lib/`](./lib/) — Shared, framework-neutral Sui workflow library
  (typed client, executor with structured Move-abort errors, env loader,
  event helpers). **Import new code from here.**
- `amm_extension/` — AMM-specific scripts.
- `helpers/` — Thin wrappers over world-contracts types
  (Storage Unit OwnerCap lookup, etc.).
- `utils/` — Legacy helpers retained until Phase 1 folds them into `lib/`.

## Adding a new script

1. Import primitives from [`lib/`](./lib/) (`createSuiClient`,
   `keypairFromEnv`, `executeTx`, `loadEnv`, `findEvent`,
   `findCreatedObject`).
2. Declare every env var the script reads via `loadEnv([...])` so a
   misconfigured environment fails up front with one clear message.
3. Always go through `executeTx` rather than calling
   `signAndExecuteTransaction` directly — it parses Move aborts into a
   typed `TransactionExecutionError` with the module / function / abort
   code.
4. Document required env vars in the file header.
