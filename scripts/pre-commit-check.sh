#!/bin/bash
# Pre-commit hook to check for untracked source files
# This can be used as a git hook or run manually before committing
#
# To install as a git hook:
#   ln -s ../../scripts/pre-commit-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# To run manually:
#   bash scripts/pre-commit-check.sh

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
  echo -e "${YELLOW}Warning: Untracked source files detected:${NC}" >&2
  echo "" >&2
  echo "$ALL_UNTRACKED" | while read -r file; do
    echo -e "  ${YELLOW}⚠${NC} $file" >&2
  done
  echo "" >&2
  echo -e "${YELLOW}These files should be added to git before committing.${NC}" >&2
  echo -e "${YELLOW}Run: git add <file> for each file above${NC}" >&2
  echo -e "${YELLOW}Or run: pnpm run verify to check again${NC}" >&2
  echo "" >&2
  # In pre-commit hook mode, we can choose to block or warn
  # For now, we'll warn but not block (exit 0)
  # To make it blocking, change exit 0 to exit 1
  exit 0
fi

echo -e "${GREEN}✓ All source files are tracked${NC}"
exit 0
