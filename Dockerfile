# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

# Build shared package then server
RUN pnpm --filter @attra/shared build && pnpm --filter @attra/server build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/server/dist apps/server/dist

# Environment
ENV NODE_ENV=production
ENV APP_HOST=0.0.0.0
ENV APP_PORT=3000

EXPOSE 3000

CMD ["node", "apps/server/dist/apps/server/src/index.js"]

