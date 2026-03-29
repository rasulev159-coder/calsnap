FROM node:20-alpine AS base
RUN npm install -g pnpm@8

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build shared
RUN cd packages/shared && pnpm run build || true

WORKDIR /app/apps/backend

EXPOSE 4000
CMD ["npx", "tsx", "src/index.ts"]
