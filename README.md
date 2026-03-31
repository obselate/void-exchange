<p align="center">
  <img src="docs/banner.png" alt="Void Exchange" width="100%" />
</p>

# Void Exchange

**The first decentralized marketplace on EVE Frontier.** Deploy a fully operational trading market on any Smart Storage Unit in under 2 minutes.

**Live at [void-exchange.com](https://void-exchange.com)**

---

## How It Works

Each market holds reserves of two resources inside an SSU. Trades are priced using a **StableSwap curve** with a tunable amplification factor. Players fly to the SSU, deposit from cargo, swap at the live rate, and withdraw.

- **Dynamic fees** — base fee on every trade, plus a surge that scales with pool imbalance. Trades that restore balance pay only the base fee.
- **Rebalance bonuses** — traders who reduce imbalance earn bonus tokens from accumulated fees, capped at 3x the trade fee. Imbalanced pools self-correct through arbitrage incentives.

```
Player deposits via game UI → Main inventory (airlock)
    ↓ swap()
Input moves Main → Open (reserves)
Output moves Open → Main (player withdraws)
    ↓
Fee → fee_pool (bonus budget)
Bonus ← fee_pool (if rebalancing)
```

## For Pool Operators

An `AMMAdminCap` grants full control over each pool:

- **Seed and add liquidity** to establish or deepen a market
- **Tune base fee, surge rate, and bonus rate** to match the pair's volatility
- **Withdraw accumulated fees** or roll them back into reserves
- **Update the pool banner** displayed to traders
- **Correct reserves directly** if manual rebalancing is needed

## Architecture

**Three inventory types on the SSU:**
- **Main** — player-facing, visible in game UI
- **Open** — extension-locked, holds AMM reserves + fee pool
- **Owned** — separate player inventory (not used by AMM)

## Stack

- **Smart contract**: Sui Move (`move-contracts/amm_extension/`)
- **Frontend**: React + Vite (`dapps/`)
- **Scripts**: TypeScript + Sui SDK (`ts-scripts/amm_extension/`)

## Fee Math

At pool imbalance `I` (0 = balanced, 5000 BPS = extreme):

| Direction | Fee | Bonus |
|-----------|-----|-------|
| Worsening | `base + I * surge / 10000` | 0 |
| Rebalancing | `base` | `min(I * bonus / 10000 * output, fee_pool, fee * 3)` |

Default config: base=50, surge=2000, bonus=1000 BPS.

## Setup

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started)
- Node.js + pnpm

### Run the dApp

```bash
cd dapps
cp .envsample .env
# Edit .env with your package IDs
pnpm install
pnpm dev
```

### Deploy Your Own Market

1. Drop and online an SSU in EVE Frontier
2. Build and publish the AMM contract:
   ```bash
   cd move-contracts/amm_extension
   sui client publish
   ```
3. Set the dApp URL on your SSU: `https://void-exchange.com/?ssu=<YOUR_SSU_ID>`
4. Follow the setup wizard to configure and deploy your market

## License

MIT
