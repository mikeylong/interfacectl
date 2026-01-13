#!/bin/bash
# Check Vercel deployment status after code changes
# Usage: ./scripts/check-vercel-deployments.sh [project-url]

set -e

PROJECTS=(
  "https://www.interfacectl.com"
  "https://www.surfaces.systems"
  "https://www.surfaceops.ai"
)

echo "=== Vercel Deployment Status Check ==="
echo "Timestamp: $(date)"
echo ""

if [ -n "$1" ]; then
  PROJECTS=("$1")
fi

for url in "${PROJECTS[@]}"; do
  echo "--- $(basename $url) ---"
  vercel inspect "$url" 2>&1 | grep -E "status|created|target|id|url" | head -6
  echo ""
done
