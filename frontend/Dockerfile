# Stage 1: Build React app
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
# VITE_API_BASE_URL을 빈 값으로 두면 상대 경로(/api/...)로 요청 → nginx가 backend로 프록시
RUN pnpm build

# Stage 2: Serve via nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
