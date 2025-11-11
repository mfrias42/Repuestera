# Guía Rápida - Próximos Pasos

## ✅ Lo que ya está hecho

1. **Tests E2E con Cypress**: 5 tests funcionando al 100%
2. **Documentación completa**: Tests E2E y SonarCloud
3. **Configuración de SonarCloud**: Archivo `sonar-project.properties` listo
4. **Scripts npm**: Para ejecutar tests, cobertura y análisis

## 🚀 Siguiente: Configurar SonarCloud (5-10 minutos)

### Paso 1: Crear cuenta en SonarCloud

1. Ve a https://sonarcloud.io
2. Clic en "Log in" → "Log in with GitHub"
3. Autoriza SonarCloud

### Paso 2: Importar proyecto

1. Clic en "+" (esquina superior derecha)
2. "Analyze new project"
3. Selecciona organización `mfrias42`
4. Selecciona repositorio `Repuestera`
5. Clic en "Set Up"

### Paso 3: Configurar análisis

1. Selecciona "With GitHub Actions" o "Manually"
2. Si eliges "Manually", sigue estas instrucciones:

**Generar Token:**
- My Account → Security → Generate Token
- Nombre: "Repuestera-Local"
- Copia el token

**Configurar en GitHub (para CI/CD):**
- Repositorio → Settings → Secrets and variables → Actions
- New repository secret
- Nombre: `SONAR_TOKEN`
- Valor: (pega el token)

### Paso 4: Ejecutar primer análisis

```bash
# 1. Generar reportes de cobertura
npm run test:coverage

# 2. Instalar SonarScanner (si no lo tienes)
brew install sonar-scanner

# 3. Ejecutar análisis
sonar-scanner \
  -Dsonar.projectKey=mfrias42_tp05 \
  -Dsonar.organization=mfrias42 \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=TU_TOKEN_AQUI
```

O simplemente:
```bash
npm run sonar
```

### Paso 5: Revisar resultados

1. Ve a https://sonarcloud.io
2. Abre tu proyecto "Repuestera"
3. Revisa:
   - Quality Gate (debe ser "Passed")
   - Bugs, Vulnerabilities, Code Smells
   - Coverage
   - Duplications

## 📝 Comandos Útiles

### Tests E2E
```bash
# Ver tests en interfaz gráfica
npm run cypress:open

# Ejecutar todos los tests
npm run cypress:run

# Ejecutar solo tests de productos
npx cypress run --spec "cypress/e2e/*-producto*.cy.js"
```

### Cobertura
```bash
# Backend + Frontend
npm run test:coverage

# Ver reporte backend en navegador
open backend/coverage/lcov-report/index.html

# Ver reporte frontend en navegador
open frontend/coverage/lcov-report/index.html
```

### SonarCloud
```bash
# Análisis completo (después de configurar)
npm run test:coverage && npm run sonar
```

## 📚 Documentación Disponible

- `DOCUMENTACION_TESTS_E2E.md` - Guía completa de tests E2E
- `DOCUMENTACION_SONARCLOUD.md` - Guía completa de SonarCloud
- `RESUMEN_IMPLEMENTACION.md` - Resumen ejecutivo del trabajo

## ✅ Checklist Final

- [x] Instalar y configurar Cypress
- [x] Desarrollar 3+ tests E2E (5 implementados)
- [x] Documentar escenarios de prueba
- [x] Configurar archivo sonar-project.properties
- [ ] Crear cuenta en SonarCloud
- [ ] Importar proyecto en SonarCloud
- [ ] Ejecutar primer análisis
- [ ] Revisar y documentar resultados
- [ ] Integrar en pipeline CI/CD (opcional pero recomendado)

## 🎯 Criterios de Evaluación del TP

### Pruebas de Integración E2E (25 puntos)
- ✅ Instalar y configurar Cypress
- ✅ Desarrollar al menos 3 casos de prueba (5 implementados):
  - ✅ Flujo completo de creación de registro
  - ✅ Flujo completo de actualización de registro
  - ✅ Validación de integración frontend-backend para manejo de errores
- ✅ Documentar escenarios de prueba

### Análisis Estático con SonarCloud
- ✅ Configurar SonarCloud
- ⏳ Utilizar para análisis estático
- ⏳ Interpretar reportes de calidad y vulnerabilidades
- ⏳ Integrar en pipeline CI/CD

## 💡 Tips

1. **Para los tests E2E**: Ya están todos funcionando, solo asegúrate de tener backend y frontend corriendo cuando los ejecutes

2. **Para SonarCloud**: El paso más importante es generar el token y configurarlo correctamente

3. **Para el informe**: Toma screenshots de:
   - Tests de Cypress pasando (interfaz gráfica)
   - Dashboard de SonarCloud
   - Quality Gate
   - Métricas de cobertura

## 🆘 Si algo falla

### Tests E2E no pasan
```bash
# Verifica que estén corriendo:
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
cd frontend && npm start

# Terminal 3: Cypress
npm run cypress:open
```

### SonarCloud no analiza
```bash
# Verifica que tengas cobertura generada
ls backend/coverage/lcov.info
ls frontend/coverage/lcov.info

# Si no existen, genera cobertura primero
npm run test:coverage
```

### Error de autenticación en SonarCloud
- Verifica que el token sea válido
- Verifica que la organización y projectKey sean correctos
- Revisa `sonar-project.properties`

## 📧 Contacto

Si tienes dudas, revisa la documentación completa en:
- `DOCUMENTACION_TESTS_E2E.md`
- `DOCUMENTACION_SONARCLOUD.md`

¡Éxito con el trabajo práctico! 🚀
