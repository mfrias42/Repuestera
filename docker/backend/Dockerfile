# Stage 1: Imagen base para ejecutar la aplicación
FROM node:20-alpine AS runtime

# Establecer directorio de trabajo
WORKDIR /app

# Copiar los archivos del backend (asume que vienen del artifact)
# Se espera que el contexto de build contenga los archivos compilados
COPY . .

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Exponer el puerto donde corre el backend
EXPOSE 8000

# Variables de entorno por defecto (se sobreescriben en runtime)
ENV NODE_ENV=production
ENV PORT=8000

# Health check para verificar que el servidor está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usuario no privilegiado para seguridad
USER node

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
