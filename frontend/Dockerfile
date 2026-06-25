# ----- Build stage -----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Vide = même origine que l'API (Caddy route /process,/download,/logs vers le backend).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
# Suivi des erreurs frontend (Sentry). Vide = désactivé (no-op au runtime).
ARG VITE_SENTRY_DSN=
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ARG VITE_SENTRY_ENV=production
ENV VITE_SENTRY_ENV=$VITE_SENTRY_ENV
RUN npm run build

# ----- Runtime stage -----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
