# =============================================================================
# Unified Dockerfile for wabtec-ricochet-ui
# Supports all customers (amtk, csao, njtr, nysw, sepa, vrex) and
# environments (prod, dev, dr) via build arguments
# =============================================================================

# Build arguments for base images
ARG NODE_VERSION=20-alpine3.18
ARG NGINX_VERSION=stable-alpine

# =============================================================================
# Stage 1: Build React Application
# =============================================================================
FROM node:${NODE_VERSION} AS builder

# Build-time configuration arguments
ARG SCAC=amtk
ARG ENVIRONMENT=prod
ARG MARK_LIST=amtk
ARG BUILD_ID=unknown

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Configure package.json homepage based on customer and environment
RUN set -e; \
    SCAC_LOWER=$(echo "${SCAC}" | tr '[:upper:]' '[:lower:]'); \
    case "${ENVIRONMENT}" in \
        prod) ENV_SUBDOMAIN="" ;; \
        dev|interop) ENV_SUBDOMAIN="interop." ;; \
        dr) ENV_SUBDOMAIN="dr." ;; \
        *) ENV_SUBDOMAIN="" ;; \
    esac; \
    if [ -z "${ENV_SUBDOMAIN}" ]; then \
        FQDN="${SCAC_LOWER}-apps.railwaynet.net"; \
    else \
        FQDN="${SCAC_LOWER}-apps.${ENV_SUBDOMAIN}railwaynet.net"; \
    fi; \
    sed -i "s|SCAC_URI-apps.railwaynet.net|${FQDN}|g" package.json; \
    echo "Configured package.json for SCAC=${SCAC_LOWER}, ENV=${ENVIRONMENT}, FQDN=${FQDN}"

# Install dependencies
RUN npm ci

# Copy application source
COPY . ./

# Generate environment configuration from template
RUN set -e; \
    SCAC_LOWER=$(echo "${SCAC}" | tr '[:upper:]' '[:lower:]'); \
    SCAC_UPPER=$(echo "${SCAC}" | tr '[:lower:]' '[:upper:]'); \
    case "${ENVIRONMENT}" in \
        prod) ENV_SUBDOMAIN=""; SSO_ENV="prod" ;; \
        dev|interop) ENV_SUBDOMAIN="interop."; SSO_ENV="interop" ;; \
        dr) ENV_SUBDOMAIN="dr."; SSO_ENV="dr" ;; \
        *) ENV_SUBDOMAIN=""; SSO_ENV="prod" ;; \
    esac; \
    \
    # Start with template
    cp .env.template .env.production; \
    \
    # Replace SCAC_URI- with lowercase scac prefix
    sed -i "s|SCAC_URI-|${SCAC_LOWER}-|g" .env.production; \
    \
    # Replace SCAC_VAR with uppercase scac
    sed -i "s|SCAC_VAR|${SCAC_UPPER}|g" .env.production; \
    \
    # Replace MARK_LIST with customer marks
    sed -i "s|MARK_LIST|${MARK_LIST}|g" .env.production; \
    \
    # Replace ENVIRONMENT. with subdomain (or empty for prod)
    if [ -z "${ENV_SUBDOMAIN}" ]; then \
        sed -i "s|ENVIRONMENT\.||g" .env.production; \
    else \
        sed -i "s|ENVIRONMENT\.|${ENV_SUBDOMAIN}|g" .env.production; \
    fi; \
    \
    # Copy to required locations for React build
    cp .env.production .env.development; \
    cp .env.production .env; \
    \
    # Log configuration for debugging
    echo "=== Generated Environment Configuration ==="; \
    echo "SCAC: ${SCAC_UPPER} (${SCAC_LOWER})"; \
    echo "ENVIRONMENT: ${ENVIRONMENT}"; \
    echo "MARKS: ${MARK_LIST}"; \
    echo "BUILD_ID: ${BUILD_ID}"; \
    cat .env.production

# Build the React application
RUN npm run build

# =============================================================================
# Stage 2: Production Nginx Server
# =============================================================================
FROM nginx:${NGINX_VERSION} AS production

# Runtime labels for identification
ARG SCAC=amtk
ARG ENVIRONMENT=prod
ARG BUILD_ID=unknown
ARG BUILD_DATE
ARG GIT_COMMIT
ARG VERSION

LABEL maintainer="Wabtec" \
      app="ricochet-ui" \
      scac="${SCAC}" \
      environment="${ENVIRONMENT}" \
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
