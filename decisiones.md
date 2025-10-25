# Decisiones Técnicas - TP05
## Ingeniería de Software 3 - Release Pipeline

### 📋 **Resumen del Proyecto**
Implementación de un Release Pipeline completo para la aplicación Repuestera con ambientes QA y Producción, incluyendo aprobaciones manuales y gestión de configuraciones por ambiente.

---

## 🏗️ **1. Arquitectura de Ambientes**

### **Decisión: Estrategia Multi-Ambiente**
- **QA Environment**: Despliegue automático para testing
- **Production Environment**: Despliegue con aprobación manual

**Justificación:**
- Permite testing exhaustivo antes de producción
- Reduce riesgo de errores en producción
- Facilita rollback en caso de problemas
- Cumple con mejores prácticas de DevOps

### **Recursos Azure por Ambiente:**

#### QA Environment
- **Backend**: `repuestera-api-mfrias-qa`
- **Frontend**: `repuestera-web-mfrias-qa`
- **URL API**: `https://repuestera-api-mfrias-qa.azurewebsites.net/api`

#### Production Environment
- **Backend**: `repuestera-api-mfrias`
- **Frontend**: `repuestera-web-mfrias`
- **URL API**: `https://repuestera-api-mfrias.azurewebsites.net/api`

---

## 🔧 **2. Configuración de Variables por Ambiente**

### **Variables QA:**
```yaml
NODE_ENV: 'qa'
API_URL: 'https://repuestera-api-mfrias-qa.azurewebsites.net/api'
REACT_APP_API_URL: 'https://repuestera-api-mfrias-qa.azurewebsites.net/api'
```

### **Variables Producción:**
```yaml
NODE_ENV: 'production'
API_URL: 'https://repuestera-api-mfrias.azurewebsites.net/api'
REACT_APP_API_URL: 'https://repuestera-api-mfrias.azurewebsites.net/api'
```

**Justificación:**
- Separación clara de configuraciones
- Evita conflictos entre ambientes
- Facilita debugging y troubleshooting
- Permite diferentes niveles de logging

---

## 🚀 **3. Release Pipeline Strategy**

### **Flujo de Despliegue:**
```
Build → QA (Automático) → Production (Manual Approval)
```

### **Stages Implementados:**

#### **Stage 1: Build**
- Construcción de backend y frontend
- Ejecución de tests
- Generación de artefactos

#### **Stage 2: Deploy QA**
- Despliegue automático a ambiente QA
- Configuración de variables QA
- Testing automático disponible

#### **Stage 3: Deploy Production**
- **Requiere aprobación manual**
- Despliegue a ambiente de producción
- Configuración de variables de producción

**Justificación:**
- Automatización máxima con control manual en producción
- Reduce tiempo de deployment
- Mantiene calidad y seguridad

---

## 🔐 **4. Gestión de Aprobaciones**

### **Aprobaciones Configuradas:**
- **QA**: Sin aprobación (automático)
- **Production**: Aprobación manual requerida

### **Responsables de Aprobación:**
- **Tech Lead**: Aprobación técnica
- **Product Owner**: Aprobación funcional
- **DevOps Engineer**: Aprobación de infraestructura

### **Proceso de Aprobación:**
1. QA deployment se ejecuta automáticamente
2. Testing manual/automático en QA
3. Solicitud de aprobación para producción
4. Revisión de cambios y testing results
5. Aprobación manual por responsables
6. Deployment a producción

**Justificación:**
- Control de calidad en producción
- Responsabilidad compartida
- Trazabilidad de decisiones
- Cumplimiento de políticas corporativas

---

## 🛠️ **5. Decisiones Técnicas Específicas**

### **5.1 Uso de AzureAppServiceSettings Task**
**Problema:** Error "Parameter name cannot be empty" con appSettings inline
**Solución:** Separar configuración usando `AzureAppServiceSettings@1`

