#!/usr/bin/env sh
# Run `sui move test` for every Move package under move-contracts/.
# Mirrors scripts/lint-move.sh — same iteration, different action.
set -e
for dir in move-contracts/*/; do
  if [ -f "${dir}Move.toml" ]; then
    echo "==> Testing ${dir%/}"
    sui move test --path "${dir%/}"
  fi
done
