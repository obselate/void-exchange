# Void Exchange

A StableSwap AMM for EVE Frontier with dynamic fees and rebalance bonuses.

Trade in-game resources (Feldspar, Platinum, etc.) at a player-owned Smart Storage Unit. The pool self-balances through economic incentives — worsening trades pay escalating fees, rebalancing trades earn bonuses funded by those fees.

## How it works

- **StableSwap curve** (Curve-style) keeps prices tight near 1:1 for equally-valued resources
- **Dynamic fees**: base fee (0.5%) + surge that scales with pool imbalance (up to ~4.5% at max imbalance)
- **Rebalance bonuses**: traders who restore balance get bonus output from the accumulated fee pool
- **House always wins**: bonuses capped at 3x the trade fee, and can never exceed the fee pool

## Architecture

```
Player deposits via game UI → Main inventory (airlock)
    ↓ swap()
Input moves Main → Open (reserves)
Output moves Open → Main (player withdraws)
    ↓
Fee → fee_pool (bonus budget)
Bonus ← fee_pool (if rebalancing)
```

**Three inventory types on the SSU:**
- **Main** — player-facing, visible in game UI
- **Open** — extension-locked, holds AMM reserves + fee pool
- **Owned** — separate player inventory (not used by AMM)

## Stack

- **Smart contract**: Sui Move (`move-contracts/amm_extension/`)
- **Frontend**: React + Vite (`dapps/`)
- **Scripts**: TypeScript + Sui SDK (`ts-scripts/amm_extension/`)

## Deployed

- **Network**: Sui testnet (stillness)
- **Package ID**: `0x89926521a48b27cd28fb9f2979f63783c743a43be9c44ae7f9829ad12a0da8e8` (v9)
- **Original Package ID**: `0x8f5f0274f8268f5ba8267c0bcb5004e8bb639fa28259d90fba2f7c9850871dbb` (for type references)

## Setup

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started)
- Node.js + pnpm

### Run the dApp

```bash
cd dapps
cp .envsample .env
# Edit .env with your package IDs, SSU ID, character ID
pnpm install
pnpm dev
```

Access the swap UI at `http://localhost:5173`. Admin panel at `http://localhost:5173/?admin`.

### Deploy your own

1. Drop and online an SSU in EVE Frontier
2. Build and publish the AMM contract:
   ```bash
   cd move-contracts/amm_extension
   sui client publish
   ```
3. Authorize the extension, create a pool, and init fee config via the admin panel or scripts in `ts-scripts/amm_extension/`

See [docs/amm-setup-wizard-plan.md](./docs/amm-setup-wizard-plan.md) for the full automated setup plan.

## Contract overview

**`move-contracts/amm_extension/sources/amm.move`**

| Function | Who | What |
|----------|-----|------|
| `create_pool` | Admin | Create a new AMM pool on an SSU |
| `swap` | Anyone | Trade token A for B or vice versa |
| `add_liquidity` | Admin | Seed reserves from main → open |
| `init_fee_config` | Admin | Enable dynamic fees + bonuses |
| `withdraw_fees` | Admin | Cash out accumulated fees |
| `roll_fees_to_reserves` | Admin | Deepen liquidity with fee profits |
| `set_reserves` | Admin | Sync reserve accounting |

## Fee math

At pool imbalance `I` (0 = balanced, 5000 BPS = extreme):

| Direction | Fee | Bonus |
|-----------|-----|-------|
| Worsening | `base + I * surge / 10000` | 0 |
| Rebalancing | `base` | `min(I * bonus / 10000 * output, fee_pool, fee * 3)` |

Default config: base=50, surge=2000, bonus=1000 BPS.

## License

MIT
