# ============================================
# STAGE 1: Build React app
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files del frontend
COPY frontend/package*.json ./

# Instalar dependencias (usando install en vez de ci para evitar problemas de sincronización)
RUN npm install --production=false

# Copiar código fuente del frontend
COPY frontend/ .

# Build de producción
RUN npm run build

# ============================================
# STAGE 2: Serve with Nginx
# ============================================
FROM nginx:alpine

# Eliminar los archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar los archivos compilados desde el stage builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx para SPA
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Agregar script para inyectar variables de entorno en runtime
COPY docker/frontend/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx se inicia automáticamente con la imagen base
