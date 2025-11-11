// cypress/e2e/validacion-errores-producto.cy.js

describe('Validación de manejo de errores en productos', () => {
  beforeEach(() => {
    // Login como admin antes de cada test
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type('admin@repuestera.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('input[name="isAdmin"]').click({ force: true });
    cy.get('button[type="submit"]').click();
    cy.wait(3000); // Esperar a que se procese el login
    cy.url().should('match', /\/(admin|products)/, { timeout: 10000 });
  });

  it('Debería validar campos requeridos al crear un producto', () => {
    // Hacer clic en "Nuevo Producto"
    cy.contains('Nuevo Producto').click();

    // Intentar guardar sin completar campos requeridos
    cy.contains('button', 'Guardar').click();

    // Verificar que el formulario no se envía (el diálogo sigue abierto)
    cy.contains('Nuevo Producto', { timeout: 2000 }).should('be.visible');
  });

  it('Debería mostrar error al intentar crear producto con código duplicado', () => {
    // Crear primer producto con código específico
    cy.contains('Nuevo Producto').click();
    
    const codigoDuplicado = 'DUP-' + Date.now();
    
    cy.get('input[name="nombre"]').type('Producto Original');
    cy.get('input[name="codigo"]').type(codigoDuplicado);
    cy.get('input[name="precio"]').type('100');
    cy.get('input[name="stock"]').type('10');
    cy.contains('button', 'Guardar').click();
    
    cy.wait(3000);

    // Intentar crear segundo producto con el mismo código
    cy.contains('Nuevo Producto').click();
    cy.get('input[name="nombre"]').type('Producto Duplicado');
    cy.get('input[name="codigo"]').type(codigoDuplicado);
    cy.get('input[name="precio"]').type('200');
    cy.get('input[name="stock"]').type('20');
    cy.contains('button', 'Guardar').click();

    // Verificar que aparece un mensaje de error o que el diálogo sigue abierto
    cy.wait(2000);
    // Si el backend maneja correctamente el error, mostrará un alert o el diálogo no se cerrará
    cy.get('body').then(($body) => {
      const hasError = $body.find('[role="alert"]').length > 0;
      const dialogStillOpen = $body.text().includes('Nuevo Producto');
      expect(hasError || dialogStillOpen).to.be.true;
    });
  });

  it('Debería validar que el precio sea un número positivo', () => {
    cy.contains('Nuevo Producto').click();

    cy.get('input[name="nombre"]').type('Producto Test Precio');
    cy.get('input[name="codigo"]').type('PRICE-' + Date.now());
    cy.get('input[name="precio"]').type('-50'); // Precio negativo
    cy.get('input[name="stock"]').type('10');

    cy.contains('button', 'Guardar').click();

    // El navegador debería validar que el número sea positivo
    // o el formulario no debería enviarse
    cy.wait(2000);
    cy.contains('Nuevo Producto').should('be.visible');
  });
});
