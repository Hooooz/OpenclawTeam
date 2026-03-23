FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/control-api/package.json apps/control-api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY apps/control-api apps/control-api
COPY packages/shared packages/shared

RUN npm run build --workspace @openclaw/shared && npm run build --workspace @openclaw/control-api

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/control-api/package.json apps/control-api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev

COPY --from=build /app/apps/control-api/dist apps/control-api/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist

EXPOSE 3201

CMD ["node", "apps/control-api/dist/index.js"]
