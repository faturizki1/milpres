FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++
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
RUN npm ci --omit=dev
USER app
EXPOSE 3001
CMD ["node", "dist/main.js"]
