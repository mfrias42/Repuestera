# Configuración y Uso de SonarCloud

## Descripción

SonarCloud es una plataforma de análisis estático de código que detecta bugs, vulnerabilidades, code smells y problemas de seguridad en tu código. Este documento describe cómo configurar y usar SonarCloud en el proyecto Repuestera.

## Configuración Inicial

### 1. Crear Cuenta en SonarCloud

1. Ve a [https://sonarcloud.io](https://sonarcloud.io)
2. Haz clic en "Log in"
3. Selecciona "Log in with GitHub"
4. Autoriza a SonarCloud a acceder a tu cuenta de GitHub

### 2. Importar Organización y Proyecto

1. Una vez autenticado, haz clic en el "+" en la esquina superior derecha
2. Selecciona "Analyze new project"
3. Selecciona tu organización de GitHub (`mfrias42`)
4. Selecciona el repositorio `Repuestera`
5. Elige el método de análisis: "With GitHub Actions" o "Manually"

### 3. Obtener Token de Autenticación

1. Ve a tu perfil en SonarCloud (esquina superior derecha)
2. Haz clic en "My Account" → "Security"
3. En la sección "Generate Tokens", ingresa un nombre (ej: "Repuestera-CI")
4. Haz clic en "Generate"
5. **COPIA EL TOKEN** (solo se muestra una vez)

### 4. Configurar Token como Secret en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Haz clic en "New repository secret"
4. Nombre: `SONAR_TOKEN`
5. Valor: Pega el token que copiaste
6. Haz clic en "Add secret"

## Configuración del Proyecto

### Archivo `sonar-project.properties`

El proyecto ya tiene configurado el archivo `sonar-project.properties` con:

```properties
sonar.projectKey=mfrias42_tp05
sonar.organization=mfrias42

# Rutas a los archivos fuente
sonar.sources=frontend/src,backend
sonar.tests=backend/__tests__

# Excluir archivos innecesarios
sonar.exclusions=**/node_modules/**,**/coverage/**,**/build/**,**/*.test.js,**/__tests__/**,**/setupTests.js,**/reportWebVitals.js,**/scripts/**,**/config/**

# Reportes de cobertura
sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info

# Configuración general
sonar.sourceEncoding=UTF-8
sonar.host.url=https://sonarcloud.io
```

### Ajustes Necesarios

Verifica que `sonar.projectKey` y `sonar.organization` coincidan con los valores de tu proyecto en SonarCloud.

## Ejecución del Análisis

### Opción 1: Ejecución Manual Local

Para ejecutar el análisis localmente, necesitas instalar SonarScanner:

#### Instalación de SonarScanner (macOS)

```bash
brew install sonar-scanner
```

#### Ejecutar Análisis

```bash
# Generar reportes de cobertura primero
cd backend
npm test -- --coverage
cd ..

cd frontend
npm test -- --coverage
cd ..

# Ejecutar análisis de SonarCloud
sonar-scanner \
  -Dsonar.projectKey=mfrias42_tp05 \
  -Dsonar.organization=mfrias42 \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=TU_TOKEN_AQUI
```

### Opción 2: Integración con GitHub Actions (Recomendado)

Ya tienes configurado Azure Pipelines, pero si quieres agregar SonarCloud a GitHub Actions:

1. Crea el archivo `.github/workflows/sonarcloud.yml`:

```yaml
name: SonarCloud Analysis

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarcloud:
    name: SonarCloud
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Shallow clones should be disabled for better analysis
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies - Backend
        run: |
          cd backend
          npm ci
      
      - name: Install dependencies - Frontend
        run: |
          cd frontend
          npm ci
      
      - name: Run tests with coverage - Backend
        run: |
          cd backend
          npm test -- --coverage
      
      - name: Run tests with coverage - Frontend
        run: |
          cd frontend
          npm test -- --coverage
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Opción 3: Integración con Azure Pipelines

Agrega estos pasos a tu `azure-pipelines.yml`:

```yaml
# Después de ejecutar los tests con cobertura

- task: SonarCloudPrepare@1
  inputs:
    SonarCloud: 'SonarCloud'
    organization: 'mfrias42'
    scannerMode: 'CLI'
    configMode: 'file'

- task: SonarCloudAnalyze@1

- task: SonarCloudPublish@1
  inputs:
    pollingTimeoutSec: '300'
```

## Interpretar Reportes de SonarCloud

### Quality Gate

SonarCloud evalúa tu código con un "Quality Gate" que incluye:

- **Bugs**: Errores de lógica que pueden causar comportamiento incorrecto
- **Vulnerabilities**: Problemas de seguridad
- **Code Smells**: Problemas de mantenibilidad
- **Coverage**: Porcentaje de código cubierto por tests
- **Duplications**: Código duplicado

### Métricas Principales

1. **Reliability Rating** (A-E)
   - Basado en la severidad y cantidad de bugs
   - A = 0 bugs
   - E = Al menos 1 bug bloqueante

2. **Security Rating** (A-E)
   - Basado en vulnerabilidades de seguridad
   - A = 0 vulnerabilidades
   - E = Al menos 1 vulnerabilidad bloqueante

3. **Maintainability Rating** (A-E)
   - Basado en la deuda técnica
   - A = deuda técnica < 5%
   - E = deuda técnica > 50%

4. **Coverage**
   - Porcentaje de líneas cubiertas por tests
   - Objetivo recomendado: > 80%

5. **Duplications**
   - Porcentaje de código duplicado
   - Objetivo recomendado: < 3%

### Cómo Revisar Issues

1. Accede a tu proyecto en SonarCloud
2. Ve a la pestaña "Issues"
3. Filtra por:
   - **Type**: Bug, Vulnerability, Code Smell
   - **Severity**: Blocker, Critical, Major, Minor, Info
   - **Tag**: Específico del tipo de problema

4. Para cada issue:
   - Lee la descripción
   - Revisa el código afectado
   - Consulta la explicación y el ejemplo
   - Aplica la solución recomendada

### Ejemplo de Solución de Issues Comunes

#### 1. Code Smell: "Functions should not be too complex"

**Problema**: Una función tiene demasiada complejidad ciclomática.

**Solución**: Refactorizar dividiendo la función en funciones más pequeñas.

```javascript
// Antes (complejo)
function processUser(user) {
  if (user.isActive) {
    if (user.hasPermission) {
      if (user.emailVerified) {
        // lógica compleja
      }
    }
  }
}

// Después (simple)
function processUser(user) {
  if (!canProcessUser(user)) return;
  executeUserProcessing(user);
}

function canProcessUser(user) {
  return user.isActive && user.hasPermission && user.emailVerified;
}

function executeUserProcessing(user) {
  // lógica de procesamiento
}
```

#### 2. Security: "Expressions should not be too complex"

**Problema**: Usar `eval()` o código dinámico inseguro.

**Solución**: Evitar `eval()` y usar alternativas seguras.

#### 3. Bug: "Variables should be initialized"

**Problema**: Variable usada antes de ser inicializada.

**Solución**: Inicializar todas las variables al declararlas.

## Métricas de Calidad Objetivo

Para el proyecto Repuestera, establecemos estos objetivos:

| Métrica | Objetivo | Estado Actual |
|---------|----------|---------------|
| Bugs | 0 | - |
| Vulnerabilities | 0 | - |
| Code Smells | < 10 | - |
| Coverage | > 80% | - |
| Duplications | < 3% | - |
| Reliability Rating | A | - |
| Security Rating | A | - |
| Maintainability Rating | A | - |

## Comandos Útiles

### Generar Cobertura de Código

```bash
# Backend
cd backend
npm test -- --coverage

# Frontend
cd frontend
npm test -- --coverage
```

### Ver Reporte de Cobertura Local

```bash
# Backend
open backend/coverage/lcov-report/index.html

# Frontend
open frontend/coverage/lcov-report/index.html
```

### Limpiar Archivos de Cobertura

```bash
# Backend
rm -rf backend/coverage

# Frontend
rm -rf frontend/coverage
```

## Buenas Prácticas

1. **Ejecutar análisis regularmente**: Al menos antes de cada merge a main
2. **Revisar nuevos issues**: No permitir que se acumulen
3. **Mantener coverage alto**: Escribir tests para código nuevo
4. **Refactorizar code smells**: Dedicar tiempo a mejorar la calidad
5. **No ignorar warnings**: Aunque no bloqueen, son importantes
6. **Documentar decisiones**: Si decides ignorar un issue, documenta por qué

## Integración en el Flujo de Trabajo

1. **Desarrollo local**:
   - Escribir código
   - Escribir tests
   - Ejecutar tests con coverage
   - Revisar cobertura local

2. **Antes de commit**:
   - Ejecutar linter
   - Ejecutar tests
   - Verificar que no hay errores

3. **En Pull Request**:
   - CI ejecuta tests automáticamente
   - SonarCloud analiza el código
   - Revisar reporte de SonarCloud
   - Corregir issues antes de merge

4. **Después de merge**:
   - Verificar Quality Gate en main
   - Actualizar documentación si es necesario

## Solución de Problemas

### "Analysis failed: No coverage report found"

**Solución**: Asegúrate de ejecutar los tests con coverage antes del análisis:
```bash
npm test -- --coverage
```

### "Project key already exists"

**Solución**: Verifica que el `projectKey` en `sonar-project.properties` coincida con tu proyecto en SonarCloud.

### "Authentication failed"

**Solución**: Verifica que el token de SonarCloud sea válido y esté configurado correctamente.

## Referencias

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [SonarQube JavaScript Rules](https://rules.sonarsource.com/javascript)
- [SonarCloud Quality Gates](https://docs.sonarcloud.io/improving/quality-gates/)

## Próximos Pasos

1. ✅ Configurar cuenta de SonarCloud
2. ✅ Importar proyecto
3. ✅ Configurar token
4. ⏳ Ejecutar primer análisis
5. ⏳ Revisar y corregir issues
6. ⏳ Integrar en pipeline de CI/CD
7. ⏳ Establecer Quality Gate personalizado
