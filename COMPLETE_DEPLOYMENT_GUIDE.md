# 🚀 Guía Completa de Despliegue - Repuestera

## 📋 **Resumen de Configuración**

Esta aplicación está configurada para desplegarse en **dos ambientes** en Azure:
- **🧪 QA (Quality Assurance)** - Para testing y desarrollo
- **🚀 Producción** - Para usuarios finales

## 🏗️ **Arquitectura de la Solución**

### **Ambiente QA**
- **Resource Group**: `rg-repuestera-qa`
- **Backend API**: `repuestera-api.azurewebsites.net`
- **Frontend Web**: `repuestera-web.azurewebsites.net`
- **Base de Datos**: MySQL Flexible Server (`manufrias.mysql.database.azure.com`)

### **Ambiente Producción**
- **Resource Group**: `rg-repuestera-prod`
- **Backend API**: `repuestera-api.azurewebsites.net`
- **Frontend Web**: `repuestera-web.azurewebsites.net`
- **Base de Datos**: MySQL Flexible Server (mismo servidor, diferentes bases de datos)

## 📁 **Archivos de Configuración**

### **Pipeline de CI/CD**
- `azure-pipelines.yml` - Pipeline completo para QA y Producción

### **Templates ARM**
- `azure-infrastructure-qa.json` - Infraestructura para QA
- `azure-infrastructure.json` - Infraestructura para Producción
- `azure-infrastructure-qa-simple.json` - Template simplificado para QA

### **Scripts de Despliegue**
- `deploy-both-environments.sh` - Despliega ambos ambientes
- `deploy-prod-infrastructure.sh` - Solo Producción
- `deploy-qa-infrastructure.sh` - Solo QA

## 🔧 **Configuración de Base de Datos**

### **MySQL Flexible Server**
- **Servidor**: `manufrias.mysql.database.azure.com`
- **Usuario**: `A`
- **Contraseña**: `4286Pka1#`
- **Puerto**: `3306`
- **Base de datos QA**: `repuestera_db`
- **Base de datos Producción**: `repuestera_db` (misma base, diferentes ambientes)

### **Configuración de la Aplicación**
- **Tipo de DB**: `mysql` (configuración pura, sin híbrida)
- **Host**: `manufrias.mysql.database.azure.com`
- **Puerto**: `3306`
- **SSL**: Habilitado para Azure

## 🚀 **Proceso de Despliegue**

### **1. Despliegue Automático (Recomendado)**
```bash
# Hacer push al repositorio
git push azure main
```
- El pipeline se ejecuta automáticamente
- Despliega primero QA, luego Producción (con aprobación manual)

### **2. Despliegue Manual de Infraestructura**
```bash
# Desplegar ambos ambientes
./deploy-both-environments.sh

# O desplegar individualmente
./deploy-qa-infrastructure.sh
./deploy-prod-infrastructure.sh
```

## 🔐 **Variables de Entorno**

### **Backend (QA)**
```env
NODE_ENV=qa
PORT=8000
DB_TYPE=mysql
DB_HOST=manufrias.mysql.database.azure.com
DB_USER=A
DB_PASSWORD=4286Pka1#
DB_NAME=repuestera_db
DB_PORT=3306
JWT_SECRET=qa_jwt_secret_key_2024
JWT_EXPIRES_IN=24h
```

### **Backend (Producción)**
```env
NODE_ENV=production
PORT=8000
DB_TYPE=mysql
DB_HOST=manufrias.mysql.database.azure.com
DB_USER=A
DB_PASSWORD=4286Pka1#
DB_NAME=repuestera_db
DB_PORT=3306
JWT_SECRET=prod_jwt_secret_key_secure_2024
JWT_EXPIRES_IN=24h
```

### **Frontend (QA)**
```env
REACT_APP_API_URL=https://repuestera-api.azurewebsites.net/api
NODE_ENV=production
PORT=8080
```

### **Frontend (Producción)**
```env
REACT_APP_API_URL=https://repuestera-api.azurewebsites.net/api
NODE_ENV=production
PORT=8080
```

## 📦 **Dependencias**

### **Backend (package.json)**
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.6.5"
  }
}
```

### **Frontend (package.json)**
- React 18
- React Router
- Axios para API calls
- Bootstrap para UI

## 🔍 **Verificación Post-Despliegue**

### **1. Verificar Backend**
```bash
# Health check
curl https://repuestera-api.azurewebsites.net/api/health

# Verificar logs
az webapp log tail --resource-group rg-repuestera-qa --name repuestera-api
```

### **2. Verificar Frontend**
- Abrir `https://repuestera-web.azurewebsites.net`
- Verificar que carga correctamente
- Probar login de admin

### **3. Verificar Base de Datos**
```bash
# Verificar conexión
az mysql flexible-server show --resource-group rg-repuestera-qa --name manufrias
```

## 🛠️ **Troubleshooting**

### **Problemas Comunes**

1. **Error 500 en login de admin**
   - Verificar logs del backend
   - Verificar conexión a MySQL
   - Verificar variables de entorno

2. **Error de CORS**
   - Verificar configuración en `server.js`
   - Verificar URLs permitidas

3. **Error de conexión a MySQL**
   - Verificar reglas de firewall
   - Verificar credenciales
   - Verificar que el servidor esté activo

### **Comandos de Diagnóstico**
```bash
# Ver logs del backend
az webapp log tail --resource-group rg-repuestera-qa --name repuestera-api

# Verificar estado del App Service
az webapp show --resource-group rg-repuestera-qa --name repuestera-api

# Verificar variables de entorno
az webapp config appsettings list --resource-group rg-repuestera-qa --name repuestera-api
```

## 📞 **Soporte**

Para problemas o dudas:
1. Revisar logs de Azure
2. Verificar configuración de variables de entorno
3. Verificar conectividad de base de datos
4. Revisar documentación de Azure App Service

## 🎯 **Próximos Pasos**

1. **Monitoreo**: Configurar Application Insights
2. **Backup**: Configurar backup automático de MySQL
3. **Escalabilidad**: Configurar auto-scaling
4. **Seguridad**: Configurar SSL/TLS
5. **Testing**: Implementar tests automatizados
