FROM node:20-bullseye-slim AS base

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NODE_ENV=production \
    PORT=8080

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    chromium \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

COPY . .

# Optional: if web-ui exists and has dist, copy; else skip
RUN mkdir -p /app/web-ui/dist || true

EXPOSE 8080

CMD ["npm","start"]
