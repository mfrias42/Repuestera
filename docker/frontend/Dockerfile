# Imagen base de nginx alpine (ligera)
FROM nginx:alpine

# Establecer el directorio de trabajo
WORKDIR /usr/share/nginx/html

# Eliminar los archivos por defecto de nginx
RUN rm -rf ./*

# Copiar los archivos compilados de React (build) al directorio de nginx
# Se espera que el contexto contenga el resultado de 'npm run build'
COPY . .

# Copiar configuración personalizada de nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Agregar script para inyectar variables de entorno en runtime
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx se inicia automáticamente con la imagen base
