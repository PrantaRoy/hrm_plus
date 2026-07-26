FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/frontend

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /repo/apps/frontend/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
