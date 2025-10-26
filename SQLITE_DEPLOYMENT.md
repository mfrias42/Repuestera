# 🚀 Despliegue SQLite - Repuestera

## ✅ **Migración Completada: MySQL → SQLite**

La aplicación Repuestera ha sido completamente migrada de MySQL a SQLite para simplificar el despliegue en Azure.

## 📋 **Cambios Realizados**

### 1. **Backend Actualizado**
- ✅ Configuración SQLite en `backend/config/database-sqlite.js`
- ✅ Modelos actualizados para SQLite
- ✅ Variables de entorno configuradas
- ✅ Base de datos local funcionando

### 2. **Templates ARM Simplificados**
- ✅ Removidos todos los recursos de MySQL
- ✅ Configurados solo App Services
- ✅ Variables de entorno para SQLite
- ✅ SKU F1 (gratuito) por defecto

### 3. **Pipeline Azure DevOps Actualizado**
- ✅ Variables de entorno para SQLite
- ✅ Comandos de inicialización simplificados
- ✅ Sin dependencias de MySQL

## 🚀 **Despliegue Rápido**

### **Opción 1: Script Automatizado (Recomendado)**

```bash
# Ejecutar script de despliegue SQLite
./deploy-sqlite-infrastructure.sh
```

### **Opción 2: Comando Manual**

```bash
# Crear resource group
az group create --name rg-repuestera-sqlite --location "East US"

# Desplegar infraestructura
az deployment group create \
  --resource-group rg-repuestera-sqlite \
  --template-file azure-infrastructure-qa-simple.json \
  --verbose
```

## 📊 **Recursos Creados**

- **App Service Plan**: `repuestera-mfrias-plan-qa` (F1 - Gratuito)
- **Backend API**: `repuestera-mfrias-qa-api`
- **Frontend Web**: `repuestera-mfrias-qa-web`
- **Base de datos**: SQLite (archivo local en `/home/data/`)

## 🌐 **URLs de Acceso**

Después del despliegue exitoso:

- **Frontend**: `https://repuestera-mfrias-qa-web.azurewebsites.net`
- **Backend API**: `https://repuestera-mfrias-qa-api.azurewebsites.net/api`
- **Health Check**: `https://repuestera-mfrias-qa-api.azurewebsites.net/api/health`

## ⚙️ **Variables de Entorno Configuradas**

### Backend (Azure App Service)
```env
NODE_ENV=production
PORT=8080
DB_TYPE=sqlite
DB_PATH=/home/data/repuestera_qa.db
JWT_SECRET=tu_jwt_secret_super_seguro_para_produccion_2024
JWT_REFRESH_SECRET=tu_jwt_refresh_secret_super_seguro_para_produccion_2024
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Frontend (Build Variables)
```env
REACT_APP_API_URL=https://repuestera-mfrias-qa-api.azurewebsites.net/api
NODE_ENV=production
```

## 🔧 **Ventajas de SQLite**

1. **Simplicidad**: Sin configuración de base de datos externa
2. **Costo**: Gratuito (no requiere Azure Database)
3. **Rendimiento**: Base de datos local, muy rápida
4. **Mantenimiento**: Sin administración de servidor
5. **Portabilidad**: Archivo de base de datos único

## ⚠️ **Limitaciones de SQLite**

1. **Concurrencia**: Limitada para aplicaciones de alta concurrencia
2. **Escalabilidad**: No se puede escalar horizontalmente
3. **Backup**: Requiere backup manual del archivo
4. **Tamaño**: Limitado a ~281 TB (suficiente para la mayoría de casos)

## 🔄 **Pipeline de Azure DevOps**

El pipeline se ejecuta automáticamente y:

1. **Build Stage**:
   - Construye el backend con SQLite
   - Construye el frontend con variables de producción
   - Genera artefactos comprimidos

2. **Deploy Stage**:
   - Despliega backend a Azure App Service
   - Despliega frontend a Azure App Service
   - Inicializa SQLite automáticamente

## 🛠️ **Comandos Útiles**

### Verificar Estado
```bash
# Ver recursos creados
az resource list --resource-group rg-repuestera-sqlite --output table

# Ver logs del backend
az webapp log tail --resource-group rg-repuestera-sqlite --name repuestera-mfrias-qa-api

# Ver configuración
az webapp config appsettings list --resource-group rg-repuestera-sqlite --name repuestera-mfrias-qa-api
```

### Reiniciar Aplicaciones
```bash
# Reiniciar backend
az webapp restart --resource-group rg-repuestera-sqlite --name repuestera-mfrias-qa-api

# Reiniciar frontend
az webapp restart --resource-group rg-repuestera-sqlite --name repuestera-mfrias-qa-web
```

## 🔍 **Verificación del Despliegue**

1. **Health Check**: Visitar `/api/health` en el backend
2. **Frontend**: Verificar que carga correctamente
3. **API**: Probar endpoints de productos y autenticación
4. **Base de datos**: Verificar que SQLite se inicializa correctamente

## 🚨 **Solución de Problemas**

### Error: "Database not found"
- Verificar que el directorio `/home/data` existe
- Revisar permisos de escritura
- Verificar variables de entorno

### Error: "CORS not allowed"
- Verificar configuración de CORS en el backend
- Revisar URLs permitidas en `server.js`

### Error: "App not starting"
- Revisar logs de Azure App Service
- Verificar que todas las dependencias están instaladas
- Comprobar variables de entorno

## 📈 **Monitoreo**

- **Application Insights**: Configurado automáticamente
- **Logs**: Disponibles en Azure Portal
- **Métricas**: CPU, memoria, requests

## 🎯 **Próximos Pasos**

1. **Desplegar infraestructura**: Ejecutar script de despliegue
2. **Configurar pipeline**: Conectar con Azure DevOps
3. **Probar aplicación**: Verificar funcionalidad completa
4. **Configurar dominio**: Opcional, para producción

## 💡 **Recomendaciones**

- **Desarrollo**: Usar SQLite local para desarrollo
- **Producción**: Considerar migrar a PostgreSQL/MySQL para alta concurrencia
- **Backup**: Implementar backup automático del archivo SQLite
- **Monitoreo**: Configurar alertas en Application Insights

---

**Estado**: ✅ Listo para despliegue con SQLite
**Complejidad**: 🟢 Baja (sin base de datos externa)
**Costo**: 🟢 Gratuito (F1 tier)
