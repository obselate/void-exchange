# Setup EVE Frontier world

## Why

In the real game, players create a **Smart Character** (an on-chain identity that owns all their assemblies), build a **Network Node** (the power source that burns fuel to produce energy), and deploy assemblies like **Smart Storage Units** and **Smart Gates**. All assemblies need energy to function.

During development, the deploy and seed steps recreate this on a local (or test) network so you have real on-chain objects to build and test against.

## What gets created

The seed step simulates those in-game actions automatically:

1. A test **Smart Character** — has ownership access to all in-game objects on-chain
2. A **Network Node** — fueled and burning energy
3. A **Smart Storage Unit** — online, with test items deposited
4. Two **Smart Gates** — online and linked for jumping

For more info on Smart Character, Network Node, and Storage Unit, see the [world-contracts](https://github.com/evefrontier/world-contracts) repo and docs.

---

## Prerequisites

- Git, Node.js, Sui CLI (or use the [Docker environment](../docker/readme.md))

---

## Quick start (world only)

These steps cover only the `world-contracts` part. For the broader Void
Exchange dev flow see [`docs/development.md`](../docs/development.md).
Assume `world-contracts` and `void-exchange` are sibling directories.

> **Coming soon:** Clone, deploy, configure, seed, and copy will be simplified into a single setup command. Move package dependencies will resolve via [MVR](https://docs.sui.io/guides/developer/packages/move-package-management).

### 1. Clone and deploy the world

Use a **stable tag** so void-exchange stays compatible if world-contracts has breaking changes on `main`. 
**Stable tag:** `v0.0.18`

```bash
git clone -b v0.0.18 https://github.com/evefrontier/world-contracts.git
cd world-contracts
cp env.example .env   # fill in keys, ADMIN_ADDRESS, SPONSOR_ADDRESSES, etc.
pnpm install
pnpm deploy-world localnet   # or testnet
pnpm configure-world localnet
```

This publishes the world package and configures access control, fuel/energy rates, and gate distances.

### 2. Seed test resources

Creates the Smart Character, Network Node, Storage Unit, and Gates listed above:

```bash
pnpm create-test-resources localnet   # use same network as deploy/configure
```

### 3. Copy output into void-exchange

```bash
# From world-contracts directory
NETWORK=localnet   # or testnet
mkdir -p ../void-exchange/deployments/$NETWORK/
cp -r deployments/* ../void-exchange/deployments/
cp test-resources.json ../void-exchange/test-resources.json
cp "contracts/world/Pub.localnet.toml" "../void-exchange/deployments/localnet/Pub.localnet.toml"
```

- `deployments/<network>/extracted-object-ids.json` — world package ID and shared object IDs
- `test-resources.json` — item IDs used to derive on-chain object IDs. Read more about object id derivation [here](https://docs.evefrontier.com/smart-contracts/object-model)

---

## Next steps

- [Move contracts](../move-contracts/readme.md) — build and publish the
  AMM extension.
- [TypeScript scripts](../ts-scripts/readme.md) — run scripts against the
  seeded resources.
- [Development guide](../docs/development.md) — toolchain, workflows, CI.
