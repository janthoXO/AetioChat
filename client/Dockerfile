# Stage 1: Build the application
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace and lockfile from root
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package and client
COPY shared ./shared
COPY client ./client

# Install dependencies at the workspace root
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build everything
RUN pnpm --filter client run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine AS runner
COPY --from=base /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
