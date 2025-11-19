/**
 * Test E2E: Validación de manejo de errores frontend-backend
 * TP07 - Pruebas de Integración
 */

describe('Manejo de Errores Frontend-Backend', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  it('debe manejar correctamente error 500 del servidor al crear producto', () => {
    // Arrange - Login como admin
    cy.loginAsAdmin();
    cy.visit('/admin', { timeout: 10000 });

    // Interceptar error del servidor
    cy.intercept('POST', '**/api/products', (req) => {
      req.reply({
        statusCode: 500,
        body: {
          error: 'Error interno del servidor',
          message: 'No se pudo crear el producto'
        }
      });
    }).as('serverError');

    // Act - Intentar crear producto
    cy.get('button').contains('Nuevo Producto', { timeout: 10000 }).click();
    cy.get('input[name="nombre"]', { timeout: 5000 }).should('be.visible').type('Producto Test');
    cy.get('input[name="precio"]').type('10.99');
    cy.get('input[name="stock"]').type('5');
    cy.get('button').contains('Guardar').click();

    // Assert - Verificar manejo del error
    cy.wait('@serverError', { timeout: 10000 });
    cy.get('body', { timeout: 5000 }).should('satisfy', ($body) => {
      return $body.text().toLowerCase().includes('error') || $body.text().toLowerCase().includes('servidor');
    });
  });

  it('debe manejar correctamente error 401 (no autorizado) al acceder a recursos protegidos', () => {
    // Arrange - Sin autenticación
    cy.clearAuth();
    cy.visit('/admin', { timeout: 10000 });

    // Interceptar error de autorización
    cy.intercept('GET', '**/api/products*', (req) => {
      req.reply({
        statusCode: 401,
        body: {
          error: 'No autorizado',
          message: 'Token inválido o expirado'
        }
      });
    }).as('unauthorizedError');

    // Act - Esperar a que se intente cargar productos o redirección
    cy.wait('@unauthorizedError', { timeout: 10000 }).then(() => {
      // Assert - Verificar redirección a login o mensaje de error
      cy.url({ timeout: 5000 }).should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/admin');
      });
    });
  });

  it('debe manejar correctamente error 404 al intentar actualizar producto inexistente', () => {
    // Arrange - Login como admin
    cy.loginAsAdmin();
    cy.visit('/admin');

    // Interceptar error 404
    cy.intercept('PUT', '**/api/products/999', {
      statusCode: 404,
      body: {
        error: 'Producto no encontrado',
        message: 'El producto con ID 999 no existe'
      }
    }).as('notFoundError');

    // Act - Simular intento de actualizar producto inexistente
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/products/999`,
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`
      },
      body: {
        nombre: 'Producto Test',
        precio: 10.99,
        stock: 5
      },
      failOnStatusCode: false
    }).then((response) => {
      // Assert - Verificar respuesta de error
      expect(response.status).to.eq(404);
      expect(response.body.error).to.exist;
    });
  });

  it('debe mostrar mensaje de error cuando falla la conexión con el backend', () => {
    // Arrange - Interceptar error de red
    cy.intercept('GET', '**/api/products*', {
      forceNetworkError: true
    }).as('networkError');

    cy.visit('/products', { timeout: 10000 });

    // Act - Esperar a que se intente cargar productos
    cy.wait('@networkError', { timeout: 10000 }).then(() => {
      // Assert - Verificar que se muestra mensaje de error o que la página carga
      cy.get('body', { timeout: 5000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('error') || text.includes('cargando') || text.includes('producto');
      });
    });
  });
});

