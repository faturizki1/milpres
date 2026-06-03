FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build auth-service only
RUN pnpm --filter=@milpers/auth-service run build

FROM node:22-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built code
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

USER app
EXPOSE 3001
WORKDIR /app/services/auth-service
CMD ["node", "dist/main.js"]
