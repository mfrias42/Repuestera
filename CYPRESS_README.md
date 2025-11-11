# Documentación de Tests E2E con Cypress - TP7

## 📋 Resumen de Tests Implementados

Se han implementado **3 archivos de tests E2E** que cubren los requerimientos del TP7:

### 1. **1-crear-producto.cy.js** - Flujo de Creación de Registros
- ✅ Test de registro de nuevo usuario
- ✅ Validación de email duplicado
- ✅ Validación de coincidencia de contraseñas

### 2. **2-actualizar-producto.cy.js** - Flujo de Actualización de Registros
- ✅ Agregar productos al carrito
- ✅ Actualizar cantidad de productos en el carrito
- ✅ Eliminar productos del carrito
- ✅ Cálculo correcto del total

### 3. **3-validacion-errores.cy.js** - Validación de Errores Frontend-Backend
- ✅ Error 500 (servidor no disponible)
- ✅ Error 401 (no autorizado)
- ✅ Validación de campos requeridos
- ✅ Validación de formato de email
- ✅ Indicador de loading
- ✅ Protección de rutas
- ✅ Validación de stock
- ✅ Funcionalidad de logout

**Total: 15 tests E2E implementados** ✨

## 🚀 Cómo Ejecutar los Tests

### Opción 1: Modo Interactivo (Recomendado para desarrollo)

1. **Levantar el backend** (en una terminal):
```bash
cd backend
npm run dev
```

2. **Levantar el frontend** (en otra terminal):
```bash
cd frontend
npm start
```

3. **Abrir Cypress** (en una tercera terminal):
```bash
npm run cypress:open
```

4. En la interfaz de Cypress, selecciona **E2E Testing** → **Chrome** → Elige el test que quieras ejecutar

### Opción 2: Modo Headless (Para CI/CD)

```bash
npm run cypress:run
```

### Opción 3: Con Chrome visible

```bash
npm run cypress:run:headed
```

### Opción 4: Ejecutar todo automáticamente

Este comando levanta los servidores y ejecuta los tests automáticamente:

```bash
npm run e2e
```

## 📁 Estructura de Archivos Cypress

```
cypress/
├── e2e/
│   ├── 1-crear-producto.cy.js      # Tests de creación
│   ├── 2-actualizar-producto.cy.js # Tests de actualización
│   └── 3-validacion-errores.cy.js  # Tests de validación
├── fixtures/                        # Datos de prueba
├── support/
│   ├── commands.js                  # Comandos personalizados
│   └── e2e.js                       # Configuración global
└── cypress.config.js                # Configuración principal
```

## 🛠️ Comandos Personalizados Disponibles

### `cy.login(email, password)`
Realiza el login de un usuario.
```javascript
cy.login('test@test.com', 'password123');
```

### `cy.addToCart(productIndex)`
Agrega un producto al carrito.
```javascript
cy.addToCart(0); // Agrega el primer producto
```

### `cy.goToCart()`
Navega al carrito.
```javascript
cy.goToCart();
```

### `cy.register(userData)`
Registra un nuevo usuario.
```javascript
cy.register({
  nombre: 'Test User',
  email: 'test@test.com',
  password: 'Test123456'
});
```

## ⚙️ Configuración

El archivo `cypress.config.js` está configurado con:
- **baseUrl**: `http://localhost:3000` (Frontend)
- **apiUrl**: `http://localhost:8000/api` (Backend)
- **Viewport**: 1280x720
- **Video**: Activado para debugging
- **Screenshots**: En caso de fallos
- **Timeouts**: 10 segundos

## 📊 Reportes

Después de ejecutar los tests con `npm run cypress:run`, encontrarás:
- **Videos** en `cypress/videos/`
- **Screenshots** (si hay fallos) en `cypress/screenshots/`

## 🔧 Requisitos Previos

Asegúrate de tener:
1. ✅ Base de datos MySQL configurada y corriendo
2. ✅ Variables de entorno configuradas en `/backend/.env`
3. ✅ Usuario de prueba creado en la base de datos:
   - Email: `test@test.com`
   - Password: `password123`
4. ✅ Productos cargados en la base de datos

## 📝 Notas Importantes

- Los tests usan `data-testid` para seleccionar elementos. Si fallan, verifica que los componentes tengan estos atributos.
- Algunos tests usan `cy.intercept()` para simular errores del backend.
- Los tests limpian el `localStorage` antes de ejecutarse para evitar interferencias.

## 🐛 Troubleshooting

### Los tests fallan porque no encuentra elementos

Verifica que:
1. El frontend esté corriendo en `http://localhost:3000`
2. El backend esté corriendo en `http://localhost:8000`
3. Los selectores CSS coincidan con tu código

### Error de timeout

Aumenta los timeouts en `cypress.config.js`:
```javascript
defaultCommandTimeout: 15000,
requestTimeout: 15000,
```

### Tests pasan localmente pero fallan en CI/CD

Asegúrate de que en el pipeline:
1. La base de datos esté disponible
2. Las variables de entorno estén configuradas
3. Los servidores tengan tiempo suficiente para iniciar

## 📚 Documentación Adicional

- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API](https://docs.cypress.io/api/table-of-contents)
- [Material-UI Testing](https://mui.com/material-ui/guides/testing/)

## ✅ Checklist TP7

- [x] Punto 1: Code Coverage implementado (77.31%)
- [x] Punto 2: SonarCloud configurado (Quality Gate PASSED)
- [x] Punto 3: Tests E2E con Cypress (15 tests)
- [ ] Punto 4: Integración en pipeline CI/CD (próximo paso)

---

**Última actualización**: 10 de noviembre de 2025
