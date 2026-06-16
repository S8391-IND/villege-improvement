FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm install --workspace=client
COPY client ./client
RUN npm run build --workspace=client

FROM nginx:alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
