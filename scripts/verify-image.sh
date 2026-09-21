#!/usr/bin/env bash
#
# Start a built ricochet-ui image and prove it actually serves the application.
#
# This exists because 1.0.3 shipped blank. nginx.conf used `alias` where the
# bundle's location required `root`, so `/ricochet-ui/` resolved outside the
# bundle directory — and so did the try_files fallback, landing on the base
# image's stock "Welcome to nginx!" page. Every request returned that page with
# a 200. The image built clean, nginx started clean, every status code was 200.
#
# So this asserts what was actually served, never the status code. Two
# assertions, because the failure has two distinguishable shapes:
#
#   1. The served document references a JavaScript bundle at all. Under the
#      alias bug it did not — the welcome page has no <script src> — so this is
#      the branch that catches that specific regression.
#   2. That bundle is served as JavaScript rather than as a fallback document.
#      This catches a bundle that is missing, mis-hashed, or shadowed by an
#      over-eager SPA fallback.
#
# Both workflows call this. ci.yml runs it on a pull request; release.yml runs
# it against the image it is about to publish, because a tag need not have come
# from a commit that passed ci.yml — which is how 1.0.3 reached Docker Hub.
#
# Usage: verify-image.sh <image-ref> [base-path] [host-port]

set -euo pipefail

IMAGE="${1:?usage: verify-image.sh <image-ref> [base-path] [host-port]}"
BASE_PATH="${2:-ricochet-ui}"
PORT="${3:-8080}"
CONTAINER="verify-${BASE_PATH}-$$"

docker run -d --name "$CONTAINER" -p "${PORT}:80" "$IMAGE" >/dev/null

# Cleanup on EVERY exit path, not just the ones written out below. Without this
# a `set -e` abort leaves the container holding its name and port, which costs
# nothing on a throwaway GitHub runner and breaks every subsequent run on a
# self-hosted one. The logs go out first so a startup failure leaves evidence.
cleanup() {
  docker logs "$CONTAINER" 2>&1 | tail -30 || true
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

ready=""
for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "http://localhost:${PORT}/${BASE_PATH}/"; then
    ready=1
    break
  fi
  sleep 1
done

# An explicit failure arm. Without it the loop just ends, the next curl fails
# with a bare exit 7 under pipefail, and a container that never started gets
# reported as a bundle problem — sending the reader to the wrong file.
if [ -z "$ready" ]; then
  echo "::error::the container never answered on :${PORT}. nginx did not start, or is not listening. Container logs follow."
  exit 1
fi

# Take the bundle path from the served document rather than hardcoding it: the
# filename carries a content hash and changes every build.
asset=$(curl -s "http://localhost:${PORT}/${BASE_PATH}/" \
  | sed -n 's/.*src="\([^"]*\.js\)".*/\1/p' | head -1)

if [ -z "$asset" ]; then
  echo "::error::the document served at /${BASE_PATH}/ references no JavaScript bundle. Either the React build produced none, or nginx is serving some other page entirely — under the 1.0.3 bug this was the base image's stock nginx welcome page. Check root vs alias in nginx.conf against where the Dockerfile copies the build."
  exit 1
fi
echo "the served document asks for $asset"

type=$(curl -s -o /dev/null -w '%{content_type}' "http://localhost:${PORT}${asset}")
echo "served as $type"

case "$type" in
  *javascript*)
    echo "the bundle is served as JavaScript"
    ;;
  *)
    echo "::error::${asset} is served as '${type}', not JavaScript. The file is missing at that path and the SPA fallback answered in its place, so the application will not boot. Check that the bundle exists where nginx resolves it to."
    exit 1
    ;;
esac
