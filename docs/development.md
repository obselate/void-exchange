# Void Exchange — Development Guide

This document is the entry point for working on the codebase. For the
deployed-product story see [`README.md`](../README.md). For planned features
see [`roadmap.md`](./roadmap.md).

## Repo layout

```
move-contracts/      # Sui Move packages (amm_extension is the production AMM)
  amm_extension/
    sources/amm.move # The AMM. Single Move module today.
    tests/           # `sui move test` runs these
ts-scripts/          # Operational scripts (publish, authorize, etc.)
  lib/               # Shared Sui workflow library — import from here.
  utils/             # Legacy helpers used by smart-gate scripts (Phase 1
                     # will fold these into lib/).
  amm_extension/     # AMM-specific scripts (currently only authorize-amm.ts)
  smart_gate_extension/
  helpers/
dapps/               # React + Vite frontend. See dapps/README.md.
docs/                # Long-form docs.
scripts/             # Shell scripts (lint-move, test-move).
```

## Toolchain

Pinned in `.tool-versions` (asdf / mise compatible) and `.nvmrc`:

| Tool   | Version            |
|--------|--------------------|
| Node   | 24.13.0            |
| pnpm   | 10.17.0            |
| Sui    | `mainnet-v1.70.2`  |

CI uses the same Sui release tag (see `.github/workflows/ci.yml`,
`SUI_RELEASE_TAG`). The Move package edition is `2024`, which requires Sui
≥ 1.30.

The project currently targets the EVE Frontier `testnet_*` environments
(see `move-contracts/amm_extension/Move.toml`). Sui's testnet release line
(`testnet-v1.71.0` at time of writing) is one step ahead of mainnet stable.
We pin to mainnet-stable for predictability and bump after verifying tests
on the new version.

## Common workflows

### Initial setup

```sh
pnpm install
cp .env.example .env       # populate with your keys + package IDs
```

### Move

```sh
pnpm lint            # sui move build --lint per package
pnpm test:move       # sui move test per package
```

The lint and test scripts iterate `move-contracts/*/` and run on each Move
package. Drop a new package in and it gets picked up automatically.

### TypeScript

```sh
pnpm typecheck       # tsc --noEmit
pnpm fmt             # prettier --write Move
pnpm fmt:ts          # prettier --write TS
pnpm fmt:check       # CI-equivalent check
```

### Operational scripts

Each script is `tsx ts-scripts/<extension>/<name>.ts` and reads its config
from `.env`. The `package.json` `scripts` block exposes the common ones:

```sh
pnpm authorise-storage-unit-extension
pnpm configure-rules
# etc.
```

A new script should:
1. Import its primitives from `ts-scripts/lib` (not `utils/` — that path is
   the legacy fallback).
2. Declare every env var it reads via `loadEnv([...])` so a misconfigured
   environment fails up front with a single clear message.
3. Use `executeTx(client, signer, tx)` rather than calling
   `signAndExecuteTransaction` directly. The helper parses Move aborts into
   a `TransactionExecutionError` with `module`, `function`, and abort code.

### dapp (frontend)

```sh
cd dapps
cp .envsample .env
pnpm install
pnpm dev
```

The dapp consumes the Move contract through the hooks in `dapps/src/hooks/`.
Phase 1 will lift the PTB builders out of those hooks into
`ts-scripts/lib/amm/` so the dapp and scripts share one source of truth.

## Build & deploy the AMM contract

```sh
cd move-contracts/amm_extension
sui client publish
```

The `Published.toml` file in the package directory tracks deployed package
addresses per environment.

## CI

Two jobs run on every push and PR (`.github/workflows/ci.yml`):

- **move** — installs the pinned Sui CLI, runs `sh scripts/lint-move.sh`
  and `sh scripts/test-move.sh`.
- **typescript** — `pnpm fmt:check` and `pnpm typecheck`.

CI installs Sui from the official GitHub release tarball (`mainnet-vX.Y.Z`)
rather than a third-party setup action, to keep the supply chain narrow.

## "No slop" checklist for new Move code

Before merging changes to `amm_extension`:

1. Every `assert!` has an `#[error(code = N)]` constant; no magic numbers.
2. Every public entry has a Move test exercising at least one success and
   one failure path.
3. State-changing functions emit an event whose schema is documented in the
   PR description.
4. Arithmetic that can overflow `u64` is promoted to `u128` with the
   intermediate result range documented in a comment, citing the
   [Move Book on integer types](https://move-book.com/move-basics/primitive-types.html#integer-types).
5. Capability checks (`assert!(cap.pool_id == object::id(pool), ENotOwner)`)
   appear at the top of every entry that takes an `&AMMAdminCap`.
