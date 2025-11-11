# ✅ CHECKLIST DEFENSA TP07

## 🎯 ANTES DE LA DEFENSA

### 1. Verificaciones Técnicas (30 min antes)

#### Pipeline en Azure DevOps
- [ ] Pipeline ejecutado exitosamente (último commit)
- [ ] SonarCloud showing green Quality Gate
- [ ] E2E Tests: 5/5 passing
- [ ] Coverage: 77.31% visible en reportes
- [ ] Artifacts publicados correctamente

**Comando para verificar:**
```bash
# Ver último pipeline
# Ir a: https://dev.azure.com/mfrias42/tp05/_build

# Verificar que muestre:
# ✅ Build - Succeeded
# ✅ Deploy_QA - Succeeded  
# ✅ E2E_Tests - Succeeded
# ✅ Deploy_Production - Manual pending (OK)
```

#### Tests Locales
- [ ] Backend tests: `cd backend && npm test`
- [ ] Backend coverage: `cd backend && npm test -- --coverage`
- [ ] Cypress local: `npm run cypress:open`
- [ ] Frontend build: `cd frontend && npm run build`

#### SonarCloud Dashboard
- [ ] Acceder: https://sonarcloud.io/project/overview?id=mfrias42_tp05
- [ ] Verificar:
  - [ ] Quality Gate: Passed
  - [ ] Bugs: 0 (o cantidad conocida)
  - [ ] Vulnerabilities: 0
  - [ ] Code Smells: < 50
  - [ ] Coverage: 77.31%
  - [ ] Duplications: < 3%

#### Servicios en QA
- [ ] Backend QA: https://repuestera-api-qa.azurewebsites.net/api/health
- [ ] Frontend QA: https://repuestera-web-qa.azurewebsites.net
- [ ] Login funcional: admin@repuestera.com / admin123
- [ ] CRUD productos funcional

---

## 📱 DURANTE LA DEFENSA

### Parte 1: Presentación (5 min)

#### Diapositiva 1: Overview
```
✅ Proyecto: Sistema Repuestera
✅ Stack: React + Node.js + MySQL
✅ CI/CD: Azure DevOps
✅ Testing: Jest (197 tests) + Cypress (5 tests)
✅ Análisis: SonarCloud
✅ Coverage: 77.31% backend
```

#### Diapositiva 2: Arquitectura Pipeline
```
Build → Deploy QA → E2E Tests → Deploy Prod
  ↓         ↓          ↓            ↓
SonarCloud  Health   Quality     Manual
Analysis    Checks    Gates      Approval
```

### Parte 2: Demostraciones (15 min)

#### Demo 1: Ejecutar Pipeline Completo (5 min)
1. Abrir Azure DevOps: https://dev.azure.com/mfrias42/tp05/_build
2. Mostrar último run exitoso
3. Explicar cada stage:
   - **Build:** "Aquí se ejecutan 197 tests de Jest, se genera coverage del 77.31%, y SonarCloud analiza el código"
   - **Deploy QA:** "Despliega backend y frontend a ambiente de QA en Azure"
   - **E2E Tests:** "Ejecuta 5 tests de Cypress validando flujos críticos"
   - **Deploy Prod:** "Requiere aprobación manual, solo se ejecuta si todo lo anterior pasa"
4. Mostrar artifacts:
   - Test results
   - Coverage reports
   - Cypress screenshots

**Script:**
```
"Como pueden ver, el pipeline tiene 4 etapas. En Build ejecutamos 
los tests unitarios y el análisis de SonarCloud. Alcanzamos un 
77.31% de cobertura en el backend, superando el mínimo del 70%. 
Luego desplegamos a QA, ejecutamos pruebas E2E con Cypress, y solo 
si todo pasa permitimos el deploy a producción."
```

#### Demo 2: SonarCloud Dashboard (3 min)
1. Abrir: https://sonarcloud.io/project/overview?id=mfrias42_tp05
2. Mostrar:
   - Quality Gate status
   - Coverage 77.31%
   - Bugs/Vulnerabilities/Code Smells
   - Duplications
   - Security Hotspots
3. Navegar a "Code" tab → mostrar código analizado
4. Ir a "Issues" → explicar uno resuelto

**Script:**
```
"SonarCloud nos da una visión completa de la calidad del código. 
Aquí vemos que pasamos el Quality Gate, tenemos 77% de cobertura, 
y hemos resuelto todos los issues críticos. La herramienta detecta 
vulnerabilidades, bugs y code smells automáticamente en cada commit."
```

#### Demo 3: Cypress Tests en Vivo (4 min)
1. Abrir terminal
2. Ejecutar: `npm run cypress:open`
3. Seleccionar test: `1-crear-producto.cy.js`
4. Mostrar ejecución visual:
   - Login automático
   - Navegación
   - Llenado de formulario
   - Verificación de resultado
5. Cerrar y ejecutar todos: `npm run cypress:run`

