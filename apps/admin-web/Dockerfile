FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/admin-web/package.json apps/admin-web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY apps/admin-web apps/admin-web
COPY packages/shared packages/shared

RUN npm run build --workspace @openclaw/shared && npm run build --workspace @openclaw/admin-web

FROM nginx:1.27-alpine

COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html
