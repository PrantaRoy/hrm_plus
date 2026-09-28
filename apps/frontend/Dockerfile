# Build context is the repo root (npm workspaces): docker build -f apps/frontend/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/saas-frontend/package.json apps/saas-frontend/package.json
RUN npm ci -w apps/frontend -w packages/shared -w packages/ui

COPY packages/shared packages/shared
COPY packages/ui packages/ui
COPY apps/frontend apps/frontend

# Vite inlines these at build time, so changing them requires a rebuild.
ARG VITE_API_BASE_URL=http://localhost:4000/api
ARG VITE_DEFAULT_TENANT_SLUG=acme
ARG VITE_PUBLIC_TENANT_BASE_DOMAIN=localhost
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DEFAULT_TENANT_SLUG=$VITE_DEFAULT_TENANT_SLUG \
    VITE_PUBLIC_TENANT_BASE_DOMAIN=$VITE_PUBLIC_TENANT_BASE_DOMAIN

RUN npm run build -w packages/shared && npm run build -w apps/frontend

FROM nginx:alpine
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
