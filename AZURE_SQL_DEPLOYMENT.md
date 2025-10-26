# 🗄️ Despliegue con Azure SQL Database - Repuestera

## 🎯 **Configuración Híbrida: Desarrollo + Producción**

La aplicación ahora soporta **dos configuraciones de base de datos**:

- **🔧 Desarrollo Local**: SQLite (rápido y simple)
- **☁️ Producción Azure**: Azure SQL Database (robusto y escalable)

## 📊 **Comparación de Opciones**

| Característica | SQLite | Azure SQL Database |
|----------------|--------|-------------------|
| **Costo** | 🟢 Gratuito | 🟡 ~$5/mes (Basic) |
| **Rendimiento** | 🟢 Muy rápido (local) | 🟢 Rápido (optimizado) |
| **Escalabilidad** | 🔴 Limitada | 🟢 Alta |
| **Concurrencia** | 🔴 Baja | 🟢 Alta |
| **Backup** | 🔴 Manual | 🟢 Automático |
| **Seguridad** | 🟡 Básica | 🟢 Enterprise |
| **Mantenimiento** | 🟢 Cero | 🟢 Cero (administrado) |

## 🚀 **Despliegue con Azure SQL Database**

### **Paso 1: Desplegar Infraestructura**

```bash
# Ejecutar script de despliegue con Azure SQL
./deploy-azure-sql.sh
```

**Recursos que se crearán:**
- App Service Plan: `repuestera-mfrias-plan`
- Backend API: `repuestera-mfrias-api`
- Frontend Web: `repuestera-mfrias-web`
- Azure SQL Server: `repuestera-mfrias-sql-server`
- Azure SQL Database: `repuestera_db`
- Application Insights: `repuestera-mfrias-insights`

### **Paso 2: Configurar Variables de Entorno**

El template ARM configura automáticamente estas variables:

```env
# Backend (Azure App Service)
NODE_ENV=production
DB_TYPE=sqlserver
DB_HOST=repuestera-mfrias-sql-server.database.windows.net
DB_USER=repuestera_admin
DB_PASSWORD=[tu_contraseña]
DB_NAME=repuestera_db
DB_PORT=1433
```

### **Paso 3: Verificar Despliegue**

```bash
# Verificar recursos creados
az resource list --resource-group rg-repuestera-sql --output table

# Verificar conexión a Azure SQL
az sql db show --resource-group rg-repuestera-sql --server repuestera-mfrias-sql-server --name repuestera_db
```

## 🔧 **Configuración Híbrida del Backend**

### **Desarrollo Local (SQLite)**
```bash
# Variables de entorno para desarrollo
DB_TYPE=sqlite
# No se requieren más variables para SQLite
```

### **Producción Azure (SQL Server)**
```bash
# Variables de entorno para producción
DB_TYPE=sqlserver
DB_HOST=repuestera-mfrias-sql-server.database.windows.net
DB_USER=repuestera_admin
DB_PASSWORD=tu_contraseña_segura
DB_NAME=repuestera_db
DB_PORT=1433
```

## 📋 **Estructura de Archivos**

```
backend/config/
├── database.js              # Configuración híbrida
├── database-sqlite.js        # Implementación SQLite
└── database-sqlserver.js    # Implementación Azure SQL
```

## 🌐 **URLs de Acceso**

Después del despliegue exitoso:

- **Frontend**: `https://repuestera-mfrias-web.azurewebsites.net`
- **Backend API**: `https://repuestera-mfrias-api.azurewebsites.net/api`
- **Health Check**: `https://repuestera-mfrias-api.azurewebsites.net/api/health`

## 💰 **Costos Estimados**

### **Azure SQL Database**
- **Basic**: ~$5/mes (5 DTU, 2GB)
- **S0**: ~$15/mes (10 DTU, 250GB)
- **S1**: ~$30/mes (20 DTU, 250GB)

### **App Service**
- **F1**: Gratuito (con limitaciones)
- **B1**: ~$13/mes (1 core, 1.75GB RAM)

### **Total Estimado**
- **Básico**: ~$5/mes (SQL Basic + App F1)
- **Estándar**: ~$28/mes (SQL S0 + App B1)

## 🔍 **Ventajas de Azure SQL Database**

### **1. Escalabilidad**
- Auto-scaling basado en demanda
- Escalar verticalmente (más DTU)
- Escalar horizontalmente (más réplicas)

