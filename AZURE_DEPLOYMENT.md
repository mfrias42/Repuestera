# Despliegue en Azure - Repuestera

Esta guía detalla cómo desplegar la aplicación Repuestera en Azure App Service usando Azure DevOps.

## Prerrequisitos

### 1. Recursos de Azure
- Suscripción de Azure activa
- Grupo de recursos creado
- Azure DevOps organization y proyecto

### 2. Configuración de Base de Datos
- Azure Database for MySQL o SQL Server
- Configurar las variables de entorno de conexión

## Configuración Inicial

### 1. Crear Infraestructura con ARM Template

```bash
# Desplegar infraestructura usando Azure CLI
az deployment group create \
  --resource-group rg-repuestera \
  --template-file azure-infrastructure.json \
  --parameters appNamePrefix=repuestera sku=B1
```

### 2. Configurar Service Connection en Azure DevOps

1. Ve a **Project Settings** > **Service connections**
2. Crea una nueva **Azure Resource Manager** connection
3. Nombra la conexión como `Azure-Service-Connection`
4. Selecciona tu suscripción y grupo de recursos

### 3. Configurar Variables en Azure DevOps

En tu pipeline, configura estas variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `azureSubscription` | `Azure-Service-Connection` | Nombre de la service connection |
| `webAppNameBackend` | `repuestera-api` | Nombre del App Service para API |
| `webAppNameFrontend` | `repuestera-web` | Nombre del App Service para Web |
| `resourceGroupName` | `rg-repuestera` | Nombre del grupo de recursos |

## Variables de Entorno

### Backend (Azure App Service Settings)

```bash
NODE_ENV=production
PORT=8000
DB_HOST=tu-servidor-mysql.mysql.database.azure.com
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=repuestera
JWT_SECRET=tu-jwt-secret-super-seguro
CORS_ORIGIN=https://repuestera-web.azurewebsites.net
```

### Frontend (Build Variables)

```bash
REACT_APP_API_URL=https://repuestera-api.azurewebsites.net/api
NODE_ENV=production
```

## Proceso de Despliegue

### 1. Pipeline Automático

El archivo `azure-pipelines.yml` configura un pipeline que:

1. **Build Stage:**
   - Construye el backend y ejecuta pruebas
   - Construye el frontend con variables de producción
   - Genera artefactos comprimidos

2. **Deploy Stage:**
   - Despliega el backend a Azure App Service
   - Despliega el frontend a Azure App Service
   - Configura variables de entorno automáticamente

### 2. Despliegue Manual

Si prefieres desplegar manualmente:

#### Backend:
```bash
# Comprimir archivos del backend
cd backend
zip -r backend.zip . -x "node_modules/*" ".env"

# Desplegar usando Azure CLI
az webapp deployment source config-zip \
  --resource-group rg-repuestera \
  --name repuestera-api \
  --src backend.zip
```

#### Frontend:
```bash
# Construir frontend
cd frontend
npm run build

# Copiar azure-package.json al build
cp azure-package.json build/package.json

# Comprimir build
cd build
zip -r frontend.zip .

# Desplegar
az webapp deployment source config-zip \
  --resource-group rg-repuestera \
  --name repuestera-web \
  --src frontend.zip
```

## Configuración de Base de Datos

### 1. Azure Database for MySQL

```bash
# Crear servidor MySQL
az mysql server create \
  --resource-group rg-repuestera \
  --name repuestera-mysql \
  --admin-user adminuser \
  --admin-password TuPassword123! \
  --sku-name B_Gen5_1

# Crear base de datos
az mysql db create \
  --resource-group rg-repuestera \
  --server-name repuestera-mysql \
  --name repuestera
```

### 2. Configurar Firewall

```bash
# Permitir servicios de Azure
az mysql server firewall-rule create \
  --resource-group rg-repuestera \
  --server repuestera-mysql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Monitoreo y Logs

### 1. Application Insights

El template ARM configura automáticamente Application Insights para:
- Monitoreo de rendimiento
- Tracking de errores
- Métricas de uso

### 2. Logs de App Service

```bash
# Habilitar logs
az webapp log config \
  --resource-group rg-repuestera \
  --name repuestera-api \
  --application-logging filesystem \
  --level information

# Ver logs en tiempo real
az webapp log tail \
  --resource-group rg-repuestera \
  --name repuestera-api
```

## Dominios Personalizados

### 1. Configurar Dominio

```bash
# Agregar dominio personalizado
az webapp config hostname add \
  --resource-group rg-repuestera \
  --webapp-name repuestera-web \
  --hostname tu-dominio.com
```

### 2. Certificado SSL

```bash
# Crear certificado SSL gratuito
az webapp config ssl create \
  --resource-group rg-repuestera \
  --name repuestera-web \
  --hostname tu-dominio.com
```

## Escalado

### 1. Escalado Manual

```bash
# Cambiar plan de App Service
az appservice plan update \
  --resource-group rg-repuestera \
  --name repuestera-plan \
  --sku S1
```

### 2. Auto-escalado

Configura reglas de auto-escalado basadas en:
- CPU usage
- Memory usage
- Request count

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos:**
   - Verificar firewall rules
   - Confirmar connection string
   - Revisar variables de entorno

2. **Frontend no carga:**
   - Verificar que serve esté instalado
   - Confirmar REACT_APP_API_URL
   - Revisar CORS en backend

3. **Pipeline falla:**
   - Verificar service connection
   - Confirmar nombres de recursos
   - Revisar permisos de Azure DevOps

### Comandos Útiles

```bash
# Ver estado de App Services
az webapp show --resource-group rg-repuestera --name repuestera-api

# Reiniciar App Service
az webapp restart --resource-group rg-repuestera --name repuestera-api

# Ver configuración
az webapp config appsettings list --resource-group rg-repuestera --name repuestera-api
```

## URLs de Producción

Después del despliegue exitoso:

- **Frontend:** https://repuestera-web.azurewebsites.net
- **API Backend:** https://repuestera-api.azurewebsites.net/api
- **Application Insights:** Portal de Azure > repuestera-insights

## Seguridad

### Configuraciones Implementadas

1. **HTTPS Only:** Forzado en ambos App Services
2. **Security Headers:** Configurados en web.config
3. **CORS:** Configurado para permitir solo el frontend
4. **TLS 1.2:** Versión mínima requerida
5. **Variables de Entorno:** Secrets almacenados de forma segura

### Recomendaciones Adicionales

- Usar Azure Key Vault para secrets sensibles
- Implementar Azure Front Door para CDN
- Configurar Azure Security Center
- Habilitar Azure Defender para App Service