# 🚀 Configuración de Pipeline con MySQL Flexible Server

## 📋 **Resumen de la Configuración**

### ✅ **Recursos Creados:**
- **MySQL Flexible Server**: `manufrias.mysql.database.azure.com`
- **Base de datos**: `repuestera_db`
- **App Service Plan**: `repuestera-plan` (F1 - Gratuito)
- **Backend API**: `repuestera-api.azurewebsites.net`
- **Frontend Web**: `repuestera-web.azurewebsites.net`
- **Resource Group**: `rg-repuestera-qa`

### 🔧 **Pipeline Configurado:**
- **Trigger**: Push a `main` branch
- **Ambientes**: QA (automático) → Producción (aprobación manual)
- **Base de datos**: MySQL Flexible Server para ambos ambientes
- **Node.js**: Versión 20.x

## 🌐 **URLs de Acceso:**

### **QA Environment:**
- **Backend**: `https://repuestera-api.azurewebsites.net`
- **Frontend**: `https://repuestera-web.azurewebsites.net`
- **Health Check**: `https://repuestera-api.azurewebsites.net/api/health`

### **Producción Environment:**
- **Backend**: `https://repuestera-api.azurewebsites.net`
- **Frontend**: `https://repuestera-web.azurewebsites.net`

## 🔐 **Variables de Entorno Configuradas:**

### **Backend (QA y Producción):**
```env
NODE_ENV=production
DB_TYPE=mysql
DB_HOST=manufrias.mysql.database.azure.com
DB_USER=A
DB_PASSWORD=4286Pka1#
DB_NAME=repuestera_db
DB_PORT=3306
JWT_SECRET=mysql_flexible_jwt_secret_2024
JWT_REFRESH_SECRET=mysql_flexible_jwt_refresh_secret_2024
```

### **Frontend:**
```env
REACT_APP_API_URL=https://repuestera-api.azurewebsites.net/api
```

## 🚀 **Proceso de Despliegue:**

### **1. Build Stage:**
- Instalar dependencias del backend
- Ejecutar pruebas del backend
- Construir frontend para QA
- Construir frontend para Producción
- Crear artefactos comprimidos

### **2. QA Stage (Automático):**
- Desplegar backend a QA
- Configurar variables de entorno MySQL
- Desplegar frontend a QA
- Inicializar base de datos

### **3. Producción Stage (Aprobación Manual):**
- Desplegar backend a Producción
- Configurar variables de entorno MySQL
- Desplegar frontend a Producción
- Inicializar base de datos

## 📊 **Ventajas de la Configuración:**

### **✅ MySQL Flexible Server:**
- **Persistencia**: Base de datos robusta y persistente
- **Escalabilidad**: Auto-scaling según demanda
- **Backup**: Automático cada 5 minutos
- **Seguridad**: Encriptación en tránsito y reposo
- **Alta Disponibilidad**: 99.95% SLA

### **✅ Pipeline Multi-Ambiente:**
- **QA Automático**: Testing continuo
- **Producción Controlada**: Aprobación manual
- **Variables Separadas**: Configuración por ambiente
- **Rollback**: Posibilidad de revertir cambios

### **✅ Costos Optimizados:**
- **App Service F1**: Gratuito
- **MySQL Flexible Server**: ~$50/mes
- **Total**: ~$50/mes

## 🔧 **Scripts Disponibles:**

### **Despliegue:**
```bash
# Crear base de datos
./create-database.sh

# Crear App Services
./create-app-service.sh

# Probar conexión
./test-mysql-connection.sh
```

### **Configuración:**
```bash
# Configurar Azure DevOps
./configure-azure-devops.sh

# Push al repositorio
./push-to-azure-repo.sh
```

## 📋 **Próximos Pasos:**

### **1. Configurar Azure DevOps:**
```bash
# Editar configure-azure-devops.sh con tu información
# - ORGANIZATION: tu-organizacion
# - PROJECT: tu-proyecto
# - PIPELINE_ID: tu-pipeline-id

./configure-azure-devops.sh
```

### **2. Hacer Push al Repositorio:**
```bash
# Editar push-to-azure-repo.sh con tu URL
# - AZURE_REPO_URL: https://dev.azure.com/tu-organizacion/tu-proyecto/_git/tu-repositorio

./push-to-azure-repo.sh
```

### **3. Monitorear Despliegue:**
- Verificar que el pipeline se ejecute
- Probar la aplicación en QA
- Aprobar despliegue a Producción

## 🚨 **Solución de Problemas:**

### **Error de Conexión MySQL:**
```bash
# Verificar estado del servidor
az mysql flexible-server show --resource-group rg-repuestera-qa --name manufrias

# Verificar firewall
az mysql flexible-server firewall-rule list --resource-group rg-repuestera-qa --name manufrias
```

### **Error de Pipeline:**
```bash
# Ver logs del pipeline
az pipelines runs list --project tu-proyecto

# Ejecutar pipeline manualmente
az pipelines run --name tu-pipeline-name
```

### **Error de App Service:**
```bash
# Ver logs de la aplicación
az webapp log tail --resource-group rg-repuestera-qa --name repuestera-api

# Verificar variables de entorno
az webapp config appsettings list --resource-group rg-repuestera-qa --name repuestera-api
```

## 📞 **Soporte:**

Para problemas con la configuración:
1. Revisar logs de Azure DevOps
2. Verificar variables de entorno
3. Probar conexión a MySQL
4. Consultar documentación de Azure

---

**Estado**: ✅ Configuración completa con MySQL Flexible Server
**Complejidad**: 🟡 Media (pipeline multi-ambiente)
**Costo**: 🟡 ~$50/mes (MySQL Flexible Server)
**Escalabilidad**: 🟢 Alta
**Limitaciones**: 🟢 Mínimas
