#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh &>/dev/null; then
  echo "gh CLI not found -- skipping spec artifact download."
  echo "Install it from https://cli.github.com to fetch spec artifacts."
  node scripts/gen-specs-page.ts
  exit 0
fi

if ! gh auth status &>/dev/null; then
  echo "gh CLI not authenticated -- skipping spec artifact download."
  echo "Run 'gh auth login' or set GH_TOKEN to fetch spec artifacts."
  node scripts/gen-specs-page.ts
  exit 0
fi

mkdir -p public/specs
if gh release download --repo tempoxyz/payment-auth-spec latest \
  -D public/specs/ \
  --clobber 2>&1; then
  echo "Spec artifacts downloaded to public/specs/"
else
  echo "Failed to download spec artifacts -- skipping."
  echo "Ensure GH_TOKEN has access to tempoxyz/payment-auth-spec."
fi

node scripts/gen-specs-page.ts
