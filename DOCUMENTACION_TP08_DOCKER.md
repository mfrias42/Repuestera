# 📦 TP08 - Implementación de Contenedores Docker

> **Trabajo Práctico 8 - Ingeniería de Software III**  
> **Tema**: Implementación de Aplicaciones con Docker y Docker Compose  
> **Fecha**: Noviembre 2025

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura de Contenedores](#arquitectura-de-contenedores)
3. [Dockerfiles](#dockerfiles)
4. [Docker Compose](#docker-compose)
5. [Configuración de Nginx](#configuración-de-nginx)
6. [Pruebas Locales](#pruebas-locales)
7. [Despliegue en Azure](#despliegue-en-azure)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

### Objetivos del TP08

- ✅ Containerizar aplicación completa (Backend + Frontend + Database)
- ✅ Implementar multi-stage builds
- ✅ Configurar Docker Compose para orquestación
- ✅ Optimizar imágenes Docker
- ✅ Desplegar en Azure Container Registry + Container Instances

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│ APLICACIÓN CONTAINERIZADA                  │
├─────────────────────────────────────────────┤
│ Frontend:  React 18 + Nginx Alpine         │
│ Backend:   Node.js 20 Alpine               │
│ Database:  MySQL 8.0                       │
│ Orquestación: Docker Compose 3.8          │
└─────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura de Contenedores

### Diagrama de Servicios

```
┌──────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│                 repuestera-network                       │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────┐             │
│  │  MySQL 8.0      │  │  Backend         │             │
│  │  Container      │◄─┤  (Node.js 20)    │             │
│  │                 │  │  Port: 8000      │             │
│  │  Port: 3306     │  │                  │             │
│  │  Volume:        │  └────────┬─────────┘             │
│  │  mysql_data     │           │                        │
│  └─────────────────┘           │ HTTP API               │
│                                 │                        │
│                    ┌────────────▼─────────┐             │
│                    │  Frontend            │             │
│                    │  (React + Nginx)     │             │
│                    │  Port: 80            │             │
│                    │                      │             │
│                    └──────────────────────┘             │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
                    HOST: localhost
                    - Frontend: http://localhost
                    - Backend:  http://localhost:8000
                    - MySQL:    localhost:3306
```

### Características de Cada Servicio

#### MySQL Container
- **Imagen**: `mysql:8.0` oficial
- **Puerto**: 3306 (expuesto al host)
- **Volumen Persistente**: `mysql_data` (datos sobreviven a restart)
- **Health Check**: `mysqladmin ping` cada 10s
- **Variables de Entorno**:
  - `MYSQL_ROOT_PASSWORD`: rootpassword
  - `MYSQL_DATABASE`: repuestera_db
  - `MYSQL_USER`: repuestera_user
  - `MYSQL_PASSWORD`: repuestera_pass

#### Backend Container
- **Base**: Node.js 20 Alpine (imagen ligera)
- **Puerto**: 8000
- **Dependencia**: Espera a MySQL (health check)
- **Health Check**: `curl http://localhost:8000/api/health`
- **Inicialización**: Crea tablas automáticamente al arrancar
- **Variables de Entorno**:
  - `NODE_ENV`: production
  - `DB_HOST`: mysql (nombre del servicio)
  - `DB_PORT`: 3306
  - `DB_NAME`: repuestera_db
  - `DB_USER`: repuestera_user
  - `DB_PASSWORD`: repuestera_pass
  - `JWT_SECRET`: (configurar en producción)

#### Frontend Container
- **Multi-Stage Build**:
  - Stage 1 (Builder): Node.js 20 Alpine - Compila React
  - Stage 2 (Runtime): Nginx Alpine - Sirve build estático
- **Puerto**: 80
- **Configuración Nginx**:
  - Proxy reverso a `/api/*` → `http://backend:8000/api/`
  - SPA fallback (`try_files` para React Router)
  - Health endpoint `/health`
  - Compresión gzip habilitada

---

## 📄 Dockerfiles

### Backend Dockerfile

**Ubicación**: `docker/backend/Dockerfile`

```dockerfile
# Imagen base: Node.js 20 Alpine (ligera)
FROM node:20-alpine AS runtime

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files primero (aprovecha cache de Docker)
COPY backend/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY backend/ .

# Cambiar ownership al usuario nodejs
RUN chown -R nodejs:nodejs /app

# Exponer puerto
EXPOSE 8000

# Cambiar a usuario no-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Comando de inicio
CMD ["node", "server.js"]
```

**Características**:
- ✅ Single-stage build (backend no necesita compilación compleja)
- ✅ Usuario no-root (`nodejs:1001`)
- ✅ Cache de dependencias (`package*.json` primero)
- ✅ Solo dependencias de producción (`npm ci --only=production`)
- ✅ Health check nativo de Docker
- ✅ Imagen final: ~120MB

### Frontend Dockerfile

**Ubicación**: `docker/frontend/Dockerfile`

```dockerfile
# ============================================
# STAGE 1: BUILD
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY frontend/package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies)
RUN npm install --production=false

# Copiar código fuente
COPY frontend/ .

# Compilar aplicación React
RUN npm run build

# ============================================
# STAGE 2: SERVE
# ============================================
FROM nginx:alpine

# Remover contenido default de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar build de React desde stage anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración Nginx personalizada
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar script de variables de entorno
COPY docker/frontend/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Nginx se inicia automáticamente con entrypoint default
```

**Características**:
- ✅ **Multi-stage build** (reduce imagen final de ~1GB a ~25MB)
- ✅ Stage 1: Compila React con todas las devDependencies
- ✅ Stage 2: Solo copia el `/build` compilado + Nginx
- ✅ Configuración Nginx personalizada
- ✅ Health check endpoint
- ✅ Imagen final: ~25MB (vs 1GB sin multi-stage)

---

## 🐳 Docker Compose

**Ubicación**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Base de datos MySQL
  mysql:
    image: mysql:8.0
    container_name: repuestera-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: repuestera_db
      MYSQL_USER: repuestera_user
      MYSQL_PASSWORD: repuestera_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - repuestera-network

  # Backend Node.js
  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: repuestera-backend
    environment:
      NODE_ENV: production
      PORT: 8000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: repuestera_db
      DB_USER: repuestera_user
      DB_PASSWORD: repuestera_pass
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
    ports:
      - "8000:8000"
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - repuestera-network
    restart: unless-stopped

  # Frontend React + Nginx
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    container_name: repuestera-frontend
    environment:
      API_URL: http://localhost:8000
    ports:
      - "80:80"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - repuestera-network
    restart: unless-stopped

volumes:
  mysql_data:
    driver: local

networks:
  repuestera-network:
    driver: bridge
```

### Explicación de Configuraciones Clave

#### `depends_on` con `condition`
```yaml
depends_on:
  mysql:
    condition: service_healthy
```
- Backend **NO arranca** hasta que MySQL responda al health check
- Evita errores de "conexión rechazada" al inicio

#### `restart: unless-stopped`
- Contenedores se reinician automáticamente si fallan
- Útil para recuperación automática de errores

#### `volumes` nombrados
```yaml
volumes:
  mysql_data:
    driver: local
```
- Datos de MySQL persisten entre reinicios
- Ubicación: `/var/lib/docker/volumes/repuestera_mysql_data`

#### `networks` bridge
```yaml
networks:
  repuestera-network:
    driver: bridge
```
- Comunicación interna entre contenedores
- Frontend accede a backend via `http://backend:8000` (nombre del servicio)

---

## ⚙️ Configuración de Nginx

**Ubicación**: `docker/frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;

    # Ruta del build de React
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Health check endpoint (para Docker)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Proxy para API del backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }

    # SPA fallback para React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Características Clave

1. **Proxy Reverso API**:
   - Todas las requests a `/api/*` se reenvían a `http://backend:8000/api/`
   - Headers originales preservados (`X-Real-IP`, `X-Forwarded-For`)

2. **SPA Fallback**:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
   - Cualquier ruta no encontrada devuelve `index.html`
   - Permite React Router funcionar correctamente

3. **Health Endpoint**:
   - Responde `200 OK` en `/health`
   - Usado por Docker para health checks

4. **Optimizaciones**:
   - Gzip compresión habilitada
   - Cache de 1 año para assets estáticos

---

## 🧪 Pruebas Locales

### Comandos Básicos

```bash
# Construir imágenes
docker-compose build

# Reconstruir sin cache (útil tras cambios)
docker-compose build --no-cache

# Levantar servicios
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend

# Detener servicios
docker-compose down

# Detener + borrar volúmenes
docker-compose down -v
```

### Pruebas de Funcionalidad

#### 1. Health Checks
```bash
# Backend
curl http://localhost:8000/api/health

# Frontend
curl http://localhost/health

# MySQL (desde container)
docker exec repuestera-mysql mysqladmin ping -u root -prootpassword
```

#### 2. Acceso a la Aplicación
```bash
# Frontend (navegador)
open http://localhost

# API directamente
curl http://localhost:8000/api/health

# Base de datos
docker exec -it repuestera-mysql mysql -u repuestera_user -prepuestera_pass repuestera_db
```

#### 3. Verificar Inicialización de Tablas
```bash
# Ver logs del backend
docker-compose logs backend | grep "Tablas"

# Debe mostrar:
# ✅ Tablas de base de datos inicializadas
```

#### 4. Probar Flujo Completo
1. Abrir http://localhost
2. Registrar usuario
3. Login
4. Crear producto (admin)
5. Ver productos

### Resultados Esperados

```bash
$ docker-compose ps
NAME                  STATUS        PORTS
repuestera-backend    Up (healthy)  0.0.0.0:8000->8000/tcp
repuestera-frontend   Up (healthy)  0.0.0.0:80->80/tcp
repuestera-mysql      Up (healthy)  0.0.0.0:3306->3306/tcp

$ curl http://localhost:8000/api/health
{
  "status":"OK",
  "message":"Servidor funcionando correctamente",
  "database":"Conectada",
  "environment":"production",
  "timestamp":"2025-11-11T16:04:49.934Z"
}
```

---

## ☁️ Despliegue en Azure

### Opción 1: Azure Container Registry + Container Instances

#### Paso 1: Crear Azure Container Registry (ACR)

```bash
# Variables
RESOURCE_GROUP="repuestera-rg"
ACR_NAME="repusteraacr"
LOCATION="eastus"

# Crear resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Crear ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

#### Paso 2: Build y Push de Imágenes

```bash
# Login a ACR
az acr login --name $ACR_NAME

# Tag imágenes
docker tag repuestera-backend:latest $ACR_NAME.azurecr.io/repuestera-backend:latest
docker tag repuestera-frontend:latest $ACR_NAME.azurecr.io/repuestera-frontend:latest

# Push a ACR
docker push $ACR_NAME.azurecr.io/repuestera-backend:latest
docker push $ACR_NAME.azurecr.io/repuestera-frontend:latest
```

#### Paso 3: Deploy con Container Instances

```bash
# Obtener credenciales ACR
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Deploy Backend
az container create \
  --resource-group $RESOURCE_GROUP \
  --name repuestera-backend-aci \
  --image $ACR_NAME.azurecr.io/repuestera-backend:latest \
  --registry-login-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label repuestera-backend-unique \
  --ports 8000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=8000 \
    DB_HOST=manufrias.mysql.database.azure.com \
    DB_NAME=repuestera_db \
    DB_USER=repuestera_user \
    DB_PASSWORD='SecurePassword123!' \
    JWT_SECRET='production-jwt-secret-change-me' \
  --cpu 1 \
  --memory 1.5

# Deploy Frontend
az container create \
  --resource-group $RESOURCE_GROUP \
  --name repuestera-frontend-aci \
  --image $ACR_NAME.azurecr.io/repuestera-frontend:latest \
  --registry-login-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label repuestera-frontend-unique \
  --ports 80 \
  --environment-variables \
    API_URL=http://repuestera-backend-unique.eastus.azurecontainer.io:8000 \
  --cpu 0.5 \
  --memory 1
```

### Opción 2: Integrar con Azure Pipeline

Agregar stage al `azure-pipelines.yml`:

```yaml
- stage: DeployContainers
  displayName: 'Deploy to Azure Container Instances'
  dependsOn: Build
  jobs:
    - job: PushToACR
      steps:
        - task: Docker@2
          displayName: 'Build Backend Image'
          inputs:
            command: 'build'
            dockerfile: 'docker/backend/Dockerfile'
            tags: '$(Build.BuildId)'
            
        - task: Docker@2
          displayName: 'Push Backend to ACR'
          inputs:
            command: 'push'
            containerRegistry: 'ACR-ServiceConnection'
            repository: 'repuestera-backend'
            tags: '$(Build.BuildId)'
```

---

## 🐛 Troubleshooting

### Problema 1: Backend No Conecta a MySQL

**Síntoma**:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solución**:
- Verificar que MySQL esté healthy: `docker-compose ps`
- Verificar variable `DB_HOST=mysql` (nombre del servicio, NO localhost)
- Verificar network: `docker network inspect repuestera_repuestera-network`

### Problema 2: Frontend No Encuentra Backend

**Síntoma**:
```
Failed to fetch http://localhost:8000/api/...
```

**Solución EN DOCKER**:
- Nginx debe usar `proxy_pass http://backend:8000` (nombre del servicio)
- NO usar `http://localhost:8000` dentro del container

**Solución EN NAVEGADOR**:
- Frontend corre en `http://localhost`
- API debe ser accesible en `http://localhost:8000` desde el HOST
- Verificar puerto mapeado: `- "8000:8000"` en docker-compose

### Problema 3: Tablas No Se Crean

**Verificar logs**:
```bash
docker-compose logs backend | grep -i "tablas\|error"
```

**Debe mostrar**:
```
✅ Tablas de base de datos inicializadas
```

**Si no aparece**: El backend no está llamando a `initializeTables()` en `server.js`

### Problema 4: Build Frontend Falla

**Síntoma**:
```
npm ERR! Missing: yaml@2.8.1 from lock file
```

**Solución**:
Cambiar en Dockerfile:
```dockerfile
# Antes
RUN npm ci --production=false

# Después
RUN npm install --production=false
```

### Problema 5: Imagen Muy Grande

**Verificar tamaño**:
```bash
docker images | grep repuestera
```

**Optimizaciones**:
- ✅ Usar Alpine (Node 20 Alpine = 120MB vs Node 20 = 1GB)
- ✅ Multi-stage build (frontend de 1GB a 25MB)
- ✅ `.dockerignore` (excluir node_modules, .git, coverage)

---

## 📊 Métricas y Resultados

### Tamaños de Imágenes

| Imagen | Tamaño Sin Optimizar | Tamaño Optimizado | Reducción |
|--------|---------------------|-------------------|-----------|
| Backend | ~500MB | ~120MB | 76% |
| Frontend | ~1.2GB | ~25MB | 98% |
| **Total** | **~1.7GB** | **~145MB** | **91%** |

### Tiempos de Build

| Componente | Primera Build | Build con Cache |
|------------|---------------|-----------------|
| Backend | ~15s | ~5s |
| Frontend | ~45s | ~10s |
| MySQL | 0s (imagen oficial) | 0s |

### Consumo de Recursos (Docker Desktop)

| Servicio | CPU | Memoria | Disco |
|----------|-----|---------|-------|
| MySQL | 5% | 400MB | 150MB |
| Backend | 2% | 50MB | 120MB |
| Frontend | 1% | 10MB | 25MB |
| **Total** | **~8%** | **~460MB** | **~295MB** |

---

## ✅ Checklist de Verificación

### Pre-Deploy

- [ ] Imágenes construidas correctamente
- [ ] Health checks funcionan (backend, frontend, mysql)
- [ ] Backend inicializa tablas automáticamente
- [ ] Frontend sirve correctamente en http://localhost
- [ ] API accesible en http://localhost:8000
- [ ] Proxy Nginx funciona (/api/ → backend)
- [ ] Volúmenes persistentes configurados
- [ ] Variables de entorno definidas

### Post-Deploy Azure

- [ ] ACR creado y configurado
- [ ] Imágenes pusheadas a ACR
- [ ] Container Instances creados
- [ ] DNS names configurados
- [ ] Variables de entorno producción configuradas
- [ ] Conexión a Azure MySQL funcionando
- [ ] Health checks Azure OK
- [ ] Logs accesibles en Azure Portal

---

## 📚 Referencias

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Multi-Stage Builds**: https://docs.docker.com/build/building/multi-stage/
- **Azure Container Registry**: https://docs.microsoft.com/azure/container-registry/
- **Azure Container Instances**: https://docs.microsoft.com/azure/container-instances/

---

**Documentación elaborada por**: Martina Becerra  
**Fecha**: 11 de noviembre de 2025  
**Materia**: Ingeniería de Software III - TP08  
**Universidad**: UCC
