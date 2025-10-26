# 🗄️ Despliegue con Azure Database for MySQL Flexible Server

## 🎯 **Solución Perfecta para Azure for Students**

Azure Database for MySQL Flexible Server es la **solución ideal** para tu proyecto porque:

- ✅ **Sin limitaciones de región** como App Service
- ✅ **Más económico** que MySQL tradicional
- ✅ **Backup automático** incluido
- ✅ **Escalabilidad automática**
- ✅ **Seguridad enterprise**

## 🚀 **Despliegue Rápido**

### **Paso 1: Desplegar Infraestructura**
```bash
# Hacer ejecutable el script
chmod +x deploy-mysql-flexible.sh

# Ejecutar despliegue
./deploy-mysql-flexible.sh
```

**Recursos que se crearán:**
- App Service Plan: `repuestera-mfrias-plan`
- Backend API: `repuestera-mfrias-api`
- Frontend Web: `repuestera-mfrias-web`
- MySQL Flexible Server: `repuestera-mfrias-mysql-server`
- MySQL Database: `repuestera_db`
- Application Insights: `repuestera-mfrias-insights`

### **Paso 2: Configurar Variables de Entorno**

El template ARM configura automáticamente:

```env
# Backend (Azure App Service)
NODE_ENV=production
DB_TYPE=mysql
DB_HOST=repuestera-mfrias-mysql-server.mysql.database.azure.com
DB_USER=repuestera_admin
DB_PASSWORD=[tu_contraseña]
DB_NAME=repuestera_db
DB_PORT=3306
```

## 📊 **Ventajas vs SQLite**

| Aspecto | SQLite | MySQL Flexible Server |
|---------|--------|----------------------|
| **Persistencia** | 🔴 Se pierde en reinicio | 🟢 Persistente |
| **Concurrencia** | 🔴 Limitada | 🟢 Alta |
| **Escalabilidad** | 🔴 No escalable | 🟢 Auto-escalable |
| **Backup** | 🔴 Manual | 🟢 Automático |
| **Seguridad** | 🟡 Básica | 🟢 Enterprise |
| **Costo** | 🟢 Gratuito | 🟡 ~$12/mes |

## 💰 **Costos Estimados**

### **Azure Database for MySQL Flexible Server**
- **B1ms**: ~$12/mes (1 vCore, 2GB RAM, 20GB storage)
- **B2s**: ~$24/mes (2 vCores, 4GB RAM, 20GB storage)
- **B2ms**: ~$48/mes (2 vCores, 8GB RAM, 20GB storage)

### **App Service**
- **F1**: Gratuito (con limitaciones)
- **B1**: ~$13/mes (1 core, 1.75GB RAM)

### **Total Estimado**
- **Básico**: ~$12/mes (MySQL B1ms + App F1)
- **Estándar**: ~$25/mes (MySQL B1ms + App B1)

## 🔧 **Configuración del Backend**

### **Desarrollo Local (SQLite)**
```env
DB_TYPE=sqlite
# No se requieren más variables
```

### **Producción Azure (MySQL)**
```env
DB_TYPE=mysql
DB_HOST=repuestera-mfrias-mysql-server.mysql.database.azure.com
DB_USER=repuestera_admin
DB_PASSWORD=tu_contraseña_segura
DB_NAME=repuestera_db
DB_PORT=3306
```

## 🌐 **URLs de Acceso**

Después del despliegue exitoso:

- **Frontend**: `https://repuestera-mfrias-web.azurewebsites.net`
- **Backend API**: `https://repuestera-mfrias-api.azurewebsites.net/api`
- **Health Check**: `https://repuestera-mfrias-api.azurewebsites.net/api/health`

## 🛠️ **Comandos Útiles**

### **Verificar Estado de MySQL**
```bash
# Ver información del servidor
az mysql flexible-server show --resource-group rg-repuestera-mysql --name repuestera-mfrias-mysql-server

# Ver información de la base de datos
az mysql flexible-server db show --resource-group rg-repuestera-mysql --server-name repuestera-mfrias-mysql-server --database-name repuestera_db

# Ver métricas de rendimiento
az monitor metrics list --resource /subscriptions/{subscription-id}/resourceGroups/rg-repuestera-mysql/providers/Microsoft.DBforMySQL/flexibleServers/repuestera-mfrias-mysql-server
```