**Justificación:**
- Mayor robustez en parsing de configuraciones
- Mejor manejo de caracteres especiales
- Separación de responsabilidades (deploy vs config)

### **5.2 Estrategia de Variables de Entorno**
**Decisión:** Variables específicas por stage en lugar de variables globales

**Justificación:**
- Mayor flexibilidad por ambiente
- Evita errores de configuración cruzada
- Facilita debugging específico por ambiente

### **5.3 Estructura de Naming**
**Patrón:** `repuestera-{component}-mfrias-{environment}`

**Ejemplos:**
- `repuestera-api-mfrias-qa`
- `repuestera-web-mfrias`

**Justificación:**
- Identificación clara de recursos
- Evita conflictos de naming
- Facilita gestión en Azure Portal

---

## 📊 **6. Monitoreo y Observabilidad**

### **Application Insights:**
- Configurado para ambos ambientes
- Métricas de performance
- Logging centralizado
- Alertas automáticas

### **Health Checks:**
- Endpoint `/health` en backend
- Verificación automática post-deployment
- Rollback automático en caso de falla

**Justificación:**
- Visibilidad completa del sistema
- Detección temprana de problemas
- Mejora continua basada en métricas

---

## 🔄 **7. Estrategia de Rollback**

### **Rollback Automático:**
- Falla en health checks
- Errores críticos en deployment

### **Rollback Manual:**
- Problemas detectados post-deployment
- Issues reportados por usuarios

**Proceso:**
1. Detección del problema
2. Evaluación de impacto
3. Decisión de rollback
4. Ejecución de rollback
5. Verificación de estabilidad

---

## 📈 **8. Métricas y KPIs**

### **Métricas de Deployment:**
- Tiempo promedio de deployment
- Tasa de éxito de deployments
- Tiempo de rollback
- Frecuencia de deployments

### **Métricas de Calidad:**
- Cobertura de tests
- Bugs encontrados en QA vs Producción
- Tiempo de detección de issues

**Objetivo:** Mejora continua del proceso de release

---

## 🔧 **9. Correcciones Implementadas**

### **Pipeline sin Environments (Versión Inicial)**
**Decisión**: Convertir deployment jobs a jobs normales eliminando dependencia de environments
**Razón**: Los environments de Azure DevOps deben crearse manualmente antes de poder usarlos en el pipeline
**Implementación**:
- Cambio de `deployment:` a `job:` en todos los stages
- Eliminación de referencias a `environment:` 
- Adición de `download:` tasks para artefactos
- Mantenimiento de la estructura multi-stage

### **Configuración de Environments (Paso Opcional)**
Para habilitar aprobaciones manuales más adelante:
1. Crear environments en Azure DevOps: `qa-backend`, `qa-frontend`, `production-backend`, `production-frontend`
2. Configurar aprobaciones en environments de producción
3. Revertir jobs a deployment jobs con referencias a environments

### **Corrección de Nombres de Recursos Azure**
**Problema Identificado**: El pipeline fallaba porque los nombres de las Web Apps en las variables no coincidían con los recursos reales de Azure:
- Pipeline esperaba: `repuestera-api-mfrias-qa`, `repuestera-web-mfrias-qa`
- Recursos reales: `repuestera-mfrias-api`, `repuestera-mfrias-web`

**Solución Implementada**:
1. **Corrección de Variables del Pipeline**: Se actualizaron las variables en `azure-pipelines.yml`:
   - QA Backend: `repuestera-mfrias-qa-api`
   - QA Frontend: `repuestera-mfrias-qa-web`
   - Prod Backend: `repuestera-mfrias-api` (existente)
   - Prod Frontend: `repuestera-mfrias-web` (existente)

2. **Creación de Recursos QA**: Se creó un template simplificado (`azure-infrastructure-qa-simple.json`) sin Application Insights para evitar problemas de registro de proveedores de recursos.

3. **Deployment de Recursos QA**: Se desplegaron exitosamente los recursos QA:
   - `repuestera-mfrias-qa-api.azurewebsites.net`
   - `repuestera-mfrias-qa-web.azurewebsites.net`
