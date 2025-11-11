// cypress/e2e/actualizar-producto-admin.cy.js

describe('Flujo de actualización de producto como admin', () => {
  it('Debería permitir a un admin actualizar un producto existente', () => {
    const nombreProducto = 'Producto Para Actualizar ' + Date.now();
    const productoCodigo = 'UPDATE-' + Date.now();
    
    // Interceptar las requests
    cy.intercept('POST', '**/api/products').as('createProduct');
    cy.intercept('PUT', '**/api/products/*').as('updateProduct');
    cy.intercept('GET', '**/api/products**').as('getProducts');
    
    // Ir a la página de login
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@repuestera.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('input[name="isAdmin"]').click({ force: true });
    cy.get('button[type="submit"]').click();
    cy.wait(3000);
    cy.url().should('match', /\/(admin|products)/, { timeout: 15000 });
    
    // Esperar a que se carguen los productos iniciales
    cy.wait('@getProducts', { timeout: 10000 });
    
    // Primero crear un producto para actualizar
    cy.contains('Nuevo Producto').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('input[name="nombre"]').type(nombreProducto);
    cy.get('input[name="codigo"]').type(productoCodigo);
    cy.get('input[name="precio"]').type('100');
    cy.get('input[name="stock"]').type('10');
    cy.contains('button', 'Guardar').click();
    
    // Esperar a que se complete la creación
    cy.wait('@createProduct', { timeout: 15000 }).then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
      cy.log('Producto creado exitosamente');
    });
    
    // Esperar a que el diálogo se cierre
    cy.get('[role="dialog"]').should('not.exist', { timeout: 15000 });
    
    // Esperar a que se recarguen los productos
    cy.wait('@getProducts', { timeout: 15000 });
    
    // Verificar que el producto aparezca en la tabla
    cy.get('table tbody', { timeout: 15000 }).within(() => {
      cy.contains(nombreProducto, { timeout: 15000 }).should('be.visible');
    });

    // Buscar el producto en la tabla y hacer clic en el botón de editar
    cy.contains(nombreProducto).parents('tr').within(() => {
      // El botón de editar es el primer botón (IconButton con Edit icon)
      cy.get('button').first().click({ force: true });
    });

    // Esperar que se abra el diálogo de edición
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Editar Producto', { timeout: 5000 }).should('be.visible');

    // Modificar el stock del producto
    cy.get('input[name="stock"]').clear().type('99');

    // Guardar los cambios
    cy.contains('button', 'Guardar').click();

    // Esperar a que se complete la actualización
    cy.wait('@updateProduct', { timeout: 15000 }).then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
      cy.log('Producto actualizado exitosamente');
    });

    // Esperar a que el diálogo se cierre
    cy.get('[role="dialog"]').should('not.exist', { timeout: 15000 });
    
    // Esperar a que se recarguen los productos
    cy.wait('@getProducts', { timeout: 15000 });
    
    // Verificar que el producto actualizado aparezca en la tabla con el nuevo stock
    cy.get('table tbody', { timeout: 15000 }).within(() => {
      cy.contains(nombreProducto, { timeout: 15000 }).should('be.visible');
      // Verificar que el stock se actualizó a 99 en la misma fila
      cy.contains(nombreProducto).parents('tr').within(() => {
        cy.contains('99', { timeout: 10000 }).should('be.visible');
      });
    });
  });
});
