FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# the translation models (about 350 MB) come into the image, so the server never downloads them
RUN npm run build && npm prune --omit=dev && node scripts/geoip.mjs geo/dbip-city-lite.mmdb && node scripts/translate.mjs --download

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
	PORT=3000 \
	BODY_SIZE_LIMIT=100M \
	PROTOCOL_HEADER=x-forwarded-proto \
	HOST_HEADER=x-forwarded-host \
	ADDRESS_HEADER=x-forwarded-for \
	XFF_DEPTH=1 \
	GEOIP_DB=/app/geo/dbip-city-lite.mmdb
COPY --from=build /app/build build
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/geo geo
COPY --from=build /app/models models
COPY scripts/translate.mjs scripts/translate.mjs
COPY migrations migrations
USER node
EXPOSE 3000
CMD ["node", "build"]
