#!/bin/bash
# =============================================================================
# Local Docker build for wabtec-ricochet-ui.
# Usage: ./scripts/build-image.sh [version]
# Example: ./scripts/build-image.sh 2.0.0
#
# One image serves every railroad and environment, so there is nothing to
# choose here but the version label.
# =============================================================================

set -e

VERSION=${1:-dev}

BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

IMAGE_NAME="ricochet-ui:${VERSION}"

echo "Building ${IMAGE_NAME} from ${GIT_COMMIT}"

# Change to project root
cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker build \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  --build-arg VERSION="${VERSION}" \
  --build-arg BUILD_ID="${GIT_COMMIT}" \
  -t "${IMAGE_NAME}" \
  -f Dockerfile \
  .

echo "Built ${IMAGE_NAME}. Verify it with: ./scripts/verify-image.sh ${IMAGE_NAME}"
