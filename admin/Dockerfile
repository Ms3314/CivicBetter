# syntax=docker/dockerfile:1

# --- Base image with Bun ---
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# --- Install dependencies ---
# Copy only manifests first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Copy Prisma schema and generate client ---
COPY prisma ./prisma
RUN bun run db:generate

# --- Build/prepare app ---
COPY tsconfig.json ./
COPY src ./src

# Expose app port
EXPOSE 3000

# Default environment (override in runtime)
ENV NODE_ENV=production

# --- Start ---
# Run migrations on container startup, then start the app
# This ensures migrations are always up-to-date when container starts
CMD bunx prisma migrate deploy && bun run src/index.ts