### **2. Seguridad**
- Encriptación en tránsito y en reposo
- Firewall configurado automáticamente
- Autenticación integrada con Azure AD

### **3. Backup y Recuperación**
- Backup automático cada 5 minutos
- Point-in-time recovery
- Retención de backup hasta 35 días

### **4. Monitoreo**
- Métricas de rendimiento en tiempo real
- Alertas automáticas
- Logs de auditoría

## 🛠️ **Comandos Útiles**

### **Verificar Estado de Azure SQL**
```bash
# Ver información del servidor
az sql server show --resource-group rg-repuestera-sql --name repuestera-mfrias-sql-server

# Ver información de la base de datos
az sql db show --resource-group rg-repuestera-sql --server repuestera-mfrias-sql-server --name repuestera_db

# Ver métricas de rendimiento
az monitor metrics list --resource /subscriptions/{subscription-id}/resourceGroups/rg-repuestera-sql/providers/Microsoft.Sql/servers/repuestera-mfrias-sql-server/databases/repuestera_db
```

### **Conectar a Azure SQL desde Local**
```bash
# Instalar Azure CLI si no está instalado
# Conectar usando sqlcmd
sqlcmd -S repuestera-mfrias-sql-server.database.windows.net -d repuestera_db -U repuestera_admin -P tu_contraseña
```

### **Backup Manual**
```bash
# Crear backup manual
az sql db export --resource-group rg-repuestera-sql --server repuestera-mfrias-sql-server --name repuestera_db --storage-key-type StorageAccessKey --storage-uri https://tu-storage-account.blob.core.windows.net/backups/repuestera-backup.bacpac --storage-key tu-storage-key --administrator-login repuestera_admin --administrator-login-password tu_contraseña
```

## 🚨 **Solución de Problemas**

### **Error: "Login failed for user"**
- Verificar credenciales en variables de entorno
- Confirmar que el usuario existe en Azure SQL
- Verificar firewall rules

### **Error: "Connection timeout"**
- Verificar que el servidor Azure SQL esté ejecutándose
- Revisar configuración de firewall
- Verificar conectividad de red

### **Error: "Database not found"**
- Verificar que la base de datos existe
- Confirmar el nombre de la base de datos
- Revisar permisos del usuario

## 📈 **Monitoreo y Alertas**

### **Métricas Importantes**
- **DTU Usage**: Uso de recursos de base de datos
- **Connection Count**: Número de conexiones activas
- **Query Performance**: Tiempo de respuesta de queries
- **Storage Usage**: Uso de almacenamiento

### **Configurar Alertas**
```bash
# Crear alerta para DTU usage alto
az monitor metrics alert create \
  --name "High DTU Usage" \
  --resource-group rg-repuestera-sql \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-repuestera-sql/providers/Microsoft.Sql/servers/repuestera-mfrias-sql-server/databases/repuestera_db \
  --condition "avg dtu_consumption_percent > 80" \
  --description "Alert when DTU usage exceeds 80%"
```

## 🔄 **Migración de Datos**

### **Desde SQLite a Azure SQL**
```bash
# 1. Exportar datos de SQLite
sqlite3 backend/data/repuestera.db .dump > backup.sql

# 2. Convertir queries SQLite a SQL Server
# (Algunas diferencias de sintaxis)

# 3. Importar a Azure SQL
# Usar Azure Data Studio o sqlcmd
```

## 🎯 **Recomendaciones**

### **Para Desarrollo**
- Usar SQLite local para desarrollo rápido
- Cambiar a Azure SQL solo para testing de integración

### **Para Producción**
- Usar Azure SQL Database para mejor rendimiento
- Configurar backup automático
- Implementar monitoreo y alertas

### **Para Escalabilidad**
- Empezar con Basic tier
- Escalar a S0/S1 según demanda
- Considerar Azure SQL Managed Instance para mayor control

## 📞 **Soporte**

Para problemas con Azure SQL Database:
1. Revisar logs de Azure SQL en el portal
2. Verificar métricas de rendimiento
3. Consultar documentación de Azure SQL Database
4. Usar Azure Support si es necesario

---

**Estado**: ✅ Listo para despliegue con Azure SQL Database
**Complejidad**: 🟡 Media (configuración de base de datos)
**Costo**: 🟡 ~$5-30/mes (según tier)
**Escalabilidad**: 🟢 Alta
