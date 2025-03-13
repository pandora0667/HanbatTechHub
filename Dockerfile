FROM node:22

WORKDIR /app
RUN corepack enable && corepack prepare pnpm --activate

# 시스템 패키지 설치 (healthcheck용 curl 포함)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# 기본 모드 설정 (필수)
ENV NODE_ENV=production

EXPOSE 3000
CMD ["pnpm", "start:prod"]
