# 🚀 Script para Crear Base de Datos de Producción Directamente

Este script se conecta **directamente** a la base de datos de producción (`manufrias-prod.mysql.database.azure.com`) y crea la base de datos sin pasar por el pipeline de Azure.

## 📋 Requisitos Previos

1. **Firewall de Azure configurado:**
   - Debe permitir conexiones desde tu IP actual
   - O tener habilitado "Allow Azure services and resources to access this server"

2. **Credenciales:**
   - Host: `manufrias-prod.mysql.database.azure.com`
   - Usuario: `A`
   - Contraseña: `4286Pk1#` (o la que hayas configurado)

3. **Dependencias instaladas:**
   ```bash
   cd backend
   npm install
   ```

## 🎯 Uso

### Opción 1: Usar el script npm (Recomendado)

```bash
cd backend
npm run create-prod-db-direct
```

### Opción 2: Ejecutar directamente con Node.js

```bash
cd backend
node scripts/createProdDatabaseDirect.js
```

### Opción 3: Con contraseña personalizada

Si necesitas usar una contraseña diferente:

```bash
cd backend
DB_PASSWORD=tu_password node scripts/createProdDatabaseDirect.js
```

## ✅ Qué hace el script

1. **Se conecta al servidor MySQL** sin especificar base de datos
2. **Crea la base de datos** `repuestera_db` si no existe
3. **Crea todas las tablas necesarias:**
   - `usuarios`
   - `administradores`
   - `categorias`
   - `productos`
4. **Inserta datos iniciales:**
   - Administrador por defecto (admin@repuestera.com / admin123)
   - 8 categorías predefinidas
   - 6 productos de ejemplo

## 🔍 Verificación

Después de ejecutar el script, deberías ver:

```
🎉 ============================================
🎉 Base de Datos de Producción Creada Exitosamente
🎉 ============================================

📋 Credenciales de acceso:
   Email: admin@repuestera.com
   Password: admin123

✅ La base de datos está lista para usar
```

## ❌ Solución de Problemas

### Error: `ECONNREFUSED` o `ETIMEDOUT`

**Problema:** No se puede conectar al servidor MySQL.

**Soluciones:**
1. Verifica que el servidor MySQL esté corriendo en Azure
2. Verifica las reglas de firewall en Azure Portal:
   - Ve a Azure Portal → MySQL Flexible Server → Networking
   - Agrega tu IP actual a las reglas de firewall
   - O habilita "Allow Azure services and resources to access this server"

### Error: `ER_ACCESS_DENIED_ERROR`

**Problema:** Credenciales incorrectas.

**Soluciones:**
1. Verifica que el usuario sea `A`
2. Verifica que la contraseña sea `4286Pk1#`
3. Si cambiaste la contraseña, úsala como variable de entorno:
   ```bash
   DB_PASSWORD=tu_nueva_password node scripts/createProdDatabaseDirect.js
   ```

### Error: `ER_BAD_DB_ERROR`

**Problema:** La base de datos no existe y no se pudo crear.

**Soluciones:**
1. Verifica que el usuario tenga permisos para crear bases de datos
2. Verifica que no haya problemas de conexión durante la creación

## 📝 Notas Importantes

- Este script es **idempotente**: puedes ejecutarlo múltiples veces sin problemas
- Si las tablas ya existen, no las sobrescribe
- Si los datos ya existen, no los duplica (usa `INSERT IGNORE`)
- El script muestra información detallada de cada paso

## 🔐 Seguridad

- La contraseña está hardcodeada en el script por conveniencia
- En producción, considera usar variables de entorno o Azure Key Vault
- No compartas este script con credenciales en repositorios públicos

## 📞 Soporte

Si tienes problemas, verifica:
1. Los logs del script para ver en qué paso falla
2. Las reglas de firewall en Azure Portal
3. Las credenciales en Azure Portal → MySQL Flexible Server → Settings → Connection strings

