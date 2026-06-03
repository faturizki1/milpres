FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# build dependencies including libvips for sharp
RUN apk add --no-cache python3 make g++ vips-dev fftw-dev libjpeg-turbo-dev libpng-dev giflib-dev lcms2-dev
RUN npm install -g pnpm

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all packages
COPY packages ./packages
COPY services ./services
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build only content-service
RUN pnpm --filter=@milpers/content-service run build

FROM node:22-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production

# runtime dependencies for sharp
RUN apk add --no-cache vips
RUN npm install -g pnpm

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY services/content-service ./services/content-service

# Install dependencies (production only)
RUN pnpm install --frozen-lockfile --prod

# Copy built dist
COPY --from=builder /app/services/content-service/dist ./services/content-service/dist

USER app
EXPOSE 3002
WORKDIR /app/services/content-service
CMD ["node", "dist/main.js"]
