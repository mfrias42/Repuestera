# 🔐 Proceso de Aprobaciones Manuales - Repuestera
## TP05 - Gestión de Aprobaciones y Gates

### 📋 **Resumen**
Este documento define el proceso de aprobaciones manuales para deployments a producción, asegurando control de calidad y responsabilidad en releases críticos.

---

## 🏗️ **Arquitectura de Environments**

### **QA Environments (Automático)**
- **qa-backend**: Deployment automático del API
- **qa-frontend**: Deployment automático del Frontend
- **Trigger**: Automático después del build exitoso
- **Propósito**: Testing y validación antes de producción

### **Production Environments (Manual)**
- **production-backend**: Deployment del API con aprobación manual
- **production-frontend**: Deployment del Frontend con aprobación manual
- **Trigger**: Requiere aprobación manual explícita
- **Propósito**: Release controlado a usuarios finales

---

## 👥 **Responsables y Roles**

### **Approvers (Aprobadores)**
Los siguientes roles pueden aprobar deployments a producción:

#### **Rol Principal**
- **Matías Frías** (mfrias42@dev.azure.com)
  - Lead Developer
  - Responsabilidad: Aprobación técnica y de calidad

#### **Roles Secundarios** (Configurar según equipo)
- **Tech Lead**: Revisión técnica
- **Product Owner**: Validación de funcionalidades
- **DevOps Engineer**: Validación de infraestructura

### **Configuración de Approvers**
```yaml
# En Azure DevOps > Environments > production-* > Approvals and checks
Approvers:
  - mfrias42@dev.azure.com (Required)
  - [Agregar otros según necesidad]

Approval Policy:
  - Minimum approvers: 1
  - Allow requestor to approve: No
  - Timeout: 30 days
```

---

## 🔄 **Flujo de Aprobación**

### **Paso 1: Build y QA Automático**
```
1. Developer hace push a main
2. Pipeline ejecuta Build stage
3. Deploy automático a QA environments
4. Tests de integración en QA
```

### **Paso 2: Solicitud de Aprobación**
```
5. Pipeline llega a Production stage
6. Se pausa y solicita aprobación manual
7. Notificación enviada a approvers
8. Estado: "Waiting for approval"
```

### **Paso 3: Proceso de Revisión**
```
9. Approver revisa:
   - ✅ QA tests pasaron
   - ✅ Funcionalidades validadas
   - ✅ No hay issues críticos
   - ✅ Release notes completas
```

### **Paso 4: Decisión**
```
10. Approver puede:
    - ✅ APROBAR: Continúa deployment
    - ❌ RECHAZAR: Cancela deployment
    - 💬 COMENTAR: Solicita cambios
```

### **Paso 5: Deployment a Producción**
```
11. Si aprobado: Deploy automático a production
12. Monitoreo post-deployment
13. Notificación de completion
```

---

## 📝 **Criterios de Aprobación**

### **✅ Requisitos para Aprobar**
- [ ] Todos los tests de QA pasaron exitosamente
- [ ] Funcionalidades validadas en QA environment
- [ ] No hay bugs críticos reportados
- [ ] Release notes documentadas
- [ ] Backup de producción realizado (si aplica)
- [ ] Ventana de mantenimiento coordinada (si aplica)

### **❌ Criterios para Rechazar**
- [ ] Tests fallando en QA
- [ ] Bugs críticos sin resolver
- [ ] Funcionalidades incompletas
- [ ] Falta de documentación
- [ ] Riesgos de seguridad identificados

---

## 🚨 **Procedimientos de Emergencia**

### **Hotfix Process**
Para deployments urgentes de seguridad:
1. Crear branch `hotfix/*`
2. Proceso de aprobación acelerado (1 approver)
3. Deployment inmediato post-aprobación
4. Rollback plan preparado

### **Rollback Process**
En caso de issues en producción:
1. Identificar problema
2. Ejecutar rollback a versión anterior
3. Investigar causa raíz
4. Preparar fix para próximo deployment

---

## 📊 **Métricas y Monitoreo**

### **KPIs de Aprobación**
- Tiempo promedio de aprobación
- Tasa de aprobación vs rechazo
- Tiempo de deployment post-aprobación
- Incidentes post-deployment

### **Alertas**
- Deployment pendiente > 24 horas
- Fallas post-deployment
- Rollbacks ejecutados

---

## 🔗 **Enlaces Útiles**

- **Azure DevOps Environments**: https://dev.azure.com/mfrias42/tp05/_environments
- **Pipeline**: https://dev.azure.com/mfrias42/tp05/_build
- **QA Backend**: https://repuestera-mfrias-qa-api.azurewebsites.net
- **QA Frontend**: https://repuestera-mfrias-qa-web.azurewebsites.net
- **Prod Backend**: https://repuestera-api-mfrias.azurewebsites.net
- **Prod Frontend**: https://repuestera-web-mfrias.azurewebsites.net

---

## 📞 **Contactos**

### **Soporte Técnico**
- **Matías Frías**: mfrias42@dev.azure.com
- **Horario**: Lunes a Viernes 9:00-18:00

### **Escalación**
- **Emergencias**: [Definir proceso de escalación]
- **Issues críticos**: [Definir contactos de emergencia]

---

*Documento actualizado: $(date)*
*Versión: 1.0*