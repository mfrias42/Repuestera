# Guía de Demostración - Requerimientos del Proyecto

## Requerimientos y Cómo Demostrarlos

### 1. ✅ Demostrar Bases Diferentes

**Ubicación:** `azure-pipelines.yml`

**Evidencia:**
- Línea 631: `DB_HOST: manufrias.mysql.database.azure.com` (QA)
- Línea 796: `DB_HOST: manufrias-prod.mysql.database.azure.com` (Producción)

**Cómo demostrar:**
1. Abrir Azure DevOps → Pipelines → Ver pipeline ejecutado
2. Mostrar configuración de variables en stage DeployQA vs DeployProduction
3. Mostrar que son bases de datos diferentes

**Screenshot sugerido:**
- Configuración de app settings mostrando diferentes DB_HOST

---

### 2. ✅ Pruebas Unitarias Frontend

**Ubicación:** `frontend/src/__tests__/`

**Cómo demostrar:**
```bash
cd frontend
npm test -- --coverage
```

**En Pipeline:**
- Job `BuildFrontendQA` ejecuta tests
- Ver resultados en Azure DevOps → Tests

**Screenshot sugerido:**
- Panel de Tests en Azure DevOps mostrando tests pasando
- Coverage report mostrando 78%

---

### 3. ✅ Aprobación Manual

**Ubicación:** `azure-pipelines.yml` - Stage `DeployProduction`

**Cómo demostrar:**
1. Ejecutar pipeline hasta stage DeployProduction
2. Mostrar que aparece "Waiting for approval"
3. Mostrar botón de aprobación
4. Aprobar y mostrar que continúa

**Screenshot sugerido:**
- Pipeline esperando aprobación manual
- Botón de aprobación visible

---

### 4. ✅ Artefactos

**Ubicación:** Azure DevOps → Pipelines → Ver artefactos

**Cómo demostrar:**
1. Ir a último pipeline ejecutado
2. Click en "Artifacts"
3. Mostrar artefactos disponibles:
   - `backend-drop`
   - `frontend-qa-drop`
   - `frontend-prod-drop`
   - `backend-coverage`
   - `frontend-coverage`

**Screenshot sugerido:**
- Panel de Artefactos con todos los artefactos listados

---

### 5. ✅ Pruebas de Integración (E2E)

**Ubicación:** `frontend/cypress/e2e/`

**Tests implementados:**
- `01-registro-usuario.cy.js`
- `02-actualizacion-producto.cy.js`
- `03-manejo-errores.cy.js`

**Cómo demostrar localmente:**
```bash
cd frontend
# Iniciar backend y frontend
npm run cypress:open  # Modo interactivo
# O
npm run cypress:run:headless  # Modo headless
```

**En Pipeline:**
- Job `E2ETests` ejecuta Cypress con paralelización (2 workers)
- Resultados publicados en:
  - **Cypress Cloud**: https://cloud.cypress.io (requiere configuración de variable secreta)
  - **Azure DevOps**: Tests → Cypress E2E Tests (reporte JUnit)

**Configuración de Cypress Cloud:**
1. El `projectId: '3hqyec'` está configurado en `frontend/cypress.config.js`
2. **IMPORTANTE**: Agregar variable secreta en Azure DevOps:
   - Ir a: Pipelines → Tu Pipeline → Edit → Variables
   - Agregar variable: `CYPRESS_RECORD_KEY` = `cedda1b7-3a98-4010-abf8-8b18c325d78f`
   - Marcar como **Secret** (🔒)
   - Guardar
3. Los tests se ejecutan con `--record --parallel` para enviar resultados a Cypress Cloud
4. Ver resultados en: https://cloud.cypress.io/projects/3hqyec

**Screenshot sugerido:**
- Dashboard de Cypress Cloud con resultados de tests
- Videos/screenshots de Cypress en Cloud
- Resultados en Azure DevOps también

---

### 6. ✅ Pipeline 1: Camino Feliz

**Pipeline:** `azure-pipelines.yml`

**Cómo demostrar:**
1. Ejecutar pipeline completo
2. Mostrar que todos los stages pasan:
   - ✅ Build
   - ✅ QualityGates
   - ✅ DeployQA
   - ✅ DeployProduction (con aprobación)

**Screenshot sugerido:**
- Vista completa del pipeline con todos los stages en verde

---

### 7. ⚠️ Pipeline 2: Error en Prueba Unitaria

**Pipeline:** `azure-pipelines-demo-error.yml`