**Script:**
```
"Cypress nos permite automatizar pruebas end-to-end simulando un 
usuario real. Este test valida el flujo completo de creación de 
producto: hace login como administrador, llena el formulario con 
datos válidos, y verifica que el producto se cree correctamente. 
Tenemos 5 tests que cubren creación, actualización y validación 
de errores."
```

#### Demo 4: Quality Gate en Acción (3 min)
1. Mostrar código en `azure-pipelines.yml`:
   ```yaml
   # Líneas 391-478: E2E Tests stage
   condition: succeeded() # Solo ejecuta si QA deployment OK
   ```
2. Explicar: "Si cualquier test de Cypress falla, el stage E2E_Tests falla, y Deploy_Production no se ejecuta"
3. Mostrar ejemplo en pipeline anterior (si hay uno con fallo)

**Script:**
```
"Los quality gates son críticos. Configuramos el pipeline para que 
bloquee el deploy a producción si:
1. El coverage cae bajo 70%
2. SonarCloud detecta issues críticos
3. Algún test de Cypress falla
4. Los health checks de QA no responden

Esto nos da confianza de que solo código de calidad llega a usuarios."
```

---

### Parte 3: Preguntas y Respuestas (10 min)

#### Pregunta Esperada 1: "¿Por qué 70% de cobertura y no más?"

**Respuesta:**
```
"Elegimos 70% basándonos en estudios de la industria que muestran 
que es el punto de equilibrio entre costo y beneficio. 

- 50-60%: Muy bajo, demasiado riesgo
- 70-80%: Sweet spot, cubre código crítico
- 90-100%: Costoso, retornos decrecientes

Priorizamos tests en:
1. Lógica de negocio (Product, User models)
2. Rutas de API críticas (auth, products)
3. Validaciones de seguridad

El 23% restante son edge cases, código de inicialización, y 
helpers que no justifican el esfuerzo."
```

#### Pregunta Esperada 2: "¿Cómo decidiste qué testear con Cypress?"

**Respuesta:**
```
"Seguimos la pirámide de testing:
- Base (70%): Unit tests con Jest → Rápidos, baratos
- Medio (20%): Integration tests → Módulos interconectados
- Top (10%): E2E tests con Cypress → Caros, críticos

Los 5 tests de Cypress cubren:
1. Crear producto: Flujo más común de admin
2. Actualizar producto: Segunda operación más frecuente
3. Validar errores: Campos requeridos, duplicados, precios

No testeamos todo con E2E porque:
- Son lentos (~50s por test)
- Son frágiles (cambios UI los rompen)
- Son costosos de mantener

Los reservamos para flujos críticos de negocio."
```

#### Pregunta Esperada 3: "¿Qué mejoras implementarías?"

**Respuesta:**
```
"Con más tiempo, agregaría:

1. Frontend Coverage (70%+)
   - Tests para componentes React
   - Tests para Context/Hooks
   - Integración con React Testing Library

2. Performance Testing
   - k6 o Artillery para load tests
   - Validar que el backend soporte 100 req/s
   - Detectar memory leaks

3. Security Testing
   - OWASP ZAP para vulnerability scanning
   - Snyk para dependencias vulnerables
   - Análisis de secrets en commits

4. Parallel Testing
   - Ejecutar Cypress tests en paralelo
   - Reducir tiempo de E2E de 2min a 30seg

5. Visual Regression Testing
   - Percy o Chromatic para UI changes
   - Detectar cambios visuales no intencionados"
```

#### Pregunta Esperada 4: "¿Cómo manejarías un test intermitente (flaky)?"

**Respuesta:**
```
"Los tests flaky son un problema común. Mi estrategia:

1. Reproducir localmente
   - Ejecutar 10+ veces con --repeat
   - Identificar patrón de fallo

2. Analizar causa raíz
   - Timing issues → Aumentar timeouts
   - Race conditions → Agregar waits explícitos
   - Datos aleatorios → Usar fixtures fijos
   - Network → Mock APIs

3. Soluciones aplicadas en este proyecto:
   - pageLoadTimeout: 60000ms (no 30s)
   - cy.wait(5000) después de login
   - Códigos únicos con timestamp en tests
   - Health checks antes de E2E

4. Si persiste:
   - Aislar el test en suite separada
   - Retry automático (cypress-plugin-retries)
   - Como último recurso: skip temporalmente"
```

#### Pregunta Esperada 5: "¿Qué métricas de SonarCloud son más importantes?"

**Respuesta:**
```
"Priorizamos en este orden:

1. Vulnerabilities (Crítico)
   - Impacto: Seguridad directa
   - Meta: 0 vulnerabilities
   - Ejemplos: SQL injection, XSS, secrets expuestos

2. Bugs (Alto)
   - Impacto: Funcionalidad rota
   - Meta: < 5 bugs
   - Ejemplos: Null pointer, lógica incorrecta

3. Code Smells (Medio)
   - Impacto: Mantenibilidad
   - Meta: < 50 smells
   - Ejemplos: Funciones muy largas, duplicación

4. Coverage (Medio)
   - Impacto: Confianza en cambios
   - Meta: > 70%
   - Nota: No es todo, solo una métrica

5. Duplications (Bajo)
   - Impacto: Deuda técnica
   - Meta: < 3%
   - Se refactoriza gradualmente

El Quality Gate combina todas estas métricas para dar 
un pass/fail binario."
```

