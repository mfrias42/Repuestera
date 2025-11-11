// cypress/e2e/crear-producto-admin.cy.js

describe('Flujo de creación de producto como admin', () => {
  it('Debería permitir a un admin crear un producto', () => {
    // Ir a la página de login
    cy.visit('/login');

    // Completar login como admin
    cy.get('input[name="email"]').type('admin@repuestera.com');
    cy.get('input[name="password"]').type('admin123');
    
    // Activar el switch de admin (Material-UI Switch)
    cy.get('input[name="isAdmin"]').click({ force: true });
    
    cy.get('button[type="submit"]').click();

    // Esperar a que se procese el login
    cy.wait(3000);
    
    // Debug: ver la URL actual
    cy.url().then((url) => {
      cy.log('URL actual después del login: ' + url);
    });
    
    // Esperar redirección a /admin (puede ser /admin o /products según el rol)
    cy.url().should('match', /\/(admin|products)/, { timeout: 10000 });

    // El panel de admin ya muestra la pestaña de productos por defecto
    // Hacer clic en el botón "Nuevo Producto"
    cy.contains('Nuevo Producto').click();

    // Esperar que se abra el diálogo y completar el formulario
    cy.get('input[name="nombre"]').type('Producto Cypress Test');
    cy.get('input[name="codigo"]').type('CYP-' + Date.now()); // Código único para evitar duplicados
    cy.get('input[name="precio"]').type('150.50');
    cy.get('input[name="stock"]').type('20');
    // Categoria es opcional - si existe el campo, intentar llenarlo pero no fallar
    cy.get('body').then($body => {
      if ($body.find('input[name="categoria"]').length > 0) {
        cy.log('Campo categoria encontrado - es opcional');
      }
    });
    cy.get('textarea[name="descripcion"]').type('Producto creado por test E2E de Cypress');

    // Interceptar la petición POST
    cy.intercept('POST', '**/api/products').as('createProduct');

    // Enviar el formulario
    cy.contains('button', 'Guardar').click();

    // Esperar a que se complete la petición
    cy.wait('@createProduct').its('response.statusCode').should('eq', 201);
    
    // Esperar un poco más para que el UI se actualice
    cy.wait(2000);
    
    // Verificar que se creó exitosamente buscando el producto en la página
    cy.get('body', { timeout: 10000 }).should('contain', 'Producto Cypress Test');
  });
});
