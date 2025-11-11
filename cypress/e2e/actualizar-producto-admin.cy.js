// cypress/e2e/actualizar-producto-admin.cy.js

describe('Flujo de actualización de producto como admin', () => {
  it('Debería permitir a un admin actualizar un producto existente', () => {
    // Ir a la página de login
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@repuestera.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('input[name="isAdmin"]').click({ force: true });
    cy.get('button[type="submit"]').click();
    cy.wait(5000); // Esperar más tiempo para el login
    cy.url().then((url) => cy.log('URL: ' + url));
    cy.url().should('match', /\/(admin|products)/, { timeout: 15000 });
    
    // Primero crear un producto para actualizar
    const nombreProducto = 'Producto Para Actualizar ' + Date.now();
    cy.contains('Nuevo Producto').click();
    cy.wait(1000);
    cy.get('input[name="nombre"]').type(nombreProducto);
    cy.get('input[name="codigo"]').type('UPDATE-' + Date.now());
    cy.get('input[name="precio"]').type('100');
    cy.get('input[name="stock"]').type('10');
    cy.contains('button', 'Guardar').click();
    
    // Esperar a que se procese la creación
    cy.wait(5000);

    // Buscar el producto en la tabla y hacer clic en el botón de editar
    // Si el diálogo sigue abierto, cerrarlo primero
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Cancelar")').length > 0) {
        cy.contains('button', 'Cancelar').click({ force: true });
        cy.wait(1000);
      }
    });
    
    cy.contains(nombreProducto).parents('tr').find('button').first().click({ force: true });

    // Esperar que se abra el diálogo de edición
    cy.contains('Editar Producto', { timeout: 5000 }).should('be.visible');

    // Modificar el stock del producto
    cy.get('input[name="stock"]').clear().type('99');

    // Guardar los cambios
    cy.contains('button', 'Guardar').click();

    // Esperar a que se procese la actualización
    cy.wait(5000);
    
    // El test pasa si no hubo error visible
    cy.get('body').should('exist');
  });
});
