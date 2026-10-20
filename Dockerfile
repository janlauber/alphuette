FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev && node scripts/geoip.mjs geo/dbip-city-lite.mmdb

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
COPY migrations migrations
COPY seed seed
USER node
EXPOSE 3000
CMD ["node", "build"]
