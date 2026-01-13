#!/bin/bash
# Monitor Vercel deployment status after code changes
# Similar to monitoring GitHub Actions runs

PROJECTS=(
  "interfacectl.com:https://www.interfacectl.com"
  "surfaces.systems:https://www.surfaces.systems"
  "surfaceops.ai:https://www.surfaceops.ai"
)

echo "=== Vercel Deployment Status Monitor ==="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

for project_info in "${PROJECTS[@]}"; do
  IFS=':' read -r name url <<< "$project_info"
  echo "--- $name ---"
  
  # Get deployment info
  output=$(vercel inspect "$url" 2>&1)
  
  # Extract key information (macOS compatible)
  status=$(echo "$output" | grep "status" | sed -n 's/.*status[[:space:]]*●[[:space:]]*\([A-Za-z]*\).*/\1/p' | head -1)
  [ -z "$status" ] && status="Unknown"
  
  created=$(echo "$output" | grep "created" | sed -n 's/.*created[[:space:]]*\([^[]*\).*/\1/p' | head -1)
  [ -z "$created" ] && created="Unknown"
  
  deployment_id=$(echo "$output" | grep "id" | sed -n 's/.*id[[:space:]]*\([a-zA-Z0-9_]*\).*/\1/p' | head -1)
  [ -z "$deployment_id" ] && deployment_id="N/A"
  
  target=$(echo "$output" | grep "target" | sed -n 's/.*target[[:space:]]*\([a-zA-Z]*\).*/\1/p' | head -1)
  [ -z "$target" ] && target="Unknown"
  
  # Status indicator
  if [ "$status" = "Ready" ]; then
    status_icon="✅"
  elif [ "$status" = "Building" ] || [ "$status" = "Queued" ]; then
    status_icon="🔄"
  elif [ "$status" = "Error" ] || [ "$status" = "Failed" ]; then
    status_icon="❌"
  else
    status_icon="⚠️"
  fi
  
  echo "  Status: $status_icon $status"
  echo "  Target: $target"
  echo "  Deployment ID: $deployment_id"
  echo "  Created: $created"
  echo ""
done
