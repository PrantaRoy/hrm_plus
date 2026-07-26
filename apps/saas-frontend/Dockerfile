FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/saas-frontend/package.json apps/saas-frontend/package.json
RUN npm install
COPY packages/shared packages/shared
COPY apps/saas-frontend apps/saas-frontend
RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/saas-frontend

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /repo/apps/saas-frontend/dist ./dist
EXPOSE 5174
CMD ["serve", "-s", "dist", "-l", "5174"]
