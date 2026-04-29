# `lib/amm/` — AMM PTB builders

This directory will hold typed Programmable Transaction Block (PTB) builders
for every public entry on `amm_extension::amm`. Each builder is a pure
function `(args) => Transaction` — no signing, no execution, no client.
Both `ts-scripts/` and `dapps/` import from here so there is exactly one
place where the on-chain call shape lives.

**Status: empty.** Filled in **Phase 1**, after generating Move bindings from
`sui move build --dump-bytecode-as-base64` so the builder argument types are
checked against the live Move source.

Until Phase 1 lands, the dapp's `useAmmTransactions.ts` is the canonical
reference for the on-chain interface.
