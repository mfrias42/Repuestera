# 🚀 Guía Rápida: Ejecutar Tests E2E de Cypress

## Paso 1: Verificar que todo está instalado

```bash
# Verifica que Cypress está instalado
npx cypress --version
```

## Paso 2: Levantar el Backend

Abre una terminal y ejecuta:

```bash
cd "/Users/martinabecerra/Documents/UCC/4/Ingenieria de Software III/Repuestera/Repuestera/backend"
npm run dev
```

✅ Deberías ver algo como: `Servidor corriendo en puerto 8000`

## Paso 3: Levantar el Frontend

Abre **otra terminal** y ejecuta:

```bash
cd "/Users/martinabecerra/Documents/UCC/4/Ingenieria de Software III/Repuestera/Repuestera/frontend"
npm start
```

✅ El navegador debería abrirse automáticamente en `http://localhost:3000`

## Paso 4: Ejecutar Cypress

Abre **una tercera terminal** y ejecuta:

```bash
cd "/Users/martinabecerra/Documents/UCC/4/Ingenieria de Software III/Repuestera/Repuestera"
npm run cypress:open
```

## Paso 5: En la ventana de Cypress

1. Haz clic en **"E2E Testing"**
2. Selecciona **Chrome** como navegador
3. Verás una lista de tests:
   - `0-smoke-test.cy.js` - Test básico (empieza por este)
   - `1-crear-producto.cy.js` - Tests de registro
   - `2-actualizar-producto.cy.js` - Tests de carrito
   - `3-validacion-errores.cy.js` - Tests de validación

4. Haz clic en cualquier test para ejecutarlo

## 🎯 Primer Test Recomendado

Ejecuta primero **`0-smoke-test.cy.js`** para verificar que todo funciona.

Este test simplemente:
- ✅ Carga la página de login
- ✅ Verifica que los campos están visibles
- ✅ Carga la página de registro

Si este test pasa, los demás deberían funcionar también.

## ⚠️ Antes de ejecutar los tests que requieren login

Necesitas crear un usuario de prueba en tu base de datos:

```sql
INSERT INTO usuarios (nombre, email, password, telefono, direccion, rol)
VALUES (
  'Usuario Test',
  'test@test.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- Hash de 'password123'
  '1234567890',
  'Calle Test 123',
  'cliente'
);
```

O simplemente regístrate manualmente en la aplicación con:
- Email: `test@test.com`
- Password: `password123`

## 📹 Ejecutar Tests en Modo Headless (sin ventana)

Si quieres ejecutar todos los tests de una vez sin abrir ventanas:

```bash
npm run cypress:run
```

Los resultados aparecerán en la terminal y se generarán videos en `cypress/videos/`.

## 🐛 Si algo falla

1. **Verifica que el backend esté corriendo** en puerto 8000
2. **Verifica que el frontend esté corriendo** en puerto 3000
3. **Revisa la consola del navegador** en Cypress para ver errores
4. **Mira los screenshots** en `cypress/screenshots/` si un test falla

## 📊 Resultados Esperados

- ✅ 0-smoke-test.cy.js: **3 tests passing**
- ✅ 1-crear-producto.cy.js: **3 tests passing**
- ✅ 2-actualizar-producto.cy.js: **4 tests passing**
- ✅ 3-validacion-errores.cy.js: **8 tests passing**

**Total: 18 tests E2E** 🎉

## 💡 Consejos

- Los tests son **independientes** - puedes ejecutarlos en cualquier orden
- Si un test falla, Cypress toma un **screenshot automáticamente**
- Usa el **selector de pruebas** en Cypress para ver paso a paso qué hace cada test
- Los tests limpian el `localStorage` antes de ejecutarse

---

¿Todo listo? ¡Adelante! 🚀
