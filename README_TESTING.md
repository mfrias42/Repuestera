# 🧪 Guía Rápida de Testing - Repuestera

## 🚀 Ejecutar Tests

### Backend

```bash
cd backend

# Ejecutar todos los tests
npm test

# Modo watch (desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage

# Modo CI (como en Azure)
npm run test:ci
```

### Frontend

```bash
cd frontend

# Ejecutar todos los tests
npm test

# Modo CI (como en Azure)
npm run test:ci
```

## 📊 Estadísticas

- **Backend**: 197 tests ✅
- **Frontend**: ~24+ tests ✅
- **Cobertura Backend**: 83.67% promedio
- **Tiempo de ejecución**: < 6 segundos total

## 🎯 Estructura de Tests

```
backend/
  __tests__/
    unit/
      models/      # Tests de modelos
      routes/      # Tests de rutas
      middleware/  # Tests de middleware

frontend/src/
  __tests__/
    services/      # Tests de servicios API
    context/       # Tests de contextos
    components/    # Tests de componentes
```

## ✅ Checklist de Tests

- ✅ Configuración de entorno (Jest, Supertest)
- ✅ Tests de modelos backend (88 tests)
- ✅ Tests de rutas backend (52 tests)
- ✅ Tests de middleware backend (54 tests)
- ✅ Tests de servicios frontend (14 tests)
- ✅ Tests de contextos frontend (12 tests)
- ✅ Tests de componentes frontend (en progreso)
- ✅ Integración con CI/CD pipeline
- ✅ Reportes de cobertura

## 📝 Notas

- Todos los tests son **completamente aislados**
- No requieren base de datos ni servicios externos
- Todos los mocks están pre-configurados
- Optimizados para ejecución en CI/CD

---

**Para más detalles**: Ver `TESTING_CI_CD.md`