### Estado Actual
- ✅ Variables del pipeline corregidas para QA y Producción
- ✅ Recursos QA creados y funcionando
- ✅ Variables de producción corregidas para usar recursos existentes
- ✅ Pipeline listo para deployment completo
- ✅ Cambios commiteados y pusheados

### Corrección Final de Recursos de Producción
**Problema**: Después de corregir QA, el pipeline fallaba en producción porque los nombres de recursos no coincidían.

**Recursos Existentes en Azure**:
- Backend Prod: `repuestera-api-mfrias`
- Frontend Prod: `repuestera-web-mfrias`

**Corrección Aplicada**: Se actualizaron las variables de producción en el pipeline para usar los nombres correctos de los recursos existentes.

---

## 🔐 **Implementación de Aprobaciones Manuales**

### **Objetivo**: Configurar aprobaciones manuales para el pase a Producción según TP05.

**Problema**: El pipeline actual usa jobs regulares que no soportan aprobaciones manuales.

**Solución Implementada**:

### **1. Conversión a Deployment Jobs**
- Convertir jobs regulares a `deployment` jobs
- Agregar `environment` property para cada deployment
- Usar estrategia `runOnce` con sección `deploy`

### **2. Environments Configurados**
**QA (Sin aprobación)**:
- `qa-backend`: Deploy automático del API
- `qa-frontend`: Deploy automático del Frontend

**Production (Con aprobación manual)**:
- `production-backend`: Deploy del API con aprobación requerida
- `production-frontend`: Deploy del Frontend con aprobación requerida

### **3. Proceso de Aprobación**
- **Approver Principal**: mfrias42@dev.azure.com
- **Criterios**: Tests QA exitosos, validación funcional, sin bugs críticos
- **Timeout**: 30 días
- **Política**: Mínimo 1 approver, requestor no puede auto-aprobar

### **4. Archivos Creados/Modificados**
- `azure-pipelines.yml`: Convertido a deployment jobs con environments
- `APPROVAL_PROCESS.md`: Documentación completa del proceso
- `setup-environments.sh`: Guía para configuración manual

### **5. Configuración Manual Requerida**
Los environments deben crearse manualmente en Azure DevOps:
1. Acceder a Pipelines → Environments
2. Crear 4 environments (qa-backend, qa-frontend, production-backend, production-frontend)
3. Configurar aprobaciones solo para production environments
4. Agregar approvers y políticas

**Estado**: ✅ Pipeline modificado - Requiere configuración manual de environments en Azure DevOps

**Próximos pasos**:
1. Crear environments manualmente en Azure DevOps
2. Configurar aprobaciones para production environments
3. Probar flujo completo con aprobaciones
4. Validar proceso de rollback si es necesario

## 🎯 **10. Próximos Pasos**

### **Mejoras Planificadas:**
1. **Blue-Green Deployment** para zero-downtime
2. **Automated Testing** en pipeline
3. **Security Scanning** automático
4. **Performance Testing** en QA
5. **Canary Deployments** para releases críticos
6. **Configuración de Environments para aprobaciones manuales**

### **Automatizaciones Futuras:**
- Auto-rollback basado en métricas
- Deployment scheduling
- Notificaciones automáticas
- Integration con Slack/Teams

---

## 📝 **11. Lecciones Aprendidas**

### **Problemas Encontrados:**
1. **AppSettings Parsing**: Resuelto con AzureAppServiceSettings
2. **Variable Scoping**: Solucionado con variables por stage
3. **Environment Naming**: Estandarizado con convención clara

### **Mejores Prácticas Aplicadas:**
- Separación de ambientes
- Aprobaciones manuales para producción
- Variables específicas por ambiente
- Documentación completa de decisiones

---

**Fecha:** Enero 2025  
**Autor:** Estudiante TP05  
**Versión:** 1.0  
**Estado:** Implementado