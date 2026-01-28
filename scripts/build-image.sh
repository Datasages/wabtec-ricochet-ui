#!/bin/bash
# =============================================================================
# Local Docker Build Script for wabtec-ricochet-ui
# Usage: ./scripts/build-image.sh <scac> <environment> [tag]
# Example: ./scripts/build-image.sh amtk dev v1.0.0
# =============================================================================

set -e

# Arguments
SCAC=${1:-amtk}
ENVIRONMENT=${2:-dev}
TAG=${3:-latest}

# Validate SCAC
case "${SCAC}" in
  amtk|csao|njtr|nysw|sepa|vrex)
    ;;
  *)
    echo "Error: Invalid SCAC '${SCAC}'"
    echo "Valid options: amtk, csao, njtr, nysw, sepa, vrex"
    exit 1
    ;;
esac

# Validate ENVIRONMENT
case "${ENVIRONMENT}" in
  prod|dev|dr)
    ;;
  *)
    echo "Error: Invalid ENVIRONMENT '${ENVIRONMENT}'"
    echo "Valid options: prod, dev, dr"
    exit 1
    ;;
esac

# Marks lookup
case "${SCAC}" in
  amtk) MARK_LIST="AMTK,CDTX,IDTX,WDTX" ;;
  csao) MARK_LIST="csao" ;;
  njtr) MARK_LIST="njtr" ;;
  nysw) MARK_LIST="nysw" ;;
  sepa) MARK_LIST="sepa" ;;
  vrex) MARK_LIST="vrex" ;;
  *) MARK_LIST="${SCAC}" ;;
esac

# Build info
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

IMAGE_NAME="ricochet-ui:${SCAC}-${ENVIRONMENT}-${TAG}"

echo "=========================================="
echo "Building: ${IMAGE_NAME}"
echo "SCAC: ${SCAC}"
echo "Environment: ${ENVIRONMENT}"
echo "Marks: ${MARK_LIST}"
echo "Git Commit: ${GIT_COMMIT}"
echo "=========================================="

# Change to project root
cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker build \
  --build-arg SCAC="${SCAC}" \
  --build-arg ENVIRONMENT="${ENVIRONMENT}" \
  --build-arg MARK_LIST="${MARK_LIST}" \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  --build-arg VERSION="${TAG}" \
  --build-arg BUILD_ID="${GIT_COMMIT}" \
  -t "${IMAGE_NAME}" \
  -f Dockerfile \
  .

echo "=========================================="
echo "Successfully built: ${IMAGE_NAME}"
echo "=========================================="
echo ""
echo "To run locally:"
echo "  docker run -p 8080:80 ${IMAGE_NAME}"
echo ""
echo "To test:"
echo "  curl http://localhost:8080/ricochet-ui/"
