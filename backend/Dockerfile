# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