**Cómo demostrar:**
1. Crear pipeline en Azure DevOps usando `azure-pipelines-demo-error.yml`
2. Ejecutar pipeline
3. Mostrar que falla en stage Build
4. Mostrar mensaje de error
5. Corregir el test (eliminar `__tests__/unit/demo-failing.test.js`)
6. Re-ejecutar y mostrar que pasa

**Pasos para crear pipeline:**
1. Azure DevOps → Pipelines → New Pipeline
2. Seleccionar repositorio
3. Seleccionar "Existing Azure Pipelines YAML file"
4. Seleccionar `azure-pipelines-demo-error.yml`
5. Guardar y ejecutar

**Screenshot sugerido:**
- Pipeline fallando en tests
- Mensaje de error visible
- Pipeline corregido pasando

---

### 8. ⚠️ Pipeline 3: Cambio en Frontend sin Aprobación Manual

**Pipeline:** `azure-pipelines-demo-frontend-only.yml`

**Cómo demostrar:**
1. Crear pipeline en Azure DevOps usando `azure-pipelines-demo-frontend-only.yml`
2. Ejecutar pipeline
3. Mostrar que despliega a QA sin requerir aprobación
4. Comparar con pipeline de producción que sí requiere aprobación

**Pasos para crear pipeline:**
1. Azure DevOps → Pipelines → New Pipeline
2. Seleccionar repositorio
3. Seleccionar "Existing Azure Pipelines YAML file"
4. Seleccionar `azure-pipelines-demo-frontend-only.yml`
5. Guardar y ejecutar

**Screenshot sugerido:**
- Pipeline desplegando directamente sin aprobación
- Comparación lado a lado con pipeline de producción

---

### 9. ⚠️ Prueba con Mock sin BD

**Ubicación:** `backend/__tests__/unit/`

**Cómo demostrar:**

**Paso 1: Verificar que BD está desconectada**
```bash
# Verificar que no hay conexión a BD
# Los tests deben funcionar sin BD porque usan mocks
```

**Paso 2: Ejecutar tests sin BD**
```bash
cd backend
# Asegurarse de que no hay conexión a BD
npm test
```

**Paso 3: Mostrar mocks en código**
- Mostrar `backend/__tests__/unit/models/Product.test.js` línea 7-9
- Mostrar `backend/__tests__/unit/models/User.test.js` línea 7-9
- Explicar que `executeQuery` está mockeado

**Ejemplo de mock:**
```javascript
// backend/__tests__/unit/models/Product.test.js
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()  // Mock de la función de BD
}));
```

**Screenshot sugerido:**
- Tests ejecutándose sin BD
- Código de mocks visible
- Tests pasando sin conexión a BD

---

## Checklist de Preparación para Presentación

- [ ] Verificar que todas las bases de datos están configuradas correctamente
- [ ] Ejecutar pipeline principal y verificar que pasa
- [ ] Crear pipeline de demostración de error
- [ ] Crear pipeline de demostración de frontend sin aprobación
- [ ] Ejecutar tests sin BD y verificar que pasan
- [ ] Tomar screenshots de cada requerimiento
- [ ] Preparar explicación de cada requerimiento
- [ ] Verificar que los artefactos se publican correctamente
- [ ] Verificar que la aprobación manual funciona
- [ ] Verificar que los tests E2E se ejecutan correctamente

---

## Orden Sugerido de Demostración

1. **Pipeline Principal (Camino Feliz)**
   - Mostrar pipeline completo ejecutándose
   - Explicar cada stage

2. **Bases Diferentes**
   - Mostrar configuración de QA vs Producción
   - Explicar por qué son diferentes

3. **Pruebas Unitarias Frontend**
   - Mostrar ejecución de tests
   - Mostrar coverage report

4. **Artefactos**
   - Mostrar artefactos publicados
   - Explicar cómo se usan en deploy

5. **Aprobación Manual**
   - Mostrar pipeline esperando aprobación
   - Aprobar y mostrar que continúa

6. **Pruebas de Integración**
   - Mostrar ejecución de Cypress
   - Mostrar resultados E2E

7. **Pipeline con Error**
   - Ejecutar pipeline de demostración de error
   - Mostrar cómo falla
   - Corregir y mostrar que pasa

8. **Pipeline Frontend sin Aprobación**
   - Ejecutar pipeline de frontend solo
   - Mostrar que despliega sin aprobación
   - Comparar con producción

9. **Mocks sin BD**
   - Desconectar BD
   - Ejecutar tests
   - Mostrar que pasan sin BD
   - Explicar cómo funcionan los mocks

