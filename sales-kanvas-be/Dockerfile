# PRODUCTION
# Last Upate: 24 September 2026

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist
EXPOSE 53103
CMD ["node", "dist/src/main.js"]
