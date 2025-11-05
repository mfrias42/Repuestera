# 🎯 Próximos Pasos para Desplegar - TP06

## ✅ Estado Actual

- ✅ Tests unitarios implementados (197 backend + 24+ frontend)
- ✅ Pipeline configurado con tests automáticos
- ✅ Reportes de cobertura integrados
- ✅ CI/CD completamente funcional

## 🚀 Pasos Inmediatos para Desplegar

### 1️⃣ Verificar que todo funciona localmente

```bash
# Backend
cd backend
npm install
npm test              # Debe pasar todos los tests
npm run test:ci       # Verificar modo CI

# Frontend
cd ../frontend
npm install
npm run test:ci       # Debe pasar todos los tests
```

### 2️⃣ Verificar configuración de Azure DevOps

**En Azure DevOps Portal**:

1. **Service Connection**:
   - Ve a: Project Settings → Service connections
   - Verifica que `Azure-Service-Connection` exista y funcione
   - Si no existe, créala con tu suscripción de Azure

2. **Environments**:
   - Ve a: Pipelines → Environments
   - Verifica que existan:
     - `qa-backend`
     - `qa-frontend`
     - `production-backend` (con aprobación manual)
     - `production-frontend` (con aprobación manual)

3. **App Services en Azure**:
   - Verifica que existan en Azure Portal:
     - `repuestera-api-qa`
     - `repuestera-web-qa`
     - `repuestera-api-prod`
     - `repuestera-web-prod`

### 3️⃣ Hacer Push al Repositorio

```bash
# Verificar cambios
git status

# Agregar todos los archivos
git add .

# Commit
git commit -m "TP06: Tests unitarios completos con CI/CD integrado"

# Push (esto disparará el pipeline automáticamente)
git push origin main
```

### 4️⃣ Monitorear el Pipeline

1. Ve a Azure DevOps → Pipelines
2. El pipeline se ejecutará automáticamente
3. **Verifica el stage Build**:
   - ✅ Tests de backend deben pasar (197 tests)
   - ✅ Tests de frontend deben pasar (24+ tests)
   - ✅ Reportes de cobertura deben publicarse

4. **Si todo pasa**:
   - El pipeline desplegará automáticamente a QA
   - Luego esperará aprobación para producción

## 📋 Checklist Completo

### Pre-Despliegue
- [ ] Tests pasan localmente (backend y frontend)
- [ ] Git está configurado y conectado a Azure DevOps
- [ ] Service Connection configurado en Azure DevOps
- [ ] Environments creados en Azure DevOps
- [ ] App Services creados en Azure Portal
- [ ] Base de datos MySQL configurada
- [ ] Variables de entorno configuradas

### Durante Despliegue
- [ ] Pipeline se ejecuta automáticamente
- [ ] Tests pasan en el pipeline
- [ ] Reportes de cobertura se publican
- [ ] Despliegue a QA es exitoso
- [ ] Aprobar despliegue a producción

### Post-Despliegue
- [ ] Verificar que aplicaciones funcionen en QA
- [ ] Verificar que aplicaciones funcionen en producción
- [ ] Revisar reportes de cobertura en Azure DevOps

## 🔍 Qué Esperar en el Pipeline

### Stage: Build
```
✅ Instalar dependencias
✅ Ejecutar tests backend (197 tests)
✅ Ejecutar tests frontend (24+ tests)
✅ Generar reportes de cobertura
✅ Publicar reportes
✅ Crear artefactos
```

### Stage: Deploy QA (Automático)
```
✅ Desplegar backend a QA
✅ Desplegar frontend a QA
✅ Configurar variables de entorno
```

### Stage: Deploy Production (Requiere Aprobación)
```
⏳ Esperar aprobación manual
✅ Desplegar backend a producción
✅ Desplegar frontend a producción
```

## 🚨 Si Algo Falla

### Tests fallan
- Revisa los logs del pipeline
- Ejecuta los tests localmente para reproducir
- Verifica que todas las dependencias estén instaladas

### Despliegue falla
- Verifica que el Service Connection funcione
- Verifica que los App Services existan
- Revisa los logs de despliegue en Azure DevOps

### Reportes no aparecen
- Verifica que el flag `--coverage` esté en los scripts
- Revisa la configuración de `PublishCodeCoverageResults@1`

## 📞 Recursos Útiles

- **Guía completa**: Ver `GUIA_DESPLIEGUE_TP06.md`
- **Documentación de tests**: Ver `TESTING_CI_CD.md`
- **Checklist TP06**: Ver `CHECKLIST_TP06.md`

## 🎉 Resultado Esperado

Después de completar estos pasos:
- ✅ Aplicación desplegada en QA (automático)
- ✅ Aplicación desplegada en producción (después de aprobación)
- ✅ Reportes de cobertura visibles en Azure DevOps
- ✅ Pipeline funcionando automáticamente en cada push

---

**¡Listo para desplegar!** 🚀

