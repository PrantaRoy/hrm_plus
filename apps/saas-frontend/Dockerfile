# Build context is the repo root (npm workspaces): docker build -f apps/saas-frontend/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/saas-frontend/package.json apps/saas-frontend/package.json
RUN npm ci -w apps/saas-frontend -w packages/shared -w packages/ui

COPY packages/shared packages/shared
COPY packages/ui packages/ui
COPY apps/saas-frontend apps/saas-frontend

# Vite inlines this at build time, so changing it requires a rebuild. No trailing /api for this app.
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build -w packages/shared && npm run build -w apps/saas-frontend

FROM nginx:alpine
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/saas-frontend/dist /usr/share/nginx/html
EXPOSE 80
