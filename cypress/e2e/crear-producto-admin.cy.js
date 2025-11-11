// cypress/e2e/crear-producto-admin.cy.js

describe('Flujo de creación de producto como admin', () => {
  it('Debería permitir a un admin crear un producto', () => {
    const productoNombre = 'Producto Cypress Test ' + Date.now();
    const productoCodigo = 'CYP-' + Date.now();
    
    // Interceptar la request de creación de producto
    cy.intercept('POST', '**/api/products').as('createProduct');
    cy.intercept('GET', '**/api/products**').as('getProducts');
    
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
    
    // Esperar redirección a /admin
    cy.url().should('match', /\/(admin|products)/, { timeout: 10000 });

    // Esperar a que se carguen los productos iniciales
    cy.wait('@getProducts', { timeout: 10000 });

    // Hacer clic en el botón "Nuevo Producto"
    cy.contains('Nuevo Producto').click();

    // Esperar que se abra el diálogo
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Nuevo Producto').should('be.visible');

    // Completar el formulario
    cy.get('input[name="nombre"]').type(productoNombre);
    cy.get('input[name="codigo"]').type(productoCodigo);
    cy.get('input[name="precio"]').type('150.50');
    cy.get('input[name="stock"]').type('20');
    cy.get('textarea[name="descripcion"]').type('Producto creado por test E2E de Cypress');

    // Enviar el formulario
    cy.contains('button', 'Guardar').click();

    // Esperar a que se complete la request de creación
    cy.wait('@createProduct', { timeout: 15000 }).then((interception) => {
      // Verificar que la request fue exitosa
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
      cy.log('Producto creado exitosamente en el backend');
    });

    // Esperar a que el diálogo se cierre
    cy.get('[role="dialog"]').should('not.exist', { timeout: 15000 });
    
    // Esperar a que se recarguen los productos después de crear
    cy.wait('@getProducts', { timeout: 15000 });
    
    // Verificar que el producto aparezca en la tabla
    cy.get('table', { timeout: 15000 }).should('be.visible');
    cy.get('table tbody', { timeout: 15000 }).within(() => {
      cy.contains(productoNombre, { timeout: 15000 }).should('be.visible');
    });
  });
});