---

## 📊 MATERIAL DE APOYO

### Screenshots Preparados
- [ ] Pipeline completo ejecutado
- [ ] SonarCloud Quality Gate: Passed
- [ ] Coverage report: 77.31%
- [ ] Cypress test results: 5/5 passing
- [ ] Health checks QA: 200 OK

### Comandos Rápidos
```bash
# Backend tests
cd backend && npm test

# Backend coverage
cd backend && npm test -- --coverage

# Frontend build
cd frontend && npm run build

# Cypress headless
npm run cypress:run

# Cypress visual
npm run cypress:open

# SonarScanner (local)
npm run sonar

# Check services
curl https://repuestera-api-qa.azurewebsites.net/api/health
```

### URLs Críticas
```
Azure Pipeline:
https://dev.azure.com/mfrias42/tp05/_build

SonarCloud Dashboard:
https://sonarcloud.io/project/overview?id=mfrias42_tp05

Backend QA:
https://repuestera-api-qa.azurewebsites.net

Frontend QA:
https://repuestera-web-qa.azurewebsites.net

GitHub Repo:
https://github.com/mfrias42/Repuestera
```

---

## 🎤 TIPS DE DEFENSA

### DO ✅
- Hablar con confianza y claridad
- Mostrar el código funcionando EN VIVO
- Explicar decisiones técnicas con fundamento
- Admitir limitaciones y proponer mejoras
- Usar términos técnicos correctos
- Responder conciso y directo

### DON'T ❌
- Leer diapositivas textualmente
- Decir "no sé" sin intentar razonar
- Culpar a herramientas por problemas
- Exagerar o mentir sobre implementación
- Ir sin haber probado demos antes
- Divagar sin responder la pregunta

### Frases Clave
- "Como pueden ver en el dashboard..."
- "Esta decisión se basó en..."
- "El trade-off aquí es..."
- "En producción agregaría..."
- "La razón técnica es..."

---

## ⏱️ TIMELINE SUGERIDO

```
00:00 - 00:05  |  Introducción + Overview del proyecto
00:05 - 00:10  |  Demo Pipeline en Azure DevOps
00:10 - 00:13  |  Demo SonarCloud Dashboard
00:13 - 00:17  |  Demo Cypress Tests (visual)
00:17 - 00:20  |  Explicación Quality Gates
00:20 - 00:30  |  Preguntas y Respuestas
```

**Total:** 30 minutos

---

## 🚨 PLAN B (Si algo falla)

### Si el pipeline está fallando
- Mostrar último run exitoso
- Explicar la causa del fallo actual
- Demostrar que sabes debuggearlo

### Si SonarCloud no carga
- Mostrar screenshots preparados
- Explicar la configuración del archivo `.properties`
- Mostrar reportes locales de coverage

### Si Cypress falla en vivo
- Ejecutar headless: `npm run cypress:run`
- Mostrar video grabado de ejecución exitosa
- Explicar que en CI/CD siempre pasa

### Si no hay internet
- Tener screenshots/videos listos offline
- Reporte de coverage HTML descargado
- Logs del pipeline exportados

---

## ✅ CHECKLIST FINAL (1 día antes)

- [ ] Pipeline ejecutado exitosamente
- [ ] 5 tests Cypress: 100% passing
- [ ] SonarCloud: Quality Gate passed
- [ ] Backend coverage: 77.31%
- [ ] Todas las URLs funcionando
- [ ] Screenshots tomados y guardados
- [ ] Videos de Cypress guardados
- [ ] Laptop cargada 100%
- [ ] Internet backup (mobile hotspot)
- [ ] Código committed y pushed
- [ ] Documentación reviewed
- [ ] Respuestas a preguntas practicadas
- [ ] Demos probadas 2+ veces

---

## 🎯 MENSAJE FINAL

**Recuerda:**
- Conoces tu proyecto mejor que nadie
- Has implementado TODO lo requerido
- Tienes evidencia sólida (77.31% coverage, 5 tests E2E, SonarCloud)
- La defensa es solo explicar lo que ya funciona

**Confianza:**
Tu implementación es SÓLIDA. El pipeline funciona, los tests pasan, 
la documentación es completa. Solo falta que lo demuestres con claridad.

**¡Éxito en la defensa! 🚀**

---

**Documento preparado para:** Defensa TP07  
**Fecha:** 11/11/2025  
**Tiempo de preparación sugerido:** 2 horas  
**Resultado esperado:** 92-96% (A/A+)
