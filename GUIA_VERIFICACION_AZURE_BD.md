# 🔍 Guía de Verificación de Base de Datos en Azure

Esta guía te ayudará a diagnosticar problemas de conexión a la base de datos en producción.

## 📋 Checklist de Verificación

### 1. ✅ Verificar MySQL Flexible Server en Azure Portal

1. **Ir a Azure Portal** → Buscar "manufrias-prod" (tu servidor MySQL)
2. **Verificar Estado del Servidor:**
   - Estado debe ser **"Running"** (En ejecución)
   - Si está detenido, iniciarlo

3. **Verificar Configuración:**
   - **Nombre del servidor:** `manufrias-prod.mysql.database.azure.com`
   - **Usuario administrador:** `A`
   - **Base de datos:** `repuestera_db` debe existir

### 2. 🔥 Verificar Reglas de Firewall (CRÍTICO)

**Este es el problema más común:**

1. En el servidor MySQL, ir a **"Networking"** o **"Firewall rules"**
2. **Verificar que exista una regla que permita conexiones desde Azure Services:**
   - ✅ **"Allow Azure services and resources to access this server"** debe estar **HABILITADO**
   - O agregar una regla específica para el App Service

3. **Si no está habilitado:**
   - Activar la opción "Allow Azure services and resources to access this server"
   - Guardar cambios
   - Esperar 1-2 minutos para que se apliquen

4. **Verificar IPs permitidas:**
   - Puede que necesites agregar el rango de IPs de Azure App Services
   - O habilitar "Allow public access from any Azure service"

### 3. 🔐 Verificar Variables de Entorno en App Service

1. **Ir a App Service de Producción:**
   - Buscar `repuestera-api-prod` en Azure Portal
   - Ir a **"Configuration"** → **"Application settings"**

2. **Verificar que existan TODAS estas variables:**
   ```
   DB_TYPE=mysql
   DB_HOST=manufrias-prod.mysql.database.azure.com
   DB_USER=A
   DB_PASSWORD=4286Pka1#
   DB_NAME=repuestera_db
   DB_PORT=3306
   NODE_ENV=production
   ```

3. **Verificar que NO haya espacios extra:**
   - Copiar y pegar puede agregar espacios al inicio/final
   - Revisar cada valor cuidadosamente

4. **Si falta alguna variable o está incorrecta:**
   - Agregar/editar la variable
   - **Guardar** (esto reiniciará el App Service)
   - Esperar 2-3 minutos para que se reinicie

### 4. 📊 Verificar Logs del App Service

1. **Ir a App Service** → **"Log stream"** o **"Logs"**
2. **Buscar estos mensajes al iniciar:**
   - ✅ `🔗 Configuración Azure MySQL Flexible Server:`
   - ✅ `✅ Conexión a MySQL Flexible Server verificada correctamente`
   - ✅ `✅ Las tablas ya existen` o `⚠️ Las tablas no existen. Inicializando...`

3. **Si ves errores como:**
   - ❌ `ECONNREFUSED` → Problema de firewall o servidor no accesible
   - ❌ `ER_ACCESS_DENIED_ERROR` → Credenciales incorrectas
   - ❌ `ER_BAD_DB_ERROR` → Base de datos no existe
   - ❌ `ETIMEDOUT` → Problema de red/firewall

### 5. 🏥 Usar el Endpoint de Health Check

**Abrir en el navegador:**
```
https://repuestera-api-prod.azurewebsites.net/api/health
```

**Respuesta esperada (éxito):**
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "database": {
    "connected": true,
    "status": "Conectada",
    "tables": "completas",
    "tablesCount": 4
  },
  "environment": "production",
  "config": {
    "dbHost": "manufrias-prod.mysql.database.azure.com",
    "dbName": "repuestera_db",
    "dbUser": "A",
    "dbType": "mysql"
  }
}
```

**Si `connected: false`:**
- Problema de conexión (firewall, credenciales, o servidor no accesible)

**Si `tablesCount: 0` o `tables: "incompletas"`:**
- La base de datos está vacía
- El servidor intentará inicializarla automáticamente
- Revisar logs para ver si la inicialización falló

### 6. 🔧 Verificar Base de Datos Existe

**Desde Azure Portal:**
1. Ir al servidor MySQL → **"Databases"**
2. Verificar que `repuestera_db` exista
3. Si no existe, crearla:
   - Click en **"+ Add"**
   - Nombre: `repuestera_db`
   - Charset: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`

