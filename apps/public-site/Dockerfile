FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all packages
COPY packages ./packages
COPY apps ./apps
COPY services ./services

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build only public-site
RUN pnpm --filter=@milpers/public-site run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S next && adduser -S next -G next

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/public-site/package.json ./apps/public-site/

# Install runtime dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copy built standalone app
COPY --from=builder /app/apps/public-site/.next/standalone ./apps/public-site/
COPY --from=builder /app/apps/public-site/.next/static ./apps/public-site/.next/static
COPY --from=builder /app/apps/public-site/public ./apps/public-site/public

USER next
EXPOSE 3000
WORKDIR /app/apps/public-site
CMD ["node", "server.js"]
