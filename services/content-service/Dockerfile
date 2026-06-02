FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# build dependencies including libvips for sharp
RUN apk add --no-cache python3 make g++ vips-dev fftw-dev libjpeg-turbo-dev libpng-dev giflib-dev lcms2-dev
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# runtime dependencies for sharp
RUN apk add --no-cache vips
RUN npm ci --omit=dev
USER app
EXPOSE 3002
CMD ["node", "dist/main.js"]
