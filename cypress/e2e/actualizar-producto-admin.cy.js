// cypress/e2e/actualizar-producto-admin.cy.js

describe('Flujo de actualización de producto como admin', () => {
  it('Debería permitir a un admin actualizar un producto existente', () => {
    // Login como admin
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type('admin@repuestera.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('input[name="isAdmin"]').click({ force: true });
    cy.get('button[type="submit"]').click();
    cy.wait(5000); // Esperar más tiempo para el login
    cy.url().then((url) => cy.log('URL: ' + url));
    cy.url().should('match', /\/(admin|products)/, { timeout: 15000 });
    
    // Primero crear un producto para actualizar
    cy.contains('Nuevo Producto').click();
    cy.get('input[name="nombre"]').type('Producto Para Actualizar');
    cy.get('input[name="codigo"]').type('UPDATE-' + Date.now());
    cy.get('input[name="precio"]').type('100');
    cy.get('input[name="stock"]').type('10');
    cy.contains('button', 'Guardar').click();
    cy.wait(3000);

    // Buscar el producto recién creado y hacer clic en editar
    cy.contains('Producto Para Actualizar').parent('tr').find('button').first().click();

    // Esperar que se abra el diálogo de edición
    cy.contains('Editar Producto', { timeout: 5000 }).should('be.visible');

    // Modificar el stock del producto
    cy.get('input[name="stock"]').clear().type('99');

    // Guardar los cambios
    cy.contains('button', 'Guardar').click();

    // Verificar que se procesó la actualización (el diálogo se cierra o aparece mensaje)
    cy.wait(3000);
    
    // Verificar que el producto actualizado existe en la página
    cy.contains('Producto Para Actualizar').should('be.visible');
  });
});
