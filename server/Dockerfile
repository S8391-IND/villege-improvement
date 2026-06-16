FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package*.json ./
COPY server/package*.json ./server/
COPY database/package*.json ./database/
RUN npm install --workspaces
COPY database ./database
COPY server ./server
RUN npm run build --workspace=server

FROM base AS runner
ENV NODE_ENV=production
COPY package*.json ./
COPY database/package*.json ./database/
COPY server/package*.json ./server/
RUN npm install --workspaces --omit=dev
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/database/dist ./database/dist
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
