#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh &>/dev/null; then
  echo "⚠️  gh CLI not found — skipping spec artifact download."
  echo "   Install it from https://cli.github.com to fetch spec artifacts."
  exit 0
fi

mkdir -p public/specs
gh release download --repo tempoxyz/payment-auth-spec latest \
  -D public/specs/ \
  --clobber
echo "✓ Spec artifacts downloaded to public/specs/"
