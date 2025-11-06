# syntax=docker/dockerfile:1

# --- Base image with Bun ---
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# --- Install dependencies ---
# Copy only manifests first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Build/prepare app ---
COPY tsconfig.json ./
COPY src ./src

# Optional: copy drizzle config if you plan to run migrations inside container
COPY drizzle.config.ts ./drizzle.config.ts

# Expose app port
EXPOSE 3000

# Default environment (override in runtime)
ENV NODE_ENV=production

# --- Start ---
# You can run migrations on startup by uncommenting the line below
# CMD bun run db:migrate && bun run src/index.ts
CMD ["bun", "run", "src/index.ts"]
