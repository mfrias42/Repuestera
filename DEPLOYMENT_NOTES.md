# Notas de Despliegue - Migración a SQLite

## ✅ Migración Completada Exitosamente

La migración de MySQL a SQLite se ha completado exitosamente en el entorno local:

### Cambios Realizados:

1. **Backend actualizado** - Todos los modelos y configuraciones ahora usan SQLite
2. **Base de datos SQLite creada** - `backend/data/repuestera.db`
3. **Variables de entorno actualizadas** - Removidas configuraciones de MySQL
4. **Templates de Azure simplificados** - Removidos recursos de MySQL

### Pruebas Locales:

- ✅ Servidor backend funcionando correctamente en puerto 8000
- ✅ Base de datos SQLite inicializada con datos de ejemplo
- ✅ API endpoints respondiendo correctamente
- ✅ Health check endpoint funcionando

## ⚠️ Limitaciones de Azure for Students

Durante las pruebas de despliegue en Azure, se encontraron **restricciones severas** en la suscripción Azure for Students:

### Problema Identificado:
```
RequestDisallowedByAzure: This policy maintains a set of best available regions where your subscription can deploy resources.
```

### Regiones Probadas (Todas Fallaron):
- North Central US
- Brazil South  
- South Central US
- East US
- West Europe

### Causa:
Las suscripciones Azure for Students tienen políticas muy restrictivas que limitan significativamente las regiones y recursos disponibles para despliegue.

## 🚀 Alternativas de Despliegue Recomendadas

### 1. **Vercel (Recomendado para este proyecto)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar desde el directorio raíz
vercel

# Configurar variables de entorno en Vercel dashboard
```

**Ventajas:**
- Gratuito para proyectos personales
- Soporte nativo para Node.js
- SQLite funciona perfectamente
- Despliegue automático desde Git

### 2. **Railway**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y desplegar
railway login
railway init
railway up
```

**Ventajas:**
- Gratuito hasta $5/mes de uso
- Soporte completo para SQLite
- Base de datos persistente

### 3. **Render**
- Conectar repositorio GitHub
- Configurar como Web Service
- SQLite se mantiene en el sistema de archivos

### 4. **Heroku (Con limitaciones)**
- Requiere configuración especial para SQLite
- Sistema de archivos efímero (se pierde la DB en restart)

## 📋 Próximos Pasos Recomendados

1. **Elegir plataforma alternativa** (Vercel recomendado)
2. **Configurar despliegue automático** desde GitHub
3. **Probar aplicación en producción**
4. **Documentar proceso de despliegue elegido**

## 🔧 Configuración para Vercel

Crear `vercel.json` en la raíz del proyecto:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/build/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/build/$1"
    }
  ]
}
```

## 📝 Conclusión

La migración a SQLite fue **exitosa** y la aplicación funciona perfectamente en local. Las limitaciones de Azure for Students requieren usar plataformas alternativas para el despliegue en producción.

**Estado actual:** ✅ Listo para despliegue en plataformas alternativas