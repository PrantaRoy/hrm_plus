FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm install
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/backend

FROM node:20-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/backend ./apps/backend
WORKDIR /repo/apps/backend
EXPOSE 4000
CMD ["node", "dist/server.js"]
