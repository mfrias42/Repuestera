/**
 * Test E2E: Flujo completo de actualización de producto
 * TP07 - Pruebas de Integración
 */

describe('Flujo de Actualización de Producto', () => {
  beforeEach(() => {
    cy.clearAuth();
    cy.loginAsAdmin();
    cy.visit('/admin');
  });

  it('debe actualizar un producto existente correctamente', () => {
    // Arrange - Datos del producto a actualizar
    const updatedData = {
      nombre: 'Filtro de Aceite Actualizado',
      precio: '25.99',
      stock: '100',
      descripcion: 'Descripción actualizada del producto'
    };

    // Interceptar llamadas al API
    cy.intercept('GET', '**/api/products*', {
      statusCode: 200,
      body: {
        products: [
          {
            id: 1,
            nombre: 'Filtro de Aceite',
            precio: 15.99,
            stock: 50,
            descripcion: 'Descripción original'
          }
        ],
        total: 1
      }
    }).as('getProducts');

    cy.intercept('PUT', '**/api/products/1', {
      statusCode: 200,
      body: {
        message: 'Producto actualizado exitosamente',
        product: {
          id: 1,
          ...updatedData
        }
      }
    }).as('updateProduct');

    // Act - Esperar a que carguen los productos
    cy.wait('@getProducts');

    // Buscar y hacer clic en el botón de editar
    cy.contains('Filtro de Aceite').should('be.visible');
    cy.get('button').contains('Editar').first().click();

    // Modificar los campos
    cy.get('input[name="nombre"]').clear().type(updatedData.nombre);
    cy.get('input[name="precio"]').clear().type(updatedData.precio);
    cy.get('input[name="stock"]').clear().type(updatedData.stock);
    cy.get('textarea[name="descripcion"]').clear().type(updatedData.descripcion);

    // Guardar cambios
    cy.get('button').contains('Guardar').click();

    // Assert - Verificar que se hizo la llamada de actualización
    cy.wait('@updateProduct');

    // Verificar que se muestra mensaje de éxito o que el producto se actualizó
    cy.get('body').should('contain', 'actualizado');
  });

  it('debe validar campos requeridos al actualizar producto', () => {
    // Interceptar GET de productos
    cy.intercept('GET', '**/api/products*', {
      statusCode: 200,
      body: { products: [{ id: 1, nombre: 'Producto Test', precio: 10, stock: 5 }], total: 1 }
    }).as('getProducts');

    cy.wait('@getProducts');

    // Act - Abrir diálogo de edición
    cy.get('button').contains('Editar').first().click();

    // Limpiar campo requerido
    cy.get('input[name="nombre"]').clear();

    // Intentar guardar
    cy.get('button').contains('Guardar').click();

    // Assert - Verificar validación HTML5
    cy.get('input[name="nombre"]:invalid').should('exist');
  });
});

