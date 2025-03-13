FROM node:22

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# 기본 모드 설정 (필수)
ENV NODE_ENV=production

EXPOSE 3000
CMD ["pnpm", "start:prod"]
