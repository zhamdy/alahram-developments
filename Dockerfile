# ==========================================
# Al-Ahram Developments - Multi-stage Build
# ==========================================

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/dist/alahram-developments ./dist/alahram-developments
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001 -G nodejs
USER angular

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "dist/alahram-developments/server/server.mjs"]
