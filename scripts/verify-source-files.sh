#!/bin/bash
# Verify that all source files in packages/*/src/ are tracked by git
# This prevents CI build failures from missing source files

# Don't use set -e here as we need to handle errors gracefully

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find untracked source files using find (more reliable than glob patterns)
UNTRACKED_BROAD=$(find packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" \) -path "*/src/*" ! -path "*/node_modules/*" ! -path "*/dist/*" 2>/dev/null | while read -r file; do
  if ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
    echo "$file"
  fi
done)

# Also try git ls-files for any remaining untracked files
UNTRACKED_GIT=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E 'packages/.*/src/.*\.(ts|tsx|json)$' || true)

# Combine and deduplicate
ALL_UNTRACKED=$(echo -e "$UNTRACKED_BROAD\n$UNTRACKED_GIT" | sort -u | grep -v '^$')

if [ -n "$ALL_UNTRACKED" ]; then
  echo -e "${RED}Error: Untracked source files found:${NC}" >&2
  echo "" >&2
  echo "$ALL_UNTRACKED" | while read -r file; do
    echo -e "  ${RED}✗${NC} $file" >&2
  done
  echo "" >&2
  echo -e "${YELLOW}These files must be added to git before committing.${NC}" >&2
  echo -e "${YELLOW}Run: git add <file> for each file above${NC}" >&2
  exit 1
fi

echo -e "${GREEN}✓ All source files are tracked by git${NC}"
exit 0
