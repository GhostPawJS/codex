FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
RUN mkdir -p /data && chown node:node /data
ENV GHOSTPAW_CODEX_DB=/data/codex.db
VOLUME /data
USER node
ENTRYPOINT ["node", "dist/mcp-server.js"]
