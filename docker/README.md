# Dockerfiles - Sistema Repuestera

Este directorio contiene los Dockerfiles optimizados para contenerizar la aplicación Repuestera.

## 📁 Estructura

```
docker/
├── backend/
│   ├── Dockerfile           # Imagen del backend (Node.js + Express)
│   └── .dockerignore       # Archivos a excluir
└── frontend/
    ├── Dockerfile          # Imagen del frontend (React + Nginx)
    ├── nginx.conf          # Configuración de Nginx para SPA
    ├── env.sh              # Script para inyectar variables de entorno
    └── .dockerignore       # Archivos a excluir
```

## 🐳 Backend Dockerfile

### Características:
- **Base**: `node:20-alpine` (imagen ligera de Node.js 20)
- **Optimizaciones**:
  - Solo dependencias de producción (`npm ci --only=production`)
  - Usuario no privilegiado (`USER node`)
  - Health check incluido en `/api/health`
  - Multi-stage build para reducir tamaño
  
### Variables de Entorno:
| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Ambiente de ejecución | `production` |
| `PORT` | Puerto del servidor | `8000` |
| `DB_HOST` | Host de MySQL | (requerido) |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de BD | (requerido) |
| `DB_PASSWORD` | Contraseña de BD | (requerido) |
| `DB_NAME` | Nombre de la BD | (requerido) |

### Construcción:
```bash
# Desde la raíz del proyecto
docker build -f docker/backend/Dockerfile -t repuestera-backend:latest ./backend
```

### Ejecución Local:
```bash
docker run -p 8000:8000 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=repuestera \
  repuestera-backend:latest
```

### Health Check:
```bash
curl http://localhost:8000/api/health
# Respuesta esperada: {"status":"ok","timestamp":"..."}
```

---

## 🎨 Frontend Dockerfile

### Características:
- **Base**: `nginx:alpine` (servidor web ligero)
- **Optimizaciones**:
  - Configuración de Nginx para SPA (React Router)
  - Gzip compression habilitado
  - Cache para assets estáticos
  - Health check incluido
  - Variables de entorno inyectadas en runtime
  
### Variables de Entorno:
| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `REACT_APP_API_URL` | URL del backend | `http://localhost:8000` |
| `REACT_APP_ENV` | Ambiente | `production` |
| `API_URL` | URL para proxy de Nginx | (opcional) |

### Construcción:
```bash
# Desde la raíz del proyecto
# 1. Primero construir el frontend
cd frontend
npm run build

# 2. Construir la imagen Docker
docker build -f ../docker/frontend/Dockerfile -t repuestera-frontend:latest ./build
```

### Ejecución Local:
```bash
docker run -p 80:80 \
  -e REACT_APP_API_URL=http://localhost:8000 \
  -e REACT_APP_ENV=development \
  repuestera-frontend:latest
```

### Health Check:
```bash
curl http://localhost/
# Debería devolver el HTML de la aplicación React
```

---

## 🚀 Build Completo con Docker Compose (Opcional)

Para desarrollo local, podés usar Docker Compose:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=repuestera
    depends_on:
      - mysql

  frontend:
    build:
      context: ./frontend/build
      dockerfile: ../docker/frontend/Dockerfile
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=repuestera
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

---

## 🔍 Mejores Prácticas Implementadas

### Seguridad:
- ✅ Usuario no privilegiado (no root)
- ✅ Imagen base Alpine (menos superficie de ataque)
- ✅ .dockerignore para excluir archivos sensibles
- ✅ Health checks para monitoreo

### Optimización:
- ✅ Capas ordenadas de menos a más cambiantes
- ✅ Solo dependencias de producción
- ✅ Gzip compression en Nginx
- ✅ Cache de assets estáticos

### Operaciones:
- ✅ Health checks configurados
- ✅ Logs accesibles
- ✅ Variables de entorno configurables
- ✅ Graceful shutdown

---

## 📊 Tamaño de Imágenes

| Imagen | Tamaño Estimado | Notas |
|--------|----------------|-------|
| Backend | ~150-200 MB | Node.js Alpine + dependencias |
| Frontend | ~50-80 MB | Nginx Alpine + build de React |

---

## 🧪 Testing de las Imágenes

### Test de Backend:
```bash
# 1. Construir
docker build -f docker/backend/Dockerfile -t repuestera-backend:test ./backend

# 2. Ejecutar
docker run -d --name backend-test -p 8000:8000 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=repuestera \
  repuestera-backend:test

# 3. Verificar health
curl http://localhost:8000/api/health

# 4. Ver logs
docker logs backend-test

# 5. Limpiar
docker stop backend-test && docker rm backend-test
```

### Test de Frontend:
```bash
# 1. Construir frontend
cd frontend && npm run build

# 2. Construir imagen
docker build -f ../docker/frontend/Dockerfile -t repuestera-frontend:test ./build

# 3. Ejecutar
docker run -d --name frontend-test -p 3000:80 \
  -e REACT_APP_API_URL=http://localhost:8000 \
  repuestera-frontend:test

# 4. Verificar
curl http://localhost:3000/

# 5. Limpiar
docker stop frontend-test && docker rm frontend-test
```

---

## 🐛 Troubleshooting

### Backend no inicia:
```bash
# Ver logs
docker logs <container_id>

# Verificar variables de entorno
docker exec <container_id> env

# Conectar al contenedor
docker exec -it <container_id> sh
```

### Frontend no carga:
```bash
# Verificar que env-config.js se creó
docker exec <container_id> cat /usr/share/nginx/html/env-config.js

# Ver logs de Nginx
docker logs <container_id>

# Verificar configuración de Nginx
docker exec <container_id> nginx -t
```

### Problemas de conexión BD:
```bash
# Desde el contenedor, testear conexión
docker exec -it <container_id> sh
nc -zv mysql_host 3306
```

---

## 📝 Próximos Pasos

1. ✅ **Crear Azure Container Registry** para almacenar las imágenes
2. ✅ **Modificar azure-pipelines.yml** para build y push de imágenes
3. ✅ **Configurar Azure Container Instances** para QA
4. ✅ **Configurar Azure App Services** para PROD
5. ✅ **Implementar CD** automático desde ACR

---

## 🔗 Referencias

- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Nginx Docker Guide](https://docs.nginx.com/nginx/admin-guide/installing-nginx/installing-nginx-docker/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
