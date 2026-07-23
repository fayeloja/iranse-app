# Multi-stage Dockerfile for Iransé API and BullMQ Workers (DECISIONS.md #11, #12)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/validation/package*.json ./packages/validation/

RUN npm ci

# Copy source files
COPY apps/api ./apps/api
COPY packages/validation ./packages/validation

# Build TypeScript output
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/validation/package*.json ./packages/validation/

RUN npm ci --only=production

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/infra/database/migrations ./apps/api/dist/infra/database/migrations

EXPOSE 3000

# Default entrypoint starts HTTP API server.
# Override CMD to ["node", "apps/api/dist/worker.js"] for BullMQ worker container instances.
CMD ["node", "apps/api/dist/server.js"]
