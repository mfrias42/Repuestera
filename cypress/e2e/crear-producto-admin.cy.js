// cypress/e2e/crear-producto-admin.cy.js

describe('Flujo de creación de producto como admin', () => {
  it('Debería permitir a un admin crear un producto', () => {
    // Ir a la página de login
    cy.visit('http://localhost:3000/login');

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
    cy.get('textarea[name="descripcion"]').type('Producto creado por test E2E de Cypress');

    // Enviar el formulario
    cy.contains('button', 'Guardar').click();

    // Esperar a que se cierre el diálogo o se procese la solicitud
    cy.wait(3000);
    
    // Verificar que el producto aparece en la tabla o que no hay error visible
    // (Si hay error, el test fallará mostrando el mensaje de error)
    cy.contains('Producto Cypress Test', { timeout: 5000 });
  });
});
