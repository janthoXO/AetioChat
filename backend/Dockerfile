# Stage 1: Build the application
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace and lockfile from root
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package and backend
COPY shared ./shared
COPY backend ./backend

# Install dependencies at the workspace root
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build everything
FROM base AS build
RUN pnpm --filter backend run build

# Extract only production dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm deploy --filter backend --prod /app/prod-out

# Stage 2: Production image using Distroless
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Re-use the isolated production dependencies and build artifacts
COPY --from=prod-deps /app/prod-out/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
# We need package.json for module resolution (type: module)
COPY --from=build /app/backend/package.json ./

EXPOSE 3000

CMD ["dist/main.js"]
