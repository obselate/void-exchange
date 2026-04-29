# Move contracts

The Void Exchange AMM lives in [`amm_extension/`](./amm_extension/). It
extends EVE Frontier's Smart Storage Unit (SSU) with a StableSwap pool —
liquidity reserves are held in the SSU's open inventory; the extension
authorizes itself on the SSU and brokers trades.

The extension uses the
[typed witness pattern](https://github.com/evefrontier/world-contracts/blob/main/docs/architechture.md#layer-3-player-extensions-moddability)
to plug into the world. See [`amm.move`](./amm_extension/sources/amm.move).

## Prerequisites

- Sui CLI (pinned to `mainnet-v1.70.2` in
  [`.tool-versions`](../.tool-versions)) — or [Docker](../docker/readme.md).
- A deployed world (see [`setup-world/`](../setup-world/readme.md)).
- `world-contracts` checked out as a sibling of this repo. See the
  ["world-contracts sibling dependency"](../docs/development.md#world-contracts-sibling-dependency)
  section.

## Build, test, lint

From the repo root:

```bash
pnpm lint            # sui move build --lint per package
pnpm test:move       # sui move test per package
pnpm fmt             # prettier --write *.move
pnpm fmt:check       # CI-equivalent check
```

## Publish

```bash
cd move-contracts/amm_extension
sui client publish -e testnet     # or testnet_internal / testnet_stillness etc.
```

The active environments are declared in `Move.toml` under `[environments]`.
Published addresses per environment are tracked in `Published.toml`. See
[Sui package management](https://docs.sui.io/guides/developer/packages/move-package-management)
for the full publish/upgrade story.

## Caveats

- **TypeName includes package ID.** Redeploying the extension (new package
  ID) changes the `AMMAuth` type. Any SSU that authorized the old type
  must re-authorize; pool state created against the old package is
  unreachable from the new package.
- **Extension slot.** An SSU can authorize one extension type at a time.
  Authorizing AMMAuth on an SSU that already runs another extension
  replaces it.
