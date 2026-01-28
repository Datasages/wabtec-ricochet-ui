#!/bin/bash
# =============================================================================
# Build All Customer/Environment Combinations
# Usage: ./scripts/build-all.sh [tag]
# Example: ./scripts/build-all.sh v1.0.0
# =============================================================================

set -e

TAG=${1:-latest}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CUSTOMERS=("amtk" "csao" "njtr" "nysw" "sepa" "vrex")
ENVIRONMENTS=("prod" "dev" "dr")

TOTAL=$((${#CUSTOMERS[@]} * ${#ENVIRONMENTS[@]}))
CURRENT=0

echo "=========================================="
echo "Building all ${TOTAL} image combinations"
echo "Tag: ${TAG}"
echo "=========================================="
echo ""

for scac in "${CUSTOMERS[@]}"; do
  for env in "${ENVIRONMENTS[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo ""
    echo "[${CURRENT}/${TOTAL}] Building ${scac}-${env}..."
    echo ""
    "${SCRIPT_DIR}/build-image.sh" "${scac}" "${env}" "${TAG}"
  done
done

echo ""
echo "=========================================="
echo "All ${TOTAL} builds completed successfully!"
echo "=========================================="
echo ""
echo "Images created:"
for scac in "${CUSTOMERS[@]}"; do
  for env in "${ENVIRONMENTS[@]}"; do
    echo "  - ricochet-ui:${scac}-${env}-${TAG}"
  done
done
