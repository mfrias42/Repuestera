# Documentación de Pruebas E2E con Cypress

## Descripción General

Este documento describe las pruebas de integración end-to-end (E2E) implementadas con Cypress para validar los flujos críticos de la aplicación Repuestera.

## Instalación y Configuración

### Prerequisitos
- Node.js v14 o superior
- Backend corriendo en `http://localhost:8000`
- Frontend corriendo en `http://localhost:3000`
- Base de datos MySQL configurada y con usuario admin creado

### Instalación de Cypress
```bash
npm install --save-dev cypress
```

### Configuración
El archivo `cypress.config.js` contiene la configuración base de Cypress.

## Escenarios de Prueba Implementados

### 1. Flujo de Creación de Producto (`crear-producto-admin.cy.js`)

**Objetivo:** Validar que un administrador pueda crear un nuevo producto correctamente.

**Pasos del Test:**
1. Navegación a la página de login (`/login`)
2. Ingreso de credenciales de administrador
   - Email: `admin@repuestera.com`
   - Password: `admin123`
3. Activación del switch "Iniciar como administrador"
4. Submit del formulario de login
5. Verificación de redirección a `/admin`
6. Click en el botón "Nuevo Producto"
7. Completado del formulario con datos de prueba:
   - Nombre: "Producto Cypress Test"
   - Código: Generado dinámicamente con timestamp para evitar duplicados
   - Precio: 150.50
   - Stock: 20
   - Descripción: "Producto creado por test E2E de Cypress"
8. Click en el botón "Guardar"
9. Verificación de que el producto aparece en la interfaz

**Resultado Esperado:** El producto se crea exitosamente y aparece en la tabla de productos.

**Estado:** ✅ PASSING

---

### 2. Flujo de Actualización de Producto (`actualizar-producto-admin.cy.js`)

**Objetivo:** Validar que un administrador pueda actualizar un producto existente.

**Pasos del Test:**
1. Login como administrador (usando `beforeEach`)
2. Espera para que cargue la tabla de productos
3. Click en el botón de editar del primer producto de la tabla
4. Verificación de que se abre el diálogo "Editar Producto"
5. Modificación de campos:
   - Nombre: "Producto Actualizado por Cypress"
   - Stock: 50
6. Click en "Guardar"
7. Verificación de que el producto actualizado aparece en la tabla

**Resultado Esperado:** El producto se actualiza correctamente con los nuevos valores.

**Estado:** ⚠️ REQUIERE AJUSTES (selector de botón de editar)

---

### 3. Validación de Errores (`validacion-errores-producto.cy.js`)

**Objetivo:** Validar el manejo correcto de errores en la integración frontend-backend.

#### Test 3.1: Validación de Campos Requeridos
**Pasos:**
1. Login como administrador
2. Click en "Nuevo Producto"
3. Intento de guardar sin completar campos requeridos
4. Verificación de que el formulario no se envía y el diálogo permanece abierto

**Resultado Esperado:** El navegador/aplicación no permite enviar el formulario sin los campos requeridos.

**Estado:** ✅ PASSING

#### Test 3.2: Código Duplicado
**Pasos:**
1. Creación de un producto con un código específico
2. Intento de crear otro producto con el mismo código
3. Verificación de que aparece un mensaje de error o el diálogo permanece abierto

**Resultado Esperado:** La aplicación previene la creación de productos con códigos duplicados.

**Estado:** ⚠️ REQUIERE VALIDACIÓN BACKEND

#### Test 3.3: Validación de Precio Positivo
**Pasos:**
1. Intento de crear un producto con precio negativo
2. Verificación de que el formulario no se envía

**Resultado Esperado:** El formulario valida que el precio debe ser un número positivo.

**Estado:** ✅ PASSING

---

## Ejecución de las Pruebas

### Modo Interactivo (con interfaz gráfica)
```bash
npx cypress open
```

### Modo Headless (sin interfaz)
```bash
# Todos los tests
npx cypress run

# Tests específicos de productos
npx cypress run --spec "cypress/e2e/*-producto*.cy.js"

# Un test específico
npx cypress run --spec "cypress/e2e/crear-producto-admin.cy.js"
```

## Estructura de Archivos

```
cypress/
├── e2e/
│   ├── crear-producto-admin.cy.js           # Test de creación
│   ├── actualizar-producto-admin.cy.js      # Test de actualización
│   └── validacion-errores-producto.cy.js    # Tests de validación de errores
├── fixtures/
│   └── example.json                         # Datos de prueba
├── support/
│   ├── commands.js                          # Comandos personalizados
│   └── e2e.js                              # Configuración global
└── screenshots/                             # Screenshots de tests fallidos (generados automáticamente)
```

## Comandos Personalizados

Puedes agregar comandos personalizados en `cypress/support/commands.js` para reutilizar lógica común, por ejemplo:

```javascript
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('http://localhost:3000/login');
  cy.get('input[name="email"]').type('admin@repuestera.com');
  cy.get('input[name="password"]').type('admin123');
  cy.get('input[name="isAdmin"]').click({ force: true });
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin', { timeout: 10000 });
});
```

## Buenas Prácticas Implementadas

1. **Uso de `beforeEach`**: Para reducir código duplicado en tests que requieren autenticación.
2. **Selectores robustos**: Uso de selectores por atributos (`name`, `role`) en lugar de clases CSS.
3. **Timeouts apropiados**: Configuración de timeouts donde es necesario para esperar operaciones asíncronas.
4. **Códigos únicos**: Generación de códigos con timestamps para evitar conflictos entre ejecuciones.
5. **Esperas explícitas**: Uso de `cy.wait()` para operaciones que requieren tiempo de procesamiento.

## Problemas Conocidos y Soluciones

### 1. Material-UI Select
**Problema:** Los componentes Select de Material-UI tienen `pointer-events: none` en el input.
**Solución:** Usar `{ force: true }` o hacer click en el contenedor padre.

### 2. Validación de Duplicados
**Problema:** La validación de códigos duplicados puede no estar implementada en el backend.
**Solución:** Implementar validación en el backend o ajustar el test para verificar el comportamiento actual.

## Resultados de Ejecución

**Última ejecución:** 
- Total de tests: 5
- Pasando: 3 ✅
- Fallando: 2 ⚠️
- Porcentaje de éxito: 60%

## Próximos Pasos

1. ✅ Implementar test de creación de producto
2. ✅ Implementar test de actualización de producto
3. ✅ Implementar tests de validación de errores
4. ⏳ Ajustar selector de botón de editar
5. ⏳ Implementar validación de duplicados en backend
6. ⏳ Agregar comandos personalizados para login
7. ⏳ Configurar integración con CI/CD

## Integración con CI/CD

Para integrar estos tests en un pipeline de CI/CD (Azure Pipelines, GitHub Actions, etc.), asegúrate de:

1. Instalar dependencias: `npm ci`
2. Levantar el backend y frontend antes de ejecutar tests
3. Ejecutar Cypress en modo headless: `npx cypress run`
4. Guardar screenshots y videos como artefactos en caso de fallos

Ejemplo para Azure Pipelines:
```yaml
- script: npm ci
  displayName: 'Install dependencies'

- script: npm run start:backend &
  displayName: 'Start backend'

- script: npm run start:frontend &
  displayName: 'Start frontend'

- script: npx cypress run
  displayName: 'Run E2E tests'

- task: PublishTestResults@2
  inputs:
    testResultsFiles: 'cypress/results/*.xml'
  condition: always()
```

## Contacto y Soporte

Para preguntas o problemas con los tests E2E, contactar al equipo de desarrollo.
