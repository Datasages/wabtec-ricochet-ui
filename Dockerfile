# =============================================================================
# Dockerfile for wabtec-ricochet-ui
#
# One image for every railroad and environment, with no configuration. The API
# is always the page's own origin (each railroad's ALB serves /ricochet-ui and
# /strolr-api on one host) and the marks come from strolr-api, so nothing about
# a railroad or an environment is built in or supplied at start. Vault decision
# 2026-10-04-ricochet-ui-zero-config-image.md.
# =============================================================================

# Build arguments for base images
ARG NODE_VERSION=20-alpine3.18
ARG NGINX_VERSION=stable-alpine

# =============================================================================
# Stage 1: Build React Application
# =============================================================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

# Copy package files first for layer caching
COPY package.json package-lock.json ./

RUN npm ci

COPY . ./

# react-scripts 5 emits source maps unless told otherwise, and they ship in the
# image: /ricochet-ui/static/js/main.<hash>.js.map returns the full unminified
# source to anyone on the customer domain, and the bundle's trailing
# sourceMappingURL comment makes devtools fetch it automatically.
#
# Placement is the control: the files are never built, so there is nothing for
# an nginx rule to have to remember to hide. collins-strolr-ui sets the same
# flag.
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# =============================================================================
# Stage 2: Production Nginx Server
# =============================================================================
FROM nginx:${NGINX_VERSION} AS production

# Alpine publishes security fixes between nginx image releases, and the image
# scan in supply-chain-audit.yml fails on any HIGH/CRITICAL with a fix
# available. Without this, a fixed CVE in the base (libexpat, OpenSSL) blocks
# every build until upstream re-cuts the tag. The nginx binary itself comes
# from nginx.org's repo, which the official image removes after install, so
# this moves only Alpine's own packages within the same release branch.
RUN apk upgrade --no-cache

# Labels identify the build only; there is no railroad or environment to record.
ARG BUILD_ID=unknown
ARG BUILD_DATE
ARG GIT_COMMIT
ARG VERSION

LABEL maintainer="Wabtec" \
      app="ricochet-ui" \
      build-id="${BUILD_ID}" \
      build-date="${BUILD_DATE}" \
      git-commit="${GIT_COMMIT}" \
      version="${VERSION}"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application to nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html/ricochet-ui

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