### **Conectar a MySQL desde Local**
```bash
# Instalar MySQL client si no está instalado
# Conectar usando mysql client
mysql -h repuestera-mfrias-mysql-server.mysql.database.azure.com -u repuestera_admin -p repuestera_db
```

### **Backup Manual**
```bash
# Crear backup manual
az mysql flexible-server backup create --resource-group rg-repuestera-mysql --name repuestera-mfrias-mysql-server --backup-name repuestera-backup-$(date +%Y%m%d)
```

## 🔍 **Ventajas de MySQL Flexible Server**

### **1. Sin Limitaciones de Región**
- ✅ **Más flexible** que App Service
- ✅ **Disponible en más regiones**
- ✅ **Mejor compatibilidad** con Azure for Students

### **2. Backup y Recuperación**
- ✅ **Backup automático** cada 5 minutos
- ✅ **Point-in-time recovery**
- ✅ **Retención de backup** hasta 35 días

### **3. Escalabilidad**
- ✅ **Auto-scaling** basado en demanda
- ✅ **Escalar verticalmente** (más vCores)
- ✅ **Escalar horizontalmente** (más réplicas)

### **4. Seguridad**
- ✅ **Encriptación en tránsito** y en reposo
- ✅ **Firewall configurado** automáticamente
- ✅ **Autenticación integrada** con Azure AD

## 🚨 **Solución de Problemas**

### **Error: "Access denied for user"**
- Verificar credenciales en variables de entorno
- Confirmar que el usuario existe en MySQL
- Verificar firewall rules

### **Error: "Connection timeout"**
- Verificar que el servidor MySQL esté ejecutándose
- Revisar configuración de firewall
- Verificar conectividad de red

### **Error: "Database not found"**
- Verificar que la base de datos existe
- Confirmar el nombre de la base de datos
- Revisar permisos del usuario

## 📈 **Monitoreo y Alertas**

### **Métricas Importantes**
- **CPU Usage**: Uso de CPU del servidor
- **Memory Usage**: Uso de memoria
- **Connection Count**: Número de conexiones activas
- **Storage Usage**: Uso de almacenamiento

### **Configurar Alertas**
```bash
# Crear alerta para CPU usage alto
az monitor metrics alert create \
  --name "High CPU Usage" \
  --resource-group rg-repuestera-mysql \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-repuestera-mysql/providers/Microsoft.DBforMySQL/flexibleServers/repuestera-mfrias-mysql-server \
  --condition "avg cpu_percent > 80" \
  --description "Alert when CPU usage exceeds 80%"
```

## 🔄 **Migración de Datos**

### **Desde SQLite a MySQL**
```bash
# 1. Exportar datos de SQLite
sqlite3 backend/data/repuestera.db .dump > backup.sql

# 2. Convertir queries SQLite a MySQL
# (Algunas diferencias de sintaxis)

# 3. Importar a MySQL
mysql -h repuestera-mfrias-mysql-server.mysql.database.azure.com -u repuestera_admin -p repuestera_db < backup.sql
```

## 🎯 **Recomendaciones**

### **Para Desarrollo**
- Usar SQLite local para desarrollo rápido
- Cambiar a MySQL solo para testing de integración

### **Para Producción**
- Usar MySQL Flexible Server para mejor rendimiento
- Configurar backup automático
- Implementar monitoreo y alertas

### **Para Escalabilidad**
- Empezar con B1ms tier
- Escalar a B2s/B2ms según demanda
- Considerar Azure Database for MySQL si necesitas más control

## 📞 **Soporte**

Para problemas con MySQL Flexible Server:
1. Revisar logs de MySQL en el portal
2. Verificar métricas de rendimiento
3. Consultar documentación de Azure Database for MySQL
4. Usar Azure Support si es necesario

---

**Estado**: ✅ Listo para despliegue con MySQL Flexible Server
**Complejidad**: 🟡 Media (configuración de base de datos)
**Costo**: 🟡 ~$12-25/mes (según tier)
**Escalabilidad**: 🟢 Alta
**Limitaciones**: 🟢 Mínimas
