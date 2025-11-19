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
    cy.visit('/admin');

    // Interceptar error del servidor
    cy.intercept('POST', '**/api/products', {
      statusCode: 500,
      body: {
        error: 'Error interno del servidor',
        message: 'No se pudo crear el producto'
      }
    }).as('serverError');

    // Act - Intentar crear producto
    cy.get('button').contains('Nuevo Producto').click();
    cy.get('input[name="nombre"]').type('Producto Test');
    cy.get('input[name="precio"]').type('10.99');
    cy.get('input[name="stock"]').type('5');
    cy.get('button').contains('Guardar').click();

    // Assert - Verificar manejo del error
    cy.wait('@serverError');
    cy.get('body').should('contain', 'error');
  });

  it('debe manejar correctamente error 401 (no autorizado) al acceder a recursos protegidos', () => {
    // Arrange - Sin autenticación
    cy.visit('/admin');

    // Interceptar error de autorización
    cy.intercept('GET', '**/api/products*', {
      statusCode: 401,
      body: {
        error: 'No autorizado',
        message: 'Token inválido o expirado'
      }
    }).as('unauthorizedError');

    // Act - Intentar acceder a página protegida
    cy.wait('@unauthorizedError');

    // Assert - Verificar redirección a login o mensaje de error
    cy.url().should('include', '/login');
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

    cy.visit('/products');

    // Act - Esperar a que se intente cargar productos
    cy.wait('@networkError');

    // Assert - Verificar que se muestra mensaje de error
    cy.get('body').should('contain', 'error');
  });
});