### 7. 🔄 Reiniciar App Service

**Si hiciste cambios en variables de entorno o firewall:**
1. Ir a App Service → **"Overview"**
2. Click en **"Restart"**
3. Esperar 2-3 minutos
4. Verificar logs para confirmar que se conectó correctamente

### 8. 🧪 Probar Conexión Manualmente (Opcional)

**Desde Azure Cloud Shell o tu terminal con Azure CLI:**

```bash
# Conectar usando mysql client
mysql -h manufrias-prod.mysql.database.azure.com \
      -u A \
      -p \
      --ssl-mode=REQUIRED \
      repuestera_db

# Cuando pida password, ingresar: 4286Pka1#

# Una vez conectado, verificar tablas:
SHOW TABLES;

# Deberías ver:
# - usuarios
# - administradores
# - categorias
# - productos
```

**Si no puedes conectar desde Cloud Shell:**
- El problema es de firewall
- Necesitas habilitar "Allow Azure services"

## 🚨 Problemas Comunes y Soluciones

### Problema: "ECONNREFUSED" o "ETIMEDOUT"
**Causa:** Firewall bloqueando conexiones
**Solución:**
1. Habilitar "Allow Azure services and resources to access this server"
2. Verificar que el App Service esté en la misma región o red permitida

### Problema: "ER_ACCESS_DENIED_ERROR"
**Causa:** Credenciales incorrectas
**Solución:**
1. Verificar `DB_USER` y `DB_PASSWORD` en App Service Configuration
2. Verificar que el usuario `A` exista en MySQL
3. Resetear password si es necesario

### Problema: "ER_BAD_DB_ERROR"
**Causa:** Base de datos no existe
**Solución:**
1. Crear la base de datos `repuestera_db` en Azure Portal
2. O ejecutar: `CREATE DATABASE repuestera_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### Problema: "ER_NO_SUCH_TABLE"
**Causa:** Base de datos vacía (sin tablas)
**Solución:**
1. El servidor intentará inicializar automáticamente
2. Revisar logs para ver si la inicialización falló
3. Si falla, ejecutar manualmente el script `initProdDatabase.js` via SSH

## 📝 Comandos Útiles de Azure CLI

```bash
# Ver estado del servidor MySQL
az mysql flexible-server show \
  --resource-group <tu-resource-group> \
  --name manufrias-prod

# Ver reglas de firewall
az mysql flexible-server firewall-rule list \
  --resource-group <tu-resource-group> \
  --name manufrias-prod

# Ver variables de entorno del App Service
az webapp config appsettings list \
  --resource-group <tu-resource-group> \
  --name repuestera-api-prod

# Ver logs en tiempo real
az webapp log tail \
  --resource-group <tu-resource-group> \
  --name repuestera-api-prod

# Reiniciar App Service
az webapp restart \
  --resource-group <tu-resource-group> \
  --name repuestera-api-prod
```

## ✅ Orden Recomendado de Verificación

1. **Primero:** Verificar endpoint `/api/health` para diagnóstico rápido
2. **Segundo:** Verificar firewall (más común)
3. **Tercero:** Verificar variables de entorno en App Service
4. **Cuarto:** Verificar logs del App Service
5. **Quinto:** Verificar que la base de datos existe
6. **Último:** Reiniciar App Service si hiciste cambios

## 🆘 Si Nada Funciona

1. **Verificar logs completos** del App Service (últimas 24 horas)
2. **Probar conexión desde Azure Cloud Shell** para aislar el problema
3. **Verificar que el servidor MySQL esté en la misma región** que el App Service (mejor rendimiento)
4. **Contactar soporte de Azure** si el servidor MySQL no responde

