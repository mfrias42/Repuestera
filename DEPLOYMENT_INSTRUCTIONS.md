# 🚀 Instrucciones de Despliegue - Repuestera

## Prerrequisitos

1. **Azure CLI instalado y configurado**
   ```bash
   # Instalar Azure CLI (si no está instalado)
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Iniciar sesión en Azure
   az login
   ```

2. **Permisos en Azure**
   - Contributor o Owner en la suscripción de Azure
   - Permisos para crear Resource Groups y recursos

## 📋 Orden de Despliegue

### Paso 1: Desplegar Infraestructura QA

```bash
# Ejecutar el script de despliegue QA
./deploy-qa-infrastructure.sh
```

**Recursos que se crearán:**
- Resource Group: `rg-repuestera`
- App Service Plan: `repuestera-mfrias-plan-qa`
- Backend API: `repuestera-mfrias-api-qa`
- Frontend Web: `repuestera-mfrias-web-qa`
- MySQL Server: `repuestera-mfrias-qa-server`
- MySQL Database: `repuestera_qa`
- Application Insights: `repuestera-mfrias-insights-qa`

### Paso 2: Ejecutar Pipeline de Azure DevOps

1. Hacer commit y push de los cambios al repositorio de Azure DevOps
2. El pipeline se ejecutará automáticamente y desplegará las aplicaciones en QA
3. Verificar que el despliegue QA sea exitoso

### Paso 3: Desplegar Infraestructura de Producción

```bash
# Ejecutar el script de despliegue de Producción
./deploy-prod-infrastructure.sh
```

**Recursos que se crearán:**
- App Service Plan: `repuestera-mfrias-plan`
- Backend API: `repuestera-mfrias-api`
- Frontend Web: `repuestera-mfrias-web`
- MySQL Server: `repuestera-mfrias-server`
- MySQL Database: `repuestera`
- Application Insights: `repuestera-mfrias-insights`

### Paso 4: Aprobar Despliegue a Producción

1. El pipeline pausará antes del despliegue a producción
2. Revisar los cambios en QA
3. Aprobar manualmente el despliegue a producción en Azure DevOps

## 🔐 Configuración de Seguridad

### Contraseñas MySQL
- **QA**: Se solicitará durante el despliegue
- **Producción**: Se solicitará durante el despliegue
- **Requisitos**: Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números

### Variables de Entorno
Las siguientes variables se configuran automáticamente en Azure:

**QA:**
- `DB_HOST`: `repuestera-mfrias-qa-server.mysql.database.azure.com`
- `DB_USER`: `repuestera_admin`
- `DB_PASSWORD`: [Configurada durante el despliegue]
- `DB_NAME`: `repuestera_qa`
- `DB_PORT`: `3306`

**Producción:**
- `DB_HOST`: `repuestera-mfrias-server.mysql.database.azure.com`
- `DB_USER`: `repuestera_admin`
- `DB_PASSWORD`: [Configurada durante el despliegue]
- `DB_NAME`: `repuestera`
- `DB_PORT`: `3306`

## 🌐 URLs de Acceso

### QA
- **Frontend**: `https://repuestera-mfrias-web-qa.azurewebsites.net`
- **Backend API**: `https://repuestera-mfrias-api-qa.azurewebsites.net/api`

### Producción
- **Frontend**: `https://repuestera-mfrias-web.azurewebsites.net`
- **Backend API**: `https://repuestera-mfrias-api.azurewebsites.net/api`

## 🔍 Verificación del Despliegue

### 1. Verificar Infraestructura
```bash
# Listar recursos creados
az resource list --resource-group rg-repuestera --output table
```

### 2. Verificar Aplicaciones
- Acceder a las URLs del frontend
- Probar la funcionalidad de búsqueda de productos
- Verificar que la API responde correctamente

### 3. Verificar Base de Datos
- Las bases de datos se inicializan automáticamente con datos de ejemplo
- Los scripts de inicialización se ejecutan durante el despliegue

## 🚨 Solución de Problemas

### Error: "Resource group not found"
```bash
# Crear el resource group manualmente
az group create --name rg-repuestera --location "Brazil South"
```

### Error: "MySQL server name already exists"
- Los nombres de servidores MySQL deben ser únicos globalmente
- Modificar el prefijo en los templates si es necesario

### Error: "Deployment failed"
```bash
# Ver detalles del error
az deployment group show --resource-group rg-repuestera --name [deployment-name]
```

### Pipeline falla en inicialización de BD
- Verificar que los servidores MySQL estén ejecutándose
- Verificar las reglas de firewall (deben permitir servicios de Azure)
- Verificar las credenciales de conexión

## 📞 Soporte

Para problemas con el despliegue:
1. Revisar los logs del pipeline en Azure DevOps
2. Verificar los logs de Application Insights
3. Consultar la documentación de Azure MySQL Flexible Server

## 🔄 Rollback

En caso de necesitar hacer rollback:
1. Usar la funcionalidad de slots de Azure App Service
2. O redesplegar una versión anterior desde Azure DevOps
3. Para la base de datos, usar los backups automáticos de Azure MySQL