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
# it against the image it is about to publish. 1.0.3 was NOT published because
# a tag skipped CI — it came from the PR #21 merge commit, which ci.yml ran on
# and passed. It shipped because nothing ever STARTED the image. The release
# path gets its own call anyway, since a tag genuinely need not come from a
# commit that reached main.
#
# Usage: verify-image.sh <image-ref> [base-path] [host-port]

set -euo pipefail

IMAGE="${1:?usage: verify-image.sh <image-ref> [base-path] [host-port]}"
BASE_PATH="${2:-ricochet-ui}"
PORT="${3:-8080}"
CONTAINER="verify-${BASE_PATH}-$$"

# Registered BEFORE `docker run`, which is the whole point. `docker run` can
# create the container and then fail to start it — an already-allocated host
# port is the common case — and with the trap installed afterwards, `set -e`
# aborts first and leaves that container behind holding its name. That is
# exactly the self-hosted-runner leak this trap exists to prevent, so
# installing it late made the guarantee false in its own headline case.
#
# `cleanup` tolerates a container that was never created: both commands end
# in `|| true`.
cleanup() {
  docker logs "$CONTAINER" 2>&1 | tail -30 || true
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Loopback only. The script talks to nothing but localhost, and ci.yml runs on
# `pull_request`, so on a self-hosted runner a fork's Dockerfile and served
# content would otherwise be reachable from the runner's network for the
# duration of the check.
docker run -d --name "$CONTAINER" -p "127.0.0.1:${PORT}:80" "$IMAGE" >/dev/null

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

# Redirects must be relative. TLS terminates in front of this container, so
# nginx sees plain HTTP on :80; an absolute Location would send the browser to
# http://, downgrading it (or failing outright where only 443 is open). Both
# redirects nginx issues are checked: the root, and the base path without its
# trailing slash (nginx's automatic directory redirect).
for path in "/" "/${BASE_PATH}"; do
  location=$(curl -s -o /dev/null -D - "http://localhost:${PORT}${path}" \
    | tr -d '\r' | sed -n 's/^[Ll]ocation: //p')
  case "$location" in
    /*)
      echo "${path} redirects to ${location} (relative)"
      ;;
    *)
      echo "::error::${path} redirects to '${location}', not a relative path. Behind the TLS edge that sends the browser to plain http://. Set 'absolute_redirect off;' in nginx.conf."
      exit 1
      ;;
  esac
done
