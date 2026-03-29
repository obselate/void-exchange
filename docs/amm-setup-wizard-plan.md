# One-Script AMM Setup Wizard

## Context

Setting up an AMM currently requires: manually authorizing the extension, creating a pool, init'ing fee config, copying IDs around, editing .env files, and starting the server. The goal is a single CLI wizard that does everything after the user drops an SSU in-game.

## Flow

```
User drops SSU in-game → runs `tsx ts-scripts/amm_extension/setup-wizard.ts` → answers prompts → AMM is live
```

## The Wizard

**Single file:** `ts-scripts/amm_extension/setup-wizard.ts`

Uses `node:readline/promises` (no new deps). Prompts with sensible defaults, pre-fills from root `.env` where possible.

### Step 1: Gather input

| Prompt | Default | Source |
|--------|---------|--------|
| SSU Object ID | — | `SSU_OBJECT_ID` env or required |
| Character Object ID | — | `CHARACTER_OBJECT_ID` env or required |
| AMM Package ID | — | `AMM_PACKAGE_ID` env or required |
| Token A type ID | `77800` | — |
| Token A name | `Feldspar` | — |
| Token B type ID | `77810` | — |
| Token B name | `Platinum` | — |
| Reserve A | `1000` | — |
| Reserve B | `1000` | — |
| Amplification | `200` | — |
| Fee BPS | `50` | — |
| Surge BPS | `2000` | — |
| Bonus BPS | `1000` | — |
| Banner | auto from names | — |

Private key from `PLAYER_A_PRIVATE_KEY` env (never prompted on screen).

Display summary → confirm `[Y/n]`.

### Step 2: Authorize AMMAuth on SSU

- Reuse pattern from `ts-scripts/amm_extension/authorize-amm.ts`
- Borrow OwnerCap → authorize_extension<AMMAuth> → return OwnerCap
- If already authorized, catch error and skip gracefully

### Step 3: Create Pool

- Call `amm::create_pool` with params, transfer AMMAdminCap to sender
- Extract from `objectChanges`: Pool ID (AMMPool created), AdminCap ID (AMMAdminCap created)
- Get Pool ISV via `client.getObject` → `owner.Shared.initial_shared_version`
- Wait for finalization with `client.waitForTransaction`

### Step 4: Init Fee Config

- Call `amm::init_fee_config(pool, admin_cap, surge_bps, bonus_bps)`
- Pool passed as shared object ref with ISV from step 3

### Step 5: Write dApp .env

Update `dapps/.env` with:
```
VITE_EVE_WORLD_PACKAGE_ID=<world_package>
VITE_AMM_PACKAGE_ID=<amm_package>
VITE_SSU_OBJECT_ID=<ssu_id>
VITE_CHARACTER_OBJECT_ID=<character_id>
VITE_SUI_GRAPHQL_ENDPOINT=https://graphql.testnet.sui.io/graphql
```

Print localStorage commands for the user to paste in browser console:
```js
localStorage.setItem("amm_pool_id", "<pool_id>");
localStorage.setItem("amm_pool_isv", "<pool_isv>");
localStorage.setItem("amm_admin_cap_id", "<admin_cap_id>");
localStorage.setItem("amm_package_id", "<amm_package_id>");
```

### Step 6: Start dApp

Ask `Start dApp? [Y/n]` → spawn `pnpm dev` in dapps/ with inherited stdio.

## Files to create/modify

- **Create:** `ts-scripts/amm_extension/setup-wizard.ts` — the wizard
- **Reference (read only):**
  - `ts-scripts/amm_extension/authorize-amm.ts` — authorize pattern
  - `ts-scripts/amm_extension/create-pool.ts` — create pool + extract IDs pattern
  - `ts-scripts/utils/helper.ts` — SDK initialization utilities
  - `ts-scripts/helpers/storage-unit-extension.ts` — getOwnerCap
  - `dapps/src/hooks/useAmmTransactions.ts` — shared object ref + ISV pattern

## Key implementation details

- Three separate transactions (authorize → create pool → init fees) because each depends on the previous result
- `waitForTransaction` after create_pool before querying the pool object for ISV
- Authorize is idempotent — catch "already authorized" and continue
- AdminCap must be explicitly transferred in the PTB (`tx.transferObjects`)
- AMMAuth type arg uses the package ID that originally published the type (for upgrade compatibility)

## Verification

1. `cd builder-scaffold && tsx ts-scripts/amm_extension/setup-wizard.ts`
2. Answer prompts (or accept defaults)
3. Verify authorize tx succeeds (or skips if already done)
4. Verify pool created — Pool ID, ISV, AdminCap ID printed
5. Verify fee config initialized
6. Verify `dapps/.env` updated with correct values
7. dApp starts and shows the pool at `localhost:5173`
8. Admin panel at `?admin` shows correct pool config and fee pool
