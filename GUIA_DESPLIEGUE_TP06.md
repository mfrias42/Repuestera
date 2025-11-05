# 🚀 Guía de Despliegue - TP06 con Tests

## 📋 Próximos Pasos para Desplegar

Ahora que los tests están implementados y configurados en el pipeline, estos son los pasos para desplegar:

## ✅ Paso 1: Verificar Configuración del Pipeline

### 1.1. Verificar que el pipeline está actualizado
El pipeline ya incluye:
- ✅ Ejecución de tests automática
- ✅ Reportes de cobertura
- ✅ Validación antes del despliegue

**Archivo**: `azure-pipelines.yml`

### 1.2. Verificar variables del pipeline
Asegúrate de que estas variables estén configuradas en Azure DevOps:

```yaml
azureSubscription: 'Azure-Service-Connection'
resourceGroupName: 'rg-repuestera-qa'
webAppNameBackendQA: 'repuestera-api-qa'
webAppNameFrontendQA: 'repuestera-web-qa'
webAppNameBackendProd: 'repuestera-api-prod'
webAppNameFrontendProd: 'repuestera-web-prod'
```

## ✅ Paso 2: Configurar Azure DevOps

### 2.1. Service Connection
1. Ve a **Project Settings** → **Service connections**
2. Crea o verifica la conexión `Azure-Service-Connection`
3. Conecta con tu suscripción de Azure

### 2.2. Environments
Crea los environments en **Pipelines** → **Environments**:
- `qa-backend`
- `qa-frontend`
- `production-backend` (con aprobación manual)
- `production-frontend` (con aprobación manual)

### 2.3. Variables de Pipeline
Ve a **Pipelines** → **Library** → **Variable groups** y crea:
- Variables de conexión a MySQL
- Variables de configuración de JWT
- URLs de API

## ✅ Paso 3: Hacer Push al Repositorio

### 3.1. Verificar cambios
```bash
# Verificar que todos los archivos estén commitados
git status

# Verificar que los tests pasen localmente
cd backend && npm test
cd ../frontend && npm run test:ci
```

### 3.2. Commit y Push
```bash
# Agregar todos los cambios
git add .

# Commit con mensaje descriptivo
git commit -m "TP06: Implementación completa de tests unitarios con CI/CD"

# Push a main (esto disparará el pipeline)
git push origin main
```

## ✅ Paso 4: Monitorear el Pipeline

### 4.1. Verificar ejecución
1. Ve a **Pipelines** en Azure DevOps
2. El pipeline se ejecutará automáticamente al hacer push
3. Verifica que el stage **Build** complete exitosamente

### 4.2. Verificar tests
- ✅ Backend: 197 tests deben pasar
- ✅ Frontend: 24+ tests deben pasar
- ✅ Reportes de cobertura deben publicarse

### 4.3. Verificar reportes
- Ve a la pestaña **Code Coverage** del pipeline
- Verifica que los reportes se publiquen correctamente

## ✅ Paso 5: Despliegue a QA

### 5.1. Despliegue automático
El pipeline despliega automáticamente a QA después de que los tests pasen:
- ✅ Backend se despliega a `repuestera-api-qa`
- ✅ Frontend se despliega a `repuestera-web-qa`

### 5.2. Verificar despliegue QA
1. Verifica que las aplicaciones estén corriendo
2. Prueba los endpoints de la API
3. Verifica que el frontend se conecte correctamente

## ✅ Paso 6: Despliegue a Producción

### 6.1. Aprobación manual
1. El pipeline esperará aprobación para producción
2. Revisa los logs y reportes de QA
3. Aproba el despliegue a producción

### 6.2. Despliegue
- Backend se despliega a `repuestera-api-prod`
- Frontend se despliega a `repuestera-web-prod`

## 🔧 Troubleshooting

### Tests fallan en el pipeline
**Solución**:
1. Verifica que `npm install` se ejecute correctamente
2. Revisa los logs del pipeline
3. Ejecuta los tests localmente con `CI=true`

### Reportes de cobertura no aparecen
**Solución**:
1. Verifica que el flag `--coverage` esté presente
2. Verifica que los archivos se generen en `coverage/`
3. Revisa la configuración de `PublishCodeCoverageResults@1`

### Despliegue falla
**Solución**:
1. Verifica que el Service Connection esté configurado
2. Verifica que los App Services existan
3. Revisa los logs de despliegue

## 📊 Checklist Pre-Despliegue

Antes de desplegar, verifica:

- [ ] Tests pasan localmente (backend y frontend)
- [ ] Pipeline YAML está actualizado con tests
- [ ] Service Connection configurado en Azure DevOps
- [ ] Environments creados en Azure DevOps
- [ ] Variables de pipeline configuradas
- [ ] App Services creados en Azure
- [ ] Base de datos MySQL configurada
- [ ] Variables de entorno configuradas en App Services

## 🎯 Flujo Completo

```
1. Push a main
   ↓
2. Pipeline Build Stage
   ├─ Instalar dependencias
   ├─ Ejecutar tests backend ✅
   ├─ Ejecutar tests frontend ✅
   ├─ Generar reportes de cobertura ✅
   └─ Crear artefactos
   ↓
3. Pipeline Deploy QA Stage (Automático)
   ├─ Desplegar backend a QA
   └─ Desplegar frontend a QA
   ↓
4. Pipeline Deploy Prod Stage (Aprobación Manual)
   ├─ Aprobar despliegue
   ├─ Desplegar backend a Prod
   └─ Desplegar frontend a Prod
```

## 📝 Notas Importantes

1. **Tests bloquean despliegue**: Si los tests fallan, el pipeline no despliega
2. **Reportes automáticos**: Los reportes de cobertura se publican automáticamente
3. **QA automático**: El despliegue a QA es automático después de tests exitosos
4. **Producción manual**: Requiere aprobación manual para seguridad

## 🚀 Comandos Rápidos

```bash
# Verificar tests localmente antes de push
cd backend && npm test
cd ../frontend && npm run test:ci

# Verificar pipeline
git status
git add .
git commit -m "Mensaje descriptivo"
git push origin main

# Monitorear pipeline (desde Azure DevOps UI)
# https://dev.azure.com/[tu-organizacion]/[tu-proyecto]/_build
```

---

**Estado**: ✅ Listo para desplegar
**Última actualización**: TP06 - Pruebas Unitarias completadas

