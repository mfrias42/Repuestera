# 🚀 Despliegue en Vercel - Repuestera

## ✅ **Solución Perfecta para Azure for Students**

Dado que Azure for Students tiene limitaciones severas de región, **Vercel es la alternativa ideal** para tu proyecto.

## 🎯 **Ventajas de Vercel**

- ✅ **Completamente gratuito** para proyectos personales
- ✅ **SQLite funciona perfectamente** (archivo local)
- ✅ **Sin limitaciones** de región o recursos
- ✅ **Despliegue automático** desde GitHub
- ✅ **CDN global** incluido
- ✅ **HTTPS automático**
- ✅ **Dominio personalizado** gratuito

## 🚀 **Despliegue Rápido**

### **Paso 1: Instalar Vercel CLI**
```bash
npm i -g vercel
```

### **Paso 2: Login en Vercel**
```bash
vercel login
```

### **Paso 3: Desplegar**
```bash
# Desde el directorio raíz del proyecto
vercel

# Seguir las instrucciones:
# - Link to existing project? N
# - Project name: repuestera
# - Directory: ./
# - Override settings? N
```

### **Paso 4: Configurar Variables de Entorno**
```bash
# En el dashboard de Vercel, agregar:
NODE_ENV=production
DB_TYPE=sqlite
DB_PATH=/tmp/repuestera.db
JWT_SECRET=vercel_jwt_secret_super_seguro_2024
JWT_REFRESH_SECRET=vercel_jwt_refresh_secret_super_seguro_2024
```

## 📁 **Estructura del Proyecto para Vercel**

```
/
├── vercel.json              # Configuración de Vercel
├── backend/
│   ├── server.js            # Servidor Node.js
│   ├── config/
│   │   └── database.js      # Configuración híbrida
│   └── ...
├── frontend/
│   ├── build/               # Build de React (generado)
│   └── ...
└── package.json             # Dependencias del proyecto
```

## 🔧 **Configuración Automática**

El archivo `vercel.json` ya está configurado para:

1. **Backend**: Servidor Node.js en `/api/*`
2. **Frontend**: Archivos estáticos en `/`
3. **SQLite**: Base de datos en `/tmp/repuestera.db`
4. **Variables**: Configuradas automáticamente

## 🌐 **URLs de Acceso**

Después del despliegue:

- **Frontend**: `https://repuestera.vercel.app`
- **Backend API**: `https://repuestera.vercel.app/api`
- **Health Check**: `https://repuestera.vercel.app/api/health`

## 📊 **Monitoreo y Logs**

### **Ver Logs en Tiempo Real**
```bash
vercel logs
```

### **Ver Estado del Proyecto**
```bash
vercel ls
```

### **Ver Detalles del Proyecto**
```bash
vercel inspect
```

## 🔄 **Despliegue Automático**

### **Conectar con GitHub**
1. Ir a [vercel.com](https://vercel.com)
2. Conectar tu repositorio GitHub
3. Configurar auto-deploy en push a `main`

### **Variables de Entorno en Dashboard**
1. Ir a Project Settings
2. Environment Variables
3. Agregar las variables necesarias

## 🛠️ **Comandos Útiles**

### **Despliegue Manual**
```bash
# Desplegar a producción
vercel --prod

# Desplegar preview
vercel
```

### **Ver Variables de Entorno**
```bash
vercel env ls
```

### **Agregar Variable de Entorno**
```bash
vercel env add NODE_ENV
# Seleccionar: Production, Preview, Development
# Valor: production
```

### **Reiniciar Despliegue**
```bash
vercel --force
```

## 🚨 **Solución de Problemas**

### **Error: "Module not found"**
```bash
# Verificar que todas las dependencias están en package.json
npm install
```

### **Error: "Build failed"**
```bash
# Ver logs detallados
vercel logs --follow
```

### **Error: "Database not found"**
- Verificar que `DB_PATH` está configurado
- SQLite se crea automáticamente en `/tmp/`

## 📈 **Ventajas vs Azure**

| Aspecto | Azure for Students | Vercel |
|---------|-------------------|--------|
| **Costo** | 🟢 Gratuito | 🟢 Gratuito |
| **Limitaciones** | 🔴 Muy severas | 🟢 Mínimas |
| **Regiones** | 🔴 Restringidas | 🟢 Global |
| **SQLite** | 🟡 Complejo | 🟢 Nativo |
| **Despliegue** | 🔴 Manual | 🟢 Automático |
| **Dominio** | 🔴 Manual | 🟢 Automático |

## 🎯 **Próximos Pasos**

1. **Instalar Vercel CLI**: `npm i -g vercel`
2. **Login**: `vercel login`
3. **Desplegar**: `vercel`
4. **Configurar variables**: En dashboard de Vercel
5. **Probar aplicación**: Verificar funcionalidad

## 💡 **Recomendaciones**

- **Desarrollo**: Usar SQLite local
- **Producción**: Vercel con SQLite
- **Backup**: Implementar backup del archivo SQLite
- **Monitoreo**: Usar logs de Vercel

---

**Estado**: ✅ Listo para despliegue en Vercel
**Complejidad**: 🟢 Muy baja
**Costo**: 🟢 Gratuito
**Limitaciones**: 🟢 Mínimas
