FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

ENV HOST=0.0.0.0
EXPOSE 8787

CMD ["pnpm", "--filter", "@baret-midnight/server", "start"]
