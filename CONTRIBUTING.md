# Contributing to Void Exchange

Thanks for your interest in contributing. This project is open source and we
welcome contributions from the community.

## Ways to contribute

- **Help others** — Answer questions and share solutions in
  [Discord](https://discord.com/invite/evefrontier).
- **Report bugs or suggest features** — Open an issue (see below).
- **Code and docs** — Submit a pull request (see below).

## Opening an issue

[Open an issue](https://github.com/obselate/void-exchange/issues) to report a
bug or suggest a feature.

- **Search first** — Check open and closed issues; add a comment to an
  existing one if it fits.
- **Bug reports** — Include steps to reproduce, expected vs actual behaviour,
  and your environment (Docker vs host, network).
- **Feature requests** — Describe the use case and why it would help.

## Submitting a pull request

1. **Fork** the repo and create a branch from `main`.
2. **Discuss first** — For anything beyond typos or trivial fixes, open an
   issue or feature request so we can align before you invest time.
3. **Keep PRs focused** — Prefer several small PRs over one large one. Aim
   for a single logical change.
4. **Run checks** — `pnpm lint`, `pnpm test:move`, `pnpm typecheck`, and
   `pnpm fmt:check` before submitting (CI runs the same set).
5. **Write a clear description** — Describe what changed, why, and how you
   tested it.

## Code and documentation guidelines

**General** — Match the style and patterns of the code you're changing.
Update relevant readmes and `docs/development.md` when you change behaviour.

**By folder:**

- **Move contracts** (`move-contracts/amm_extension/`) — Follow
  [Sui Move conventions](https://docs.sui.io/concepts/sui-move-concepts/conventions)
  and the
  [Move code quality checklist](https://move-book.com/guides/code-quality-checklist).
  Every change must satisfy the "no slop" checklist in
  [`docs/development.md`](./docs/development.md): typed error codes,
  invariants documented, capability checks at the top of admin entries,
  Move tests for success and failure paths, events for state changes.
- **TypeScript** (`ts-scripts/`) — Import primitives from
  `ts-scripts/lib/` (typed Sui client, executor, env loader). Don't reach
  into `ts-scripts/utils/` for new code — that path is the legacy fallback
  scheduled for migration.
- **dapp** (`dapps/`) — React + TypeScript + Vite +
  `@evefrontier/dapp-kit` / `@mysten/dapp-kit-react`. PTB shapes will move
  into `ts-scripts/lib/amm/` (Phase 1) so the dapp and scripts share a
  single source of truth — prefer importing from there once it lands.
- **Docs** — Update [`docs/development.md`](./docs/development.md) for
  workflow changes and [`docs/roadmap.md`](./docs/roadmap.md) for planned
  features.
- **`.env` and config** — Document new env vars in `.env.example` and in
  the docs.

## License and conduct

By contributing, you agree that your contributions will be licensed under
the same terms as the project. We expect respectful, constructive behaviour.
