# Build context is the repo root (npm workspaces): docker build -f apps/backend/Dockerfile .

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /repo
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Every workspace manifest must be present so the lockfile resolves; only the backend's deps are installed.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/saas-frontend/package.json apps/saas-frontend/package.json
RUN npm ci -w apps/backend -w packages/shared

COPY packages/shared packages/shared
COPY apps/backend apps/backend
# Prisma clients (gitignored apps/backend/generated) must exist before tsc — the `build` script
# runs tsc first, which only works locally because a stale generated/ dir is already there.
RUN npm run build -w packages/shared \
    && npm run prisma:generate -w apps/backend \
    && npm exec -w apps/backend -- tsc -p tsconfig.json

# ---- runtime ----
FROM node:20-bookworm-slim
WORKDIR /repo
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# chromium: payslip/PDF rendering (puppeteer). openssl: prisma engines.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates chromium fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# devDependencies are intentionally kept: tenant provisioning shells out to `npx prisma migrate deploy`,
# and the seed/maintenance scripts run through tsx.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/backend ./apps/backend

# Pre-create the uploads dir so a named volume mounted here inherits node ownership.
RUN mkdir -p /repo/apps/backend/uploads && chown -R node:node /repo/apps/backend/uploads
USER node
WORKDIR /repo/apps/backend
EXPOSE 4000
CMD ["node", "dist/server.js"]
