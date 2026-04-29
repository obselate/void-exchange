# `lib/amm/` — AMM workflow library

Single source of truth for every Programmable Transaction Block (PTB) the
AMM uses. Both [`dapps/`](../../../dapps/) and the CLI scripts under
[`../../amm_extension/`](../../amm_extension/) import from here.

## Layout

```
operations.ts             — Hand-written compound PTB builders.
                            (swap, seed, authorize-and-create, etc.)
index.ts                  — Public barrel. Import from here.
generated/                — Output of `pnpm codegen`. Do not edit.
  amm_extension/amm.ts    — Bindings for amm_extension::amm.
  world/character.ts      — Bindings for world::character.
  world/storage_unit.ts   — Bindings for world::storage_unit.
  world/...               — Other world modules pulled in by dependency.
  utils/index.ts          — Codegen runtime helpers.
```

## Usage

```ts
import { buildSwapTx, type AmmPackageIds, type SsuContext } from "ts-scripts/lib/amm";

const tx = buildSwapTx({
    pool: { poolId: "0x…", poolIsv: 12345 },
    ssu: { ssuId: "0x…", ssuIsv: 6789, characterId: "0x…", characterIsv: 6789 },
    ammPackageIds: { current: "0x…", original: "0x…" },
    swap: { typeIdIn: 77810n, amountIn: 1000n, minOut: 950n, typeIdOut: 78423n, totalOutput: 950n },
});
```

For one-off PTB calls not covered by `operations.ts`, import the generated
module directly through the barrel:

```ts
import { amm, character, storageUnit } from "ts-scripts/lib/amm";

tx.add(amm.setReserves({
    package: ammPackageIds.current,
    arguments: { pool, adminCap, reserveA: 1000n, reserveB: 1000n },
}));
```

Every generated `MoveStruct` (e.g. `amm.SwapWithBonusEvent`, `amm.AMMPool`)
is a BCS decoder usable with `client.getObject` / event parsing.

## Regenerating bindings

After any change to `move-contracts/amm_extension/sources/amm.move` (or the
world-contracts modules it imports):

```sh
pnpm codegen
```

The CI `Codegen drift` check fails the build if generated output is out of
sync with the Move source.

## Why this layer exists

The dapp used to inline `tx.moveCall({ target: \`${pkg}::amm::swap\` })`
strings in `useAmmTransactions.ts` and CLI scripts duplicated the same
shape. That meant any change to a Move function signature could silently
drift between the two consumers. With `@mysten/codegen` driving every
single-call binding from the Move summary, drift is impossible — the
generated TypeScript fails to compile if the Move source changes
incompatibly.
