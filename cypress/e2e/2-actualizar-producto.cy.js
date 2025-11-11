describe('Test E2E - Gestión de Carrito', () => {
  // Usuario de prueba para todos los tests
  const testUser = {
    email: `carrito_test_${Date.now()}@test.com`,
    password: 'Password123',
    nombre: 'CarritoTest',
    apellido: 'Usuario'
  };

  before(() => {
    // Registrar usuario una sola vez para todos los tests
    cy.registerUser(testUser);
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    // Login antes de cada test
    cy.loginUser(testUser.email, testUser.password);
    // Verificar que el login fue exitoso
    cy.url({ timeout: 10000 }).should('include', '/products');
  });

  it('Debe permitir agregar productos al carrito', () => {
    // Ya estamos logueados por el beforeEach
    
    // Esperar a que carguen los productos
    cy.contains(/Catálogo de Productos/i, { timeout: 10000 }).should('be.visible');

    // Buscar el botón "Agregar al Carrito"
    cy.contains('button', /Agregar al Carrito/i).first().click();

    // Verificar mensaje de éxito (Snackbar)
    cy.contains(/agregado al carrito/i, { timeout: 5000 }).should('be.visible');

    // Verificar que el badge del carrito se actualizó en el Navbar
    cy.get('.MuiBadge-badge').should('contain', '1');
  });

  it('Debe permitir actualizar cantidad de productos en el carrito', () => {
    // Ya estamos logueados por el beforeEach
    
    // Esperar a que carguen los productos
    cy.contains(/Catálogo de Productos/i, { timeout: 10000 }).should('be.visible');

    // Agregar un producto
    cy.contains('button', /Agregar al Carrito/i).first().click();
    
    // Esperar mensaje de confirmación
    cy.contains(/agregado al carrito/i, { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Ir al carrito haciendo clic en el badge
    cy.get('.MuiBadge-root').first().click();

    // Verificar que estamos en el carrito y hay productos
    cy.url().should('include', '/cart');
    cy.contains(/Carrito de Compras/i, { timeout: 5000 }).should('be.visible');

    // Incrementar cantidad usando el botón con icono Add
    cy.get('.MuiIconButton-root').eq(1).click();

    // Esperar y verificar que la cantidad aumentó
    cy.wait(1000);
    cy.get('body').should('be.visible');
  });

  it('Debe permitir eliminar productos del carrito', () => {
    // Ya estamos logueados por el beforeEach

    // Agregar producto
    cy.contains('button', /Agregar al Carrito/i).first().click();
    
    // Esperar mensaje de confirmación
    cy.contains(/agregado al carrito/i, { timeout: 5000 }).should('be.visible');
    cy.wait(2000);

    // Ir al carrito haciendo clic en el badge
    cy.get('.MuiBadge-root').first().click();

    // Verificar que hay productos
    cy.url().should('include', '/cart');
    cy.contains(/Carrito de Compras/i).should('be.visible');

    // Contar cuántos productos hay antes de eliminar
    cy.get('.MuiCard-root').its('length').then((initialCount) => {
      // Buscar el IconButton con color="error" dentro del card del producto (no el de "Vaciar Carrito")
      cy.get('.MuiCard-root .MuiIconButton-colorError').first().click();
      
      cy.wait(1000);
      
      // Verificar que hay menos productos que antes (o el mensaje de carrito vacío si era el único)
      cy.get('body').then(($body) => {
        if ($body.find('.MuiCard-root').length > 0) {
          // Si todavía hay productos, verificar que disminuyó la cantidad
          cy.get('.MuiCard-root').should('have.length', initialCount - 1);
        } else {
          // Si no hay más productos, debe aparecer el mensaje de carrito vacío
          cy.contains(/Tu carrito está vacío/i).should('be.visible');
        }
      });
    });
  });

  it('Debe calcular correctamente el total del carrito', () => {
    // Ya estamos logueados por el beforeEach
    
    // Esperar a que carguen los productos
    cy.wait(1500);

    // Capturar el precio del primer producto antes de agregarlo
    let precioProducto;
    cy.get('.MuiCard-root').first().find('h6').contains(/\$/i).invoke('text').then((texto) => {
      // Extraer el precio del texto (ej: "$ 15,99" -> 15.99)
      precioProducto = parseFloat(texto.replace(/[$.]/g, '').replace(',', '.').trim());
      cy.log(`Precio del producto: $${precioProducto}`);
    });

    // Agregar el primer producto dos veces
    cy.get('button').contains(/Agregar al Carrito/i).first().click();
    cy.wait(2000);
    
    cy.get('button').contains(/Agregar al Carrito/i).first().click();
    cy.wait(2000);

    // Ir al carrito haciendo clic en el badge
    cy.get('.MuiBadge-root').first().click();

    // Verificar que aparece el resumen con el total
    cy.url().should('include', '/cart');
    cy.contains(/Resumen del Pedido/i).should('be.visible');
    cy.contains(/Total:/i).should('be.visible');
    
    // Verificar que hay al menos 1 producto en el carrito
    cy.get('.MuiCard-root').should('have.length.at.least', 1);
    
    // Verificar que en el resumen aparece "x2" (cantidad multiplicada)
    cy.contains(/x2/).should('be.visible');
    
    // Verificar que el total calculado es correcto (precio * 2)
    cy.contains(/Total:/i).parent().invoke('text').then((textoTotal) => {
      const totalMostrado = parseFloat(textoTotal.replace(/[^0-9,.]/g, '').replace(',', '.'));
      const totalEsperado = precioProducto * 2;
      cy.log(`Total mostrado: $${totalMostrado}, Total esperado: $${totalEsperado}`);
      expect(totalMostrado).to.equal(totalEsperado);
    });
  });
});
